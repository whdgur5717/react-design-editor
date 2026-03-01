import type { CodeComponentDefinition, SceneNode } from "@design-editor/core"

import { useEditorStore } from "../../services/EditorContext"
import { PropertyControlInputs } from "../PropertyControlInputs"

export function CodeComponentPropsTab({
	node,
	codeComponent,
}: {
	node: SceneNode & { type: "instance" }
	codeComponent: CodeComponentDefinition
}) {
	const setInstancePropValues = useEditorStore((state) => state.setInstancePropValues)

	const controls = codeComponent.propertyControls
	const values = node.propValues ?? {}

	const handleChange = (key: string, value: unknown) => {
		setInstancePropValues(node.id, { ...values, [key]: value })
	}

	if (Object.keys(controls).length === 0) {
		return (
			<div className="design-tab">
				<div className="empty-state">No property controls defined</div>
			</div>
		)
	}

	return (
		<div className="design-tab">
			<section className="property-section">
				<h3 className="section-title">Component Props</h3>
				<PropertyControlInputs controls={controls} values={values} onChange={handleChange} />
			</section>
		</div>
	)
}
