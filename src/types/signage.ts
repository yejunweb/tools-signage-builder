/** 文案字色 / 描边 */
export interface TextStyle {
    color: string;
    strokeColor: string;
    strokeWidth: number;
}

/** 展示类型（对齐 house-map-vue signShowTypeEnum） */
export type ShowType = 'buildInfo' | 'floorInfo' | 'unitInfo' | 'roomInfo' | 'areaInfo';

/** 房号一条（不含楼栋/楼层） */
export interface ShowInfoItem {
    id: string;
    unitNum: string;
    roomId: string;
    area: string;
    unitStyle: TextStyle;
    roomStyle: TextStyle;
    areaStyle: TextStyle;
}

/** 单条历史记录 */
export interface SignRecord {
    id: string;
    name: string;
    width: number;
    height: number;
    borderRadius: number;
    /** 圆角内填充色 */
    background: string;
    /** 圆角外透明；默认 true */
    transparentBackground: boolean;
    buildingNum: string;
    totalFloorNum: string;
    buildingStyle: TextStyle;
    floorStyle: TextStyle;
    showTypes: ShowType[];
    showInfoLs: ShowInfoItem[];
    /** 保存时生成的预览 dataURL */
    preview: string;
    createdAt: string;
    updatedAt: string;
}

export interface HistoryFile {
    version: 1;
    items: SignRecord[];
}

/** 编辑表单草稿（与记录字段对齐，未含 id/preview/时间） */
export type SignDraft = Omit<SignRecord, 'id' | 'preview' | 'createdAt' | 'updatedAt'> & {
    id?: string;
};
