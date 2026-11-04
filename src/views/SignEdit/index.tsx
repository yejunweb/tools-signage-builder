import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, InputNumber, Modal } from 'antd';

import ColorPicker from '@/components/ColorPicker';
import SignPreview from '@/components/SignPreview';
import WindowShell from '@/components/WindowShell';
import {
    BG_PRESETS,
    HEIGHT_MAX,
    HEIGHT_MIN,
    SHOW_TYPE_OPTIONS,
    THEME_PRIMARY,
    WIDTH_MAX,
    WIDTH_MIN,
} from '@/constants/signage';

import SortableRoomCard from './SortableRoomCard';
import { CollapsibleStyleRow } from './StyleFields';
import { useSignEdit } from './useSignEdit';

import './index.css';

export type SignEditProps = {
    /** 无 id 则为新建 */
    recordId?: string;
    onBack: () => void;
    onSaved: () => void;
};

/**
 * 编辑页：预览 + 表单 IA（记录名→画布→展示类型→楼栋/层→房号）+ 底栏。
 */
function SignEdit({ recordId, onBack, onSaved }: SignEditProps) {
    const {
        draft,
        bgMode,
        setBgMode,
        styleOpen,
        roomPanelOpen,
        leaveOpen,
        setLeaveOpen,
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
        canvasInput,
    } = useSignEdit({ recordId, onBack, onSaved });

    return (
        <WindowShell title='返回' showBack onBack={handleBack}>
            <div className='pg-sign-edit'>
                <SignPreview {...canvasInput} />

                <div className='pg-sign-edit__form custom-scrollbar'>
                    <section className='pg-sign-edit__section'>
                        <h3>基本信息</h3>
                        <label className='pg-sign-edit__label'>记录名称</label>
                        <Input value={draft.name} onChange={e => patchDraft({ name: e.target.value })} />
                    </section>

                    <section className='pg-sign-edit__section'>
                        <h3>标牌画布</h3>
                        <div className='pg-sign-edit__row-canvas'>
                            <div>
                                <label className='pg-sign-edit__label'>宽</label>
                                <InputNumber
                                    className='pg-sign-edit__full'
                                    value={draft.width}
                                    min={WIDTH_MIN}
                                    max={WIDTH_MAX}
                                    onChange={v => setCanvasWidth(typeof v === 'number' ? v : null)}
                                    onBlur={() => blurClamp('width', WIDTH_MIN, WIDTH_MAX)}
                                />
                            </div>
                            <button
                                type='button'
                                className={`pg-sign-edit__size-lock${sizeLocked ? ' is-locked' : ''}`}
                                aria-label={sizeLocked ? '解锁宽高比例' : '锁定宽高比例'}
                                title={sizeLocked ? '已锁定比例（点击解锁）' : '锁定比例（改一边联动另一边）'}
                                aria-pressed={sizeLocked}
                                onClick={toggleSizeLocked}
                            >
                                {sizeLocked ? <LockOutlined /> : <UnlockOutlined />}
                            </button>
                            <div>
                                <label className='pg-sign-edit__label'>高</label>
                                <InputNumber
                                    className='pg-sign-edit__full'
                                    value={draft.height}
                                    min={HEIGHT_MIN}
                                    max={HEIGHT_MAX}
                                    onChange={v => setCanvasHeight(typeof v === 'number' ? v : null)}
                                    onBlur={() => blurClamp('height', HEIGHT_MIN, HEIGHT_MAX)}
                                />
                            </div>
                            <div>
                                <label className='pg-sign-edit__label'>圆角</label>
                                <InputNumber
                                    className='pg-sign-edit__full'
                                    value={draft.borderRadius}
                                    min={0}
                                    max={999}
                                    onChange={v => patchDraft({ borderRadius: typeof v === 'number' ? v : draft.borderRadius })}
                                />
                            </div>
                        </div>
                        <label className='pg-sign-edit__label'>背景色</label>
                        <div className='pg-sign-edit__bg-presets'>
                            {BG_PRESETS.map(p => {
                                const active = bgMode === 'preset' && draft.background.toLowerCase() === p.color.toLowerCase();
                                return (
                                    <button
                                        key={p.key}
                                        type='button'
                                        className={`pg-sign-edit__chip ${active ? 'is-active' : ''}`}
                                        onClick={() => {
                                            setBgMode('preset');
                                            patchDraft({ background: p.color });
                                        }}
                                    >
                                        <i style={{ background: p.color }} />
                                        {p.label}
                                    </button>
                                );
                            })}
                            <button
                                type='button'
                                className={`pg-sign-edit__chip ${bgMode === 'custom' ? 'is-active' : ''}`}
                                onClick={() => setBgMode('custom')}
                            >
                                自定义
                            </button>
                            {bgMode === 'custom' ? (
                                <ColorPicker value={draft.background} onChange={background => patchDraft({ background })} />
                            ) : null}
                        </div>
                    </section>

                    <section className='pg-sign-edit__section'>
                        <h3>展示类型</h3>
                        <div className='pg-sign-edit__types'>
                            {SHOW_TYPE_OPTIONS.map(opt => {
                                const on = draft.showTypes.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        type='button'
                                        className={`pg-sign-edit__type ${on ? 'is-active' : ''}`}
                                        onClick={() => toggleType(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className='pg-sign-edit__section'>
                        <h3>标牌基本信息</h3>
                        <p className='pg-sign-edit__hint'>整牌一份（非按房号条）。楼栋号 / 楼层数各自可配字色与描边，样式默认收起。</p>
                        <div className='pg-sign-edit__row2'>
                            <div>
                                <label className='pg-sign-edit__label'>楼栋号</label>
                                <Input
                                    value={draft.buildingNum}
                                    placeholder='如 6'
                                    onChange={e => patchDraft({ buildingNum: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='pg-sign-edit__label'>楼层数</label>
                                <Input
                                    value={draft.totalFloorNum}
                                    placeholder='如 17'
                                    onChange={e => patchDraft({ totalFloorNum: e.target.value })}
                                />
                            </div>
                        </div>
                        <CollapsibleStyleRow
                            title={`楼栋号 「${draft.buildingNum || '—'}#」`}
                            open={Boolean(styleOpen['basic:building'])}
                            onToggle={() => toggleStyleOpen('basic:building')}
                            style={draft.buildingStyle}
                            onChange={patch => patchDraft({ buildingStyle: { ...draft.buildingStyle, ...patch } })}
                        />
                        <CollapsibleStyleRow
                            title={`楼层数 「${draft.totalFloorNum || '—'}F」`}
                            open={Boolean(styleOpen['basic:floor'])}
                            onToggle={() => toggleStyleOpen('basic:floor')}
                            style={draft.floorStyle}
                            onChange={patch => patchDraft({ floorStyle: { ...draft.floorStyle, ...patch } })}
                        />
                    </section>

                    <section className='pg-sign-edit__section'>
                        <div className='pg-sign-edit__section-head'>
                            <h3>房号信息</h3>
                            {draft.showInfoLs.length > 0 ? (
                                <button type='button' className='pg-sign-edit__link' onClick={addRoom}>
                                    + 添加
                                </button>
                            ) : null}
                        </div>

                        {draft.showInfoLs.length === 0 ? (
                            <div className='pg-sign-edit__rooms-empty'>
                                <div className='pg-sign-edit__rooms-empty-icon'>+</div>
                                <div className='pg-sign-edit__rooms-empty-title'>暂无房号，点击添加</div>
                                <div className='pg-sign-edit__rooms-empty-desc'>
                                    每条含单元号、室号、面积；相邻同单元号在预览第 2 行合并
                                </div>
                                <Button type='primary' onClick={addRoom}>
                                    添加房号
                                </Button>
                            </div>
                        ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRoomDragEnd}>
                                <SortableContext items={roomIds} strategy={verticalListSortingStrategy}>
                                    <div className='pg-sign-edit__rooms'>
                                        {draft.showInfoLs.map((room, idx) => (
                                            <SortableRoomCard
                                                key={room.id}
                                                room={room}
                                                index={idx}
                                                panelOpen={Boolean(roomPanelOpen[room.id])}
                                                onTogglePanel={() => toggleRoomPanel(room.id)}
                                                onCopy={() => duplicateRoom(room.id)}
                                                onRemove={() => removeRoom(room.id)}
                                                onUpdate={patch => updateRoom(room.id, patch)}
                                                onUpdateStyle={(key, patch) => updateRoomStyle(room.id, key, patch)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </section>
                </div>

                <footer className='pg-sign-edit__footer'>
                    <Checkbox checked={draft.transparentBackground} onChange={e => patchDraft({ transparentBackground: e.target.checked })}>
                        透明底
                    </Checkbox>
                    <div className='pg-sign-edit__footer-actions'>
                        <Button onClick={handleBack}>取消</Button>
                        <Button onClick={handleExport}>导出 PNG</Button>
                        <Button type='primary' onClick={handleSave} style={{ boxShadow: `0 4px 12px ${THEME_PRIMARY}40` }}>
                            保存
                        </Button>
                    </div>
                </footer>
            </div>

            <Modal
                open={leaveOpen}
                title='未保存的更改'
                okText='离开'
                cancelText='继续编辑'
                okButtonProps={{ danger: true }}
                onOk={() => {
                    setLeaveOpen(false);
                    onBack();
                }}
                onCancel={() => setLeaveOpen(false)}
                centered
                maskClosable={false}
                className='pg-sign-edit__leave-modal'
                styles={{
                    mask: { background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)' },
                    container: { borderRadius: 12, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.18)' },
                }}
            >
                当前修改尚未保存，确定离开？
            </Modal>
        </WindowShell>
    );
}

export default SignEdit;
