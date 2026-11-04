import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

import { type GenerateSignCanvasInput, canvasToDataUrl, generateSignCanvas } from './generateSignCanvas';
import { isTauri } from './isTauri';

export const buildExportDataUrl = (input: GenerateSignCanvasInput): string => canvasToDataUrl(generateSignCanvas(input));

const sanitizeFileBase = (name: string) => {
    const trimmed = name.trim() || '标牌';
    // 去掉路径分隔与非法文件名字符，保留中文与常见符号
    return trimmed.replace(/[\\/:*?"<>|]/g, '_');
};

export const ensurePngFileName = (fileName: string) => {
    const base = sanitizeFileBase(fileName);
    return base.toLowerCase().endsWith('.png') ? base : `${base}.png`;
};

/** dataURL → PNG 字节 */
export const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
    const comma = dataUrl.indexOf(',');
    const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

/** 浏览器降级：`<a download>` */
export const downloadPngViaAnchor = (dataUrl: string, fileName: string) => {
    const safeName = ensurePngFileName(fileName);
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = safeName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
};

export type ExportPngResult =
    | { ok: true; mode: 'tauri-dialog'; path: string }
    | { ok: true; mode: 'anchor-fallback'; reason: string }
    | { ok: false; cancelled: true }
    | { ok: false; cancelled?: false; error: string; fellBack: boolean };

/**
 * 导出 PNG：Tauri 下走「另存为」可选路径 + 写文件；非 Tauri / 失败时降级 `<a download>`。
 * 默认文件名 = 记录名.png
 */
export const exportPng = async (dataUrl: string, recordName: string): Promise<ExportPngResult> => {
    const fileName = ensurePngFileName(recordName);

    if (!isTauri()) {
        downloadPngViaAnchor(dataUrl, fileName);
        return { ok: true, mode: 'anchor-fallback', reason: '非 Tauri 环境，已用浏览器下载' };
    }

    try {
        const path = await save({
            title: '导出 PNG',
            defaultPath: fileName,
            filters: [{ name: 'PNG', extensions: ['png'] }],
        });

        if (path === null) {
            return { ok: false, cancelled: true };
        }

        const bytes = dataUrlToUint8Array(dataUrl);
        await writeFile(path, bytes);
        return { ok: true, mode: 'tauri-dialog', path };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        try {
            downloadPngViaAnchor(dataUrl, fileName);
            return {
                ok: true,
                mode: 'anchor-fallback',
                reason: `另存为失败（${message}），已降级为浏览器下载`,
            };
        } catch (fallbackErr) {
            const fb = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
            return { ok: false, error: `导出失败：${message}；降级亦失败：${fb}`, fellBack: false };
        }
    }
};
