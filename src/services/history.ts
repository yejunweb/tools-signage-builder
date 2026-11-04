import { HISTORY_STORAGE_KEY } from '@/constants/signage';
import type { HistoryFile, SignRecord } from '@/types/signage';

const emptyHistory = (): HistoryFile => ({ version: 1, items: [] });

const readRaw = (): HistoryFile => {
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!raw) return emptyHistory();
        const parsed = JSON.parse(raw) as HistoryFile;
        if (parsed?.version !== 1 || !Array.isArray(parsed.items)) return emptyHistory();
        return parsed;
    } catch {
        return emptyHistory();
    }
};

const writeRaw = (data: HistoryFile) => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(data));
};

export const listRecords = (): SignRecord[] => {
    const items = readRaw().items;
    return [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
};

export const getRecord = (id: string): SignRecord | undefined => readRaw().items.find(item => item.id === id);

export const upsertRecord = (record: SignRecord): void => {
    const data = readRaw();
    const idx = data.items.findIndex(item => item.id === record.id);
    if (idx >= 0) data.items[idx] = record;
    else data.items.unshift(record);
    writeRaw(data);
};

export const removeRecord = (id: string): void => {
    const data = readRaw();
    data.items = data.items.filter(item => item.id !== id);
    writeRaw(data);
};

