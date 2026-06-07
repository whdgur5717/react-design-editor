export const defaultCanvasStyles = `
:host {
	display: block;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: transparent;
	color: inherit;
	font: inherit;
}

*,
*::before,
*::after {
	box-sizing: border-box;
}

[data-design-editor-canvas-mount] {
	display: block;
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
}

.de-canvas-surface {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: transparent;
	pointer-events: none;
	overscroll-behavior: none;
}

.de-canvas-stage {
	position: absolute;
	top: 0;
	left: 0;
	width: 0;
	height: 0;
	transform-origin: 0 0;
	will-change: transform;
	isolation: isolate;
}

.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	color: #666;
	font-size: 14px;
}

.ProseMirror {
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	border: none;
	outline: none;
	background: transparent;
}

.ProseMirror:focus {
	outline: none;
}

.ProseMirror p {
	margin: 0;
}
`
