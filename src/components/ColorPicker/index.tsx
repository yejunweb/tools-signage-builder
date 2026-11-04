import { ColorPicker as AntColorPicker } from 'antd';
import type { Color } from 'antd/es/color-picker';

import { COLOR_PRESETS } from '@/constants/signage';
import { normalizeHex } from '@/utils/format';

import './index.css';

export type ColorPickerProps = {
    value: string;
    onChange: (hex: string) => void;
    /** 是否显示 Hex 文本 */
    showHex?: boolean;
};

const COLOR_PICKER_PRESETS = [
    {
        label: '预设',
        colors: [...COLOR_PRESETS],
        defaultOpen: true,
    },
];

const COLOR_PICKER_STYLES = {
    popupOverlayInner: {
        padding: 8,
    },
};

const COLOR_PICKER_CLASS_NAMES = {
    popup: {
        root: 'comp-color-picker-popup',
    },
};

const formatShowText = (c: Color) => normalizeHex(c.toHexString());

/**
 * 颜色选择：基于 antd ColorPicker 封装。
 * 弹出层走 antd 定位（getPopupContainer → body），避免父级 overflow 裁切。
 * 面板内格式可切换（defaultFormat=hex）；对外 onChange 仍归一为 hex。
 */
function ColorPicker({ value, onChange, showHex = true }: ColorPickerProps) {
    const hex = normalizeHex(value);

    const handleChange = (color: Color) => {
        onChange(normalizeHex(color.toHexString()));
    };

    return (
        <AntColorPicker
            className='comp-color-picker'
            classNames={COLOR_PICKER_CLASS_NAMES}
            styles={COLOR_PICKER_STYLES}
            value={hex}
            size='small'
            disabledAlpha
            defaultFormat='hex'
            showText={showHex ? formatShowText : false}
            getPopupContainer={() => document.body}
            autoAdjustOverflow
            arrow={false}
            presets={COLOR_PICKER_PRESETS}
            onChange={handleChange}
        />
    );
}

export default ColorPicker;
