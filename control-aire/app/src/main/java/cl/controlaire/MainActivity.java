package cl.controlaire;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.hardware.ConsumerIrManager;
import android.os.Bundle;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final String[] MODE_NAMES = {"Frío", "Calor", "Seco", "Ventilar", "Auto"};
    private static final String[] FAN_NAMES = {"Auto", "Baja", "Media", "Alta"};

    private static final int BG = 0xFF0E1A24, CARD = 0xFF1A2B3A, ACCENT = 0xFF35C2F0,
            TEXT = 0xFFFFFFFF, MUTED = 0xFF8FA6B8, ON = 0xFF2EBD6B, OFF = 0xFFE05252;

    private ConsumerIrManager ir;
    private SharedPreferences prefs;

    private int proto, mode, temp, fan;
    private boolean power, swing;

    private TextView tempView, statusView, powerView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ir = (ConsumerIrManager) getSystemService(Context.CONSUMER_IR_SERVICE);
        prefs = getSharedPreferences("estado", MODE_PRIVATE);
        proto = clamp(prefs.getInt("proto", 0), 0, AcCodes.PROTOCOLS.length - 1);
        mode = clamp(prefs.getInt("mode", AcCodes.COOL), 0, MODE_NAMES.length - 1);
        temp = clamp(prefs.getInt("temp", 24), AcCodes.TEMP_MIN, AcCodes.TEMP_MAX);
        fan = clamp(prefs.getInt("fan", AcCodes.F_AUTO), 0, FAN_NAMES.length - 1);
        power = prefs.getBoolean("power", false);
        swing = prefs.getBoolean("swing", false);
        setContentView(buildUi());
        refresh();
    }

    // ------------------------------------------------------------------ UI

    private View buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(24), dp(20), dp(24));
        root.setBackgroundColor(BG);

        TextView title = label("Control Aire Kendal", 20, TEXT);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        root.addView(title);

        powerView = label("", 14, MUTED);
        root.addView(powerView);

        if (ir == null || !ir.hasIrEmitter()) {
            TextView warn = label("Este teléfono no reporta un emisor infrarrojo. "
                    + "La app no podrá enviar señales.", 14, OFF);
            warn.setPadding(0, dp(12), 0, 0);
            root.addView(warn);
        }

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER_HORIZONTAL);
        card.setBackground(round(CARD, 24));
        card.setPadding(dp(16), dp(20), dp(16), dp(20));
        tempView = label("", 88, TEXT);
        tempView.setGravity(Gravity.CENTER);
        tempView.setTypeface(Typeface.create("sans-serif-light", Typeface.NORMAL));
        card.addView(tempView);
        statusView = label("", 15, MUTED);
        statusView.setGravity(Gravity.CENTER);
        card.addView(statusView);
        root.addView(card, margins(16));

        root.addView(row(
                button("−", 34, CARD, TEXT, v -> changeTemp(-1)),
                button("+", 34, CARD, TEXT, v -> changeTemp(1))), margins(12));

        root.addView(row(
                button("Encender", 17, ON, TEXT, v -> { power = true; sendState(); }),
                button("Apagar", 17, OFF, TEXT, v -> { power = false; sendState(); })), margins(12));

        root.addView(row(
                button("Modo", 15, CARD, ACCENT, v -> {
                    mode = (mode + 1) % MODE_NAMES.length;
                    sendIfOn();
                }),
                button("Ventilador", 15, CARD, ACCENT, v -> {
                    fan = (fan + 1) % FAN_NAMES.length;
                    sendIfOn();
                }),
                button("Oscilar", 15, CARD, ACCENT, v -> toggleSwing())), margins(12));

        TextView hint = label("Tipo de señal — si el aire no responde, prueba otro tipo y "
                + "presiona Encender apuntando el teléfono al equipo.", 13, MUTED);
        root.addView(hint, margins(24));

        Spinner spinner = new Spinner(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, AcCodes.PROTOCOLS);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
        spinner.setSelection(proto);
        spinner.setBackground(round(CARD, 14));
        spinner.setPadding(dp(8), dp(10), dp(8), dp(10));
        spinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position != proto) {
                    proto = position;
                    swing = false;
                    refresh();
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
        root.addView(spinner, margins(8));

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BG);
        scroll.addView(root);
        return scroll;
    }

    private TextView label(String text, int sp, int color) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(sp);
        t.setTextColor(color);
        return t;
    }

    private TextView button(String text, int sp, int bg, int fg, View.OnClickListener click) {
        TextView b = label(text, sp, fg);
        b.setGravity(Gravity.CENTER);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setBackground(round(bg, 18));
        b.setMinHeight(dp(64));
        b.setClickable(true);
        b.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            click.onClick(v);
        });
        return b;
    }

    private LinearLayout row(View... views) {
        LinearLayout r = new LinearLayout(this);
        r.setOrientation(LinearLayout.HORIZONTAL);
        for (int i = 0; i < views.length; i++) {
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            if (i > 0) lp.leftMargin = dp(12);
            r.addView(views[i], lp);
        }
        return r;
    }

    private LinearLayout.LayoutParams margins(int topDp) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(topDp);
        return lp;
    }

    private GradientDrawable round(int color, int radiusDp) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(radiusDp));
        return g;
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private static int clamp(int v, int lo, int hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    // -------------------------------------------------------------- acciones

    private void changeTemp(int delta) {
        temp = clamp(temp + delta, AcCodes.TEMP_MIN, AcCodes.TEMP_MAX);
        sendIfOn();
    }

    private void toggleSwing() {
        if (AcCodes.swingIsToggle(proto)) {
            if (power) transmit(AcCodes.swingToggle());
            else Toast.makeText(this, "Enciende el aire primero", Toast.LENGTH_SHORT).show();
            return;
        }
        swing = !swing;
        sendIfOn();
    }

    /** Como un control real: con el aire apagado solo se ajusta la pantalla. */
    private void sendIfOn() {
        if (power) sendState();
        else refresh();
    }

    private void sendState() {
        refresh();
        transmit(AcCodes.build(proto, power, mode, temp, fan, swing));
    }

    private void transmit(int[] pattern) {
        if (ir == null || !ir.hasIrEmitter()) {
            Toast.makeText(this, "Sin emisor infrarrojo", Toast.LENGTH_SHORT).show();
            return;
        }
        try {
            ir.transmit(AcCodes.FREQ, pattern);
        } catch (RuntimeException e) {
            Toast.makeText(this, "No se pudo enviar: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void refresh() {
        tempView.setText(mode == AcCodes.FAN ? "—" : temp + "°");
        tempView.setTextColor(power ? TEXT : MUTED);
        String status = MODE_NAMES[mode] + "  ·  Ventilador " + FAN_NAMES[fan];
        if (!AcCodes.swingIsToggle(proto)) status += "  ·  Oscilar " + (swing ? "sí" : "no");
        statusView.setText(status);
        powerView.setText(power ? "Encendido" : "Apagado");
        powerView.setTextColor(power ? ON : MUTED);
        prefs.edit().putInt("proto", proto).putInt("mode", mode).putInt("temp", temp)
                .putInt("fan", fan).putBoolean("power", power).putBoolean("swing", swing).apply();
    }
}
