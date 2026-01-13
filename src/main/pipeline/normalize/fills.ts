import type { ExtractedFillProps } from '../extract/fills';
import { toTokenizedValue } from './utils';
import type {
	NormalizedColor,
	NormalizedFill,
	NormalizedGradientFill,
	NormalizedGradientStop,
	NormalizedImageFill,
	NormalizedSolidFill,
	NormalizedValue,
} from './types';

const toChannel = (value: number) => Math.round(value * 255);

const toHex = (value: number) => toChannel(value).toString(16).padStart(2, '0');

const rgbToHex = (color: RGB) => `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;

const normalizeColor = (color: RGB, opacity: number): NormalizedColor => {
	const red = toChannel(color.r);
	const green = toChannel(color.g);
	const blue = toChannel(color.b);
	const alpha = opacity;

	return {
		hex: rgbToHex(color),
		rgb: `rgb(${red}, ${green}, ${blue})`,
		rgba: `rgba(${red}, ${green}, ${blue}, ${alpha})`,
		opacity: alpha,
	};
};

const normalizeRgbaColor = (color: RGBA, opacity: number): NormalizedColor =>
	normalizeColor({ r: color.r, g: color.g, b: color.b }, opacity);

const normalizeSolid = (paint: SolidPaint): NormalizedSolidFill => {
	const opacity = paint.opacity ?? 1;
	const color = normalizeColor(paint.color, opacity);
	const alias = paint.boundVariables?.color;
	const normalized: NormalizedSolidFill = {
		type: 'solid',
		color: toTokenizedValue(color, alias),
	};

	if (paint.blendMode) normalized.blendMode = paint.blendMode;
	if (typeof paint.visible === 'boolean') normalized.visible = paint.visible;

	return normalized;
};

const calculateGradientAngle = (transform: Transform): number => {
	const [[a], [c]] = transform;
	return Math.atan2(c, a) * (180 / Math.PI);
};

const normalizeGradientStops = (paint: GradientPaint): NormalizedGradientStop[] => {
	const paintOpacity = paint.opacity ?? 1;
	return paint.gradientStops.map((stop) => {
		const opacity = stop.color.a * paintOpacity;
		const color = normalizeRgbaColor(stop.color, opacity);
		const alias = stop.boundVariables?.color;
		return {
			position: stop.position,
			color: toTokenizedValue(color, alias),
		};
	});
};

const normalizeGradient = (
	paint: GradientPaint,
	gradientType: NormalizedGradientFill['gradientType'],
): NormalizedGradientFill => {
	const normalized: NormalizedGradientFill = {
		type: 'gradient',
		gradientType,
		stops: normalizeGradientStops(paint),
		angle: calculateGradientAngle(paint.gradientTransform),
		transform: paint.gradientTransform,
	};

	if (paint.blendMode) normalized.blendMode = paint.blendMode;
	if (typeof paint.visible === 'boolean') normalized.visible = paint.visible;

	return normalized;
};

const normalizeFilters = (filters?: ImageFilters): NormalizedImageFill['filters'] => ({
	exposure: filters?.exposure ?? null,
	contrast: filters?.contrast ?? null,
	saturation: filters?.saturation ?? null,
	temperature: filters?.temperature ?? null,
	tint: filters?.tint ?? null,
	highlights: filters?.highlights ?? null,
	shadows: filters?.shadows ?? null,
});

const normalizeImage = (
	paint: ImagePaint | VideoPaint,
	imageHash: string | null,
	imageTransform: Transform | null,
): NormalizedImageFill => {
	const normalized: NormalizedImageFill = {
		type: 'image',
		imageHash,
		scaleMode: paint.scaleMode,
		imageTransform,
		scalingFactor: paint.scalingFactor ?? null,
		rotation: paint.rotation ?? null,
		filters: normalizeFilters(paint.filters),
	};

	if (paint.blendMode) normalized.blendMode = paint.blendMode;
	if (typeof paint.visible === 'boolean') normalized.visible = paint.visible;

	return normalized;
};

const normalizePaint = (paint: Paint): NormalizedFill | null => {
	if (paint.type === 'SOLID') {
		return normalizeSolid(paint);
	}

	if (paint.type === 'GRADIENT_LINEAR') {
		return normalizeGradient(paint, 'linear');
	}

	if (paint.type === 'GRADIENT_RADIAL') {
		return normalizeGradient(paint, 'radial');
	}

	if (paint.type === 'GRADIENT_ANGULAR') {
		return normalizeGradient(paint, 'angular');
	}

	if (paint.type === 'GRADIENT_DIAMOND') {
		return normalizeGradient(paint, 'diamond');
	}

	if (paint.type === 'IMAGE') {
		return normalizeImage(paint, paint.imageHash ?? null, paint.imageTransform ?? null);
	}

	if (paint.type === 'VIDEO') {
		return normalizeImage(paint, paint.videoHash ?? null, paint.videoTransform ?? null);
	}

	return null;
};

export const normalizePaints = (paints: ReadonlyArray<Paint> | undefined): NormalizedFill[] => {
	if (!paints || !Array.isArray(paints)) {
		return [];
	}

	const normalized: NormalizedFill[] = [];
	for (let index = 0; index < paints.length; index += 1) {
		const paint = paints[index];
		if (paint.visible === false) continue;
		const normalizedPaint = normalizePaint(paint);
		if (normalizedPaint) normalized.push(normalizedPaint);
	}

	return normalized;
};

export const normalizeFills = (
	props: ExtractedFillProps,
	nodeType?: string,
): NormalizedValue<NormalizedFill[]> => {
	const fills = props.fills;

	if (fills === figma.mixed) {
		if (nodeType !== 'TEXT') {
			console.warn('Unexpected mixed fills on non-TEXT node');
		}
		return { type: 'mixed', values: [] };
	}

	return { type: 'uniform', value: normalizePaints(fills) };
};
