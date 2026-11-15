package com.willoapparel.alat;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

/**
 * Cetak ke printer termal Bluetooth CLASSIC (SPP/RFCOMM) langsung dari halaman alat usaha,
 * tanpa aplikasi RawBT. Dipanggil dari public/alat/printer.js lewat Capacitor.nativePromise("PrinterWillo", ...).
 * Printer harus sudah dipasangkan (paired) di Pengaturan Bluetooth HP.
 */
@CapacitorPlugin(
    name = "PrinterWillo",
    permissions = { @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "bluetooth") }
)
public class PrinterWilloPlugin extends Plugin {

    private static final UUID SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private BluetoothSocket soket;
    private String alamatSoket;

    private BluetoothAdapter adapter() {
        BluetoothManager m = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        return m == null ? null : m.getAdapter();
    }

    /** Android 12+ butuh izin "Perangkat di sekitar" (BLUETOOTH_CONNECT); versi lama tidak. */
    private boolean butuhIzin() {
        return Build.VERSION.SDK_INT >= 31 && getPermissionState("bluetooth") != PermissionState.GRANTED;
    }

    @PluginMethod
    public void daftar(PluginCall call) {
        if (butuhIzin()) { requestPermissionForAlias("bluetooth", call, "izinDaftar"); return; }
        kirimDaftar(call);
    }

    @PermissionCallback
    private void izinDaftar(PluginCall call) {
        if (butuhIzin()) { call.reject("Izin Perangkat di sekitar ditolak. Izinkan di Setelan HP > Aplikasi > Kasir Willo > Izin.", "IZIN"); return; }
        kirimDaftar(call);
    }

    @SuppressLint("MissingPermission")
    private void kirimDaftar(PluginCall call) {
        BluetoothAdapter a = adapter();
        if (a == null) { call.reject("HP ini tidak punya Bluetooth.", "TIDAK_ADA"); return; }
        if (!a.isEnabled()) { call.reject("Bluetooth HP belum menyala. Nyalakan Bluetooth, lalu coba lagi.", "MATI"); return; }
        JSArray daftar = new JSArray();
        Set<BluetoothDevice> pasangan = a.getBondedDevices();
        if (pasangan != null) {
            for (BluetoothDevice d : pasangan) {
                JSObject o = new JSObject();
                String nama = d.getName();
                o.put("nama", nama == null ? d.getAddress() : nama);
                o.put("alamat", d.getAddress());
                daftar.put(o);
            }
        }
        JSObject hasil = new JSObject();
        hasil.put("perangkat", daftar);
        call.resolve(hasil);
    }

    @PluginMethod
    public void cetak(PluginCall call) {
        if (butuhIzin()) { requestPermissionForAlias("bluetooth", call, "izinCetak"); return; }
        jalankanCetak(call);
    }

    @PermissionCallback
    private void izinCetak(PluginCall call) {
        if (butuhIzin()) { call.reject("Izin Perangkat di sekitar ditolak. Izinkan di Setelan HP > Aplikasi > Kasir Willo > Izin.", "IZIN"); return; }
        jalankanCetak(call);
    }

    private void jalankanCetak(PluginCall call) {
        final String alamat = call.getString("alamat");
        final String data = call.getString("data");
        if (alamat == null || data == null) { call.reject("Data cetak kosong.", "DATA"); return; }
        final byte[] bytes;
        try { bytes = Base64.decode(data, Base64.DEFAULT); }
        catch (IllegalArgumentException e) { call.reject("Data cetak rusak.", "DATA"); return; }
        new Thread(() -> {
            try {
                tulis(alamat, bytes);
                call.resolve();
            } catch (Exception pertama) {
                // Soket lama bisa sudah putus (printer sempat mati): tutup, sambung ulang sekali.
                tutup();
                try {
                    tulis(alamat, bytes);
                    call.resolve();
                } catch (Exception e) {
                    tutup();
                    call.reject("Printer tidak tersambung. Pastikan printer menyala, sudah dipasangkan, dan dekat dengan HP.", "SAMBUNG", e);
                }
            }
        }).start();
    }

    @SuppressLint("MissingPermission")
    private synchronized void tulis(String alamat, byte[] bytes) throws IOException {
        BluetoothAdapter a = adapter();
        if (a == null || !a.isEnabled()) throw new IOException("Bluetooth mati");
        if (soket == null || !soket.isConnected() || !alamat.equals(alamatSoket)) {
            tutup();
            BluetoothDevice d = a.getRemoteDevice(alamat);
            a.cancelDiscovery();
            BluetoothSocket s;
            try {
                s = d.createRfcommSocketToServiceRecord(SPP);
                s.connect();
            } catch (IOException e) {
                s = d.createInsecureRfcommSocketToServiceRecord(SPP);
                s.connect();
            }
            soket = s;
            alamatSoket = alamat;
        }
        OutputStream out = soket.getOutputStream();
        int i = 0;
        while (i < bytes.length) {
            int n = Math.min(512, bytes.length - i);
            out.write(bytes, i, n);
            out.flush();
            i += n;
            try { Thread.sleep(20); } catch (InterruptedException ignored) {}
        }
    }

    private synchronized void tutup() {
        if (soket != null) { try { soket.close(); } catch (IOException ignored) {} }
        soket = null;
        alamatSoket = null;
    }

    @PluginMethod
    public void putus(PluginCall call) {
        tutup();
        call.resolve();
    }

    @PluginMethod
    public void bukaPengaturan(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        tutup();
    }
}
