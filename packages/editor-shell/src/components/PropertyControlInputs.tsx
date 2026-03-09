import type { PropertyControls } from "@design-editor/core"

import { CheckboxInput } from "./inputs/CheckboxInput"
import { NumberInput } from "./inputs/NumberInput"
import { SelectInput } from "./inputs/SelectInput"
import { TextInput } from "./inputs/TextInput"

interface PropertyControlInputsProps {
	controls: PropertyControls
	values: Record<string, unknown>
	onChange: (key: string, value: unknown) => void
}

export function PropertyControlInputs({ controls, values, onChange }: PropertyControlInputsProps) {
	return (
		<div className="property-controls">
			{Object.entries(controls).map(([key, control]) => {
				const value = values[key] ?? control.defaultValue

				switch (control.type) {
					case "string":
						return (
							<label key={key} className="property-row">
								<span>{control.title ?? key}</span>
								<TextInput value={String(value ?? "")} onChange={(v) => onChange(key, v)} />
							</label>
						)
					case "number":
						return (
							<label key={key} className="property-row">
								<span>{control.title ?? key}</span>
								<NumberInput value={Number(value ?? 0)} onChange={(v) => onChange(key, v)} />
							</label>
						)
					case "boolean":
						return (
							<label key={key} className="property-row">
								<span>{control.title ?? key}</span>
								<CheckboxInput checked={Boolean(value)} onChange={(v) => onChange(key, v)} />
							</label>
						)
					case "color":
						return (
							<label key={key} className="property-row">
								<span>{control.title ?? key}</span>
								<input type="color" value={String(value ?? "#000000")} onChange={(e) => onChange(key, e.target.value)} />
							</label>
						)
					case "enum":
						return (
							<label key={key} className="property-row">
								<span>{control.title ?? key}</span>
								<SelectInput
									value={String(value ?? "")}
									onChange={(v) => onChange(key, v)}
									options={(control.options ?? []).map((opt) => ({ value: opt, label: opt }))}
								/>
							</label>
						)
				}
			})}
		</div>
	)
}
