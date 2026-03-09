import type { ComponentProps } from "react"

interface CheckboxInputProps extends Omit<ComponentProps<"input">, "onChange" | "checked" | "type"> {
	checked: boolean
	onChange: (checked: boolean) => void
}

export function CheckboxInput({ checked, onChange, ...rest }: CheckboxInputProps) {
	return <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} {...rest} />
}
