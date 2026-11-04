import { normalizeHex } from './format';

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const h = normalizeHex(hex).slice(1);
    return {
        r: parseInt(h.slice(0, 2), 16) || 0,
        g: parseInt(h.slice(2, 4), 16) || 0,
        b: parseInt(h.slice(4, 6), 16) || 0,
    };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
    const c = (n: number) =>
        Math.max(0, Math.min(255, Math.round(n)))
            .toString(16)
            .padStart(2, '0')
            .toUpperCase();
    return `#${c(r)}${c(g)}${c(b)}`;
};

export const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (d !== 0) {
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            default:
                h = ((r - g) / d + 4) / 6;
        }
    }
    return { h: h * 360, s, v };
};

export const hsvToRgb = (h: number, s: number, v: number) => {
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return {
        r: (r + m) * 255,
        g: (g + m) * 255,
        b: (b + m) * 255,
    };
};

export const hueColor = (h: number) => {
    const { r, g, b } = hsvToRgb(h, 1, 1);
    return rgbToHex(r, g, b);
};
