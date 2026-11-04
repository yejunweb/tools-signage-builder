import { useState } from 'react';

import { getCurrentWindow } from '@tauri-apps/api/window';

import { isTauri } from '@/utils/isTauri';

import './index.css';

type WindowShellProps = {
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    children: React.ReactNode;
};

async function minimizeWindow() {
    if (!isTauri()) return;
    try {
        await getCurrentWindow().minimize();
    } catch (err) {
        console.error(err);
    }
}

async function closeWindow() {
    if (!isTauri()) return;
    try {
        await getCurrentWindow().close();
    } catch (err) {
        console.error(err);
    }
}

/**
 * 应用壳：Header + 内容区。
 * 整条 Header 为拖窗区（标题/空白/「返回」文字）；窗控与返回按钮 no-drag，可点。
 */
function WindowShell({ title, showBack = false, onBack, children }: WindowShellProps) {
    const [hov, setHov] = useState<'min' | 'close' | null>(null);

    return (
        <div className='comp-window-shell'>
            <header className='comp-window-shell__header' data-tauri-drag-region>
                <div className='comp-window-shell__title-wrap'>
                    {showBack ? (
                        <button type='button' className='comp-window-shell__back' onClick={onBack} aria-label='返回'>
                            <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
                                <path
                                    d='M10 3.5L5.5 8L10 12.5'
                                    stroke='currentColor'
                                    strokeWidth='1.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </button>
                    ) : null}
                    <div className='comp-window-shell__title'>{title}</div>
                </div>
                <div className='comp-window-shell__controls'>
                    <button
                        type='button'
                        title='最小化'
                        aria-label='最小化'
                        className='comp-window-shell__win-btn'
                        style={{ background: hov === 'min' ? 'rgba(15,23,42,.06)' : 'transparent' }}
                        onMouseEnter={() => setHov('min')}
                        onMouseLeave={() => setHov(null)}
                        onClick={() => void minimizeWindow()}
                    >
                        <svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden>
                            <path d='M3 7h8' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
                        </svg>
                    </button>
                    <button
                        type='button'
                        title='关闭'
                        aria-label='关闭'
                        className='comp-window-shell__win-btn'
                        style={{
                            color: hov === 'close' ? '#fff' : '#8b95a8',
                            background: hov === 'close' ? '#e34d59' : 'transparent',
                        }}
                        onMouseEnter={() => setHov('close')}
                        onMouseLeave={() => setHov(null)}
                        onClick={() => void closeWindow()}
                    >
                        <svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden>
                            <path d='M3.5 3.5l7 7M10.5 3.5l-7 7' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
                        </svg>
                    </button>
                </div>
            </header>
            <div className='comp-window-shell__body'>{children}</div>
        </div>
    );
}

export default WindowShell;
