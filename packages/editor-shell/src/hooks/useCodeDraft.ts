import { useCallback, useEffect, useRef, useState } from "react"

import { compileCode, loadCompiledModule } from "../services/compiler"
import { useEditor, useEditorStore } from "../services/EditorContext"

interface CompileState {
	isCompiling: boolean
	error: string | null
	previewCode: string | null
	previewVersion: number
}

export function useCodeDraft(componentId: string) {
	const editor = useEditor()
	const component = useEditorStore((state) => state.codeComponents.find((c) => c.id === componentId))

	const [draft, setDraft] = useState(component?.source ?? "")
	const [compileState, setCompileState] = useState<CompileState>({
		isCompiling: false,
		error: component?.compilationError ?? null,
		previewCode: component?.compiledCode ?? null,
		previewVersion: 0,
	})

	const draftRef = useRef(draft)
	draftRef.current = draft

	// Reset draft when componentId changes
	const prevIdRef = useRef(componentId)
	useEffect(() => {
		if (prevIdRef.current !== componentId) {
			prevIdRef.current = componentId
			setDraft(component?.source ?? "")
			setCompileState({
				isCompiling: false,
				error: component?.compilationError ?? null,
				previewCode: component?.compiledCode ?? null,
				previewVersion: 0,
			})
		}
	}, [componentId, component?.source, component?.compilationError, component?.compiledCode])

	const save = useCallback(async () => {
		const code = draftRef.current
		setCompileState((prev) => ({ ...prev, isCompiling: true, error: null }))
		const result = await compileCode(code)
		if (result.error) {
			setCompileState((prev) => ({ ...prev, isCompiling: false, error: result.error }))
			editor.store.getState().updateCodeComponent(componentId, {
				source: code,
				compilationError: result.error,
			})
			return
		}

		// 컴파일 성공 즉시 preview 업데이트 (loadCompiledModule 성공 여부와 무관)
		setCompileState((prev) => ({
			isCompiling: false,
			error: null,
			previewCode: result.compiledCode,
			previewVersion: prev.previewVersion + 1,
		}))

		// propertyControls 추출은 별도로 시도
		try {
			const mod = await loadCompiledModule(result.compiledCode!)
			editor.store.getState().updateCodeComponent(componentId, {
				source: code,
				compiledCode: result.compiledCode,
				propertyControls: mod.propertyControls,
				compilationError: null,
			})
		} catch {
			editor.store.getState().updateCodeComponent(componentId, {
				source: code,
				compiledCode: result.compiledCode,
				compilationError: null,
			})
		}
	}, [componentId, editor])

	const isDirty = draft !== component?.source

	return {
		component,
		draft,
		setDraft,
		save,
		isDirty,
		...compileState,
	}
}
