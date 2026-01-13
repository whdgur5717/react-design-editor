import { isNumber } from 'es-toolkit/compat';
import { normalizePaints } from './fills';
import { toTokenizedValue } from './utils';
import type { ExtractedStrokeProps } from '../extract/stroke';
import type { NormalizedCorner, NormalizedStroke, NormalizedStrokeWeight, NormalizedValue } from './types';

const toNumber = (value: number | undefined): number => (isNumber(value) ? value : 0);

const buildStrokeWeight = (
	stroke: ExtractedStrokeProps,
	boundVariables?: SceneNode['boundVariables'],
): NormalizedStrokeWeight => {
	const weightAlias = boundVariables?.strokeWeight;
	const topAlias = boundVariables?.strokeTopWeight;
	const rightAlias = boundVariables?.strokeRightWeight;
	const bottomAlias = boundVariables?.strokeBottomWeight;
	const leftAlias = boundVariables?.strokeLeftWeight;

	const weight = stroke.strokeWeight;
	const hasIndividual =
		isNumber(stroke.strokeTopWeight) &&
		isNumber(stroke.strokeRightWeight) &&
		isNumber(stroke.strokeBottomWeight) &&
		isNumber(stroke.strokeLeftWeight);

	if (weight === figma.mixed || !isNumber(weight)) {
		if (hasIndividual) {
			return {
				type: 'individual',
				top: toTokenizedValue(toNumber(stroke.strokeTopWeight), topAlias),
				right: toTokenizedValue(toNumber(stroke.strokeRightWeight), rightAlias),
				bottom: toTokenizedValue(toNumber(stroke.strokeBottomWeight), bottomAlias),
				left: toTokenizedValue(toNumber(stroke.strokeLeftWeight), leftAlias),
			};
		}
		return { type: 'uniform', value: toTokenizedValue(0, weightAlias) };
	}

	return { type: 'uniform', value: toTokenizedValue(weight, weightAlias) };
};

const buildCorner = (
	stroke: ExtractedStrokeProps,
	boundVariables?: SceneNode['boundVariables'],
): NormalizedCorner | null => {
	const smoothing = isNumber(stroke.cornerSmoothing) ? stroke.cornerSmoothing : 0;
	const topLeftAlias = boundVariables?.topLeftRadius;
	const topRightAlias = boundVariables?.topRightRadius;
	const bottomRightAlias = boundVariables?.bottomRightRadius;
	const bottomLeftAlias = boundVariables?.bottomLeftRadius;
	const uniformAlias = topLeftAlias ?? topRightAlias ?? bottomRightAlias ?? bottomLeftAlias;

	if (stroke.cornerRadius === figma.mixed) {
		const values = [
			toTokenizedValue(toNumber(stroke.topLeftRadius), topLeftAlias),
			toTokenizedValue(toNumber(stroke.topRightRadius), topRightAlias),
			toTokenizedValue(toNumber(stroke.bottomRightRadius), bottomRightAlias),
			toTokenizedValue(toNumber(stroke.bottomLeftRadius), bottomLeftAlias),
		];
		return {
			radius: { type: 'mixed', values },
			smoothing,
		};
	}

	if (isNumber(stroke.cornerRadius)) {
		return {
			radius: { type: 'uniform', value: toTokenizedValue(stroke.cornerRadius, uniformAlias) },
			smoothing,
		};
	}

	const hasIndividual =
		isNumber(stroke.topLeftRadius) ||
		isNumber(stroke.topRightRadius) ||
		isNumber(stroke.bottomRightRadius) ||
		isNumber(stroke.bottomLeftRadius);

	if (hasIndividual) {
		const values = [
			toTokenizedValue(toNumber(stroke.topLeftRadius), topLeftAlias),
			toTokenizedValue(toNumber(stroke.topRightRadius), topRightAlias),
			toTokenizedValue(toNumber(stroke.bottomRightRadius), bottomRightAlias),
			toTokenizedValue(toNumber(stroke.bottomLeftRadius), bottomLeftAlias),
		];
		return {
			radius: { type: 'mixed', values },
			smoothing,
		};
	}

	return null;
};

const normalizeCap = (cap: StrokeCap | PluginAPI['mixed'] | undefined): NormalizedValue<StrokeCap> => {
	if (cap === figma.mixed) {
		return {
			type: 'mixed',
			values: [
				'NONE',
				'ROUND',
				'SQUARE',
				'ARROW_LINES',
				'ARROW_EQUILATERAL',
				'DIAMOND_FILLED',
				'TRIANGLE_FILLED',
				'CIRCLE_FILLED',
			],
		};
	}
	return { type: 'uniform', value: cap ?? 'NONE' };
};

const normalizeJoin = (join: StrokeJoin | PluginAPI['mixed'] | undefined): NormalizedValue<StrokeJoin> => {
	if (join === figma.mixed) {
		return { type: 'mixed', values: ['MITER', 'BEVEL', 'ROUND'] as const };
	}
	return { type: 'uniform', value: join ?? 'MITER' };
};

export const normalizeStroke = (
	props: ExtractedStrokeProps,
	boundVariables?: SceneNode['boundVariables'],
): NormalizedStroke | null => {
	const paints = normalizePaints(props.strokes);
	if (paints.length === 0) return null;

	const normalized: NormalizedStroke = {
		paints: { type: 'uniform', value: paints },
		weight: buildStrokeWeight(props, boundVariables),
		align: props.strokeAlign ?? 'CENTER',
		cap: normalizeCap(props.strokeCap),
		join: normalizeJoin(props.strokeJoin),
		dashPattern: props.dashPattern ?? [],
		miterLimit: props.strokeMiterLimit ?? 0,
	};

	const corner = buildCorner(props, boundVariables);
	if (corner) normalized.corner = corner;
	if (props.vectorNetwork) normalized.vectorNetwork = props.vectorNetwork;

	return normalized;
};
