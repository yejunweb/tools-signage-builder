import type { ShowType } from '@/types/signage';

export const THEME_PRIMARY = '#3370ff';

export const PAGE_SIZE = 12;

export const WIDTH_MIN = 40;
export const WIDTH_MAX = 2000;
export const HEIGHT_MIN = 40;
export const HEIGHT_MAX = 2000;

export const STROKE_WIDTH_MIN = 0;
export const STROKE_WIDTH_MAX = 24;
export const STROKE_WIDTH_STEP = 1;

export const DEFAULT_BORDER_RADIUS = 15;
export const DEFAULT_WIDTH = 400;
export const DEFAULT_HEIGHT = 100;
export const DEFAULT_BACKGROUND = '#ef7296';

export const BG_PRESETS: { key: string; label: string; color: string }[] = [
    { key: 'pink', label: '预备粉', color: '#ef7296' },
    { key: 'blue', label: '预备蓝', color: '#5dabd7' },
    { key: 'white', label: '白', color: '#ffffff' },
    { key: 'dark', label: '深灰', color: '#2B2F36' },
    { key: 'brand', label: '品牌蓝', color: '#3370ff' },
];

/** 字色 / 描边预设（对齐 HexColorPicker DEFAULT_PRESETS） */
export const COLOR_PRESETS = [
    '#FFFFFF',
    '#000000',
    '#FF0000',
    '#FFA500',
    '#FFFF00',
    '#00FF00',
    '#00FFFF',
    '#0000FF',
    '#800080',
    '#CE0000',
    '#E99394',
    '#B00049',
    '#FF8C00',
    '#327600',
    '#4CA50A',
    '#5DABD7',
    '#0A66A9',
    '#8FA7D7',
    '#AA77F5',
    '#733C8F',
] as const;

export const SHOW_TYPE_OPTIONS: { value: ShowType; label: string }[] = [
    { value: 'buildInfo', label: '栋' },
    { value: 'floorInfo', label: '层' },
    { value: 'unitInfo', label: '单元' },
    { value: 'roomInfo', label: '房' },
    { value: 'areaInfo', label: '面积' },
];

export const ALL_SHOW_TYPES: ShowType[] = SHOW_TYPE_OPTIONS.map(o => o.value);

export const HISTORY_STORAGE_KEY = 'signage-builder-history-v1';

export const BORDER_LINE_WIDTH = 2;
export const SPLIT_LINE_WIDTH = 2;
export const SPLIT_LINE_DASH: [number, number] = [10, 5];
export const PREVIEW_FIT_PADDING = 24;
