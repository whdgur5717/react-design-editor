import type { PropertyControls } from "@design-editor/core"
import * as esbuild from "esbuild-wasm"

let initPromise: Promise<void> | null = null

function ensureInitialized() {
	if (!initPromise) {
		initPromise = esbuild.initialize({
			worker: true,
			wasmURL: "https://esm.sh/esbuild-wasm@0.24.2/esbuild.wasm",
		})
	}
	return initPromise
}

/**
 * TSX 소스 코드를 브라우저에서 실행 가능한 ESM으로 컴파일
 */
export async function compileCode(source: string): Promise<{
	compiledCode: string | null
	error: string | null
}> {
	await ensureInitialized()

	try {
		const result = await esbuild.build({
			stdin: {
				contents: source,
				loader: "tsx",
				resolveDir: ".",
			},
			bundle: true,
			format: "esm",
			jsx: "automatic",
			write: false,
			plugins: [
				{
					name: "externalize-and-validate",
					setup(build) {
						// React 계열은 external 처리 (import map이 런타임에 resolve)
						build.onResolve({ filter: /^react(-dom)?($|\/)/ }, (args) => ({
							path: args.path,
							external: true,
						}))
						// 상대 경로가 아닌 알 수 없는 패키지는 에러
						build.onResolve({ filter: /^[^./]/ }, (args) => ({
							errors: [{ text: `"${args.path}" 패키지는 사용할 수 없습니다` }],
						}))
					},
				},
			],
		})
		const compiledCode = result.outputFiles[0]?.text ?? null
		return { compiledCode, error: null }
	} catch (e) {
		return {
			compiledCode: null,
			error: e instanceof Error ? e.message : String(e),
		}
	}
}

/**
 * 컴파일된 ESM 코드를 Blob URL로 로드하여 모듈 exports 추출
 */
export async function loadCompiledModule(compiledCode: string): Promise<{
	component: React.ComponentType<Record<string, unknown>>
	propertyControls: PropertyControls
}> {
	const blob = new Blob([compiledCode], { type: "text/javascript" })
	const url = URL.createObjectURL(blob)
	try {
		const mod: { default?: React.ComponentType<Record<string, unknown>>; propertyControls?: PropertyControls } =
			await import(/* @vite-ignore */ url)
		return {
			component: mod.default ?? (() => null),
			propertyControls: mod.propertyControls ?? {},
		}
	} finally {
		URL.revokeObjectURL(url)
	}
}
