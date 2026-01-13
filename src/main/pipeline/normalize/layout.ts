import { isNumber } from 'es-toolkit/compat';
import { toTokenizedValue } from './utils';
import type { ExtractedLayoutProps } from '../extract/layout';
import type {
	NormalizedLayout,
	NormalizedLayoutChild,
	NormalizedLayoutContainer,
	NormalizedLayoutGap,
	NormalizedLayoutPadding,
	NormalizedLayoutPosition,
} from './types';

const toNumber = (value: number | undefined): number => (typeof value === 'number' ? value : 0);

const buildPosition = (
	layout: ExtractedLayoutProps,
	boundVariables?: SceneNode['boundVariables'],
): NormalizedLayoutPosition => {
	const width = toNumber(layout.width);
	const height = toNumber(layout.height);
	const minWidth = typeof layout.minWidth === 'number' ? layout.minWidth : null;
	const maxWidth = typeof layout.maxWidth === 'number' ? layout.maxWidth : null;
	const minHeight = typeof layout.minHeight === 'number' ? layout.minHeight : null;
	const maxHeight = typeof layout.maxHeight === 'number' ? layout.maxHeight : null;

	return {
		x: toNumber(layout.x),
		y: toNumber(layout.y),
		width: toTokenizedValue(width, boundVariables?.width),
		height: toTokenizedValue(height, boundVariables?.height),
		minWidth: minWidth === null ? null : toTokenizedValue(minWidth, boundVariables?.minWidth),
		maxWidth: maxWidth === null ? null : toTokenizedValue(maxWidth, boundVariables?.maxWidth),
		minHeight: minHeight === null ? null : toTokenizedValue(minHeight, boundVariables?.minHeight),
		maxHeight: maxHeight === null ? null : toTokenizedValue(maxHeight, boundVariables?.maxHeight),
	};
};

const buildPadding = (
	layout: ExtractedLayoutProps,
	boundVariables?: SceneNode['boundVariables'],
): NormalizedLayoutPadding | undefined => {
	const hasPadding =
		isNumber(layout.paddingTop) ||
		isNumber(layout.paddingRight) ||
		isNumber(layout.paddingBottom) ||
		isNumber(layout.paddingLeft);

	if (!hasPadding) return undefined;

	return {
		top: toTokenizedValue(toNumber(layout.paddingTop), boundVariables?.paddingTop),
		right: toTokenizedValue(toNumber(layout.paddingRight), boundVariables?.paddingRight),
		bottom: toTokenizedValue(toNumber(layout.paddingBottom), boundVariables?.paddingBottom),
		left: toTokenizedValue(toNumber(layout.paddingLeft), boundVariables?.paddingLeft),
	};
};

const buildGap = (
	layout: ExtractedLayoutProps,
	boundVariables?: SceneNode['boundVariables'],
): NormalizedLayoutGap | undefined => {
	const gap: NormalizedLayoutGap = {};
	const gridRowGapAlias = boundVariables?.gridRowGap;
	const gridColumnGapAlias = boundVariables?.gridColumnGap;
	const itemSpacingAlias = boundVariables?.itemSpacing;
	const counterAxisSpacingAlias = boundVariables?.counterAxisSpacing;

	if (layout.layoutMode === 'GRID') {
		if (isNumber(layout.gridRowGap)) {
			gap.row = toTokenizedValue(layout.gridRowGap, gridRowGapAlias);
		}
		if (isNumber(layout.gridColumnGap)) {
			gap.column = toTokenizedValue(layout.gridColumnGap, gridColumnGapAlias);
		}
	}

	if (layout.layoutMode === 'HORIZONTAL') {
		if (isNumber(layout.itemSpacing)) {
			gap.column = toTokenizedValue(layout.itemSpacing, itemSpacingAlias);
		}
		if (layout.layoutWrap === 'WRAP' && isNumber(layout.counterAxisSpacing)) {
			gap.row = toTokenizedValue(layout.counterAxisSpacing, counterAxisSpacingAlias);
		}
	}

	if (layout.layoutMode === 'VERTICAL') {
		if (isNumber(layout.itemSpacing)) {
			gap.row = toTokenizedValue(layout.itemSpacing, itemSpacingAlias);
		}
		if (layout.layoutWrap === 'WRAP' && isNumber(layout.counterAxisSpacing)) {
			gap.column = toTokenizedValue(layout.counterAxisSpacing, counterAxisSpacingAlias);
		}
	}

	const hasRow = gap.row !== undefined && gap.row !== null;
	const hasColumn = gap.column !== undefined && gap.column !== null;
	if (!hasRow && !hasColumn) return undefined;
	return gap;
};

const buildContainer = (
	layout: ExtractedLayoutProps,
	boundVariables?: SceneNode['boundVariables'],
): NormalizedLayoutContainer | undefined => {
	const container: NormalizedLayoutContainer = {};

	if (layout.layoutMode === 'HORIZONTAL' || layout.layoutMode === 'VERTICAL') {
		container.direction = layout.layoutMode;
	}

	const padding = buildPadding(layout, boundVariables);
	if (padding) container.padding = padding;

	const gap = buildGap(layout, boundVariables);
	if (gap) container.gap = gap;

	if (layout.primaryAxisAlignItems) container.primaryAxisAlignItems = layout.primaryAxisAlignItems;
	if (layout.counterAxisAlignItems) container.counterAxisAlignItems = layout.counterAxisAlignItems;
	if (layout.counterAxisAlignContent) container.counterAxisAlignContent = layout.counterAxisAlignContent;
	if (layout.primaryAxisSizingMode) container.primaryAxisSizingMode = layout.primaryAxisSizingMode;
	if (layout.counterAxisSizingMode) container.counterAxisSizingMode = layout.counterAxisSizingMode;
	if (layout.layoutWrap) container.layoutWrap = layout.layoutWrap;
	if (typeof layout.strokesIncludedInLayout === 'boolean') {
		container.strokesIncludedInLayout = layout.strokesIncludedInLayout;
	}
	if (typeof layout.itemReverseZIndex === 'boolean') {
		container.itemReverseZIndex = layout.itemReverseZIndex;
	}

	if (
		isNumber(layout.gridRowCount) ||
		isNumber(layout.gridColumnCount) ||
		Array.isArray(layout.gridRowSizes) ||
		Array.isArray(layout.gridColumnSizes)
	) {
		container.grid = {
			rowCount: toNumber(layout.gridRowCount),
			columnCount: toNumber(layout.gridColumnCount),
			rowGap: toTokenizedValue(toNumber(layout.gridRowGap), boundVariables?.gridRowGap),
			columnGap: toTokenizedValue(toNumber(layout.gridColumnGap), boundVariables?.gridColumnGap),
			rowSizes: layout.gridRowSizes ?? [],
			columnSizes: layout.gridColumnSizes ?? [],
		};
	}

	return Object.keys(container).length > 0 ? container : undefined;
};

const buildChild = (layout: ExtractedLayoutProps): NormalizedLayoutChild | undefined => {
	const child: NormalizedLayoutChild = {};

	if (layout.layoutAlign) child.layoutAlign = layout.layoutAlign;
	if (isNumber(layout.layoutGrow)) child.layoutGrow = layout.layoutGrow;
	if (layout.layoutPositioning) child.layoutPositioning = layout.layoutPositioning;
	if (layout.layoutSizingHorizontal) child.layoutSizingHorizontal = layout.layoutSizingHorizontal;
	if (layout.layoutSizingVertical) child.layoutSizingVertical = layout.layoutSizingVertical;

	if (
		isNumber(layout.gridRowAnchorIndex) ||
		isNumber(layout.gridColumnAnchorIndex) ||
		isNumber(layout.gridRowSpan) ||
		isNumber(layout.gridColumnSpan) ||
		layout.gridChildHorizontalAlign ||
		layout.gridChildVerticalAlign
	) {
		child.grid = {
			row: toNumber(layout.gridRowAnchorIndex),
			column: toNumber(layout.gridColumnAnchorIndex),
			rowSpan: isNumber(layout.gridRowSpan) ? layout.gridRowSpan : 1,
			columnSpan: isNumber(layout.gridColumnSpan) ? layout.gridColumnSpan : 1,
			horizontalAlign: layout.gridChildHorizontalAlign ?? 'AUTO',
			verticalAlign: layout.gridChildVerticalAlign ?? 'AUTO',
		};
	}

	return Object.keys(child).length > 0 ? child : undefined;
};

export const normalizeLayout = (
	layout: ExtractedLayoutProps,
	boundVariables?: SceneNode['boundVariables'],
): NormalizedLayout => {
	const mode: NormalizedLayout['mode'] =
		layout.layoutMode === 'GRID'
			? 'GRID'
			: layout.layoutMode === 'HORIZONTAL' || layout.layoutMode === 'VERTICAL'
				? 'AUTO'
				: 'ABSOLUTE';

	const normalized: NormalizedLayout = {
		mode,
		position: buildPosition(layout, boundVariables),
	};

	if (layout.constraints) {
		normalized.constraints = layout.constraints;
	}

	const container = buildContainer(layout, boundVariables);
	if (container) normalized.container = container;

	const child = buildChild(layout);
	if (child) normalized.child = child;

	return normalized;
};
