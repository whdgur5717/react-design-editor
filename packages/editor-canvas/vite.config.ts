import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const CDN = "https://esm.sh"
const REACT_VERSION = "18.3.1"
const USE_SYNC_VERSION = "1.6.0"

const externalMap: Record<string, string> = {
	react: `${CDN}/react@${REACT_VERSION}`,
	"react-dom": `${CDN}/react-dom@${REACT_VERSION}?external=react`,
	"react/jsx-runtime": `${CDN}/react@${REACT_VERSION}/jsx-runtime`,
	"react/jsx-dev-runtime": `${CDN}/react@${REACT_VERSION}/jsx-dev-runtime`,
	"react-dom/client": `${CDN}/react-dom@${REACT_VERSION}/client?external=react`,
}

const externalFilter = /^(react(-dom)?(\/.*)?|use-sync-external-store(\/.*)?)$/

export default defineConfig({
	plugins: [
		react(),
		{
			name: "externalize-react",
			enforce: "pre",
			resolveId(source) {
				if (source === "use-sync-external-store" || source.startsWith("use-sync-external-store/")) {
					const suffix = source.slice("use-sync-external-store".length)
					return {
						id: `${CDN}/use-sync-external-store@${USE_SYNC_VERSION}${suffix}?external=react`,
						external: true,
					}
				}
				if (externalMap[source]) {
					return { id: externalMap[source], external: true }
				}
			},
		},
	],
	server: {
		port: 3001,
	},
	build: {
		outDir: "dist",
		rollupOptions: {
			external: Object.values(externalMap),
		},
	},
	optimizeDeps: {
		esbuildOptions: {
			plugins: [
				{
					name: "externalize-react-optimizer",
					setup(build) {
						build.onResolve({ filter: /^use-sync-external-store/ }, (args) => {
							if (args.kind === "entry-point") {
								return { path: args.path, namespace: "react-stub" }
							}
							const suffix = args.path.slice("use-sync-external-store".length)
							return {
								path: `${CDN}/use-sync-external-store@${USE_SYNC_VERSION}${suffix}?external=react`,
								external: true,
							}
						})
						build.onResolve({ filter: externalFilter }, (args) => {
							if (args.kind === "entry-point") {
								return { path: args.path, namespace: "react-stub" }
							}
							return { external: true }
						})
						build.onLoad({ filter: /.*/, namespace: "react-stub" }, () => ({
							contents: "export default {}",
							loader: "js",
						}))
					},
				},
			],
		},
	},
})
