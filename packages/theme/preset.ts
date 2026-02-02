import { definePreset, defineSemanticTokens, defineTextStyles, defineTokens } from "@pandacss/dev"

const radii = defineTokens.radii({
	radius: { value: "0.5rem" },
})

export const semanticColors = defineSemanticTokens.colors({
	background: {
		value: { base: "{colors.white}", _dark: "{colors.gray.950}" },
	},
	foreground: {
		value: { base: "{colors.gray.950}", _dark: "{colors.gray.50}" },
	},
	primary: {
		DEFAULT: {
			value: { base: "{colors.blue.600}", _dark: "{colors.blue.700}" },
		},
		foreground: {
			value: { base: "{colors.white}", _dark: "{colors.gray.950}" },
		},
		active: {
			value: { base: "{colors.blue.700}", _dark: "{colors.blue.300}" },
		},
	},
	secondary: {
		DEFAULT: {
			value: { base: "{colors.slate.600}", _dark: "{colors.slate.400}" },
		},
		foreground: {
			value: { base: "{colors.white}", _dark: "{colors.gray.950}" },
		},
		active: {
			value: { base: "{colors.slate.700}", _dark: "{colors.slate.300}" },
		},
	},
	neutral: {
		DEFAULT: {
			value: { base: "{colors.gray.100}", _dark: "{colors.gray.800}" },
		},
		foreground: {
			value: { base: "{colors.gray.500}", _dark: "{colors.gray.400}" },
		},
		active: {
			value: { base: "{colors.gray.200}", _dark: "{colors.gray.700}" },
		},
	},
	accent: {
		DEFAULT: {
			value: { base: "{colors.slate.100}", _dark: "{colors.slate.800}" },
		},
		foreground: {
			value: { base: "{colors.slate.900}", _dark: "{colors.slate.50}" },
		},
		active: {
			value: { base: "{colors.slate.200}", _dark: "{colors.slate.700}" },
		},
	},
	destructive: {
		DEFAULT: {
			value: { base: "{colors.red.600}", _dark: "{colors.red.400}" },
		},
		foreground: {
			value: { base: "{colors.white}", _dark: "{colors.gray.950}" },
		},
		active: {
			value: { base: "{colors.red.700}", _dark: "{colors.red.300}" },
		},
	},
	layer: {
		DEFAULT: {
			value: { base: "{colors.white}", _dark: "{colors.gray.950}" },
		},
		overlay: {
			value: { base: "{colors.black/50}", _dark: "{colors.black/50}" },
		},
		floating: {
			value: { base: "{colors.white}", _dark: "{colors.gray.950}" },
		},
		active: {
			value: { base: "{colors.gray.50}", _dark: "{colors.gray.800}" },
		},
		foreground: {
			DEFAULT: {
				value: { base: "{colors.gray.500}", _dark: "{colors.gray.400}" },
			},
			muted: {
				value: { base: "{colors.gray.400}", _dark: "{colors.gray.500}" },
			},
			emphasized: {
				value: { base: "{colors.gray.700}", _dark: "{colors.gray.200}" },
			},
			primary: {
				value: { base: "{colors.blue.500}", _dark: "{colors.blue.400}" },
			},
		},
	},
	stroke: {
		DEFAULT: {
			value: { base: "{colors.blue.200}", _dark: "{colors.blue.600}" },
		},
		border: {
			value: { base: "{colors.gray.200}", _dark: "{colors.gray.800}" },
		},
		input: {
			value: { base: "{colors.gray.200}", _dark: "{colors.gray.800}" },
		},
		ring: {
			value: { base: "{colors.blue.500}", _dark: "{colors.blue.400}" },
		},
		destructive: {
			value: { base: "{colors.red.500}", _dark: "{colors.red.400}" },
		},
	},
})

const borders = defineSemanticTokens.borders({
	base: { value: "1px solid {colors.stroke.border}" },
	input: { value: "1px solid {colors.stroke.input}" },
	primary: { value: "1px solid {colors.stroke}" },
	destructive: { value: "1px solid {colors.destructive}" },
})

export const textStyles = defineTextStyles({
	display1: {
		value: {
			fontWeight: "{fontWeights.bold}",
			fontSize: "4.5rem",
			lineHeight: "{lineHeights.loose}",
			letterSpacing: "{letterSpacings.tight}",
		},
	},
	display2: {
		value: {
			fontWeight: "{fontWeights.bold}",
			fontSize: "3.75rem",
			lineHeight: "{lineHeights.relaxed}",
			letterSpacing: "{letterSpacings.tight}",
		},
	},
	title1: {
		value: {
			fontWeight: "semibold",
			fontSize: "2.25rem",
			lineHeight: "{lineHeights.normal}",
			letterSpacing: "{letterSpacings.tight}",
		},
	},
	title2: {
		value: {
			fontWeight: "semibold",
			fontSize: "1.5rem",
			lineHeight: "{lineHeights.snug}",
			letterSpacing: "{letterSpacings.tight}",
		},
	},
	title3: {
		value: {
			fontWeight: "{fontWeights.bold}",
			fontSize: "1.25rem",
			lineHeight: "{lineHeights.snug}",
			letterSpacing: "{letterSpacings.tight}",
		},
	},
	heading1: {
		value: {
			fontWeight: "{fontWeights.semibold}",
			fontSize: "1.125rem",
			lineHeight: "{lineHeights.normal}",
			letterSpacing: "{letterSpacings.normal}",
		},
	},
	heading2: {
		value: {
			fontWeight: "{fontWeights.semibold}",
			fontSize: "1rem",
			lineHeight: "{lineHeights.normal}",
			letterSpacing: "{letterSpacings.normal}",
		},
	},
	body1: {
		value: {
			fontWeight: "{fontWeights.normal}",
			fontSize: "1rem",
			lineHeight: "{lineHeights.relaxed}",
			letterSpacing: "{letterSpacings.normal}",
		},
	},
	body2: {
		value: {
			fontWeight: "{fontWeights.normal}",
			fontSize: "0.875rem",
			lineHeight: "{lineHeights.normal}",
			letterSpacing: "{letterSpacings.normal}",
		},
	},
	label1: {
		value: {
			fontWeight: "{fontWeights.semibold}",
			fontSize: "0.875rem",
			lineHeight: "{lineHeights.snug}",
			letterSpacing: "{letterSpacings.wide}",
		},
	},
	label2: {
		value: {
			fontWeight: "{fontWeights.semibold}",
			fontSize: "0.75rem",
			lineHeight: "{lineHeights.snug}",
			letterSpacing: "{letterSpacings.wide}",
		},
	},
	caption1: {
		value: {
			fontWeight: "{fontWeights.semibold}",
			fontSize: "0.75rem",
			lineHeight: "{lineHeights.tight}",
			letterSpacing: "{letterSpacings.wide}",
		},
	},
	caption2: {
		value: {
			fontWeight: "{fontWeights.semibold}",
			fontSize: "0.625rem",
			lineHeight: "{lineHeights.tight}",
			letterSpacing: "{letterSpacings.wide}",
		},
	},
})

export const utilities = {
	extend: {
		fluidFontSize: {
			shorthand: "fluidFontSize",
			values: "fontSizes",
			transform(value: string) {
				if (!value.endsWith("rem")) {
					return value
				}
				try {
					const min = parseFloat(value) * 16
					const max = min + 0.5 * 16

					const [minRange, maxRange] = [360, 640]
					const slopePxPerVw = (100 * (max - min)) / (maxRange - minRange)
					const intercept = (min - slopePxPerVw * (minRange / 100)) / 16
					const calcPart = `calc(${intercept.toFixed(4)}rem + ${slopePxPerVw.toFixed(4)}vw)`

					return {
						fontSize: `clamp(${value}, ${calcPart}, ${max / 16}rem)`,
					}
				} catch (error) {
					console.error("[fluidFontSize] Error transforming value:", error, value)
					return {
						fontSize: value,
					}
				}
			},
		},
	},
}

export const defaultPreset = definePreset({
	name: "default",
	globalCss: {
		body: {
			background: "background",
			color: "foreground",
		},
	},
	theme: {
		extend: {
			textStyles,
			tokens: {
				radii,
			},
			semanticTokens: {
				colors: semanticColors,
				borders,
			},
		},
	},
})
