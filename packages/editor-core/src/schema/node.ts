import * as z from "zod/v4-mini"

/**
 * CSS 스타일 스키마 (주요 속성들)
 * 전체 NodeStyle을 검증하진 않고, 자주 사용되는 속성들만 정의
 */
export const styleSchema = z.record(z.string(), z.unknown())

/**
 * NodeData 기본 스키마 (재귀 없음)
 */
const baseNodeDataSchema = z.object({
	id: z.string(),
	type: z.string(),
	props: z.optional(z.record(z.string(), z.unknown())),
	style: z.optional(styleSchema),
})

/**
 * NodeData 스키마 (재귀 포함)
 */
export const nodeDataSchema: z.ZodMiniType<{
	id: string
	type: string
	props?: Record<string, unknown>
	style?: Record<string, unknown>
	children?: unknown[] | string
}> = z.extend(baseNodeDataSchema, {
	children: z.optional(z.union([z.lazy(() => z.array(nodeDataSchema)), z.string()])),
})

/**
 * DocumentNode 스키마
 */
export const documentNodeSchema = z.extend(baseNodeDataSchema, {
	children: z.optional(z.union([z.lazy(() => z.array(nodeDataSchema)), z.string()])),
	meta: z.optional(
		z.object({
			name: z.optional(z.string()),
			createdAt: z.optional(z.string()),
			updatedAt: z.optional(z.string()),
		}),
	),
})

/**
 * Position 스키마
 */
export const positionSchema = z.object({
	x: z.number(),
	y: z.number(),
})

/**
 * Size 스키마
 */
export const sizeSchema = z.object({
	width: z.number(),
	height: z.number(),
})

/**
 * BoundingBox 스키마
 */
export const boundingBoxSchema = z.extend(positionSchema, {
	width: z.number(),
	height: z.number(),
})
