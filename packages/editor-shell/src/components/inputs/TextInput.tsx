import type { ComponentProps } from "react"

interface TextInputProps extends Omit<ComponentProps<"input">, "onChange" | "value" | "type"> {
	value: string
	onChange: (value: string) => void
}

export function TextInput({ value, onChange, ...rest }: TextInputProps) {
	return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
}
