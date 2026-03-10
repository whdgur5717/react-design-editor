import type { CSSProperties } from "react"
import { useState } from "react"

import { NumberInput } from "./NumberInput"

interface ShorthandInputProps {
	label: string
	shorthandKey: keyof CSSProperties
	parts: readonly { key: keyof CSSProperties; label: string }[]
	style: CSSProperties
	onStyleChange: (key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]) => void
	"data-testid"?: string
}

export function ShorthandInput({
	label,
	shorthandKey,
	parts,
	style,
	onStyleChange,
	"data-testid": testId,
}: ShorthandInputProps) {
	const hasPerSideValues = parts.some((p) => style[p.key] !== undefined)
	const [expanded, setExpanded] = useState(hasPerSideValues)

	const clearParts = () => {
		for (const part of parts) {
			onStyleChange(part.key, undefined)
		}
	}

	const handleShorthandChange = (value: number) => {
		clearParts()
		onStyleChange(shorthandKey, value)
	}

	const handlePartChange = (key: keyof CSSProperties, value: number) => {
		if (style[shorthandKey] !== undefined) {
			const shorthandValue = style[shorthandKey]
			for (const part of parts) {
				if (part.key !== key && style[part.key] === undefined) {
					onStyleChange(part.key, shorthandValue)
				}
			}
			onStyleChange(shorthandKey, undefined)
		}
		onStyleChange(key, value)
	}

	const handleToggle = () => {
		if (expanded) {
			const firstValue = parts.reduce<CSSProperties[keyof CSSProperties]>((found, p) => found ?? style[p.key], undefined)
			clearParts()
			onStyleChange(shorthandKey, firstValue ?? 0)
		}
		setExpanded(!expanded)
	}

	return (
		<div className="shorthand-input" data-testid={testId}>
			{!expanded ? (
				<div className="property-grid">
					<label>
						<span>{label}</span>
						<NumberInput value={style[shorthandKey]} onChange={handleShorthandChange} />
					</label>
					<button type="button" className="toggle-btn" onClick={handleToggle} title="Per-side editing">
						⊞
					</button>
				</div>
			) : (
				<>
					<div className="shorthand-header">
						<span>{label}</span>
						<button type="button" className="toggle-btn" onClick={handleToggle} title="Single value">
							⊟
						</button>
					</div>
					<div className="property-grid">
						{parts.map((part) => (
							<label key={part.key}>
								<span>{part.label}</span>
								<NumberInput value={style[part.key]} onChange={(v) => handlePartChange(part.key, v)} />
							</label>
						))}
					</div>
				</>
			)}
		</div>
	)
}
