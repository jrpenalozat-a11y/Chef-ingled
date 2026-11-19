package app.controlaire.kendal;

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
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final int[] MODES = {ElectraCode.MODE_AUTO, ElectraCode.MODE_COOL, ElectraCode.MODE_DRY, ElectraCode.MODE_HEAT};
    private static final String[] MODE_NAMES = {"AUTO", "COOL (frío)", "DRY (deshumidificar)", "HEAT (calor)"};
    private static final int[] FANS = {ElectraCode.FAN_AUTO, ElectraCode.FAN_HIGH, ElectraCode.FAN_MED, ElectraCode.FAN_LOW};
    private static final String[] FAN_NAMES = {"AUTO", "HIGH (alta)", "MID (media)", "LOW (baja)"};

    private static final int FACE = 0xFFAEBBB3, SHELL = 0xFFF4F3EE, INK = 0xFF1D2321;
    private static final int LCD = 0xFFB9C2B0, KEY = 0xFFEEF3F1, RED = 0xFFEE4B3A;

    private boolean power, swing, swing2, strong, clean;
    private int mode = 1, fan = 1, temp = 24;

    private ConsumerIrManager ir;
    private SharedPreferences prefs;
    private TextView tempView, infoView, flagsView, statusView;
    private float dp;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        dp = getResources().getDisplayMetrics().density;
        ir = (ConsumerIrManager) getSystemService(Context.CONSUMER_IR_SERVICE);
        prefs = getSharedPreferences("estado", MODE_PRIVATE);
        power = prefs.getBoolean("power", false);
        mode = prefs.getInt("mode", 1);
        fan = prefs.getInt("fan", 1);
        temp = prefs.getInt("temp", 24);
        swing = prefs.getBoolean("swing", false);
        swing2 = prefs.getBoolean("swing2", false);
        strong = prefs.getBoolean("strong", false);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(px(18), px(18), px(18), px(24));
        root.setBackgroundColor(FACE);

        TextView title = text("SET  TEMPERATURE (°C)", 15, 0xFF4B5650, true);
        title.setGravity(Gravity.CENTER);
        root.addView(title);

        LinearLayout lcd = new LinearLayout(this);
        lcd.setOrientation(LinearLayout.VERTICAL);
        lcd.setGravity(Gravity.CENTER_HORIZONTAL);
        lcd.setPadding(px(12), px(10), px(12), px(12));
        lcd.setBackground(box(LCD, 8, 0xFF23282A, 5));
        tempView = text("", 72, 0xFF2A2F28, true);
        tempView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        infoView = text("", 16, 0xFF2A2F28, true);
        infoView.setGravity(Gravity.CENTER);
        flagsView = text("", 13, 0xFF2A2F28, false);
        flagsView.setGravity(Gravity.CENTER);
        lcd.addView(tempView);
        lcd.addView(infoView);
        lcd.addView(flagsView);
        root.addView(lcd, margins(0, 8, 0, 14));

        LinearLayout top = row();
        top.addView(key("▼", KEY, INK, v -> { if (temp > 16) temp--; send("Temperatura " + temp + " °C", false); }), cell());
        top.addView(key("ON/OFF", RED, Color.WHITE, v -> {
            power = !power;
            if (power) clean = false; else strong = false;
            send(power ? "Encendido" : "Apagado", false);
        }), cell());
        top.addView(key("▲", KEY, INK, v -> { if (temp < 32) temp++; send("Temperatura " + temp + " °C", false); }), cell());
        root.addView(top);

        LinearLayout r1 = row();
        r1.addView(key("MODE", KEY, INK, v -> {
            mode = (mode + 1) % 4;
            strong = false;
            if (mode == 2) fan = 3;
            send("Modo " + MODE_NAMES[mode], false);
        }), cell());
        r1.addView(key("SPEED", KEY, INK, v -> {
            if (mode == 2) { status("En DRY el ventilador queda en baja", false); return; }
            fan = (fan + 1) % 4;
            strong = false;
            send("Ventilador " + FAN_NAMES[fan], false);
        }), cell());
        r1.addView(key("STRONG", KEY, INK, v -> {
            if (mode != 1 && mode != 3) { status("STRONG solo funciona en frío o calor", false); return; }
            strong = !strong;
            if (strong) fan = 1;
            send("Strong " + onOff(strong), false);
        }), cell());
        root.addView(r1);

        LinearLayout r2 = row();
        r2.addView(key("SWING", KEY, INK, v -> { swing = !swing; send("Swing " + onOff(swing), false); }), cell());
        r2.addView(key("SWING2", KEY, INK, v -> { swing2 = !swing2; send("Swing2 " + onOff(swing2), false); }), cell());
        r2.addView(key("CLEAN", KEY, INK, v -> {
            if (power) { status("Para CLEAN apaga el equipo primero", false); return; }
            clean = !clean;
            send("Clean " + onOff(clean), false);
        }), cell());
        root.addView(r2);

        LinearLayout r3 = row();
        r3.addView(key("SCREEN", KEY, INK, v -> send("Pantalla del equipo", true)), cell());
        root.addView(r3);

        statusView = text("", 14, INK, false);
        statusView.setGravity(Gravity.CENTER);
        statusView.setPadding(0, px(14), 0, px(10));
        root.addView(statusView);

        TextView brand = text("Kendal · YKR-H/208E", 16, INK, true);
        brand.setGravity(Gravity.CENTER);
        brand.setBackground(box(SHELL, 10, 0, 0));
        brand.setPadding(px(10), px(14), px(10), px(14));
        root.addView(brand);

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(FACE);
        scroll.setFillViewport(true);
        scroll.addView(root);
        setContentView(scroll);

        render();
        if (ir == null || !ir.hasIrEmitter()) {
            status("Este teléfono no tiene emisor infrarrojo", true);
        } else {
            status("Apunta la parte superior del teléfono al equipo", false);
        }
    }

    private void send(String what, boolean lightToggle) {
        render();
        prefs.edit().putBoolean("power", power).putInt("mode", mode).putInt("fan", fan)
                .putInt("temp", temp).putBoolean("swing", swing).putBoolean("swing2", swing2)
                .putBoolean("strong", strong).apply();
        if (ir == null || !ir.hasIrEmitter()) {
            status("Este teléfono no tiene emisor infrarrojo", true);
            return;
        }
        try {
            int[] bytes = ElectraCode.bytes(power, MODES[mode], temp, FANS[fan], swing, swing2, strong, clean, lightToggle);
            ir.transmit(ElectraCode.FREQUENCY, ElectraCode.pattern(bytes));
            status("Enviado: " + what, false);
        } catch (RuntimeException e) {
            status("No se pudo enviar: " + e.getMessage(), true);
        }
    }

    private void render() {
        tempView.setText(temp + "°");
        infoView.setText((power ? "ENCENDIDO" : "APAGADO") + "\n" + MODE_NAMES[mode] + "  ·  FAN " + FAN_NAMES[fan]);
        StringBuilder f = new StringBuilder();
        if (strong) f.append("STRONG  ");
        if (swing) f.append("SWING  ");
        if (swing2) f.append("SWING2  ");
        if (clean) f.append("CLEAN");
        flagsView.setText(f.toString().trim());
    }

    private void status(String msg, boolean error) {
        statusView.setText(msg);
        statusView.setTextColor(error ? 0xFF9C1F12 : INK);
    }

    private static String onOff(boolean v) { return v ? "activado" : "desactivado"; }

    private int px(int v) { return Math.round(v * dp); }

    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private GradientDrawable box(int fill, int radius, int stroke, int strokeWidth) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(px(radius));
        if (strokeWidth > 0) d.setStroke(px(strokeWidth), stroke);
        return d;
    }

    private Button key(String label, int fill, int textColor, View.OnClickListener action) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(17);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setTextColor(textColor);
        b.setBackground(box(fill, 10, 0xFF7F8D86, 1));
        b.setMinHeight(px(60));
        b.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            action.onClick(v);
        });
        return b;
    }

    private LinearLayout row() {
        LinearLayout r = new LinearLayout(this);
        r.setOrientation(LinearLayout.HORIZONTAL);
        return r;
    }

    private LinearLayout.LayoutParams cell() {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        p.setMargins(px(4), px(5), px(4), px(5));
        return p;
    }

    private LinearLayout.LayoutParams margins(int l, int t, int r, int b) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        p.setMargins(px(l), px(t), px(r), px(b));
        return p;
    }
}
