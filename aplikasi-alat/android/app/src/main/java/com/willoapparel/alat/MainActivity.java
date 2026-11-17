package com.willoapparel.alat;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin lokal: cetak ke printer termal Bluetooth classic tanpa RawBT.
        registerPlugin(PrinterWilloPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
