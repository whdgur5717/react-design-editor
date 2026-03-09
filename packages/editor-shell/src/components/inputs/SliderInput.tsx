import type { ComponentProps } from "react"

interface SliderInputProps extends Omit<ComponentProps<"input">, "onChange" | "value" | "type"> {
	value: number | undefined
	onChange: (value: number) => void
	min: number
	max: number
	step: number
	defaultValue?: number
}

export function SliderInput({ value, onChange, min, max, step, defaultValue, ...rest }: SliderInputProps) {
	const current = value ?? defaultValue ?? min

	return (
		<div className="slider-input-row">
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={current}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
			<input
				type="number"
				min={min}
				max={max}
				step={step}
				value={current}
				onChange={(e) => onChange(e.target.value === "" ? min : Number(e.target.value))}
				{...rest}
			/>
		</div>
	)
}
