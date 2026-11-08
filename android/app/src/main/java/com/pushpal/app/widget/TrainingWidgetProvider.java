package com.pushpal.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.SizeF;
import android.view.View;
import android.widget.RemoteViews;
import com.pushpal.app.MainActivity;
import com.pushpal.app.R;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.Map;
import java.util.LinkedHashMap;

/** Native home-screen UI; reads shared data without starting the WebView. */
public class TrainingWidgetProvider extends AppWidgetProvider {
    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TrainingWidgetProvider.class));
        for (int id : ids) update(context, manager, id);
    }
    @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { for (int id : ids) update(c, m, id); }
    @Override public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, Bundle options) { update(c, m, id); }
    @Override public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        String action = intent.getAction();
        if (Intent.ACTION_DATE_CHANGED.equals(action) || Intent.ACTION_TIME_CHANGED.equals(action) || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) updateAll(c);
    }
    private static void update(Context c, AppWidgetManager m, int id) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Map<SizeF, RemoteViews> views = new LinkedHashMap<>();
            views.put(new SizeF(100, 80), layout(c, id, 100, 80));
            views.put(new SizeF(220, 80), layout(c, id, 220, 80));
            views.put(new SizeF(160, 160), layout(c, id, 160, 160));
            views.put(new SizeF(240, 220), layout(c, id, 240, 220));
            m.updateAppWidget(id, new RemoteViews(views));
        } else {
            Bundle o = m.getAppWidgetOptions(id);
            m.updateAppWidget(id, layout(c, id, o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 160), o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 80)));
        }
    }
    private static RemoteViews layout(Context c, int id, int width, int height) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.training_widget);
        String title = "PUSH", value = "Zacznij", detail = "Otwórz aplikację i ułóż swój plan", action = "Otwórz", trend = "Twój rytm zaczyna się dziś";
        boolean openSession = false;
        try {
            String raw = c.getSharedPreferences("push_widget", 0).getString("payload", null);
            if (raw != null) {
                JSONObject data = new JSONObject(raw);
                String today = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date());
                JSONArray plan = data.optJSONArray("plan"), history = data.optJSONArray("history");
                JSONObject day = null;
                if (plan != null) for (int i=0; i<plan.length(); i++) { JSONObject p=plan.getJSONObject(i); if(today.equals(p.optString("date"))) day=p; }
                int total=0, series=5, rest=150;
                boolean off=false, done=false, dumbbells=false;
                if(day != null) { dumbbells="dumbbells".equals(day.optString("training")); JSONArray sets=day.getJSONArray("sets"); series=sets.length(); off=series==0; rest=day.optInt("rest",150); for(int i=0;i<sets.length();i++)total+=sets.getInt(i); }
                else {
                    SimpleDateFormat utc=new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT); utc.setTimeZone(TimeZone.getTimeZone("UTC"));
                    long days=(utc.parse(today).getTime()-utc.parse(data.getString("startDate")).getTime())/86400000L;
                    dumbbells=days%2!=0; int armReps=data.optInt("dumbbellReps",10); total=dumbbells?armReps*6:data.optInt("volume",40); series=dumbbells?6:5; rest=dumbbells?Math.round((720-armReps*18)/5f):Math.max(45,Math.min(180,Math.round((720-total*3)/4f)));
                }
                int weekReps=0;
                SimpleDateFormat utc=new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT); utc.setTimeZone(TimeZone.getTimeZone("UTC"));
                long todayMs=utc.parse(today).getTime();
                if(history!=null)for(int i=0;i<history.length();i++){JSONObject h=history.getJSONObject(i);String date=h.getString("date");boolean sameKind=("dumbbells".equals(h.optString("training")))==dumbbells;if(today.equals(date)&&sameKind&&h.optBoolean("completed"))done=true;long age=todayMs-utc.parse(date).getTime();if(age>=0&&age<7*86400000L&&sameKind)weekReps+=h.optInt("reps");}
                boolean active=data.optBoolean("active");
                title=active?"PUSH · WZNÓW":done?"PUSH · GOTOWE":off?"PUSH · ODPOCZYNEK":dumbbells?"PUSH · HANTLE":"PUSH · POMPKI";
                value=active?"Wznów":done?"✓":off?"OFF":String.valueOf(total);
                int minutes=Math.round((180+total*3+Math.max(0,series-1)*rest)/60f);
                detail=active?"Twój postęp czeka":done?"Dobra robota. Teraz regeneracja.":off?"Dzień wolny":series+" serii · około "+minutes+" min";
                action=active?"Wznów":off||done?"Otwórz":"Start";
                openSession=active||(!off&&!done);
                trend=weekReps+(dumbbells?" powt. z hantlami / 7 dni":" pompek / 7 dni");
            }
        } catch(Exception ignored) { detail="Otwórz aplikację, aby odświeżyć plan"; }
        v.setTextViewText(R.id.widget_title,title);
        v.setTextViewText(R.id.widget_value,value);
        v.setTextViewText(R.id.widget_detail,detail);
        v.setTextViewText(R.id.widget_action,action);
        v.setTextViewText(R.id.widget_trend,trend);
        v.setTextViewTextSize(R.id.widget_value,android.util.TypedValue.COMPLEX_UNIT_SP,height>=220?44:height>=160?36:24);
        v.setViewVisibility(R.id.widget_detail,height>=150||width>=220?View.VISIBLE:View.GONE);
        v.setViewVisibility(R.id.widget_trend,height>=220?View.VISIBLE:View.GONE);
        v.setViewVisibility(R.id.widget_action,height>=150?View.VISIBLE:View.GONE);
        Intent launch=new Intent(c,MainActivity.class).putExtra("push_session",openSession).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending=PendingIntent.getActivity(c,id,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.widget_root,pending);
        v.setOnClickPendingIntent(R.id.widget_action,pending);
        return v;
    }
}
