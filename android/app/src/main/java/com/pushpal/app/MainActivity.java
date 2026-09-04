package com.pushpal.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.pushpal.app.repsensor.RepSensorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RepSensorPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
