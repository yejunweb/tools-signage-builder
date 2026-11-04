const FONT_STYLE = 'normal';
const FONT_WEIGHT = 'normal';
const FONT_FAMILY = 'Arial';
const FONT_COLOR = '#ffffff';
const HORIZONTAL_PADDING = 6;
const VERTICAL_PADDING = 2;
const STROKE_COLOR = '#ffffff';

export type DrawAdaptiveTextOptions = {
    fontStyle?: string;
    fontWeight?: string;
    fontFamily?: string;
    fontColor?: string;
    horizontalPadding?: number;
    verticalPadding?: number;
    fontSize?: number;
    useAutoFontSize?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
};

export const drawAdaptiveText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    width: number,
    height: number,
    targetX: number,
    targetY: number,
    options: DrawAdaptiveTextOptions = {}
): number => {
    const {
        fontStyle = FONT_STYLE,
        fontWeight = FONT_WEIGHT,
        fontFamily = FONT_FAMILY,
        fontColor = FONT_COLOR,
        horizontalPadding = HORIZONTAL_PADDING,
        verticalPadding = VERTICAL_PADDING,
        useAutoFontSize = true,
        strokeColor = STROKE_COLOR,
        strokeWidth,
    } = options;
    let { fontSize } = options;

    const availableWidth = width - 2 * horizontalPadding;
    const availableHeight = height - 2 * verticalPadding;

    if (useAutoFontSize) fontSize = availableHeight;
    fontSize = fontSize ?? availableHeight;
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

    const textWidth = ctx.measureText(text).width;
    if (useAutoFontSize && textWidth > availableWidth && textWidth > 0) {
        fontSize = fontSize * (availableWidth / textWidth);
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    }

    ctx.fillStyle = fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    const textMetrics = ctx.measureText(text);
    const textHeight = (textMetrics.actualBoundingBoxAscent || 0) + (textMetrics.actualBoundingBoxDescent || 0);
    const yCenter = targetY + textHeight / 2 - (textMetrics.actualBoundingBoxDescent || 0);

    if (strokeWidth && strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, targetX, yCenter);
    }
    ctx.fillText(text, targetX, yCenter);

    return fontSize;
};

export const getMinFontSizeOfLine = (
    textLs: string[],
    width: number,
    height: number,
    options: Pick<DrawAdaptiveTextOptions, 'fontStyle' | 'fontWeight' | 'fontFamily' | 'horizontalPadding' | 'verticalPadding'> = {}
): number => {
    const {
        fontStyle = FONT_STYLE,
        fontWeight = FONT_WEIGHT,
        fontFamily = FONT_FAMILY,
        horizontalPadding = HORIZONTAL_PADDING,
        verticalPadding = VERTICAL_PADDING,
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(width));
    canvas.height = Math.max(1, Math.floor(height));
    const ctx = canvas.getContext('2d');
    if (!ctx) return verticalPadding;

    const availableWidth = width - 2 * horizontalPadding;
    const availableHeight = height - 2 * verticalPadding;
    let minFontSize = availableHeight;

    for (const textItem of textLs) {
        let fontSize = availableHeight;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        const measured = ctx.measureText(textItem).width;
        if (measured > availableWidth && measured > 0) {
            fontSize = fontSize * (availableWidth / measured);
        }
        minFontSize = Math.min(minFontSize, fontSize);
    }

    return minFontSize;
};
