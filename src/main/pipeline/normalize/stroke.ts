import { isNumber } from 'es-toolkit/compat';
import { paintNormalizer } from './fills';
import { toTokenizedValue } from './utils';
import type { ExtractedStrokeProps } from '../extract/stroke';
import type { ExtractedStrokeCap, ExtractedStrokeJoin } from '../extract/value-types';
import type { NormalizedCorner, NormalizedStroke, NormalizedStrokeWeight, NormalizedValue } from './types';

export class StrokeNormalizer {
	normalizeStroke(
		props: ExtractedStrokeProps,
		boundVariables?: SceneNode['boundVariables'],
	): NormalizedStroke | null {
		const paints = paintNormalizer.normalizePaints(props.strokes?.value);
		if (paints.length === 0) return null;

		const normalized: NormalizedStroke = {
			paints: { type: 'uniform', value: paints },
			weight: this.buildStrokeWeight(props, boundVariables),
			align: props.strokeAlign?.value ?? 'CENTER',
			cap: this.normalizeCap(props.strokeCap),
			join: this.normalizeJoin(props.strokeJoin),
			dashPattern: props.dashPattern?.value ?? [],
			miterLimit: props.strokeMiterLimit?.value ?? 0,
		};

		const corner = this.buildCorner(props, boundVariables);
		if (corner) normalized.corner = corner;
		if (props.vectorNetwork?.value) normalized.vectorNetwork = props.vectorNetwork.value;

		return normalized;
	}

	private buildStrokeWeight(
		stroke: ExtractedStrokeProps,
		boundVariables?: SceneNode['boundVariables'],
	): NormalizedStrokeWeight {
		const extracted = stroke.strokeWeight;
		if (!extracted) {
			return { type: 'uniform', value: toTokenizedValue(0, boundVariables?.strokeWeight) };
		}

		if (extracted.type === 'side') {
			return {
				type: 'individual',
				top: toTokenizedValue(extracted.top, boundVariables?.strokeTopWeight),
				right: toTokenizedValue(extracted.right, boundVariables?.strokeRightWeight),
				bottom: toTokenizedValue(extracted.bottom, boundVariables?.strokeBottomWeight),
				left: toTokenizedValue(extracted.left, boundVariables?.strokeLeftWeight),
			};
		}

		return { type: 'uniform', value: toTokenizedValue(extracted.value, boundVariables?.strokeWeight) };
	}

	private buildCorner(
		stroke: ExtractedStrokeProps,
		boundVariables?: SceneNode['boundVariables'],
	): NormalizedCorner | null {
		const extracted = stroke.cornerRadius;
		if (!extracted) return null;

		const smoothing = isNumber(stroke.cornerSmoothing?.value) ? stroke.cornerSmoothing.value : 0;
		const topLeftAlias = boundVariables?.topLeftRadius;
		const topRightAlias = boundVariables?.topRightRadius;
		const bottomRightAlias = boundVariables?.bottomRightRadius;
		const bottomLeftAlias = boundVariables?.bottomLeftRadius;
		const uniformAlias = topLeftAlias ?? topRightAlias ?? bottomRightAlias ?? bottomLeftAlias;

		if (extracted.type === 'corner') {
			const values = [
				toTokenizedValue(extracted.topLeft, topLeftAlias),
				toTokenizedValue(extracted.topRight, topRightAlias),
				toTokenizedValue(extracted.bottomRight, bottomRightAlias),
				toTokenizedValue(extracted.bottomLeft, bottomLeftAlias),
			];
			return {
				radius: { type: 'mixed', values },
				smoothing,
			};
		}

		return {
			radius: { type: 'uniform', value: toTokenizedValue(extracted.value, uniformAlias) },
			smoothing,
		};
	}

	private normalizeCap(extracted: ExtractedStrokeCap | undefined): NormalizedValue<StrokeCap> {
		if (!extracted) {
			return { type: 'uniform', value: 'NONE' };
		}

		if (extracted.type === 'vertex') {
			const uniqueValues = Array.from(new Set(extracted.vertices.map((v) => v.value)));
			if (uniqueValues.length === 1 && uniqueValues[0]) {
				return { type: 'uniform', value: uniqueValues[0] };
			}
			if (uniqueValues.length > 0) {
				return { type: 'mixed', values: uniqueValues.filter((v): v is StrokeCap => v !== undefined) };
			}
			return { type: 'uniform', value: 'NONE' };
		}

		return { type: 'uniform', value: extracted.value };
	}

	private normalizeJoin(extracted: ExtractedStrokeJoin | undefined): NormalizedValue<StrokeJoin> {
		if (!extracted) {
			return { type: 'uniform', value: 'MITER' };
		}

		if (extracted.type === 'vertex') {
			const uniqueValues = Array.from(new Set(extracted.vertices.map((v) => v.value)));
			if (uniqueValues.length === 1 && uniqueValues[0]) {
				return { type: 'uniform', value: uniqueValues[0] };
			}
			if (uniqueValues.length > 0) {
				return { type: 'mixed', values: uniqueValues.filter((v): v is StrokeJoin => v !== undefined) };
			}
			return { type: 'uniform', value: 'MITER' };
		}

		return { type: 'uniform', value: extracted.value };
	}
}

export const strokeNormalizer = new StrokeNormalizer();
