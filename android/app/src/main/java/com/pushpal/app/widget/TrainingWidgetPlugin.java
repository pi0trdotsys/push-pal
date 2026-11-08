package com.pushpal.app.widget;

import android.content.Intent;
import android.provider.CalendarContract;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name = "TrainingWidget")
public class TrainingWidgetPlugin extends Plugin {
    @PluginMethod
    public void addCalendarEvent(PluginCall call) {
        // JSON represents epoch milliseconds as Long, not necessarily Double.
        long start = call.getData().optLong("start", -1L);
        long end = call.getData().optLong("end", -1L);
        if(start <= 0 || end <= start) { call.reject("Nieprawidłowy termin."); return; }
        Intent intent = new Intent(Intent.ACTION_INSERT).setData(CalendarContract.Events.CONTENT_URI)
            .putExtra(CalendarContract.Events.TITLE, call.getString("title", "Trening PUSH"))
            .putExtra(CalendarContract.Events.DESCRIPTION, call.getString("description", "") + (Boolean.TRUE.equals(call.getBoolean("reminder", false)) ? "\nUstaw przypomnienie 15 min przed treningiem." : ""))
            .putExtra(CalendarContract.Events.HAS_ALARM, Boolean.TRUE.equals(call.getBoolean("reminder", false)) ? 1 : 0)
            .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, start)
            .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, end);
        getActivity().runOnUiThread(() -> {
            try { getActivity().startActivity(intent); call.resolve(); }
            catch(Exception error) { call.reject("Brak aplikacji kalendarza obsługującej wydarzenia."); }
        });
    }
    @PluginMethod
    public void shareCalendar(PluginCall call) {
        try {
            String content = call.getString("content", "");
            if(!content.startsWith("BEGIN:VCALENDAR") || content.length()>1000000) { call.reject("Nieprawidłowy kalendarz."); return; }
            File file = new File(getContext().getCacheDir(), "push-plan-30-dni.ics");
            try(FileOutputStream output = new FileOutputStream(file)) { output.write(content.getBytes(StandardCharsets.UTF_8)); }
            Intent intent = new Intent(Intent.ACTION_SEND).setType("text/calendar")
                .putExtra(Intent.EXTRA_STREAM, FileProvider.getUriForFile(getContext(),getContext().getPackageName()+".fileprovider",file))
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().runOnUiThread(() -> {
                try { getActivity().startActivity(Intent.createChooser(intent,"Dodaj plan do kalendarza")); call.resolve(); }
                catch(Exception error) { call.reject("Nie można udostępnić kalendarza."); }
            });
        } catch(Exception error) { call.reject("Nie udało się przygotować kalendarza."); }
    }
    @PluginMethod
    public void update(PluginCall call) {
        String payload = call.getString("payload", "{}");
        try {
            new JSONObject(payload);
            boolean saved = getContext().getSharedPreferences("push_widget", 0).edit().putString("payload", payload).commit();
            if (!saved) { call.reject("Nie udało się zapisać danych widgetu."); return; }
            TrainingWidgetProvider.updateAll(getContext());
            call.resolve();
        } catch (Exception error) { call.reject("Nieprawidłowe dane widgetu."); }
    }
    @PluginMethod
    public void keepAwake(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        getActivity().runOnUiThread(() -> {
            if (enabled) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }
    @PluginMethod
    public void consumeLaunch(PluginCall call) {
        Intent intent = getActivity().getIntent();
        JSObject data = new JSObject();
        data.put("session", intent.getBooleanExtra("push_session", false));
        intent.removeExtra("push_session");
        call.resolve(data);
    }
    @Override
    protected void handleOnPause() {
        getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getActivity().runOnUiThread(() -> getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new Event('push-background'))", null));
    }
}
