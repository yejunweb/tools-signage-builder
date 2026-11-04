/** YYYY-MM-dd hh:mm:ss */
export const formatDateTime = (date = new Date()): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const createDefaultRecordName = (date = new Date()): string => `${formatDateTime(date)} 创建的记录`;

export const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const normalizeHex = (hex: string): string => {
    let v = (hex || '#FFFFFF').trim().toUpperCase();
    if (!v.startsWith('#')) v = `#${v}`;
    if (v.length === 4) {
        v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
    }
    if (!/^#[0-9A-F]{6}$/.test(v)) return '#FFFFFF';
    return v;
};
