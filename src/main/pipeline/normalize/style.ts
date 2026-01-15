import type { ExtractedStyle } from '../extract/types';
import type { NormalizedStyle } from './types';
import { effectsNormalizer } from './effects';
import { paintNormalizer } from './fills';
import { layoutNormalizer } from './layout';
import { strokeNormalizer } from './stroke';
import { textNormalizer } from './text';

export class StyleNormalizer {
	constructor(
		private readonly paint = paintNormalizer,
		private readonly effects = effectsNormalizer,
		private readonly layout = layoutNormalizer,
		private readonly text = textNormalizer,
		private readonly stroke = strokeNormalizer,
	) {}

	normalize(style: ExtractedStyle): NormalizedStyle {
		return {
			fills: this.paint.normalizeFills(style.fills),
			effects: this.effects.normalizeEffects(style.effects),
			layout: this.layout.normalizeLayout(style.layout, style.nodeBoundVariables),
			text: this.text.normalizeText(style.text, style.nodeBoundVariables),
			stroke: this.stroke.normalizeStroke(style.stroke, style.nodeBoundVariables),
		};
	}
}

export const styleNormalizer = new StyleNormalizer();
