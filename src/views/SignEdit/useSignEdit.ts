import { useMemo, useState } from 'react';

import { type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { message } from 'antd';

import { BG_PRESETS, HEIGHT_MAX, HEIGHT_MIN, WIDTH_MAX, WIDTH_MIN } from '@/constants/signage';
import { getRecord, upsertRecord } from '@/services/history';
import type { ShowInfoItem, ShowType, SignDraft, TextStyle } from '@/types/signage';
import { createEmptyRoom, createNewDraft, recordToDraft } from '@/utils/defaults';
import { buildExportDataUrl, exportPng } from '@/utils/exportPng';
import { clampNumber, normalizeHex } from '@/utils/format';
import { canvasToDataUrl, generateSignCanvas } from '@/utils/generateSignCanvas';
import { createId } from '@/utils/id';

import { draftSnapshot, toCanvasInput } from './draftHelpers';

type StyleOpenMap = Record<string, boolean>;

type UseSignEditArgs = {
    recordId?: string;
    onBack: () => void;
    onSaved: () => void;
};

/** 编辑页草稿状态、脏检查与保存/导出/房号操作 */
export function useSignEdit({ recordId, onBack, onSaved }: UseSignEditArgs) {
    const [draft, setDraft] = useState<SignDraft>(() => {
        if (recordId) {
            const found = getRecord(recordId);
            if (found) return recordToDraft(found);
        }
        return createNewDraft();
    });
    const [baseline, setBaseline] = useState(() => draftSnapshot(draft));
    const [styleOpen, setStyleOpen] = useState<StyleOpenMap>({});
    /** 房号整条 panel 展开态；缺省/false = 收起（只见基本信息行） */
    const [roomPanelOpen, setRoomPanelOpen] = useState<StyleOpenMap>({});
    const [leaveOpen, setLeaveOpen] = useState(false);
    /** 画布宽高比例锁定（仅 UI 态，不写入草稿） */
    const [sizeLocked, setSizeLocked] = useState(false);
    /** 打开锁定时冻结的宽高比；锁定期间联动只用它，避免 InputNumber 逐键入夹紧后把比例写坏 */
    const [lockedAspectRatio, setLockedAspectRatio] = useState<number | null>(null);
    const [bgMode, setBgMode] = useState<'preset' | 'custom'>(() => {
        const hit = BG_PRESETS.some(p => p.color.toLowerCase() === draft.background.toLowerCase());
        return hit ? 'preset' : 'custom';
    });

    const dirty = useMemo(() => draftSnapshot(draft) !== baseline, [draft, baseline]);
    const roomIds = useMemo(() => draft.showInfoLs.map(r => r.id), [draft.showInfoLs]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const patchDraft = (patch: Partial<SignDraft>) => setDraft(prev => ({ ...prev, ...patch }));

    const toggleType = (value: ShowType) => {
        setDraft(prev => {
            const has = prev.showTypes.includes(value);
            const showTypes = has ? prev.showTypes.filter(v => v !== value) : [...prev.showTypes, value];
            return { ...prev, showTypes };
        });
    };

    const updateRoom = (id: string, patch: Partial<ShowInfoItem>) => {
        setDraft(prev => ({
            ...prev,
            showInfoLs: prev.showInfoLs.map(item => (item.id === id ? { ...item, ...patch } : item)),
        }));
    };

    const updateRoomStyle = (id: string, key: 'unitStyle' | 'roomStyle' | 'areaStyle', patch: Partial<TextStyle>) => {
        setDraft(prev => ({
            ...prev,
            showInfoLs: prev.showInfoLs.map(item => (item.id === id ? { ...item, [key]: { ...item[key], ...patch } } : item)),
        }));
    };

    const addRoom = () => setDraft(prev => ({ ...prev, showInfoLs: [...prev.showInfoLs, createEmptyRoom()] }));

    /** 复制整条房号，紧跟原条插入，新 id */
    const duplicateRoom = (id: string) => {
        setDraft(prev => {
            const idx = prev.showInfoLs.findIndex(item => item.id === id);
            if (idx < 0) return prev;
            const src = prev.showInfoLs[idx];
            const copy: ShowInfoItem = {
                ...src,
                id: createId(),
                unitStyle: { ...src.unitStyle },
                roomStyle: { ...src.roomStyle },
                areaStyle: { ...src.areaStyle },
            };
            const showInfoLs = [...prev.showInfoLs];
            showInfoLs.splice(idx + 1, 0, copy);
            return { ...prev, showInfoLs };
        });
    };

    const removeRoom = (id: string) => {
        setDraft(prev => ({ ...prev, showInfoLs: prev.showInfoLs.filter(item => item.id !== id) }));
        setRoomPanelOpen(m => {
            const next = { ...m };
            delete next[id];
            return next;
        });
    };

    const onRoomDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setDraft(prev => {
            const oldIndex = prev.showInfoLs.findIndex(item => item.id === active.id);
            const newIndex = prev.showInfoLs.findIndex(item => item.id === over.id);
            if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;
            return { ...prev, showInfoLs: arrayMove(prev.showInfoLs, oldIndex, newIndex) };
        });
    };

    const handleBack = () => {
        if (dirty) {
            setLeaveOpen(true);
            return;
        }
        onBack();
    };

    const handleSave = () => {
        const name = draft.name.trim();
        if (!name) {
            message.warning('请填写记录名称');
            return;
        }
        try {
            const now = new Date().toISOString();
            const id = draft.id ?? createId();
            const preview = canvasToDataUrl(generateSignCanvas(toCanvasInput(draft)));
            const existing = draft.id ? getRecord(draft.id) : undefined;
            upsertRecord({
                id,
                name,
                width: draft.width,
                height: draft.height,
                borderRadius: draft.borderRadius,
                background: normalizeHex(draft.background),
                transparentBackground: draft.transparentBackground,
                buildingNum: draft.buildingNum,
                totalFloorNum: draft.totalFloorNum,
                buildingStyle: draft.buildingStyle,
                floorStyle: draft.floorStyle,
                showTypes: draft.showTypes,
                showInfoLs: draft.showInfoLs,
                preview,
                createdAt: existing?.createdAt ?? now,
                updatedAt: now,
            });
            const nextDraft = { ...draft, id, name };
            setDraft(nextDraft);
            setBaseline(draftSnapshot(nextDraft));
            message.success('已保存');
            onSaved();
            onBack();
        } catch {
            message.error('保存失败，请重试');
        }
    };

    const handleExport = async () => {
        const dataUrl = buildExportDataUrl(toCanvasInput(draft));
        const result = await exportPng(dataUrl, draft.name.trim() || '标牌');
        if ('cancelled' in result && result.cancelled) {
            return;
        }
        if (!result.ok) {
            message.error(result.error);
            return;
        }
        if (result.mode === 'tauri-dialog') {
            message.success('已导出 PNG');
            return;
        }
        message.info(result.reason);
    };

    /** 安全取宽高比；非法/零高则返回 null，调用方勿联动 */
    const safeAspectRatio = (width: number, height: number): number | null => {
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
        return width / height;
    };

    /** 切换锁定：开锁时冻结当前宽高比；解锁清空。夹紧后的中间值绝不回写冻结比 */
    const toggleSizeLocked = () => {
        if (sizeLocked) {
            setSizeLocked(false);
            setLockedAspectRatio(null);
            return;
        }
        setLockedAspectRatio(safeAspectRatio(draft.width, draft.height));
        setSizeLocked(true);
    };

    const setCanvasWidth = (v: number | null) => {
        setDraft(prev => {
            if (typeof v !== 'number') return prev;
            if (!sizeLocked || lockedAspectRatio == null) return { ...prev, width: v };
            return {
                ...prev,
                width: v,
                height: clampNumber(Math.round(v / lockedAspectRatio), HEIGHT_MIN, HEIGHT_MAX),
            };
        });
    };

    const setCanvasHeight = (v: number | null) => {
        setDraft(prev => {
            if (typeof v !== 'number') return prev;
            if (!sizeLocked || lockedAspectRatio == null) return { ...prev, height: v };
            return {
                ...prev,
                height: v,
                width: clampNumber(Math.round(v * lockedAspectRatio), WIDTH_MIN, WIDTH_MAX),
            };
        });
    };

    const blurClamp = (key: 'width' | 'height', min: number, max: number) => {
        setDraft(prev => {
            const clamped = clampNumber(prev[key] || min, min, max);
            if (!sizeLocked || lockedAspectRatio == null) return { ...prev, [key]: clamped };
            if (key === 'width') {
                return {
                    ...prev,
                    width: clamped,
                    height: clampNumber(Math.round(clamped / lockedAspectRatio), HEIGHT_MIN, HEIGHT_MAX),
                };
            }
            return {
                ...prev,
                height: clamped,
                width: clampNumber(Math.round(clamped * lockedAspectRatio), WIDTH_MIN, WIDTH_MAX),
            };
        });
    };

    const toggleStyleOpen = (key: string) => setStyleOpen(m => ({ ...m, [key]: !m[key] }));

    const toggleRoomPanel = (id: string) => setRoomPanelOpen(m => ({ ...m, [id]: !m[id] }));

    return {
        draft,
        bgMode,
        setBgMode,
        styleOpen,
        roomPanelOpen,
        leaveOpen,
        setLeaveOpen,
        dirty,
        roomIds,
        sensors,
        patchDraft,
        toggleType,
        updateRoom,
        updateRoomStyle,
        addRoom,
        duplicateRoom,
        removeRoom,
        onRoomDragEnd,
        handleBack,
        handleSave,
        handleExport,
        sizeLocked,
        toggleSizeLocked,
        setCanvasWidth,
        setCanvasHeight,
        blurClamp,
        toggleStyleOpen,
        toggleRoomPanel,
        canvasInput: toCanvasInput(draft),
        onBack,
    };
}
