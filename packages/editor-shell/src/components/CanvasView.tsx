import { CanvasInteractionSurface } from "./CanvasInteractionSurface"
import { LayersPanel } from "./LayersPanel"
import { PropertiesPanel } from "./PropertiesPanel"
import { Toolbar } from "./Toolbar"

export function CanvasView() {
	return (
		<div className="app">
			<Toolbar />
			<LayersPanel />
			<div className="canvas-host">
				<CanvasInteractionSurface />
			</div>
			<PropertiesPanel />
		</div>
	)
}
