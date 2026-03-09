import type { ComponentProps } from "react"
import { useEffect, useState } from "react"

interface NumberInputProps extends Omit<ComponentProps<"input">, "onChange" | "value" | "type"> {
	value: number | string | undefined
	onChange: (value: number) => void
}

export function NumberInput({ value, onChange, ...rest }: NumberInputProps) {
	const [localValue, setLocalValue] = useState(String(value ?? ""))
	const [focused, setFocused] = useState(false)

	useEffect(() => {
		if (!focused) {
			setLocalValue(String(value ?? ""))
		}
	}, [value, focused])

	const commit = (raw: string) => {
		const num = Number(raw)
		if (raw === "" || Number.isNaN(num)) {
			setLocalValue(String(value ?? ""))
			return
		}
		onChange(num)
	}

	return (
		<input
			type="text"
			inputMode="numeric"
			value={focused ? localValue : String(value ?? "")}
			onChange={(e) => setLocalValue(e.target.value)}
			onFocus={() => setFocused(true)}
			onBlur={(e) => {
				setFocused(false)
				commit(e.target.value)
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					commit(localValue)
					e.currentTarget.blur()
				}
				if (e.key === "Escape") {
					setLocalValue(String(value ?? ""))
					e.currentTarget.blur()
				}
				if (e.key === "ArrowUp" || e.key === "ArrowDown") {
					e.preventDefault()
					const step = e.shiftKey ? 10 : 1
					const cur = Number(localValue) || Number(value) || 0
					const next = cur + (e.key === "ArrowUp" ? step : -step)
					setLocalValue(String(next))
					onChange(next)
				}
			}}
			{...rest}
		/>
	)
}
