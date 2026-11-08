package com.pushpal.app;

import static org.junit.Assert.*;

import android.app.Instrumentation;
import android.app.Activity;
import android.graphics.Bitmap;
import android.provider.CalendarContract;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.RemoteViews;
import android.widget.TextView;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.pushpal.app.widget.TrainingWidgetProvider;
import java.lang.reflect.Method;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Runs inside the real Android WebView and native widget renderer. Restores prior app data. */
@RunWith(AndroidJUnit4.class)
public class PushPalDeviceTest {
    private final Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    private MainActivity activity;

    private String js(String script) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>();
        instrumentation.runOnMainSync(() -> activity.getBridge().getWebView().evaluateJavascript(script, result -> {value.set(result);latch.countDown();}));
        // The very first navigation can cancel evaluateJavascript's callback.
        // Return a missing value and let the page-ready poll try again.
        if (!latch.await(2, TimeUnit.SECONDS)) return "null";
        return value.get();
    }
    private String text() throws Exception {JSONArray value=new JSONArray("["+js("document.body?.innerText || ''")+"]");return value.isNull(0)?"":value.getString(0);}
    private void waitFor(String phrase) throws Exception {
        long deadline=System.currentTimeMillis()+30000;
        while(System.currentTimeMillis()<deadline){if(text().contains(phrase))return;Thread.sleep(150);}
        fail("Expected UI: "+phrase+"; actual: "+text());
    }
    private void click(String label) throws Exception {
        String result=js("(()=>{const b=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim()==="+JSONObject.quote(label)+");if(!b)return false;b.click();return true;})()");
        assertEquals("Clickable "+label,"true",result);
    }
    private void reload() {instrumentation.runOnMainSync(() -> activity.getBridge().getWebView().reload());}
    private void setReps(int reps) throws Exception {
        assertEquals("true",js("(()=>{const e=document.querySelector('#reps');if(!e)return false;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'"+reps+"');e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()"));
    }
    private void bridge(String expression) throws Exception {
        js("document.documentElement.dataset.testBridge='pending';Promise.resolve("+expression+").then(()=>document.documentElement.dataset.testBridge='ok').catch(e=>document.documentElement.dataset.testBridge='error:'+e.message)");
        long deadline=System.currentTimeMillis()+10000;
        String status="";
        while(System.currentTimeMillis()<deadline){status=js("document.documentElement.dataset.testBridge");if(!status.equals("\"pending\""))break;Thread.sleep(100);}
        assertEquals("Native bridge: "+expression,"\"ok\"",status);
    }
    @Test public void realPhoneTrainingRecoveryAndNativeBridges() throws Exception {
        Context context=instrumentation.getTargetContext();
        assertEquals("com.pushpal.app",context.getPackageName());
        Intent launch=context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);
        activity=(MainActivity)instrumentation.startActivitySync(launch);
        waitFor("PUSH");
        String original=js("localStorage.getItem('push-pal:state:v2')");
        String widgetOriginal=context.getSharedPreferences("push_widget",0).getString("payload",null);
        try {
            // Back up first, then exercise a known temporary plan in this app only.
            js("localStorage.removeItem('push-pal:state:v2')");reload();waitFor("Ułóż mój plan");
            click("Ułóż mój plan");waitFor("Zaczynam trening");
            click("Zaczynam trening");waitFor("Rozpocznij rozgrzewkę");click("Rozpocznij rozgrzewkę");waitFor("Rozgrzewka gotowa");click("Rozgrzewka gotowa");waitFor("Zatwierdź serię");
            setReps(3);Thread.sleep(250);
            assertEquals("3",js("JSON.parse(localStorage.getItem('push-pal:state:v2')).active.reps"));
            reload();waitFor("Wznów trening");
            assertEquals("3",js("JSON.parse(localStorage.getItem('push-pal:state:v2')).active.reps"));
            assertEquals("true",js("JSON.parse(localStorage.getItem('push-pal:state:v2')).active.paused"));
            click("Zakończ wcześniej i zachowaj wynik");waitFor("Jak było?");click("W sam raz");click("Zapisz i zakończ");waitFor("Historia treningów");
            assertEquals("3",js("JSON.parse(localStorage.getItem('push-pal:state:v2')).history[0].reps"));
            assertEquals("false",js("JSON.parse(localStorage.getItem('push-pal:state:v2')).history[0].completed"));
            assertEquals("null",js("JSON.parse(localStorage.getItem('push-pal:state:v2')).active"));
            bridge("window.Capacitor.Plugins.TrainingWidget.keepAwake({enabled:true})");
            bridge("window.Capacitor.Plugins.TrainingWidget.keepAwake({enabled:false})");
            bridge("window.Capacitor.Plugins.TrainingWidget.consumeLaunch()");
            AtomicReference<Intent> calendarIntent=new AtomicReference<>();
            Instrumentation.ActivityMonitor calendarMonitor=new Instrumentation.ActivityMonitor(){
                @Override public Instrumentation.ActivityResult onStartActivity(Intent intent){
                    if(Intent.ACTION_INSERT.equals(intent.getAction())&&CalendarContract.Events.CONTENT_URI.equals(intent.getData())){
                        calendarIntent.set(new Intent(intent));
                        return new Instrumentation.ActivityResult(Activity.RESULT_CANCELED,null);
                    }
                    return null;
                }
            };
            instrumentation.addMonitor(calendarMonitor);
            try {
                bridge("window.Capacitor.Plugins.TrainingWidget.addCalendarEvent({title:'PUSH test',description:'Test bez zapisywania wydarzenia',start:1893492000000,end:1893492900000,reminder:true})");
                assertNotNull("Calendar editor requested",calendarIntent.get());
                assertEquals("PUSH test",calendarIntent.get().getStringExtra(CalendarContract.Events.TITLE));
                assertEquals(900000,calendarIntent.get().getLongExtra(CalendarContract.EXTRA_EVENT_END_TIME,0)-calendarIntent.get().getLongExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME,0));
            } finally {instrumentation.removeMonitor(calendarMonitor);}
            SensorManager sensors=(SensorManager)context.getSystemService(Context.SENSOR_SERVICE);
            if(sensors.getDefaultSensor(Sensor.TYPE_PROXIMITY)!=null){
                bridge("window.Capacitor.Plugins.RepSensor.start({kind:'proximity'})");
                bridge("window.Capacitor.Plugins.RepSensor.stop()");
            }
            if(sensors.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)!=null){
                bridge("window.Capacitor.Plugins.RepSensor.start({kind:'hall'})");
                bridge("window.Capacitor.Plugins.RepSensor.stop()");
            }
            String payload=context.getSharedPreferences("push_widget",0).getString("payload",null);
            assertNotNull("Native widget data synchronized",payload);
            assertTrue(new JSONObject(payload).getJSONArray("plan").length()>0);
            // Verify arms and animations on the actual phone, without changing its date.
            click("Plan");waitFor("Najbliższe 30 dni");
            assertEquals("true",js("(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.includes('· H'));if(!b)return false;b.click();return true;})()"));
            waitFor("Unoszenie hantli bokiem");waitFor("Uginanie młotkowe");waitFor("Prostowanie ramion nad głową");
            assertEquals("3",js("document.querySelectorAll('.exercise-guide svg').length"));
            js("document.querySelector('.exercise-guide').scrollIntoView({block:'center'})");
            Thread.sleep(300);
            Bitmap screenshot=instrumentation.getUiAutomation().takeScreenshot();
            assertNotNull("Phone screenshot",screenshot);
            try(FileOutputStream image=new FileOutputStream(new File(context.getCacheDir(),"pushpal-arms-test.png"))){screenshot.compress(Bitmap.CompressFormat.PNG,100,image);}
        } finally {
            if(original==null||original.equals("null"))js("localStorage.removeItem('push-pal:state:v2')");
            else js("localStorage.setItem('push-pal:state:v2',"+original+")");
            if(widgetOriginal==null)context.getSharedPreferences("push_widget",0).edit().remove("payload").commit();
            else context.getSharedPreferences("push_widget",0).edit().putString("payload",widgetOriginal).commit();
            TrainingWidgetProvider.updateAll(context);
            reload();
        }
    }
    @Test public void nativeWidgetLayoutsRenderAtSmallWideAndLargeSizes() throws Exception {
        Context context=instrumentation.getTargetContext();
        Method layout=TrainingWidgetProvider.class.getDeclaredMethod("layout",Context.class,int.class,int.class,int.class);
        layout.setAccessible(true);
        AtomicReference<Throwable> failure=new AtomicReference<>();
        instrumentation.runOnMainSync(()->{
            try {
                for(int[] size:new int[][]{{100,80},{220,80},{160,160},{240,220}}){
                    RemoteViews remote=(RemoteViews)layout.invoke(null,context,123,size[0],size[1]);
                    View view=remote.apply(context,new FrameLayout(context));
                    float density=context.getResources().getDisplayMetrics().density;
                    view.measure(View.MeasureSpec.makeMeasureSpec((int)(size[0]*density),View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec((int)(size[1]*density),View.MeasureSpec.EXACTLY));
                    view.layout(0,0,view.getMeasuredWidth(),view.getMeasuredHeight());
                    TextView value=view.findViewById(R.id.widget_value);
                    assertTrue("Value present at "+size[0]+"x"+size[1],value.getText().length()>0);
                    assertTrue("Value has space at "+size[0]+"x"+size[1],value.getHeight()>0);
                    assertEquals(size[1]>=150?View.VISIBLE:View.GONE,view.findViewById(R.id.widget_action).getVisibility());
                    assertEquals(size[1]>=220?View.VISIBLE:View.GONE,view.findViewById(R.id.widget_trend).getVisibility());
                }
            }catch(Throwable error){failure.set(error);}
        });
        if(failure.get()!=null)throw new AssertionError("Widget rendering",failure.get());
    }
}
