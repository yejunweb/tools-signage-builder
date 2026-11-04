import { InputNumber } from 'antd';

import ColorPicker from '@/components/ColorPicker';
import ExpandPanel, { ExpandTrigger } from '@/components/ExpandPanel';
import { STROKE_WIDTH_MAX, STROKE_WIDTH_MIN, STROKE_WIDTH_STEP } from '@/constants/signage';
import type { TextStyle } from '@/types/signage';

type StyleFieldsProps = {
    style: TextStyle;
    onChange: (patch: Partial<TextStyle>) => void;
};

/** 字色 / 描边色 / 描边宽三件套 */
export function StyleFields({ style, onChange }: StyleFieldsProps) {
    return (
        <>
            <div className='pg-sign-edit__style-field'>
                <label>字色</label>
                <ColorPicker value={style.color} onChange={color => onChange({ color })} />
            </div>
            <div className='pg-sign-edit__style-field'>
                <label>描边色</label>
                <ColorPicker value={style.strokeColor} onChange={strokeColor => onChange({ strokeColor })} />
            </div>
            <div className='pg-sign-edit__style-field'>
                <label>描边宽</label>
                <InputNumber
                    min={STROKE_WIDTH_MIN}
                    max={STROKE_WIDTH_MAX}
                    step={STROKE_WIDTH_STEP}
                    value={style.strokeWidth}
                    onChange={v => onChange({ strokeWidth: typeof v === 'number' ? v : 0 })}
                />
            </div>
        </>
    );
}

type CollapsibleStyleRowProps = {
    title: string;
    open: boolean;
    onToggle: () => void;
    style: TextStyle;
    onChange: (patch: Partial<TextStyle>) => void;
};

/** 标牌基本信息：箭头折叠样式行（对齐设计：▸ 字段名 「值」） */
export function CollapsibleStyleRow({ title, open, onToggle, style, onChange }: CollapsibleStyleRowProps) {
    return (
        <div className='pg-sign-edit__style-row'>
            <ExpandTrigger
                open={open}
                onToggle={onToggle}
                className='pg-sign-edit__style-trigger'
                ariaLabel={open ? '收起样式' : '展开样式'}
            >
                <span className='pg-sign-edit__style-title'>{title}</span>
            </ExpandTrigger>
            <ExpandPanel open={open}>
                <div className='pg-sign-edit__style-body'>
                    <StyleFields style={style} onChange={onChange} />
                </div>
            </ExpandPanel>
        </div>
    );
}
