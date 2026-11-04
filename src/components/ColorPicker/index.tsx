import { useEffect, useMemo, useRef, useState } from 'react';

import { COLOR_PRESETS, THEME_PRIMARY } from '@/constants/signage';
import { hexToRgb, hsvToRgb, hueColor, rgbToHex, rgbToHsv } from '@/utils/color';
import { normalizeHex } from '@/utils/format';

import './index.css';

export type ColorPickerProps = {
    value: string;
    onChange: (hex: string) => void;
    /** 是否显示 Hex 输入 */
    showHex?: boolean;
};

/**
 * 颜色选择通用组件：触发器 + SV/Hue/预设/Hex。
 */
function ColorPicker({ value, onChange, showHex = true }: ColorPickerProps) {
    const [open, setOpen] = useState(false);
    const [hexInput, setHexInput] = useState(() => normalizeHex(value));
    const [editingHex, setEditingHex] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const hsv = useMemo(() => {
        const { r, g, b } = hexToRgb(value);
        return rgbToHsv(r, g, b);
    }, [value]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const commitHex = (raw: string) => {
        const next = normalizeHex(raw);
        setHexInput(next);
        onChange(next);
    };

    const setFromHsv = (h: number, s: number, v: number) => {
        const { r, g, b } = hsvToRgb(h, s, v);
        onChange(rgbToHex(r, g, b));
    };

    return (
        <div className='comp-color-picker' ref={rootRef}>
            <button type='button' className='comp-color-picker__trigger' onClick={() => setOpen(v => !v)}>
                <i className='comp-color-picker__swatch' style={{ background: normalizeHex(value) }} />
                {showHex ? <span className='comp-color-picker__hex'>{normalizeHex(value)}</span> : null}
                <svg width='10' height='10' viewBox='0 0 10 10' aria-hidden>
                    <path d='M2 3.5L5 6.5L8 3.5' stroke='currentColor' strokeWidth='1.2' fill='none' strokeLinecap='round' />
                </svg>
            </button>
            {open ? (
                <div className='comp-color-picker__panel'>
                    <div
                        className='comp-color-picker__sv'
                        style={{ background: hueColor(hsv.h) }}
                        onPointerDown={e => {
                            const el = e.currentTarget;
                            const move = (ev: PointerEvent) => {
                                const rect = el.getBoundingClientRect();
                                const s = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
                                const v = 1 - Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
                                setFromHsv(hsv.h, s, v);
                            };
                            move(e.nativeEvent);
                            const up = () => {
                                window.removeEventListener('pointermove', move);
                                window.removeEventListener('pointerup', up);
                            };
                            window.addEventListener('pointermove', move);
                            window.addEventListener('pointerup', up);
                        }}
                    >
                        <i className='comp-color-picker__sv-knob' style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
                    </div>
                    <div
                        className='comp-color-picker__hue'
                        onPointerDown={e => {
                            const el = e.currentTarget;
                            const move = (ev: PointerEvent) => {
                                const rect = el.getBoundingClientRect();
                                const h = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width)) * 360;
                                setFromHsv(h, hsv.s, hsv.v);
                            };
                            move(e.nativeEvent);
                            const up = () => {
                                window.removeEventListener('pointermove', move);
                                window.removeEventListener('pointerup', up);
                            };
                            window.addEventListener('pointermove', move);
                            window.addEventListener('pointerup', up);
                        }}
                    >
                        <i className='comp-color-picker__hue-knob' style={{ left: `${(hsv.h / 360) * 100}%` }} />
                    </div>
                    <div className='comp-color-picker__presets'>
                        {COLOR_PRESETS.map(c => {
                            const active = normalizeHex(value) === c;
                            return (
                                <button
                                    key={c}
                                    type='button'
                                    className='comp-color-picker__preset'
                                    style={{
                                        background: c,
                                        outline: active ? `2px solid ${THEME_PRIMARY}` : '1px solid #e5e8ef',
                                        outlineOffset: 1,
                                    }}
                                    onClick={() => onChange(c)}
                                    aria-label={c}
                                />
                            );
                        })}
                    </div>
                    <div className='comp-color-picker__hex-row'>
                        <span>Hex</span>
                        <input
                            value={editingHex ? hexInput : normalizeHex(value)}
                            onFocus={() => {
                                setEditingHex(true);
                                setHexInput(normalizeHex(value));
                            }}
                            onChange={e => setHexInput(e.target.value)}
                            onBlur={() => {
                                commitHex(hexInput);
                                setEditingHex(false);
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    commitHex(hexInput);
                                    setEditingHex(false);
                                }
                            }}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default ColorPicker;
