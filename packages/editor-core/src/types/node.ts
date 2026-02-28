import type { JSONContent } from "@tiptap/core"
import type { CSSProperties } from "react"

/**
 * 모든 SceneNode의 공통 필드
 */
export interface BaseNode {
	id: string
	x?: number
	y?: number
	style?: CSSProperties
	visible?: boolean
	locked?: boolean
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
	children?: SceneNode[]
}

/**
 * 컴포넌트 인스턴스 노드
 */
export interface InstanceNode extends BaseNode {
	type: "instance"
	componentId: string
	overrides?: {
		[nodeId: string]: {
			props?: Record<string, unknown>
			style?: CSSProperties
			content?: JSONContent // TextNode content override
		}
	}
	/** 코드 컴포넌트 인스턴스의 prop 값 */
	propValues?: Record<string, unknown>
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
export type SceneNode = ElementNode | InstanceNode | TextNode

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
export type Size = Pick<CSSProperties, "width" | "height">

/**
 * 노드 바운딩 박스
 */
export interface BoundingBox extends Position, Size {}

/**
 * 컴포넌트 정의 (Master Component)
 */
export interface ComponentDefinition {
	id: string
	name: string
	root: ElementNode
	createdAt: string
}

/**
 * Property Control 타입
 */
export type PropertyControlType = "string" | "number" | "boolean" | "color" | "enum"

/**
 * 개별 Property Control 정의
 */
export interface PropertyControl {
	title?: string
	type: PropertyControlType
	defaultValue?: unknown
	options?: string[] // "enum" 타입 전용
}

/**
 * Property Controls 맵 (prop 이름 → 컨트롤 정의)
 */
export type PropertyControls = Record<string, PropertyControl>

/**
 * 코드 컴포넌트 정의
 */
export interface CodeComponentDefinition {
	id: string
	name: string
	source: string
	compiledCode: string | null
	propertyControls: PropertyControls
	compilationError: string | null
}
