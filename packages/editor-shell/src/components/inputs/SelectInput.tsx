import type { ComponentProps } from "react"

export interface SelectOption {
	value: string
	label: string
}

interface SelectInputProps extends Omit<ComponentProps<"select">, "onChange" | "value" | "defaultValue"> {
	value: string | number | undefined
	defaultValue?: string
	onChange: (value: string) => void
	options: readonly SelectOption[]
}

export function SelectInput({ value, defaultValue = "", onChange, options, ...rest }: SelectInputProps) {
	return (
		<select value={String(value ?? defaultValue)} onChange={(e) => onChange(e.target.value)} {...rest}>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	)
}
