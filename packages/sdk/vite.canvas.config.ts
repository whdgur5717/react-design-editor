import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const packageRoot = dirname(fileURLToPath(import.meta.url))
const canvasRoot = resolve(packageRoot, "src/EditorCanvas")

export default defineConfig({
	root: canvasRoot,
	base: "./",
	plugins: [react()],
	build: {
		outDir: resolve(packageRoot, "dist"),
		emptyOutDir: false,
		rollupOptions: {
			input: resolve(canvasRoot, "canvas.html"),
			output: {
				entryFileNames: "canvas.js",
				chunkFileNames: "chunks/canvas-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]",
			},
		},
	},
})
