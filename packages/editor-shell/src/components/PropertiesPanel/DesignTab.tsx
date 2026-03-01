import type { SceneNode } from "@design-editor/core"

import { useEditorStore } from "../../services/EditorContext"

export function DesignTab({ node }: { node: SceneNode }) {
	const updateNode = useEditorStore((state) => state.updateNode)
	const moveNode = useEditorStore((state) => state.moveNode)
	const style = node.style ?? {}

	const handleStyleChange = (key: string, value: string | number | undefined) => {
		updateNode(node.id, {
			style: { ...style, [key]: value },
		})
	}

	return (
		<div className="design-tab" data-testid="design-tab">
			{/* Position */}
			<section className="property-section">
				<h3 className="section-title">Canvas Position</h3>
				<div className="property-grid">
					<label>
						<span>X</span>
						<input
							data-testid="prop-x"
							type="number"
							value={node.x ?? 0}
							onChange={(e) => moveNode(node.id, { x: Number(e.target.value), y: node.y ?? 0 })}
						/>
					</label>
					<label>
						<span>Y</span>
						<input
							data-testid="prop-y"
							type="number"
							value={node.y ?? 0}
							onChange={(e) => moveNode(node.id, { x: node.x ?? 0, y: Number(e.target.value) })}
						/>
					</label>
				</div>
			</section>

			{/* Size */}
			<section className="property-section">
				<h3 className="section-title">Size</h3>
				<div className="property-grid">
					<label>
						<span>W</span>
						<input
							data-testid="prop-w"
							type="number"
							value={style.width ?? ""}
							onChange={(e) => handleStyleChange("width", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
					<label>
						<span>H</span>
						<input
							data-testid="prop-h"
							type="number"
							value={style.height ?? ""}
							onChange={(e) => handleStyleChange("height", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
				</div>
			</section>

			{/* Layout */}
			<section className="property-section">
				<h3 className="section-title">Layout</h3>
				<div className="property-row">
					<select value={style.display ?? "block"} onChange={(e) => handleStyleChange("display", e.target.value)}>
						<option value="block">Block</option>
						<option value="flex">Flex</option>
						<option value="grid">Grid</option>
						<option value="inline">Inline</option>
						<option value="none">None</option>
					</select>
				</div>
				{style.display === "flex" && (
					<>
						<div className="property-grid" style={{ marginTop: 8 }}>
							<label>
								<span>Dir</span>
								<select
									value={style.flexDirection ?? "row"}
									onChange={(e) => handleStyleChange("flexDirection", e.target.value)}
								>
									<option value="row">Row</option>
									<option value="column">Column</option>
									<option value="row-reverse">Row Rev</option>
									<option value="column-reverse">Col Rev</option>
								</select>
							</label>
							<label>
								<span>Gap</span>
								<input
									type="number"
									value={style.gap ?? 0}
									onChange={(e) => handleStyleChange("gap", Number(e.target.value))}
								/>
							</label>
						</div>
						<div className="property-grid" style={{ marginTop: 8 }}>
							<label>
								<span>Align</span>
								<select value={style.alignItems ?? "stretch"} onChange={(e) => handleStyleChange("alignItems", e.target.value)}>
									<option value="stretch">Stretch</option>
									<option value="flex-start">Start</option>
									<option value="center">Center</option>
									<option value="flex-end">End</option>
								</select>
							</label>
							<label>
								<span>Justify</span>
								<select
									value={style.justifyContent ?? "flex-start"}
									onChange={(e) => handleStyleChange("justifyContent", e.target.value)}
								>
									<option value="flex-start">Start</option>
									<option value="center">Center</option>
									<option value="flex-end">End</option>
									<option value="space-between">Between</option>
									<option value="space-around">Around</option>
								</select>
							</label>
						</div>
					</>
				)}
			</section>

			{/* CSS Position */}
			<section className="property-section">
				<h3 className="section-title">CSS Position</h3>
				<div className="property-row">
					<select
						value={style.position ?? "static"}
						onChange={(e) => handleStyleChange("position", e.target.value === "static" ? undefined : e.target.value)}
					>
						<option value="static">Static</option>
						<option value="relative">Relative</option>
						<option value="absolute">Absolute</option>
						<option value="fixed">Fixed</option>
						<option value="sticky">Sticky</option>
					</select>
				</div>
				{style.position && style.position !== "static" && style.position !== "relative" && (
					<div className="property-grid" style={{ marginTop: 8 }}>
						<label>
							<span>Top</span>
							<input
								type="number"
								value={style.top ?? ""}
								onChange={(e) => handleStyleChange("top", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
						<label>
							<span>Left</span>
							<input
								type="number"
								value={style.left ?? ""}
								onChange={(e) => handleStyleChange("left", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
						<label>
							<span>Bottom</span>
							<input
								type="number"
								value={style.bottom ?? ""}
								onChange={(e) => handleStyleChange("bottom", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
						<label>
							<span>Right</span>
							<input
								type="number"
								value={style.right ?? ""}
								onChange={(e) => handleStyleChange("right", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
					</div>
				)}
			</section>

			{/* Overflow */}
			<section className="property-section">
				<h3 className="section-title">Overflow</h3>
				<div className="property-row">
					<select
						value={style.overflow ?? "visible"}
						onChange={(e) => handleStyleChange("overflow", e.target.value === "visible" ? undefined : e.target.value)}
					>
						<option value="visible">Visible</option>
						<option value="hidden">Hidden</option>
						<option value="scroll">Scroll</option>
						<option value="auto">Auto</option>
						<option value="clip">Clip</option>
					</select>
				</div>
			</section>

			{/* Spacing */}
			<section className="property-section">
				<h3 className="section-title">Spacing</h3>
				<div className="property-grid">
					<label>
						<span>P</span>
						<input
							type="number"
							placeholder="Padding"
							value={style.padding ?? ""}
							onChange={(e) => handleStyleChange("padding", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
					<label>
						<span>M</span>
						<input
							type="number"
							placeholder="Margin"
							value={style.margin ?? ""}
							onChange={(e) => handleStyleChange("margin", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
				</div>
			</section>

			{/* Fill */}
			<section className="property-section">
				<h3 className="section-title">Fill</h3>
				<div className="property-row">
					<input
						type="color"
						value={style.backgroundColor ?? "#ffffff"}
						onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
					/>
					<input
						data-testid="prop-fill"
						type="text"
						value={style.backgroundColor ?? ""}
						placeholder="#ffffff"
						onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
					/>
				</div>
			</section>

			{/* Border */}
			<section className="property-section">
				<h3 className="section-title">Border</h3>
				<div className="property-grid">
					<label>
						<span>Width</span>
						<input
							type="number"
							value={style.borderWidth ?? ""}
							onChange={(e) => handleStyleChange("borderWidth", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
					<label>
						<span>Radius</span>
						<input
							type="number"
							value={style.borderRadius ?? ""}
							onChange={(e) => handleStyleChange("borderRadius", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
				</div>
				<div className="property-row" style={{ marginTop: 8 }}>
					<input
						type="color"
						value={style.borderColor ?? "#000000"}
						onChange={(e) => handleStyleChange("borderColor", e.target.value)}
					/>
					<select value={style.borderStyle ?? "solid"} onChange={(e) => handleStyleChange("borderStyle", e.target.value)}>
						<option value="none">None</option>
						<option value="solid">Solid</option>
						<option value="dashed">Dashed</option>
						<option value="dotted">Dotted</option>
					</select>
				</div>
			</section>

			{/* Typography */}
			<section className="property-section">
				<h3 className="section-title">Typography</h3>
				<div className="property-grid">
					<label>
						<span>Size</span>
						<input
							type="number"
							value={style.fontSize ?? ""}
							onChange={(e) => handleStyleChange("fontSize", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
					<label>
						<span>Weight</span>
						<select value={style.fontWeight ?? "normal"} onChange={(e) => handleStyleChange("fontWeight", e.target.value)}>
							<option value="normal">Normal</option>
							<option value="500">Medium</option>
							<option value="600">Semibold</option>
							<option value="bold">Bold</option>
						</select>
					</label>
				</div>
				<div className="property-row" style={{ marginTop: 8 }}>
					<input
						type="color"
						value={style.color ?? "#000000"}
						onChange={(e) => handleStyleChange("color", e.target.value)}
					/>
					<input
						type="text"
						value={style.color ?? ""}
						placeholder="#000000"
						onChange={(e) => handleStyleChange("color", e.target.value)}
					/>
				</div>
				<div className="property-row" style={{ marginTop: 8 }}>
					<select
						value={style.textAlign ?? "left"}
						onChange={(e) => handleStyleChange("textAlign", e.target.value)}
						style={{ flex: 1 }}
					>
						<option value="left">Left</option>
						<option value="center">Center</option>
						<option value="right">Right</option>
					</select>
				</div>
			</section>
		</div>
	)
}
