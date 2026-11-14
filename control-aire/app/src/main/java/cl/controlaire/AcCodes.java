package cl.controlaire;

/**
 * Genera las señales infrarrojas (duraciones en microsegundos, encendido/apagado
 * alternados, portadora de 38 kHz) para los protocolos de aire acondicionado más
 * usados por los fabricantes que producen equipos para marcas como Kendal.
 */
final class AcCodes {

    static final int FREQ = 38000;

    static final int COOL = 0, HEAT = 1, DRY = 2, FAN = 3, AUTO = 4;
    static final int F_AUTO = 0, F_LOW = 1, F_MED = 2, F_HIGH = 3;

    static final int P_COOLIX = 0, P_GREE = 1, P_TCL = 2, P_ELECTRA = 3;
    static final String[] PROTOCOLS = {
        "Tipo 1 · Midea / Coolix",
        "Tipo 2 · Gree",
        "Tipo 3 · TCL",
        "Tipo 4 · AUX / Electra",
    };

    static final int TEMP_MIN = 17, TEMP_MAX = 30;

    private AcCodes() {}

    /** Señal con el estado completo del equipo. */
    static int[] build(int proto, boolean power, int mode, int temp, int fan, boolean swing) {
        temp = Math.max(TEMP_MIN, Math.min(TEMP_MAX, temp));
        switch (proto) {
            case P_GREE: return gree(power, mode, temp, fan, swing);
            case P_TCL: return tcl(power, mode, temp, fan, swing);
            case P_ELECTRA: return electra(power, mode, temp, fan, swing);
            default: return coolix(power ? coolixState(mode, temp, fan) : COOLIX_OFF);
        }
    }

    /** En Coolix la oscilación es un comando aparte que alterna; en el resto va en el estado. */
    static boolean swingIsToggle(int proto) {
        return proto == P_COOLIX;
    }

    static int[] swingToggle() {
        return coolix(COOLIX_SWING);
    }

    // ---------------------------------------------------------------- Coolix

    static final int COOLIX_OFF = 0xB27BE0;
    static final int COOLIX_SWING = 0xB26BE0;
    private static final int[] COOLIX_TEMP = {
        0b0000, 0b0001, 0b0011, 0b0010, 0b0110, 0b0111, 0b0101,   // 17..23
        0b0100, 0b1100, 0b1101, 0b1001, 0b1000, 0b1010, 0b1011,   // 24..30
    };

    static int coolixState(int mode, int temp, int fan) {
        int fanBits;
        switch (fan) {
            case F_LOW: fanBits = 0b100; break;
            case F_MED: fanBits = 0b010; break;
            case F_HIGH: fanBits = 0b001; break;
            default: fanBits = 0b101;
        }
        int t = COOLIX_TEMP[temp - 17];
        int modeBits;
        switch (mode) {
            case HEAT: modeBits = 0b11; break;
            case DRY: modeBits = 0b01; fanBits = 0b000; break;
            case AUTO: modeBits = 0b10; fanBits = 0b000; break;
            case FAN: modeBits = 0b01; t = 0b1110; break;
            default: modeBits = 0b00;
        }
        return 0xB20000 | (fanBits << 13) | 0x1F00 | (t << 4) | (modeBits << 2);
    }

    static int[] coolix(int code) {
        Pulses p = new Pulses();
        for (int rep = 0; rep < 2; rep++) {
            p.add(4692, 4416);
            for (int shift = 16; shift >= 0; shift -= 8) {
                int b = (code >> shift) & 0xFF;
                p.byteMsb(b, 552, 1656, 552);
                p.byteMsb(~b & 0xFF, 552, 1656, 552);
            }
            p.add(552, 5244);
        }
        return p.toArray();
    }

    // ------------------------------------------------------------------ Gree

    static int[] gree(boolean power, int mode, int temp, int fan, boolean swing) {
        int m;
        switch (mode) {
            case HEAT: m = 4; break;
            case DRY: m = 2; break;
            case FAN: m = 3; break;
            case AUTO: m = 0; break;
            default: m = 1;
        }
        int[] s = new int[8];
        s[0] = m | (power ? 0x08 : 0) | (fan << 4) | (swing ? 0x40 : 0);
        s[1] = temp - 16;
        s[2] = 0x20 | (power ? 0x40 : 0);
        s[3] = 0x50;
        s[4] = swing ? 0x01 : 0x00;
        s[5] = 0x20;
        s[6] = 0x00;
        int sum = 10;
        for (int i = 0; i < 4; i++) sum += s[i] & 0x0F;
        for (int i = 4; i < 7; i++) sum += s[i] >> 4;
        s[7] = (sum & 0x0F) << 4;

        Pulses p = new Pulses();
        p.add(9000, 4500);
        for (int i = 0; i < 4; i++) p.byteLsb(s[i], 620, 1600, 540);
        p.bit(false, 620, 1600, 540);
        p.bit(true, 620, 1600, 540);
        p.bit(false, 620, 1600, 540);
        p.add(620, 19980);
        for (int i = 4; i < 8; i++) p.byteLsb(s[i], 620, 1600, 540);
        p.add(620, 19980);
        return p.toArray();
    }

    // ------------------------------------------------------------------- TCL

    static int[] tcl(boolean power, int mode, int temp, int fan, boolean swing) {
        int m;
        switch (mode) {
            case HEAT: m = 1; break;
            case DRY: m = 2; break;
            case FAN: m = 7; break;
            case AUTO: m = 8; break;
            default: m = 3;
        }
        int f;
        switch (fan) {
            case F_LOW: f = 2; break;
            case F_MED: f = 3; break;
            case F_HIGH: f = 5; break;
            default: f = 0;
        }
        int[] s = {0x23, 0xCB, 0x26, 0x01, 0x00, power ? 0x24 : 0x20, m, 31 - temp,
                   0x40 | f | (swing ? 0x38 : 0), 0x00, 0x00, 0x00, 0x80, 0x00};
        s[13] = sum(s, 13);
        return generic(s, 3000, 1650, 500, 1050, 325);
    }

    // --------------------------------------------------------- AUX / Electra

    static int[] electra(boolean power, int mode, int temp, int fan, boolean swing) {
        int m;
        switch (mode) {
            case HEAT: m = 4; break;
            case DRY: m = 2; break;
            case FAN: m = 6; break;
            case AUTO: m = 0; break;
            default: m = 1;
        }
        int f;
        switch (fan) {
            case F_LOW: f = 3; break;
            case F_MED: f = 2; break;
            case F_HIGH: f = 1; break;
            default: f = 5;
        }
        int[] s = new int[13];
        s[0] = 0xC3;
        s[1] = ((temp - 8) << 3) | (swing ? 0 : 7);
        s[2] = 0xE0;
        s[4] = f << 5;
        s[6] = m << 5;
        s[9] = power ? 0x20 : 0x00;
        s[11] = 0x08;
        s[12] = sum(s, 12);
        return generic(s, 9166, 4470, 646, 1647, 547);
    }

    // ------------------------------------------------------------- utilidades

    private static int sum(int[] s, int n) {
        int t = 0;
        for (int i = 0; i < n; i++) t += s[i];
        return t & 0xFF;
    }

    private static int[] generic(int[] bytes, int hdrMark, int hdrSpace, int mark, int one, int zero) {
        Pulses p = new Pulses();
        p.add(hdrMark, hdrSpace);
        for (int b : bytes) p.byteLsb(b, mark, one, zero);
        p.add(mark, 20000);
        return p.toArray();
    }

    private static final class Pulses {
        private int[] a = new int[512];
        private int n;

        void add(int on, int off) {
            if (n + 2 > a.length) a = java.util.Arrays.copyOf(a, a.length * 2);
            a[n++] = on;
            a[n++] = off;
        }

        void bit(boolean v, int mark, int one, int zero) {
            add(mark, v ? one : zero);
        }

        void byteMsb(int b, int mark, int one, int zero) {
            for (int i = 7; i >= 0; i--) bit(((b >> i) & 1) == 1, mark, one, zero);
        }

        void byteLsb(int b, int mark, int one, int zero) {
            for (int i = 0; i < 8; i++) bit(((b >> i) & 1) == 1, mark, one, zero);
        }

        int[] toArray() {
            return java.util.Arrays.copyOf(a, n);
        }
    }
}
