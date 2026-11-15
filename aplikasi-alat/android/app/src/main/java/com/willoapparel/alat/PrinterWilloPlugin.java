package com.willoapparel.alat;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.bluetooth.BluetoothClass;
import android.os.Handler;
import android.os.Looper;
import androidx.core.content.ContextCompat;
import java.util.HashSet;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.net.Uri;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.speech.tts.TextToSpeech;
import android.util.Base64;
import android.webkit.WebView;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Locale;
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
    permissions = {
        @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "bluetooth"),
        @Permission(strings = { Manifest.permission.BLUETOOTH_SCAN }, alias = "pindai"),
        @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION }, alias = "lokasi")
    }
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
        if (butuhIzin()) { call.reject("Izin Perangkat di sekitar ditolak. Izinkan di Setelan HP > Aplikasi > Lumbung > Izin.", "IZIN"); return; }
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

    // ---- Cari printer di sekitar (seperti tombol Scan aplikasi kasir lain): printer tidak perlu dipasangkan dulu ----
    private boolean izinCariKurang() {
        if (Build.VERSION.SDK_INT >= 31) return getPermissionState("bluetooth") != PermissionState.GRANTED || getPermissionState("pindai") != PermissionState.GRANTED;
        return getPermissionState("lokasi") != PermissionState.GRANTED;
    }

    @PluginMethod
    public void cari(PluginCall call) {
        if (izinCariKurang()) {
            if (Build.VERSION.SDK_INT >= 31) requestPermissionForAliases(new String[] { "bluetooth", "pindai" }, call, "izinCari");
            else requestPermissionForAlias("lokasi", call, "izinCari");
            return;
        }
        mulaiCari(call);
    }

    @PermissionCallback
    private void izinCari(PluginCall call) {
        if (izinCariKurang()) {
            call.reject(Build.VERSION.SDK_INT >= 31 ? "Izin Perangkat di sekitar ditolak. Izinkan di Setelan HP > Aplikasi > Lumbung > Izin." : "Izin Lokasi dibutuhkan Android untuk mencari printer. Izinkan di Setelan HP > Aplikasi > Lumbung > Izin.", "IZIN");
            return;
        }
        mulaiCari(call);
    }

    @SuppressLint("MissingPermission")
    private void mulaiCari(PluginCall call) {
        final BluetoothAdapter a = adapter();
        if (a == null) { call.reject("HP ini tidak punya Bluetooth.", "TIDAK_ADA"); return; }
        if (!a.isEnabled()) { call.reject("Bluetooth HP belum menyala. Nyalakan Bluetooth, lalu coba lagi.", "MATI"); return; }
        final JSArray hasil = new JSArray();
        final Set<String> sudah = new HashSet<>();
        final BroadcastReceiver penerima = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                if (!BluetoothDevice.ACTION_FOUND.equals(intent.getAction())) return;
                BluetoothDevice d = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (d == null || sudah.contains(d.getAddress())) return;
                sudah.add(d.getAddress());
                String nama = null;
                try { nama = d.getName(); } catch (SecurityException ignored) {}
                BluetoothClass k = null;
                try { k = d.getBluetoothClass(); } catch (SecurityException ignored) {}
                boolean printer = k != null && k.getMajorDeviceClass() == BluetoothClass.Device.Major.IMAGING;
                if (nama == null && !printer) return;
                JSObject o = new JSObject();
                o.put("nama", nama == null ? d.getAddress() : nama);
                o.put("alamat", d.getAddress());
                o.put("printer", printer);
                hasil.put(o);
            }
        };
        ContextCompat.registerReceiver(getContext(), penerima, new IntentFilter(BluetoothDevice.ACTION_FOUND), ContextCompat.RECEIVER_EXPORTED);
        a.cancelDiscovery();
        if (!a.startDiscovery()) {
            try { getContext().unregisterReceiver(penerima); } catch (Exception ignored) {}
            call.reject("Gagal mencari printer. Nyalakan Lokasi HP, lalu coba lagi.", "CARI");
            return;
        }
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try { a.cancelDiscovery(); } catch (SecurityException ignored) {}
            try { getContext().unregisterReceiver(penerima); } catch (Exception ignored) {}
            JSObject r = new JSObject();
            r.put("perangkat", hasil);
            call.resolve(r);
        }, 12000);
    }

    @PluginMethod
    public void cetak(PluginCall call) {
        if (butuhIzin()) { requestPermissionForAlias("bluetooth", call, "izinCetak"); return; }
        jalankanCetak(call);
    }

    @PermissionCallback
    private void izinCetak(PluginCall call) {
        if (butuhIzin()) { call.reject("Izin Perangkat di sekitar ditolak. Izinkan di Setelan HP > Aplikasi > Lumbung > Izin.", "IZIN"); return; }
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
                    String rinci = e.getMessage() == null ? "" : " (" + e.getMessage() + ")";
                    call.reject("Printer tidak tersambung. Pastikan printer menyala, sudah dipasangkan, tidak sedang dipakai aplikasi lain, dan dekat dengan HP." + rinci, "SAMBUNG", e);
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
            soket = sambung(d);
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

    /**
     * Printer termal murah tidak seragam: coba SPP aman, SPP tidak aman, lalu kanal RFCOMM 1
     * lewat refleksi (cara yang dipakai banyak aplikasi printer untuk printer yang menolak SDP).
     */
    @SuppressLint("MissingPermission")
    private BluetoothSocket sambung(BluetoothDevice d) throws IOException {
        IOException terakhir = null;
        // Printer yang belum dipasangkan (hasil Cari): coba sambungan tanpa pasangan dulu supaya tidak muncul minta PIN.
        boolean terpasang = d.getBondState() == BluetoothDevice.BOND_BONDED;
        int[] urutan = terpasang ? new int[] { 0, 1, 2, 3 } : new int[] { 1, 3, 0, 2 };
        for (int cara : urutan) {
            BluetoothSocket s = null;
            try {
                if (cara == 0) s = d.createRfcommSocketToServiceRecord(SPP);
                else if (cara == 1) s = d.createInsecureRfcommSocketToServiceRecord(SPP);
                else if (cara == 2) s = (BluetoothSocket) d.getClass().getMethod("createRfcommSocket", int.class).invoke(d, 1);
                else s = (BluetoothSocket) d.getClass().getMethod("createInsecureRfcommSocket", int.class).invoke(d, 1);
                s.connect();
                return s;
            } catch (Exception e) {
                if (s != null) { try { s.close(); } catch (IOException ignored) {} }
                terakhir = e instanceof IOException ? (IOException) e : new IOException(String.valueOf(e.getMessage()), e);
                try { Thread.sleep(300); } catch (InterruptedException ignored) {}
            }
        }
        throw terakhir;
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

    // ---- Fitur yang tidak ada di WebView Android: simpan/bagikan file, cetak halaman (PDF), suara ----

    /** Unduhan blob tidak jalan di WebView: tulis file ke cache lalu buka lembar Bagikan (simpan ke Files/Drive/WA). */
    @PluginMethod
    public void bagikanFile(PluginCall call) {
        String nama = call.getString("nama", "file.txt").replaceAll("[^A-Za-z0-9._-]", "_");
        String data = call.getString("data");
        String mime = call.getString("mime", "application/octet-stream");
        if (data == null) { call.reject("File kosong.", "DATA"); return; }
        try {
            File dir = new File(getContext().getCacheDir(), "bagikan");
            if (!dir.exists() && !dir.mkdirs()) throw new IOException("Folder cache gagal dibuat");
            File f = new File(dir, nama);
            try (FileOutputStream o = new FileOutputStream(f)) { o.write(Base64.decode(data, Base64.DEFAULT)); }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            Intent kirim = new Intent(Intent.ACTION_SEND);
            kirim.setType(mime);
            kirim.putExtra(Intent.EXTRA_STREAM, uri);
            kirim.putExtra(Intent.EXTRA_SUBJECT, nama);
            kirim.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent pilih = Intent.createChooser(kirim, "Simpan atau kirim " + nama);
            pilih.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(pilih);
            call.resolve();
        } catch (Exception e) {
            call.reject("Gagal menyiapkan file: " + e.getMessage(), "FILE", e);
        }
    }

    /** window.print() tidak jalan di WebView: cetak halaman lewat layanan cetak Android (bisa "Simpan sebagai PDF"). */
    @PluginMethod
    public void cetakHalaman(PluginCall call) {
        final String judul = call.getString("judul", "Lumbung");
        getActivity().runOnUiThread(() -> {
            try {
                WebView w = getBridge().getWebView();
                PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter ad = w.createPrintDocumentAdapter(judul);
                pm.print(judul, ad, new PrintAttributes.Builder().build());
                call.resolve();
            } catch (Exception e) {
                call.reject("Gagal membuka layanan cetak: " + e.getMessage(), "CETAK", e);
            }
        });
    }

    private TextToSpeech tts;
    private boolean ttsSiap;
    private String ttsTunda;

    /** speechSynthesis tidak ada di WebView: bacakan teks dengan mesin suara Android (bahasa Indonesia). */
    @PluginMethod
    public void bicara(PluginCall call) {
        String teks = call.getString("teks", "");
        if (tts == null) {
            ttsTunda = teks;
            tts = new TextToSpeech(getContext(), status -> {
                ttsSiap = status == TextToSpeech.SUCCESS;
                if (ttsSiap) {
                    tts.setLanguage(new Locale("id", "ID"));
                    tts.setSpeechRate(0.9f);
                    if (ttsTunda != null) { tts.speak(ttsTunda, TextToSpeech.QUEUE_FLUSH, null, "lumbung"); ttsTunda = null; }
                }
            });
        } else if (ttsSiap) {
            tts.speak(teks, TextToSpeech.QUEUE_FLUSH, null, "lumbung");
        } else {
            ttsTunda = teks;
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        tutup();
        if (tts != null) { tts.shutdown(); tts = null; }
    }
}
