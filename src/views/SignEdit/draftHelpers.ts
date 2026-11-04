import type { SignDraft } from '@/types/signage';
import type { GenerateSignCanvasInput } from '@/utils/generateSignCanvas';

/** 脏检查快照：忽略 id / preview 等非表单字段 */
export const draftSnapshot = (draft: SignDraft) =>
    JSON.stringify({
        name: draft.name,
        width: draft.width,
        height: draft.height,
        borderRadius: draft.borderRadius,
        background: draft.background,
        transparentBackground: draft.transparentBackground,
        buildingNum: draft.buildingNum,
        totalFloorNum: draft.totalFloorNum,
        buildingStyle: draft.buildingStyle,
        floorStyle: draft.floorStyle,
        showTypes: draft.showTypes,
        showInfoLs: draft.showInfoLs,
    });

export const toCanvasInput = (draft: SignDraft): GenerateSignCanvasInput => ({
    width: draft.width,
    height: draft.height,
    borderRadius: draft.borderRadius,
    background: draft.background,
    transparentBackground: draft.transparentBackground,
    buildingNum: draft.buildingNum,
    totalFloorNum: draft.totalFloorNum,
    buildingStyle: draft.buildingStyle,
    floorStyle: draft.floorStyle,
    showTypes: draft.showTypes,
    showInfoLs: draft.showInfoLs,
});
