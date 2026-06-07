import type { DocumentNode, PageNode, SceneNode } from "./node"
import type { NodeRect } from "./protocol"

export type BuiltinEditorTool = "select" | "frame" | "text" | "shape"
export type EditorTool = string

export interface NodeLocation {
	parentId: string
	index: number
}

export interface NodePageContext {
	pageId?: string
}

type Primitive = string | number | boolean | bigint | symbol | null | undefined

export type ReadonlyDeep<T> = T extends Primitive
	? T
	: T extends (...args: never[]) => unknown
		? T
		: T extends readonly (infer Item)[]
			? readonly ReadonlyDeep<Item>[]
			: T extends object
				? { readonly [Key in keyof T]: ReadonlyDeep<T[Key]> }
				: T

/** Source of truth for editor state. */
export interface EditorModel {
	document: DocumentNode
	currentPageId: string
	selection: string[]
	hoveredId: string | null
	activeTool: EditorTool
	zoom: number
	panX: number
	panY: number
	dragPreview: { nodeId: string; dx: number; dy: number } | null
	nodeRectsCache: Record<string, NodeRect>
}

export type EditorSnapshot = ReadonlyDeep<EditorModel>
export type DocumentSnapshot = ReadonlyDeep<DocumentNode>
export type PageSnapshot = ReadonlyDeep<PageNode>
export type NodeSnapshot = ReadonlyDeep<SceneNode>
