import { normalizePaints } from './fills';
import { isNumber } from 'es-toolkit/compat';
import { toTokenizedValue } from './utils';
import type { NormalizedValue } from './types';

type ExtractedTextProps = import('../extract/text').ExtractedTextProps;
type NormalizedText = import('./types').NormalizedText;

type TextSegment = NonNullable<ExtractedTextProps['characters']>[number];

const buildRunStyle = (segment: TextSegment): NormalizedText['runs'][number]['style'] => {
	const boundVariables = segment.boundVariables;
	const fontFamilyAlias = boundVariables?.fontFamily;
	const fontStyleAlias = boundVariables?.fontStyle;
	const fontWeightAlias = boundVariables?.fontWeight;
	const fontSizeAlias = boundVariables?.fontSize;
	const letterSpacingAlias = boundVariables?.letterSpacing;
	const lineHeightAlias = boundVariables?.lineHeight;
	const paragraphSpacingAlias = boundVariables?.paragraphSpacing;
	const paragraphIndentAlias = boundVariables?.paragraphIndent;

	const textDecorationColor = segment.textDecorationColor ?? { value: 'AUTO' };

	return {
		fontName: toTokenizedValue(segment.fontName, fontFamilyAlias),
		fontSize: toTokenizedValue(segment.fontSize, fontSizeAlias),
		fontWeight: toTokenizedValue(segment.fontWeight, fontWeightAlias),
		fontStyle: toTokenizedValue(segment.fontStyle, fontStyleAlias),
		textCase: segment.textCase,
		textDecoration: segment.textDecoration,
		textDecorationStyle: segment.textDecorationStyle ?? null,
		textDecorationOffset: segment.textDecorationOffset ?? null,
		textDecorationThickness: segment.textDecorationThickness ?? null,
		textDecorationColor: toTokenizedValue(textDecorationColor, null),
		textDecorationSkipInk: segment.textDecorationSkipInk ?? null,
		lineHeight: toTokenizedValue(segment.lineHeight, lineHeightAlias),
		letterSpacing: toTokenizedValue(segment.letterSpacing, letterSpacingAlias),
		fills: normalizePaints(segment.fills),
		fillStyleId: typeof segment.fillStyleId === 'string' ? segment.fillStyleId : null,
		textStyleId: typeof segment.textStyleId === 'string' ? segment.textStyleId : null,
		listOptions: segment.listOptions ?? null,
		listSpacing: isNumber(segment.listSpacing) ? segment.listSpacing : null,
		indentation: isNumber(segment.indentation) ? segment.indentation : null,
		paragraphIndent: isNumber(segment.paragraphIndent)
			? toTokenizedValue(segment.paragraphIndent, paragraphIndentAlias)
			: null,
		paragraphSpacing: isNumber(segment.paragraphSpacing)
			? toTokenizedValue(segment.paragraphSpacing, paragraphSpacingAlias)
			: null,
		hyperlink: segment.hyperlink ?? null,
		openTypeFeatures: segment.openTypeFeatures ?? {},
	};
};

const buildRuns = (segments: TextSegment[]): NormalizedText['runs'] =>
	segments.map((segment) => ({
		start: segment.start,
		end: segment.end,
		characters: segment.characters,
		style: buildRunStyle(segment),
	}));

const buildMixedSegments = <T>(runs: NormalizedText['runs'], getValue: (run: NormalizedText['runs'][number]) => T) =>
	runs.map((run) => ({
		start: run.start,
		end: run.end,
		value: getValue(run),
	}));

const buildTextStyleId = (text: ExtractedTextProps, runs: NormalizedText['runs']): NormalizedText['textStyleId'] => {
	const textStyleId = text.textStyleId;
	if (typeof textStyleId === 'string') return textStyleId;

	const segments = buildMixedSegments<string>(runs, (run) =>
		typeof run.style.textStyleId === 'string' ? run.style.textStyleId : '',
	);

	return { type: 'mixed', segments };
};

const buildHyperlink = (text: ExtractedTextProps, runs: NormalizedText['runs']): NormalizedText['hyperlink'] => {
	const hyperlink = text.hyperlink;
	if (hyperlink !== figma.mixed) return hyperlink ?? null;

	const segments = buildMixedSegments<HyperlinkTarget | null>(runs, (run) => run.style.hyperlink);
	return { type: 'mixed', segments };
};

const normalizeLeadingTrim = (value: LeadingTrim | PluginAPI['mixed'] | undefined): NormalizedValue<LeadingTrim> => {
	if (value === figma.mixed) {
		return { type: 'mixed', values: ['NONE', 'CAP_HEIGHT'] as const };
	}
	return { type: 'uniform', value: value ?? 'NONE' };
};

export const normalizeText = (
	text: ExtractedTextProps,
	nodeBoundVariables?: SceneNode['boundVariables'],
): NormalizedText | null => {
	const segments = text.characters as TextSegment[] | undefined;
	if (!segments || segments.length === 0) return null;

	const runs = buildRuns(segments);
	const characters = runs.map((run) => run.characters).join('');
	const charactersAlias = nodeBoundVariables?.characters;

	return {
		characters: toTokenizedValue(characters, charactersAlias),
		runs,
		textAlignHorizontal: text.textAlignHorizontal ?? 'LEFT',
		textAlignVertical: text.textAlignVertical ?? 'TOP',
		textAutoResize: text.textAutoResize ?? 'NONE',
		textTruncation: text.textTruncation ?? 'DISABLED',
		maxLines: text.maxLines ?? null,
		paragraphIndent: isNumber(text.paragraphIndent) ? text.paragraphIndent : 0,
		paragraphSpacing: isNumber(text.paragraphSpacing) ? text.paragraphSpacing : 0,
		listSpacing: isNumber(text.listSpacing) ? text.listSpacing : 0,
		hangingPunctuation: text.hangingPunctuation ?? false,
		hangingList: text.hangingList ?? false,
		leadingTrim: normalizeLeadingTrim(text.leadingTrim),
		textStyleId: buildTextStyleId(text, runs),
		hyperlink: buildHyperlink(text, runs),
	};
};
