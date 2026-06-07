interface ColorInputProps {
	value: string | undefined
	onChange: (value: string) => void
	defaultPickerColor?: string
	placeholder?: string
	"data-testid"?: string
}

export function ColorInput({
	value,
	onChange,
	defaultPickerColor = "#000000",
	placeholder,
	"data-testid": testId,
}: ColorInputProps) {
	return (
		<div className="color-input-row">
			<input type="color" value={value ?? defaultPickerColor} onChange={(e) => onChange(e.target.value)} />
			<input
				type="text"
				value={value ?? ""}
				placeholder={placeholder ?? defaultPickerColor}
				onChange={(e) => onChange(e.target.value)}
				data-testid={testId}
			/>
		</div>
	)
}
