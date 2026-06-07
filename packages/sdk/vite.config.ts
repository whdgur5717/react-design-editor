import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
	plugins: [react()],
	build: {
		lib: {
			entry: {
				createEditor: "src/createEditor/index.tsx",
				EditorProvider: "src/EditorProvider/index.tsx",
				EditorRoot: "src/EditorRoot/index.tsx",
				EditorCanvas: "src/EditorCanvas/index.tsx",
				Toolbar: "src/Toolbar/index.tsx",
				LayersPanel: "src/LayersPanel/index.tsx",
				PropertiesPanel: "src/PropertiesPanel/index.tsx",
				useEditor: "src/useEditor/index.tsx",
			},
			formats: ["es"],
		},
		rollupOptions: {
			external: ["react", "react-dom", "react-dom/client"],
		},
	},
})
