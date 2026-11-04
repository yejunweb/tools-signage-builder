/** 是否运行在 Tauri WebView（存在 `__TAURI_INTERNALS__`） */
export const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
