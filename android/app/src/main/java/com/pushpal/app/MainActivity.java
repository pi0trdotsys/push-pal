package com.pushpal.app;

import android.os.Bundle;
import android.content.Intent;
import com.getcapacitor.BridgeActivity;
import com.pushpal.app.repsensor.RepSensorPlugin;
import com.pushpal.app.widget.TrainingWidgetPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RepSensorPlugin.class);
        registerPlugin(TrainingWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent.getBooleanExtra("push_session", false) && getBridge() != null) {
            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new Event('push-widget-start'))", null);
        }
    }
}
