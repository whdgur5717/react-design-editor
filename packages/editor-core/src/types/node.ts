import type { JSONContent } from "@tiptap/core"
import type { Properties } from "csstype"

export type NodeStyle = Properties<string | number>

/**
 * 모든 SceneNode의 공통 필드
 */
export interface BaseNode {
	id: string
	x?: number
	y?: number
	style?: NodeStyle
	visible?: boolean
	locked?: boolean
	children?: SceneNode[]
}

/**
 * 문서 - 여러 페이지를 포함하는 루트
 */
export interface DocumentNode {
	id: string
	children: PageNode[]
	meta?: {
		name?: string
		createdAt?: string
		updatedAt?: string
	}
}

/**
 * 페이지 - 여러 SceneNode를 포함
 */
export interface PageNode {
	id: string
	name: string
	children: SceneNode[]
}

/**
 * 요소 노드 (HTML 태그)
 */
export interface ElementNode extends BaseNode {
	type: "element"
	tag: string
	props?: Record<string, unknown>
}

/**
 * 텍스트 노드 - Tiptap 기반 리치 텍스트
 */
export interface TextNode extends BaseNode {
	type: "text"
	content: JSONContent
}

/**
 * 페이지 안에 들어가는 모든 노드
 */
export type SceneNode = ElementNode | TextNode

/**
 * 노드 위치 정보
 */
export interface Position {
	x: number
	y: number
}

/**
 * 노드 크기 정보
 */
export type Size = Pick<NodeStyle, "width" | "height">

/**
 * 노드 바운딩 박스
 */
export interface BoundingBox extends Position, Size {}
