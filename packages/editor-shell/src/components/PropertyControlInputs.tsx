import type { PropertyControls } from "@design-editor/core"

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
								<input type="text" value={String(value ?? "")} onChange={(e) => onChange(key, e.target.value)} />
							</label>
						)
					case "number":
						return (
							<label key={key} className="property-row">
								<span>{control.title ?? key}</span>
								<input type="number" value={Number(value ?? 0)} onChange={(e) => onChange(key, Number(e.target.value))} />
							</label>
						)
					case "boolean":
						return (
							<label key={key} className="property-row">
								<span>{control.title ?? key}</span>
								<input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(key, e.target.checked)} />
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
								<select value={String(value ?? "")} onChange={(e) => onChange(key, e.target.value)}>
									{(control.options ?? []).map((opt) => (
										<option key={opt} value={opt}>
											{opt}
										</option>
									))}
								</select>
							</label>
						)
				}
			})}
		</div>
	)
}
