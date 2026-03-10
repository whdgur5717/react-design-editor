import type { CSSProperties } from "react"

import type { StyleControl } from "../../schema/types"
import { ColorInput } from "../inputs/ColorInput"
import { CompositeInput } from "../inputs/CompositeInput"
import { NumberInput } from "../inputs/NumberInput"
import { SelectInput } from "../inputs/SelectInput"
import { ShorthandInput } from "../inputs/ShorthandInput"
import { SliderInput } from "../inputs/SliderInput"
import { TextInput } from "../inputs/TextInput"

interface StyleControlRendererProps {
	control: StyleControl
	style: CSSProperties
	onStyleChange: (key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]) => void
}

/** style[key]는 CSSProperties의 broad union을 반환하므로, 각 input에 맞는 타입으로 좁힌다 */
function styleVal<T>(style: CSSProperties, key: keyof CSSProperties): T {
	return style[key] as T
}

export function StyleControlRenderer({ control, style, onStyleChange }: StyleControlRendererProps) {
	const testId = `style-${"shorthandKey" in control ? control.shorthandKey : control.key}`

	switch (control.type) {
		case "number":
			return (
				<label>
					<span>{control.label}</span>
					<NumberInput
						data-testid={testId}
						value={styleVal(style, control.key)}
						onChange={(v) => onStyleChange(control.key, v)}
					/>
				</label>
			)

		case "select":
			return (
				<label>
					<span>{control.label}</span>
					<SelectInput
						data-testid={testId}
						value={styleVal(style, control.key)}
						defaultValue={control.defaultValue}
						onChange={(v) => {
							const value = control.clearOnDefault && v === control.defaultValue ? undefined : v
							onStyleChange(control.key, value)
						}}
						options={control.options}
					/>
				</label>
			)

		case "color":
			return (
				<ColorInput
					data-testid={testId}
					value={styleVal(style, control.key)}
					onChange={(v) => onStyleChange(control.key, v)}
					defaultPickerColor={control.defaultPickerColor}
				/>
			)

		case "text":
			return (
				<label>
					<span>{control.label}</span>
					<TextInput
						data-testid={testId}
						value={String(style[control.key] ?? "")}
						onChange={(v) => onStyleChange(control.key, v || undefined)}
					/>
				</label>
			)

		case "slider":
			return (
				<label>
					<span>{control.label}</span>
					<SliderInput
						data-testid={testId}
						value={styleVal(style, control.key)}
						onChange={(v) => onStyleChange(control.key, v)}
						min={control.min}
						max={control.max}
						step={control.step}
						defaultValue={control.defaultValue}
					/>
				</label>
			)

		case "shorthand":
			return (
				<ShorthandInput
					data-testid={testId}
					label={control.label}
					shorthandKey={control.shorthandKey}
					parts={control.parts}
					style={style}
					onStyleChange={onStyleChange}
				/>
			)

		case "composite":
			return (
				<CompositeInput
					data-testid={testId}
					control={control}
					value={styleVal(style, control.key)}
					onStyleChange={onStyleChange}
				/>
			)
	}
}
