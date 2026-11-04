import type { ReactNode } from 'react';

import './index.css';

export type ExpandPanelProps = {
    /** 是否展开 */
    open: boolean;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
};

/**
 * 可复用展开面板：controlled open，高度过渡动画（grid 0fr→1fr）。
 */
function ExpandPanel({ open, children, className, bodyClassName }: ExpandPanelProps) {
    return (
        <div
            className={`pg-expand-panel${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
            data-open={open ? 'true' : 'false'}
            aria-hidden={!open}
        >
            <div className='pg-expand-panel__clip'>
                <div className={`pg-expand-panel__body${bodyClassName ? ` ${bodyClassName}` : ''}`}>{children}</div>
            </div>
        </div>
    );
}

export type ExpandTriggerProps = {
    open: boolean;
    onToggle: () => void;
    /** 箭头右侧内容（字段名 / 摘要等）；仅箭头时可不传 */
    children?: ReactNode;
    className?: string;
    ariaLabel?: string;
};

/**
 * 折叠触发器：仅小灰右箭头标识状态（展开时旋转 90°），无「样式」文案。
 */
export function ExpandTrigger({ open, onToggle, children, className, ariaLabel }: ExpandTriggerProps) {
    return (
        <button
            type='button'
            className={`pg-expand-trigger${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
            aria-expanded={open}
            aria-label={ariaLabel ?? (open ? '收起' : '展开')}
            onPointerDown={e => {
                // 避免被父级拖拽/滚动手势吞掉点击（WKWebView）
                e.stopPropagation();
            }}
            onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onToggle();
            }}
        >
            <span className={`pg-expand-trigger__arrow${open ? ' is-open' : ''}`} aria-hidden>
                ▸
            </span>
            {children}
        </button>
    );
}

export default ExpandPanel;
