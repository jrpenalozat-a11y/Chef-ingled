package app.controlaire.kendal;

/**
 * Trama infrarroja del protocolo Electra/AUX (controles YKR-H, YKR-T, YKR-M).
 * Distribucion de bits y tiempos tomados de IRremoteESP8266 (ir_Electra.h / ir_Electra.cpp).
 * Cada pulsacion envia el estado completo: 13 bytes, bit menos significativo primero, 38 kHz.
 */
public final class ElectraCode {
    public static final int FREQUENCY = 38000;

    public static final int MODE_AUTO = 0, MODE_COOL = 1, MODE_DRY = 2, MODE_HEAT = 4;
    public static final int FAN_AUTO = 5, FAN_HIGH = 1, FAN_MED = 2, FAN_LOW = 3;

    private static final int HDR_MARK = 9166, HDR_SPACE = 4470;
    private static final int BIT_MARK = 646, ONE_SPACE = 1647, ZERO_SPACE = 547;
    private static final int GAP = 40000;

    private ElectraCode() {}

    public static int[] bytes(boolean power, int mode, int temp, int fan, boolean swingV,
                              boolean swingH, boolean turbo, boolean clean, boolean lightToggle) {
        int t = Math.max(16, Math.min(32, temp)) - 8;
        int[] b = new int[13];
        b[0] = 0xC3;
        b[1] = (swingV ? 0 : 7) | (t << 3);
        b[2] = (swingH ? 0 : 7) << 5;
        b[4] = fan << 5;
        b[5] = turbo ? 0x40 : 0;
        b[6] = mode << 5;
        b[9] = (clean ? 0x04 : 0) | (power ? 0x20 : 0);
        b[11] = lightToggle ? 0x15 : 0x08;
        int sum = 0;
        for (int i = 0; i < 12; i++) sum += b[i];
        b[12] = sum & 0xFF;
        return b;
    }

    /** Patron encendido/apagado en microsegundos, como lo pide ConsumerIrManager.transmit. */
    public static int[] pattern(int[] b) {
        int[] p = new int[2 + b.length * 16 + 2];
        int n = 0;
        p[n++] = HDR_MARK;
        p[n++] = HDR_SPACE;
        for (int value : b) {
            for (int bit = 0; bit < 8; bit++) {
                p[n++] = BIT_MARK;
                p[n++] = ((value >> bit) & 1) == 1 ? ONE_SPACE : ZERO_SPACE;
            }
        }
        p[n++] = BIT_MARK;
        p[n] = GAP;
        return p;
    }
}
