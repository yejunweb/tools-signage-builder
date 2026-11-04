import { useEffect, useMemo, useRef } from 'react';

import { PREVIEW_FIT_PADDING } from '@/constants/signage';
import type { ShowInfoItem, ShowType, TextStyle } from '@/types/signage';
import { countVisibleRows, generateSignCanvas } from '@/utils/generateSignCanvas';

import './index.css';

export type SignPreviewProps = {
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
 * 实时预览：白卡片头（标题 + 画布 meta）+ 标牌 fit + 四周 padding 24；透明底开时棋盘格衬托。
 */
function SignPreview(props: SignPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    const dataUrl = useMemo(() => {
        const canvas = generateSignCanvas(props);
        return canvas.toDataURL('image/png');
    }, [props]);

    const rowCount = useMemo(() => countVisibleRows(props.showTypes), [props.showTypes]);

    const meta = `画布 ${props.width}×${props.height} · 圆角 ${props.borderRadius} · ${rowCount} 行`;

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            const el = canvasRef.current;
            const stage = stageRef.current;
            if (!el || !stage) return;
            const availW = Math.max(40, stage.clientWidth - PREVIEW_FIT_PADDING * 2);
            const availH = Math.max(40, stage.clientHeight - PREVIEW_FIT_PADDING * 2);
            const scale = Math.min(availW / Math.max(props.width, 1), availH / Math.max(props.height, 1), 1);
            const drawW = Math.max(1, Math.round(props.width * scale));
            const drawH = Math.max(1, Math.round(props.height * scale));
            el.width = drawW;
            el.height = drawH;
            const ctx = el.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, drawW, drawH);
            ctx.drawImage(img, 0, 0, drawW, drawH);
        };
        img.src = dataUrl;
    }, [dataUrl, props.width, props.height]);

    return (
        <div className='comp-sign-preview-card'>
            <div className='comp-sign-preview-card__header'>
                <span className='comp-sign-preview-card__title'>实时预览</span>
                <span className='comp-sign-preview-card__meta'>{meta}</span>
            </div>
            <div ref={stageRef} className={`comp-sign-preview ${props.transparentBackground ? 'is-checker' : 'is-plain'}`}>
                <canvas ref={canvasRef} className='comp-sign-preview__canvas' />
            </div>
        </div>
    );
}

export default SignPreview;
