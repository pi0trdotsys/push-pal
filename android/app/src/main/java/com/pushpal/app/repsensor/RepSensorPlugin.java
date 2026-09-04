package com.pushpal.app.repsensor;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * PUSH — wtyczka Capacitor licząca powtórzenia z prawdziwego czujnika telefonu.
 *
 * Dwa tryby (patrz {@code kind} przekazywane z JS, {@code SensorKind} w
 * {@code src/hooks/use-rep-sensor.ts}):
 *
 * <ul>
 *   <li><b>hall</b> — magnetometr ({@link Sensor#TYPE_MAGNETIC_FIELD}), czyli
 *       fizycznie tablica czujników Halla w telefonie. Zbliżający się magnes
 *       (np. w opasce na nadgarstek albo przyklejony do podłogi) zaburza pole
 *       — to jest klasyczna, sprzętowa metoda liczenia pompek czujnikiem
 *       Halla, o którą prosił użytkownik.</li>
 *   <li><b>proximity</b> — sprzętowy czujnik zbliżeniowy
 *       ({@link Sensor#TYPE_PROXIMITY}), na wielu telefonach fizycznie też
 *       zbudowany na efekcie Halla/magnetycznym. Nie wymaga żadnego magnesu —
 *       liczy z odległości ręki/klatki piersiowej od telefonu.</li>
 * </ul>
 *
 * Wtyczka NIE liczy sama powtórzeń — tylko strumieniuje znormalizowany sygnał
 * w tej samej skali (0..~20, "mm-podobnej") co symulacja na webie, jednym
 * eventem {@code reading}. Detekcja progu, tempo i stabilność zostają po
 * stronie JS ({@code useRepSensor}), więc logika jest identyczna niezależnie
 * od źródła danych.
 */
@CapacitorPlugin(name = "RepSensor")
public class RepSensorPlugin extends Plugin implements SensorEventListener {

    /** Emisja do JS ograniczona do ~30 Hz — magnetometr potrafi tykać dużo szybciej. */
    private static final long MIN_EMIT_INTERVAL_MS = 33;

    /**
     * Skala przeliczająca zaburzenie pola magnetycznego (µT) na spadek
     * pseudo-dystansu (mm-podobny). Dobrana pod magnes średniej siły w
     * odległości kilku centymetrów od telefonu; użytkownik doestraja realną
     * czułość suwakiem "Czułość" w ekranie Plan (próg w tych samych mm).
     */
    private static final float MICROTESLA_PER_MM = 60f;

    /** Bazowa (spoczynkowa) skala pseudo-dystansu, zgodna z symulacją webową. */
    private static final float DISTANCE_MAX = 20f;
    private static final float DISTANCE_MIN = 1f;

    /** Szybkość dryfu linii bazowej pola magnetycznego (filtr wykładniczy). */
    private static final float BASELINE_ALPHA = 0.02f;

    private SensorManager sensorManager;
    private Sensor magneticSensor;
    private Sensor proximitySensor;

    private String activeKind;
    private float magneticBaseline = Float.NaN;
    private long lastEmitAt = 0L;

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(android.content.Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            magneticSensor = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
            proximitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY);
        }
    }

    @PluginMethod
    public void start(PluginCall call) {
        String kind = call.getString("kind", "hall");
        if (sensorManager == null) {
            call.reject("Brak SensorManager na tym urządzeniu.");
            return;
        }

        Sensor sensor = "proximity".equals(kind) ? proximitySensor : magneticSensor;
        if (sensor == null) {
            call.reject("Czujnik '" + kind + "' niedostępny na tym urządzeniu.");
            return;
        }

        // Zmiana rodzaju czujnika w trakcie działania — zdejmij poprzedni listener.
        sensorManager.unregisterListener(this);
        magneticBaseline = Float.NaN;
        activeKind = kind;
        sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (sensorManager != null) sensorManager.unregisterListener(this);
        activeKind = null;
        call.resolve();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (activeKind == null) return;

        float distance;
        if (event.sensor.getType() == Sensor.TYPE_PROXIMITY) {
            distance = distanceFromProximity(event);
        } else if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            distance = distanceFromMagnetic(event);
        } else {
            return;
        }

        long now = System.currentTimeMillis();
        if (now - lastEmitAt < MIN_EMIT_INTERVAL_MS) return;
        lastEmitAt = now;

        JSObject data = new JSObject();
        data.put("distance", distance);
        notifyListeners("reading", data);
    }

    private float distanceFromProximity(SensorEvent event) {
        float value = event.values[0];
        float maxRange = event.sensor.getMaximumRange();
        if (maxRange <= 1f) {
            // Wiele telefonów raportuje tylko binarnie 0 (blisko) / maxRange (daleko).
            return value < maxRange ? DISTANCE_MIN : DISTANCE_MAX;
        }
        float mm = value * 10f; // cm -> mm
        return clamp(mm, DISTANCE_MIN, DISTANCE_MAX);
    }

    private float distanceFromMagnetic(SensorEvent event) {
        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];
        float magnitude = (float) Math.sqrt(x * x + y * y + z * z);

        if (Float.isNaN(magneticBaseline)) {
            magneticBaseline = magnitude;
        }

        float delta = Math.abs(magnitude - magneticBaseline);
        float distance = clamp(DISTANCE_MAX - delta / MICROTESLA_PER_MM, DISTANCE_MIN, DISTANCE_MAX);

        // Dryfuj linię bazową tylko gdy nic nie zaburza pola — inaczej magnes
        // trzymany blisko telefonu "stałby się" nową normą i zanikłby sygnał.
        boolean atRest = distance > DISTANCE_MAX - 1f;
        if (atRest) {
            magneticBaseline += BASELINE_ALPHA * (magnitude - magneticBaseline);
        }

        return distance;
    }

    private static float clamp(float v, float min, float max) {
        return Math.max(min, Math.min(max, v));
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // brak akcji — dokładność nie wpływa na logikę progu
    }

    @Override
    protected void handleOnDestroy() {
        if (sensorManager != null) sensorManager.unregisterListener(this);
        super.handleOnDestroy();
    }
}
