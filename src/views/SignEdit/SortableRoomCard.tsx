import { DeleteOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from 'antd';

import ExpandPanel, { ExpandTrigger } from '@/components/ExpandPanel';
import type { ShowInfoItem, TextStyle } from '@/types/signage';

import { StyleFields } from './StyleFields';

type SortableRoomCardProps = {
    room: ShowInfoItem;
    index: number;
    panelOpen: boolean;
    onTogglePanel: () => void;
    onRemove: () => void;
    onUpdate: (patch: Partial<ShowInfoItem>) => void;
    onUpdateStyle: (key: 'unitStyle' | 'roomStyle' | 'areaStyle', patch: Partial<TextStyle>) => void;
};

/** 房号条：单行（箭头→手柄→prefix 输入→删除图标）；样式收进 ExpandPanel；仅手柄可拖 */
function SortableRoomCard({ room, index, panelOpen, onTogglePanel, onRemove, onUpdate, onUpdateStyle }: SortableRoomCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: room.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`pg-sign-edit__room${isDragging ? ' is-dragging' : ''}${panelOpen ? ' is-panel-open' : ''}`}
        >
            <div className='pg-sign-edit__room-row'>
                <ExpandTrigger
                    open={panelOpen}
                    onToggle={onTogglePanel}
                    className='pg-sign-edit__room-panel-toggle'
                    ariaLabel={panelOpen ? '收起样式' : '展开样式'}
                />
                <span
                    className={`pg-sign-edit__drag${isDragging ? ' is-active' : ''}`}
                    title='拖拽排序'
                    aria-label={`拖拽排序 #${index + 1}`}
                    {...attributes}
                    {...listeners}
                >
                    ⋮⋮
                </span>
                <Input
                    className='pg-sign-edit__room-input'
                    prefix={<span className='pg-sign-edit__input-prefix'>单元号</span>}
                    value={room.unitNum}
                    placeholder='如 1'
                    onChange={e => onUpdate({ unitNum: e.target.value })}
                />
                <Input
                    className='pg-sign-edit__room-input'
                    prefix={<span className='pg-sign-edit__input-prefix'>室号</span>}
                    value={room.roomId}
                    placeholder='如 1701'
                    onChange={e => onUpdate({ roomId: e.target.value })}
                />
                <Input
                    className='pg-sign-edit__room-input'
                    prefix={<span className='pg-sign-edit__input-prefix'>面积</span>}
                    value={room.area}
                    placeholder='如 143'
                    onChange={e => onUpdate({ area: e.target.value })}
                    suffix='㎡'
                />
                <button type='button' className='pg-sign-edit__room-del' aria-label='删除' title='删除' onClick={onRemove}>
                    <DeleteOutlined />
                </button>
            </div>
            <ExpandPanel open={panelOpen}>
                <div className='pg-sign-edit__room-style-panel'>
                    <div className='pg-sign-edit__room-style-group'>
                        <div className='pg-sign-edit__room-style-group-title'>{`单元号「${room.unitNum || '—'}单元」`}</div>
                        <div className='pg-sign-edit__style-body'>
                            <StyleFields style={room.unitStyle} onChange={patch => onUpdateStyle('unitStyle', patch)} />
                        </div>
                    </div>
                    <div className='pg-sign-edit__room-style-group'>
                        <div className='pg-sign-edit__room-style-group-title'>{`室号「${room.roomId || '—'}」`}</div>
                        <div className='pg-sign-edit__style-body'>
                            <StyleFields style={room.roomStyle} onChange={patch => onUpdateStyle('roomStyle', patch)} />
                        </div>
                    </div>
                    <div className='pg-sign-edit__room-style-group'>
                        <div className='pg-sign-edit__room-style-group-title'>{`面积「${room.area || '—'}m²」`}</div>
                        <div className='pg-sign-edit__style-body'>
                            <StyleFields style={room.areaStyle} onChange={patch => onUpdateStyle('areaStyle', patch)} />
                        </div>
                    </div>
                </div>
            </ExpandPanel>
        </div>
    );
}

export default SortableRoomCard;
