import {
    ALL_SHOW_TYPES,
    DEFAULT_AREA_SUFFIX,
    DEFAULT_BACKGROUND,
    DEFAULT_BORDER_RADIUS,
    DEFAULT_HEIGHT,
    DEFAULT_UNIT_SUFFIX,
    DEFAULT_WIDTH,
} from '@/constants/signage';
import type { ShowInfoItem, SignDraft, SignRecord, TextStyle } from '@/types/signage';

import { createDefaultRecordName } from './format';
import { createId } from './id';

/** 字段默认字色 / 描边（工厂，与 createEmptyRoom / createNewDraft 同目录） */
export const defaultTextStyle = (): TextStyle => ({
    color: '#ffffff',
    strokeColor: '#ffffff',
    strokeWidth: 0,
});

export const createEmptyRoom = (): ShowInfoItem => ({
    id: createId(),
    unitNum: '',
    unitSuffix: DEFAULT_UNIT_SUFFIX,
    roomId: '',
    area: '',
    areaSuffix: DEFAULT_AREA_SUFFIX,
    unitStyle: defaultTextStyle(),
    roomStyle: defaultTextStyle(),
    areaStyle: defaultTextStyle(),
});

/** 新建进编辑的产品默认 */
export const createNewDraft = (): SignDraft => ({
    name: createDefaultRecordName(),
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    borderRadius: DEFAULT_BORDER_RADIUS,
    background: DEFAULT_BACKGROUND,
    transparentBackground: true,
    buildingNum: '',
    totalFloorNum: '',
    buildingStyle: defaultTextStyle(),
    floorStyle: defaultTextStyle(),
    showTypes: [...ALL_SHOW_TYPES],
    showInfoLs: [],
});

export const recordToDraft = (record: SignRecord): SignDraft => ({
    id: record.id,
    name: record.name,
    width: record.width,
    height: record.height,
    borderRadius: record.borderRadius,
    background: record.background,
    transparentBackground: record.transparentBackground,
    buildingNum: record.buildingNum,
    totalFloorNum: record.totalFloorNum,
    buildingStyle: { ...record.buildingStyle },
    floorStyle: { ...record.floorStyle },
    showTypes: [...record.showTypes],
    showInfoLs: record.showInfoLs.map(item => ({
        ...item,
        unitSuffix: item.unitSuffix ?? DEFAULT_UNIT_SUFFIX,
        areaSuffix: item.areaSuffix ?? DEFAULT_AREA_SUFFIX,
        unitStyle: { ...item.unitStyle },
        roomStyle: { ...item.roomStyle },
        areaStyle: { ...item.areaStyle },
    })),
});

export const cloneRecordAsCopy = (record: SignRecord): SignRecord => {
    const now = new Date().toISOString();
    return {
        ...record,
        id: createId(),
        name: `${record.name} - 副本`,
        showTypes: [...record.showTypes],
        buildingStyle: { ...record.buildingStyle },
        floorStyle: { ...record.floorStyle },
        showInfoLs: record.showInfoLs.map(item => ({
            ...item,
            id: createId(),
            unitSuffix: item.unitSuffix ?? DEFAULT_UNIT_SUFFIX,
            areaSuffix: item.areaSuffix ?? DEFAULT_AREA_SUFFIX,
            unitStyle: { ...item.unitStyle },
            roomStyle: { ...item.roomStyle },
            areaStyle: { ...item.areaStyle },
        })),
        createdAt: now,
        updatedAt: now,
    };
};
