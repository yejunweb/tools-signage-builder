import {
    BORDER_LINE_WIDTH,
    DEFAULT_AREA_SUFFIX,
    DEFAULT_UNIT_SUFFIX,
    SPLIT_LINE_DASH,
    SPLIT_LINE_WIDTH,
} from '@/constants/signage';
import type { ShowInfoItem, ShowType, TextStyle } from '@/types/signage';

import { drawAdaptiveText, getMinFontSizeOfLine } from './drawAdaptiveText';

const BASIC_COLOR = '#ffffff';

/** buildInfo/floorInfo → basicInfo 行（对齐 signShowTypeMap） */
const mapShowTypes = (showTypes: ShowType[]): Array<'basicInfo' | 'unitInfo' | 'roomInfo' | 'areaInfo'> => {
    const mapped = showTypes.map(v => (v === 'buildInfo' || v === 'floorInfo' ? 'basicInfo' : v));
    return [...new Set(mapped)];
};

/** 可见绘制行数（栋/层合并为 1 行），供预览卡头 meta */
export const countVisibleRows = (showTypes: ShowType[]): number => mapShowTypes(showTypes).length;

const buildUnitMergeMap = (showInfoLs: ShowInfoItem[]): Record<number, number> => {
    let curUnitNumKey: string | undefined;
    let curUnitNumIndex = 0;
    const unitMergeMap: Record<number, number> = {};
    showInfoLs.forEach((cur, index) => {
        if (curUnitNumKey !== cur.unitNum) {
            curUnitNumKey = cur.unitNum;
            curUnitNumIndex = index;
        }
        if (!unitMergeMap[curUnitNumIndex]) unitMergeMap[curUnitNumIndex] = 0;
        unitMergeMap[curUnitNumIndex] += 1;
    });
    return unitMergeMap;
};

export type GenerateSignCanvasInput = {
    width: number;
    height: number;
    borderRadius: number;
    background: string;
    transparentBackground: boolean;
    buildingNum: string;
    totalFloorNum: string;
    buildingStyle: TextStyle;
    floorStyle: TextStyle;
    showTypes: ShowType[];
    showInfoLs: ShowInfoItem[];
};

/**
 * 纯 canvas 绘制标牌本体。
 * 画布像素 = 表单宽高（不乘 7.897）。
 */
export const generateSignCanvas = (input: GenerateSignCanvasInput): HTMLCanvasElement => {
    const {
        width,
        height,
        borderRadius,
        background,
        transparentBackground,
        buildingNum,
        totalFloorNum,
        buildingStyle,
        floorStyle,
        showTypes,
        showInfoLs,
    } = input;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const radius = Math.max(0, Math.min(borderRadius, Math.floor(Math.min(canvas.width, canvas.height) / 2)));

    // 圆角外：透明底关 → 白；开 → 保持透明
    if (!transparentBackground) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 外层白描边圆角矩形
    ctx.beginPath();
    ctx.strokeStyle = BASIC_COLOR;
    ctx.lineWidth = BORDER_LINE_WIDTH;
    ctx.roundRect(
        BORDER_LINE_WIDTH * 0.5,
        BORDER_LINE_WIDTH * 0.5,
        canvas.width - BORDER_LINE_WIDTH,
        canvas.height - BORDER_LINE_WIDTH,
        radius
    );
    ctx.stroke();

    // 内层填充
    const innerRadius = Math.max(0, radius - BORDER_LINE_WIDTH * 0.75);
    ctx.beginPath();
    ctx.fillStyle = background;
    ctx.roundRect(
        BORDER_LINE_WIDTH,
        BORDER_LINE_WIDTH,
        canvas.width - BORDER_LINE_WIDTH * 2,
        canvas.height - BORDER_LINE_WIDTH * 2,
        innerRadius
    );
    ctx.fill();

    const mapped = mapShowTypes(showTypes);
    const hasContent = Boolean(buildingNum.trim() || totalFloorNum.trim()) || showInfoLs.length > 0;

    // 楼栋/层与房号皆空：仅底色圆角白描边，不画行
    if (!hasContent || mapped.length === 0) {
        return canvas;
    }

    const avgHeight = canvas.height / mapped.length;
    const drawDashH = (y: number) => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = BASIC_COLOR;
        ctx.lineWidth = SPLIT_LINE_WIDTH;
        ctx.setLineDash(SPLIT_LINE_DASH);
        ctx.stroke();
        ctx.setLineDash([]);
    };

    const drawDashV = (x: number, y0: number, y1: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y1);
        ctx.strokeStyle = BASIC_COLOR;
        ctx.lineWidth = SPLIT_LINE_WIDTH;
        ctx.setLineDash(SPLIT_LINE_DASH);
        ctx.stroke();
        ctx.setLineDash([]);
    };

    mapped.forEach((_v, i) => {
        if (i !== mapped.length - 1) drawDashH(avgHeight + i * avgHeight);
    });

    // 栋 / 层 → basicInfo
    if (mapped.includes('basicInfo')) {
        const basicTextLs = [
            showTypes.includes('buildInfo') ? `${buildingNum}#` : '',
            showTypes.includes('floorInfo') ? `${totalFloorNum}F` : '',
        ].filter(Boolean);
        const styles: TextStyle[] = [
            ...(showTypes.includes('buildInfo') ? [buildingStyle] : []),
            ...(showTypes.includes('floorInfo') ? [floorStyle] : []),
        ];
        if (basicTextLs.length > 0) {
            const basicAvgWidth = canvas.width / basicTextLs.length;
            const basicFontSize = getMinFontSizeOfLine(basicTextLs, basicAvgWidth, avgHeight);
            basicTextLs.forEach((v, i) => {
                if (i !== basicTextLs.length - 1) {
                    drawDashV(basicAvgWidth * (i + 1), 0, avgHeight);
                }
                const style = styles[i];
                drawAdaptiveText(ctx, v, basicAvgWidth, avgHeight, (basicAvgWidth / 2) * (2 * i + 1), avgHeight / 2, {
                    fontSize: basicFontSize,
                    useAutoFontSize: false,
                    fontColor: style?.color,
                    strokeColor: style?.strokeColor,
                    strokeWidth: style?.strokeWidth,
                });
            });
        }
    }

    if (mapped.includes('unitInfo') && showInfoLs.length > 0) {
        const unitTextLs = showInfoLs.map(v => `${v.unitNum}${v.unitSuffix ?? DEFAULT_UNIT_SUFFIX}`);
        const unitAvgWidth = canvas.width / unitTextLs.length;
        const unitFontSize = getMinFontSizeOfLine(unitTextLs, unitAvgWidth, avgHeight);
        const unitAccCount = mapped.filter(v => v === 'basicInfo').length;
        const unitMergeMap = buildUnitMergeMap(showInfoLs);

        unitTextLs.forEach((v, i) => {
            if (!unitMergeMap[i]) return;
            if (i !== unitTextLs.length - 1) {
                drawDashV(unitAvgWidth * (i + unitMergeMap[i]), avgHeight * unitAccCount, avgHeight * (unitAccCount + 1));
            }
            const style = showInfoLs[i]?.unitStyle;
            drawAdaptiveText(
                ctx,
                v,
                unitAvgWidth * unitMergeMap[i],
                avgHeight,
                (unitAvgWidth / 2) * (2 * i + unitMergeMap[i]),
                avgHeight / 2 + avgHeight * unitAccCount,
                {
                    fontSize: unitFontSize,
                    useAutoFontSize: false,
                    fontColor: style?.color,
                    strokeColor: style?.strokeColor,
                    strokeWidth: style?.strokeWidth,
                }
            );
        });
    }

    if (mapped.includes('roomInfo') && showInfoLs.length > 0) {
        const roomTextLs = showInfoLs.map(v => v.roomId || '');
        const roomAvgWidth = canvas.width / roomTextLs.length;
        const roomFontSize = getMinFontSizeOfLine(roomTextLs, roomAvgWidth, avgHeight);
        const roomAccCount = mapped.filter(v => v === 'basicInfo' || v === 'unitInfo').length;

        roomTextLs.forEach((v, i) => {
            if (i !== roomTextLs.length - 1) {
                drawDashV(roomAvgWidth * (i + 1), avgHeight * roomAccCount, avgHeight * (roomAccCount + 1));
            }
            const style = showInfoLs[i]?.roomStyle;
            drawAdaptiveText(ctx, v, roomAvgWidth, avgHeight, (roomAvgWidth / 2) * (2 * i + 1), avgHeight / 2 + avgHeight * roomAccCount, {
                fontSize: roomFontSize,
                useAutoFontSize: false,
                fontColor: style?.color,
                strokeColor: style?.strokeColor,
                strokeWidth: style?.strokeWidth,
            });
        });
    }

    if (mapped.includes('areaInfo') && showInfoLs.length > 0) {
        const areaTextLs = showInfoLs.map(v => `${v.area || ''}${v.areaSuffix ?? DEFAULT_AREA_SUFFIX}`);
        const areaAvgWidth = canvas.width / areaTextLs.length;
        const areaFontSize = getMinFontSizeOfLine(areaTextLs, areaAvgWidth, avgHeight);
        const areaAccCount = mapped.filter(v => v === 'basicInfo' || v === 'unitInfo' || v === 'roomInfo').length;

        areaTextLs.forEach((v, i) => {
            if (i !== areaTextLs.length - 1) {
                drawDashV(areaAvgWidth * (i + 1), avgHeight * areaAccCount, avgHeight * (areaAccCount + 1));
            }
            const style = showInfoLs[i]?.areaStyle;
            drawAdaptiveText(ctx, v, areaAvgWidth, avgHeight, (areaAvgWidth / 2) * (2 * i + 1), avgHeight / 2 + avgHeight * areaAccCount, {
                fontSize: areaFontSize,
                useAutoFontSize: false,
                fontColor: style?.color,
                strokeColor: style?.strokeColor,
                strokeWidth: style?.strokeWidth,
            });
        });
    }

    return canvas;
};

export const canvasToDataUrl = (canvas: HTMLCanvasElement): string => canvas.toDataURL('image/png');
