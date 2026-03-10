import type { CSSProperties } from "react"

type CSSKey = keyof CSSProperties

// ─── Single Controls ───

export interface NumberControl {
	type: "number"
	key: CSSKey
	label: string
}

export interface SelectControl {
	type: "select"
	key: CSSKey
	label: string
	options: readonly { value: string; label: string }[]
	defaultValue: string
	/** 기본값이면 style에서 undefined로 클리어 */
	clearOnDefault?: boolean
}

export interface ColorControl {
	type: "color"
	key: CSSKey
	label?: string
	defaultPickerColor?: string
}

export interface TextControl {
	type: "text"
	key: CSSKey
	label: string
}

export interface SliderControl {
	type: "slider"
	key: CSSKey
	label: string
	min: number
	max: number
	step: number
	defaultValue?: number
}

export type SingleControl = NumberControl | SelectControl | ColorControl | TextControl | SliderControl

// ─── Group Controls ───

/** shorthand ↔ longhand 토글 (padding, margin, borderRadius 등) */
export interface ShorthandControl {
	type: "shorthand"
	label: string
	shorthandKey: CSSKey
	parts: readonly {
		key: CSSKey
		label: string
	}[]
}

/** 여러 서브값을 하나의 CSS 속성으로 합성 (boxShadow 등) */
export interface CompositeControl {
	type: "composite"
	key: CSSKey
	label: string
	parts: readonly {
		type: "number" | "color"
		label: string
		role: string
	}[]
	compose: (values: Record<string, unknown>) => string
	decompose: (value: string) => Record<string, unknown>
}

export type GroupControl = ShorthandControl | CompositeControl

// ─── 전체 ───

export type StyleControl = SingleControl | GroupControl

// ─── 섹션 ───

export interface StyleSection {
	title: string
	condition?: {
		key: CSSKey
		value: string | readonly string[]
		target?: "self" | "parent"
	}
	controls: readonly StyleControl[]
}
