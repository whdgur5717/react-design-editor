import type { SceneNode } from "@design-editor/core"
import type { CSSProperties } from "react"

import { designTabSchema } from "../../schema/designTabSchema"
import type { StyleSection } from "../../schema/types"
import { NumberInput } from "../inputs/NumberInput"
import { StyleControlRenderer } from "./StyleControlRenderer"
import { useNodeProperty } from "./useNodeProperty"

function isSectionVisible(section: StyleSection, style: CSSProperties, parentStyle?: CSSProperties): boolean {
	if (!section.condition) return true

	const { key, value, target } = section.condition
	const targetStyle = target === "parent" ? parentStyle : style
	if (!targetStyle) return false

	const current = targetStyle[key]
	if (Array.isArray(value)) {
		return value.includes(String(current))
	}
	return String(current) === value
}

export function DesignTab({ node, parentStyle }: { node: SceneNode; parentStyle?: CSSProperties }) {
	const { updateStyle, updatePosition } = useNodeProperty(node.id)
	const style = node.style ?? {}

	return (
		<div className="design-tab" data-testid="design-tab">
			{/* Canvas Position — 스키마 밖에서 별도 처리 (node.x/y) */}
			<section className="property-section">
				<h3 className="section-title">Canvas Position</h3>
				<div className="property-grid">
					<label>
						<span>X</span>
						<NumberInput data-testid="prop-x" value={node.x} onChange={(v) => updatePosition({ x: v, y: node.y ?? 0 })} />
					</label>
					<label>
						<span>Y</span>
						<NumberInput data-testid="prop-y" value={node.y} onChange={(v) => updatePosition({ x: node.x ?? 0, y: v })} />
					</label>
				</div>
			</section>

			{/* 스키마 기반 렌더링 */}
			{designTabSchema.map((section) => {
				if (!isSectionVisible(section, style, parentStyle)) return null

				return (
					<section key={section.title} className="property-section">
						<h3 className="section-title">{section.title}</h3>
						<div className="property-grid">
							{section.controls.map((control) => (
								<StyleControlRenderer
									key={"shorthandKey" in control ? control.shorthandKey : control.key}
									control={control}
									style={style}
									onStyleChange={updateStyle}
								/>
							))}
						</div>
					</section>
				)
			})}
		</div>
	)
}
