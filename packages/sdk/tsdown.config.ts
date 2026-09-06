import { defineConfig } from "tsdown"

export default defineConfig({
	entry: {
		index: "src/index.ts",
		createEditor: "src/createEditor/index.tsx",
		EditorProvider: "src/EditorProvider/index.tsx",
		EditorRoot: "src/EditorRoot/index.tsx",
		EditorCanvas: "src/EditorCanvas/index.tsx",
		Toolbar: "src/Toolbar/index.tsx",
		LayersPanel: "src/LayersPanel/index.tsx",
		PropertiesPanel: "src/PropertiesPanel/index.tsx",
		useEditor: "src/useEditor/index.tsx",
		styles: "src/styles/index.css",
	},
	format: ["esm"],
	dts: true,
	clean: true,
	target: "es2022",
	platform: "browser",
	deps: {
		neverBundle: [/^@design-editor\//],
	},
	outExtensions: () => ({ js: ".js" }),
})
