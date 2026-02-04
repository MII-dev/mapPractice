export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function generatePalette(baseColor: string, steps: number = 6): string[] {
    // Legacy support for named colors
    const legacyPalettes: Record<string, string[]> = {
        blue: ["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7"],
        green: ["#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a"],
        purple: ["#f3e8ff", "#e9d5ff", "#d8b4fe", "#c084fc", "#a855f7", "#9333ea"],
        red: ["#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626"],
        orange: ["#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c"],
        teal: ["#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488"],
        indigo: ["#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5"],
    };

    if (legacyPalettes[baseColor]) {
        return legacyPalettes[baseColor];
    }

    // Fallback to blue if invalid hex
    if (!baseColor || !baseColor.startsWith("#")) {
        return legacyPalettes['blue'];
    }

    const rgb = hexToRgb(baseColor);
    if (!rgb) return legacyPalettes['blue'];

    const palette: string[] = [];

    // Interpolate between very light tint (mixed with white) and base color
    for (let i = 0; i < steps; i++) {
        // t goes from ~0.2 (light) to 1.0 (base color)
        const t = 0.2 + (0.8 * i) / (steps - 1);

        // Mix with white (255, 255, 255)
        // new = rgb * t + 255 * (1 - t)
        const r = Math.round(rgb.r * t + 255 * (1 - t));
        const g = Math.round(rgb.g * t + 255 * (1 - t));
        const b = Math.round(rgb.b * t + 255 * (1 - t));

        palette.push(rgbToHex(r, g, b));
    }

    return palette;
}
