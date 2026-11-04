import { useMemo, useState } from 'react';

import { Button, Modal, message } from 'antd';

import WindowShell from '@/components/WindowShell';

import { PAGE_SIZE, THEME_PRIMARY } from '@/constants/signage';
import { listRecords, removeRecord, upsertRecord } from '@/services/history';
import type { SignRecord } from '@/types/signage';
import { cloneRecordAsCopy } from '@/utils/defaults';

import './index.css';

export type SignListProps = {
    onCreate: () => void;
    onEdit: (id: string) => void;
    /** 外部刷新标记 */
    refreshKey?: number;
};

function IconSearch() {
    return (
        <svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden>
            <circle cx='6.5' cy='6.5' r='4.25' stroke='currentColor' strokeWidth='1.4' />
            <path d='M9.75 9.75L12 12' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
        </svg>
    );
}

function IconCopy() {
    return (
        <svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden>
            <rect x='4.5' y='4.5' width='7' height='7' rx='1.5' stroke='currentColor' strokeWidth='1.25' />
            <path
                d='M3.5 9.5H3A1.5 1.5 0 0 1 1.5 8V3A1.5 1.5 0 0 1 3 1.5h5A1.5 1.5 0 0 1 9.5 3v.5'
                stroke='currentColor'
                strokeWidth='1.25'
            />
        </svg>
    );
}

function IconTrash() {
    return (
        <svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden>
            <path d='M3 4.5h8' stroke='currentColor' strokeWidth='1.25' strokeLinecap='round' />
            <path d='M5.5 4.5V3.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1' stroke='currentColor' strokeWidth='1.25' />
            <path
                d='M4.5 4.5l.5 7a1 1 0 0 0 1 .9h2a1 1 0 0 0 1-.9l.5-7'
                stroke='currentColor'
                strokeWidth='1.25'
                strokeLinejoin='round'
            />
        </svg>
    );
}

/**
 * 列表页：搜索 + 3 列卡片 + 居中分页 + 底栏新建；空态引导。
 * 卡片操作对齐 Magic OS：悬停显示复制/删除图标按钮。
 */
function SignList({ onCreate, onEdit, refreshKey = 0 }: SignListProps) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [tick, setTick] = useState(0);
    const [deleting, setDeleting] = useState<SignRecord | null>(null);
    const [hoverId, setHoverId] = useState<string | null>(null);

    const records = useMemo(() => {
        void refreshKey;
        void tick;
        return listRecords();
    }, [refreshKey, tick]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return records;
        return records.filter(r => r.name.toLowerCase().includes(q));
    }, [records, query]);

    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
    const safePage = Math.min(Math.max(1, page), pageCount);
    const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const isEmpty = records.length === 0;

    const handleCopy = (record: SignRecord) => {
        upsertRecord(cloneRecordAsCopy(record));
        setTick(v => v + 1);
        message.success('已复制');
    };

    const handleConfirmDelete = () => {
        if (!deleting) return;
        removeRecord(deleting.id);
        setDeleting(null);
        setTick(v => v + 1);
        message.success('已删除');
    };

    return (
        <WindowShell title='标牌生成器'>
            <div className='pg-sign-list'>
                {!isEmpty ? (
                    <div className='pg-sign-list__search'>
                        <div className='pg-sign-list__search-bar'>
                            <span className='pg-sign-list__search-icon'>
                                <IconSearch />
                            </span>
                            <input
                                className='pg-sign-list__search-input'
                                placeholder='搜索记录名称'
                                value={query}
                                onChange={e => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                            />
                            {query ? (
                                <button type='button' className='pg-sign-list__search-clear' onClick={() => setQuery('')}>
                                    清除
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <main className={`pg-sign-list__main custom-scrollbar ${isEmpty ? 'is-empty' : ''}`}>
                    {isEmpty ? (
                        <div className='pg-sign-list__empty'>
                            <div className='pg-sign-list__empty-icon'>+</div>
                            <div className='pg-sign-list__empty-title'>还没有标牌</div>
                            <div className='pg-sign-list__empty-desc'>创建第一条，导出 PNG 到本机</div>
                            <Button type='primary' onClick={onCreate}>
                                新建标牌
                            </Button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className='pg-sign-list__no-match'>没有匹配「{query}」的记录</div>
                    ) : (
                        <div className='pg-sign-list__grid'>
                            {pageItems.map(item => {
                                const hover = hoverId === item.id;
                                return (
                                    <article
                                        key={item.id}
                                        className={`pg-sign-list__card ${hover ? 'is-hover' : ''}`}
                                        onMouseEnter={() => setHoverId(item.id)}
                                        onMouseLeave={() => setHoverId(null)}
                                        onClick={() => onEdit(item.id)}
                                    >
                                        <div className='pg-sign-list__card-preview'>
                                            {item.preview ? (
                                                <img src={item.preview} alt='' />
                                            ) : (
                                                <div className='pg-sign-list__card-placeholder' />
                                            )}
                                        </div>
                                        <div className='pg-sign-list__card-foot'>
                                            <div className='pg-sign-list__card-name' title={item.name}>
                                                {item.name}
                                            </div>
                                            <div
                                                className={`pg-sign-list__card-actions ${hover ? 'is-visible' : ''}`}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <button type='button' title='复制' aria-label='复制' onClick={() => handleCopy(item)}>
                                                    <IconCopy />
                                                </button>
                                                <button
                                                    type='button'
                                                    title='删除'
                                                    aria-label='删除'
                                                    className='is-danger'
                                                    onClick={() => setDeleting(item)}
                                                >
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </main>

                {!isEmpty && filtered.length > 0 ? (
                    <div className='pg-sign-list__pager'>
                        <button
                            type='button'
                            className='pg-sign-list__pager-nav'
                            disabled={safePage <= 1}
                            aria-label='上一页'
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            ‹
                        </button>
                        <div className='pg-sign-list__pager-dots' role='tablist' aria-label='分页'>
                            {Array.from({ length: pageCount }).map((_, i) => {
                                const n = i + 1;
                                return (
                                    <button
                                        key={n}
                                        type='button'
                                        className={`pg-sign-list__pager-dot ${n === safePage ? 'is-active' : ''}`}
                                        aria-label={`第 ${n} 页`}
                                        onClick={() => setPage(n)}
                                    />
                                );
                            })}
                        </div>
                        <button
                            type='button'
                            className='pg-sign-list__pager-nav'
                            disabled={safePage >= pageCount}
                            aria-label='下一页'
                            onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                        >
                            ›
                        </button>
                        <span className='pg-sign-list__pager-meta'>
                            {safePage}/{pageCount} · 共 {total} 条
                        </span>
                    </div>
                ) : null}

                <footer className='pg-sign-list__footer'>
                    <Button type='primary' onClick={onCreate} style={{ boxShadow: `0 4px 12px ${THEME_PRIMARY}40` }}>
                        新建
                    </Button>
                </footer>
            </div>

            <Modal
                open={Boolean(deleting)}
                title='删除确认'
                okText='删除'
                okButtonProps={{ danger: true }}
                cancelText='取消'
                onOk={handleConfirmDelete}
                onCancel={() => setDeleting(null)}
                centered
                styles={{
                    mask: { background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)' },
                    container: { borderRadius: 12, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.18)' },
                }}
            >
                {deleting ? `确定删除「${deleting.name}」？删除后不可恢复。` : null}
            </Modal>
        </WindowShell>
    );
}

export default SignList;
