import type { StyleSection } from "./types"

function parseBoxShadow(value: string): Record<string, unknown> {
	// "2px 4px 8px 0px #000000" 또는 "2px 4px 8px 0px rgba(...)"
	const match = value.match(/^(-?\d+)px\s+(-?\d+)px\s+(-?\d+)px\s+(-?\d+)px\s+(.+)$/)
	if (!match) return { offsetX: 0, offsetY: 0, blur: 0, spread: 0, color: "#000000" }
	return {
		offsetX: Number(match[1]),
		offsetY: Number(match[2]),
		blur: Number(match[3]),
		spread: Number(match[4]),
		color: match[5],
	}
}

function composeBoxShadow(values: Record<string, unknown>): string {
	const x = values.offsetX ?? 0
	const y = values.offsetY ?? 0
	const blur = values.blur ?? 0
	const spread = values.spread ?? 0
	const color = values.color ?? "#000000"
	return `${x}px ${y}px ${blur}px ${spread}px ${color}`
}

export const designTabSchema: readonly StyleSection[] = [
	// ── Size ──
	{
		title: "Size",
		controls: [
			{ type: "number", key: "width", label: "W" },
			{ type: "number", key: "height", label: "H" },
			{ type: "number", key: "minWidth", label: "Min W" },
			{ type: "number", key: "maxWidth", label: "Max W" },
			{ type: "number", key: "minHeight", label: "Min H" },
			{ type: "number", key: "maxHeight", label: "Max H" },
		],
	},

	// ── Layout ──
	{
		title: "Layout",
		controls: [
			{
				type: "select",
				key: "display",
				label: "Display",
				options: [
					{ value: "block", label: "Block" },
					{ value: "flex", label: "Flex" },
					{ value: "grid", label: "Grid" },
					{ value: "inline", label: "Inline" },
					{ value: "none", label: "None" },
				],
				defaultValue: "block",
			},
		],
	},
	{
		title: "Flex Layout",
		condition: { key: "display", value: "flex" },
		controls: [
			{
				type: "select",
				key: "flexDirection",
				label: "Dir",
				options: [
					{ value: "row", label: "Row" },
					{ value: "column", label: "Column" },
					{ value: "row-reverse", label: "Row Rev" },
					{ value: "column-reverse", label: "Col Rev" },
				],
				defaultValue: "row",
			},
			{ type: "number", key: "gap", label: "Gap" },
			{
				type: "select",
				key: "alignItems",
				label: "Align",
				options: [
					{ value: "stretch", label: "Stretch" },
					{ value: "flex-start", label: "Start" },
					{ value: "center", label: "Center" },
					{ value: "flex-end", label: "End" },
				],
				defaultValue: "stretch",
			},
			{
				type: "select",
				key: "justifyContent",
				label: "Justify",
				options: [
					{ value: "flex-start", label: "Start" },
					{ value: "center", label: "Center" },
					{ value: "flex-end", label: "End" },
					{ value: "space-between", label: "Between" },
					{ value: "space-around", label: "Around" },
				],
				defaultValue: "flex-start",
			},
		],
	},

	// ── CSS Position ──
	{
		title: "CSS Position",
		controls: [
			{
				type: "select",
				key: "position",
				label: "Position",
				options: [
					{ value: "static", label: "Static" },
					{ value: "relative", label: "Relative" },
					{ value: "absolute", label: "Absolute" },
					{ value: "fixed", label: "Fixed" },
					{ value: "sticky", label: "Sticky" },
				],
				defaultValue: "static",
				clearOnDefault: true,
			},
		],
	},
	{
		title: "Position Offsets",
		condition: { key: "position", value: ["absolute", "fixed", "sticky"] },
		controls: [
			{ type: "number", key: "top", label: "Top" },
			{ type: "number", key: "left", label: "Left" },
			{ type: "number", key: "bottom", label: "Bottom" },
			{ type: "number", key: "right", label: "Right" },
		],
	},

	// ── Overflow ──
	{
		title: "Overflow",
		controls: [
			{
				type: "select",
				key: "overflow",
				label: "Overflow",
				options: [
					{ value: "visible", label: "Visible" },
					{ value: "hidden", label: "Hidden" },
					{ value: "scroll", label: "Scroll" },
					{ value: "auto", label: "Auto" },
					{ value: "clip", label: "Clip" },
				],
				defaultValue: "visible",
				clearOnDefault: true,
			},
		],
	},

	// ── Spacing ──
	{
		title: "Spacing",
		controls: [
			{
				type: "shorthand",
				label: "Padding",
				shorthandKey: "padding",
				parts: [
					{ key: "paddingTop", label: "T" },
					{ key: "paddingRight", label: "R" },
					{ key: "paddingBottom", label: "B" },
					{ key: "paddingLeft", label: "L" },
				],
			},
			{
				type: "shorthand",
				label: "Margin",
				shorthandKey: "margin",
				parts: [
					{ key: "marginTop", label: "T" },
					{ key: "marginRight", label: "R" },
					{ key: "marginBottom", label: "B" },
					{ key: "marginLeft", label: "L" },
				],
			},
		],
	},

	// ── Fill ──
	{
		title: "Fill",
		controls: [{ type: "color", key: "backgroundColor", defaultPickerColor: "#ffffff" }],
	},

	// ── Visual Effects ──
	{
		title: "Effects",
		controls: [
			{ type: "slider", key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01, defaultValue: 1 },
			{
				type: "composite",
				key: "boxShadow",
				label: "Shadow",
				parts: [
					{ type: "number", label: "X", role: "offsetX" },
					{ type: "number", label: "Y", role: "offsetY" },
					{ type: "number", label: "Blur", role: "blur" },
					{ type: "number", label: "Spread", role: "spread" },
					{ type: "color", label: "Color", role: "color" },
				],
				compose: composeBoxShadow,
				decompose: parseBoxShadow,
			},
		],
	},

	// ── Border ──
	{
		title: "Border",
		controls: [
			{ type: "number", key: "borderWidth", label: "Width" },
			{
				type: "shorthand",
				label: "Radius",
				shorthandKey: "borderRadius",
				parts: [
					{ key: "borderTopLeftRadius", label: "TL" },
					{ key: "borderTopRightRadius", label: "TR" },
					{ key: "borderBottomRightRadius", label: "BR" },
					{ key: "borderBottomLeftRadius", label: "BL" },
				],
			},
			{ type: "color", key: "borderColor" },
			{
				type: "select",
				key: "borderStyle",
				label: "Style",
				options: [
					{ value: "none", label: "None" },
					{ value: "solid", label: "Solid" },
					{ value: "dashed", label: "Dashed" },
					{ value: "dotted", label: "Dotted" },
				],
				defaultValue: "solid",
			},
		],
	},

	// ── Typography ──
	{
		title: "Typography",
		controls: [
			{ type: "text", key: "fontFamily", label: "Family" },
			{ type: "number", key: "fontSize", label: "Size" },
			{
				type: "select",
				key: "fontWeight",
				label: "Weight",
				options: [
					{ value: "normal", label: "Normal" },
					{ value: "500", label: "Medium" },
					{ value: "600", label: "Semibold" },
					{ value: "bold", label: "Bold" },
				],
				defaultValue: "normal",
			},
			{ type: "number", key: "lineHeight", label: "Line H" },
			{ type: "number", key: "letterSpacing", label: "Spacing" },
			{ type: "color", key: "color" },
			{
				type: "select",
				key: "textAlign",
				label: "Align",
				options: [
					{ value: "left", label: "Left" },
					{ value: "center", label: "Center" },
					{ value: "right", label: "Right" },
				],
				defaultValue: "left",
			},
		],
	},

	// ── Flex Child ──
	{
		title: "Flex Child",
		condition: { key: "display", value: "flex", target: "parent" },
		controls: [
			{ type: "number", key: "flexGrow", label: "Grow" },
			{ type: "number", key: "flexShrink", label: "Shrink" },
			{ type: "number", key: "flexBasis", label: "Basis" },
			{
				type: "select",
				key: "alignSelf",
				label: "Align Self",
				options: [
					{ value: "auto", label: "Auto" },
					{ value: "flex-start", label: "Start" },
					{ value: "center", label: "Center" },
					{ value: "flex-end", label: "End" },
					{ value: "stretch", label: "Stretch" },
				],
				defaultValue: "auto",
			},
		],
	},
]
