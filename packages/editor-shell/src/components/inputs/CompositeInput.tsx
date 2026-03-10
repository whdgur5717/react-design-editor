import type { CSSProperties } from "react"
import { useMemo } from "react"

import type { CompositeControl } from "../../schema/types"
import { ColorInput } from "./ColorInput"
import { NumberInput } from "./NumberInput"

interface CompositeInputProps {
	control: CompositeControl
	value: string | undefined
	onStyleChange: (key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]) => void
	"data-testid"?: string
}

export function CompositeInput({ control, value, onStyleChange, "data-testid": testId }: CompositeInputProps) {
	const decomposed = useMemo(() => (value ? control.decompose(String(value)) : {}), [control, value])

	const handlePartChange = (role: string, partValue: unknown) => {
		const updated = { ...decomposed, [role]: partValue }
		for (const part of control.parts) {
			if (updated[part.role] === undefined) {
				updated[part.role] = part.type === "color" ? "#000000" : 0
			}
		}
		onStyleChange(control.key, control.compose(updated))
	}

	return (
		<div className="composite-input" data-testid={testId}>
			<div className="property-grid">
				{control.parts.map((part) => (
					<label key={part.role}>
						<span>{part.label}</span>
						{part.type === "number" ? (
							<NumberInput
								value={decomposed[part.role] as number | undefined}
								onChange={(v) => handlePartChange(part.role, v)}
							/>
						) : (
							<ColorInput
								value={decomposed[part.role] as string | undefined}
								onChange={(v) => handlePartChange(part.role, v)}
							/>
						)}
					</label>
				))}
			</div>
		</div>
	)
}
