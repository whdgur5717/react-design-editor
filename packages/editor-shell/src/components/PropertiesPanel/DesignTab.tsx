import { useState } from "react"
import type { SceneNode } from "@design-editor/core"

import { useEditorStore } from "../../services/EditorContext"

/**
 * TODO (#65): 개별 방향 spacing 값이 존재하는지 확인하여 확장 모드 초기 상태를 결정
 * paddingTop/Right/Bottom/Left 중 하나라도 설정되어 있으면 true 반환
 */
function hasPerSideValues(
	style: Record<string, unknown>,
	prefix: "padding" | "margin",
): boolean {
	return (
		style[`${prefix}Top`] !== undefined ||
		style[`${prefix}Right`] !== undefined ||
		style[`${prefix}Bottom`] !== undefined ||
		style[`${prefix}Left`] !== undefined
	)
}

export function DesignTab({ node }: { node: SceneNode }) {
	const updateNode = useEditorStore((state) => state.updateNode)
	const moveNode = useEditorStore((state) => state.moveNode)
	const style = node.style ?? {}

	// TODO (#65): 개별 방향 모드 토글 상태
	const [paddingExpanded, setPaddingExpanded] = useState(() => hasPerSideValues(style, "padding"))
	const [marginExpanded, setMarginExpanded] = useState(() => hasPerSideValues(style, "margin"))

	const handleStyleChange = (key: string, value: string | number | undefined) => {
		updateNode(node.id, {
			style: { ...style, [key]: value },
		})
	}

	/**
	 * TODO (#65): 단일 값 ↔ 개별 값 전환 핸들러
	 * - 단일 → 개별: shorthand 값을 4방향에 복사 후 shorthand 제거
	 * - 개별 → 단일: 4방향 값 제거 (shorthand는 사용자가 직접 입력)
	 */
	const handleTogglePerSide = (prefix: "padding" | "margin") => {
		const isExpanding = prefix === "padding" ? !paddingExpanded : !marginExpanded
		const currentShorthand = style[prefix]

		if (isExpanding) {
			// TODO (#65): 단일 값을 4방향으로 확장
			// shorthand 값이 있으면 4방향 모두에 동일한 값을 설정하고 shorthand 제거
			const newStyle = { ...style }
			if (currentShorthand !== undefined) {
				newStyle[`${prefix}Top`] = currentShorthand
				newStyle[`${prefix}Right`] = currentShorthand
				newStyle[`${prefix}Bottom`] = currentShorthand
				newStyle[`${prefix}Left`] = currentShorthand
			}
			delete newStyle[prefix]
			updateNode(node.id, { style: newStyle })
		} else {
			// TODO (#65): 개별 값을 단일 값으로 축소
			// 4방향 값을 모두 제거 (사용자가 shorthand를 직접 입력)
			const newStyle = { ...style }
			delete newStyle[`${prefix}Top`]
			delete newStyle[`${prefix}Right`]
			delete newStyle[`${prefix}Bottom`]
			delete newStyle[`${prefix}Left`]
			updateNode(node.id, { style: newStyle })
		}

		if (prefix === "padding") setPaddingExpanded(!paddingExpanded)
		else setMarginExpanded(!marginExpanded)
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

			{/* Spacing - Padding */}
			<section className="property-section">
				<div className="section-title-row">
					<h3 className="section-title">Padding</h3>
					{/* TODO (#65): 단일/개별 전환 토글 버튼 */}
					<button
						className="spacing-toggle-btn"
						title={paddingExpanded ? "단일 값으로 전환" : "개별 방향 설정"}
						onClick={() => handleTogglePerSide("padding")}
					>
						{paddingExpanded ? "▪" : "⊞"}
					</button>
				</div>
				{paddingExpanded ? (
					/* TODO (#65): 4방향 개별 입력 UI */
					<div className="spacing-per-side">
						<label>
							<span>T</span>
							<input
								type="number"
								placeholder="Top"
								value={style.paddingTop ?? ""}
								onChange={(e) => handleStyleChange("paddingTop", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
						<label>
							<span>R</span>
							<input
								type="number"
								placeholder="Right"
								value={style.paddingRight ?? ""}
								onChange={(e) => handleStyleChange("paddingRight", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
						<label>
							<span>B</span>
							<input
								type="number"
								placeholder="Bottom"
								value={style.paddingBottom ?? ""}
								onChange={(e) => handleStyleChange("paddingBottom", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
						<label>
							<span>L</span>
							<input
								type="number"
								placeholder="Left"
								value={style.paddingLeft ?? ""}
								onChange={(e) => handleStyleChange("paddingLeft", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
					</div>
				) : (
					/* 기존 단일 입력 */
					<div className="property-row">
						<label>
							<span>P</span>
							<input
								type="number"
								placeholder="Padding"
								value={style.padding ?? ""}
								onChange={(e) => handleStyleChange("padding", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
					</div>
				)}
			</section>

			{/* Spacing - Margin */}
			<section className="property-section">
				<div className="section-title-row">
					<h3 className="section-title">Margin</h3>
					{/* TODO (#65): 단일/개별 전환 토글 버튼 */}
					<button
						className="spacing-toggle-btn"
						title={marginExpanded ? "단일 값으로 전환" : "개별 방향 설정"}
						onClick={() => handleTogglePerSide("margin")}
					>
						{marginExpanded ? "▪" : "⊞"}
					</button>
				</div>
				{marginExpanded ? (
					/* TODO (#65): 4방향 개별 입력 UI */
					<div className="spacing-per-side">
						<label>
							<span>T</span>
							<input
								type="number"
								placeholder="Top"
								value={style.marginTop ?? ""}
								onChange={(e) => handleStyleChange("marginTop", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
						<label>
							<span>R</span>
							<input
								type="number"
								placeholder="Right"
								value={style.marginRight ?? ""}
								onChange={(e) => handleStyleChange("marginRight", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
						<label>
							<span>B</span>
							<input
								type="number"
								placeholder="Bottom"
								value={style.marginBottom ?? ""}
								onChange={(e) => handleStyleChange("marginBottom", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
						<label>
							<span>L</span>
							<input
								type="number"
								placeholder="Left"
								value={style.marginLeft ?? ""}
								onChange={(e) => handleStyleChange("marginLeft", e.target.value ? Number(e.target.value) : undefined)}
							/>
						</label>
					</div>
				) : (
					/* 기존 단일 입력 */
					<div className="property-row">
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
				)}
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
