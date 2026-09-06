import { describe, expect, it } from "vitest"

import { boundingBoxSchema, documentNodeSchema, nodeDataSchema, positionSchema } from "./node"

describe("node schemas", () => {
	it("validates document nodes and geometry with zod mini schemas", () => {
		expect(
			documentNodeSchema.safeParse({
				id: "root",
				type: "document",
				children: [{ id: "child", type: "text", props: { text: "hello" } }],
				meta: { name: "Doc" },
			}).success,
		).toBe(true)

		expect(positionSchema.safeParse({ x: "bad", y: 1 }).success).toBe(false)
		expect(boundingBoxSchema.parse({ x: 1, y: 2, width: 3, height: 4 }).width).toBe(3)
		expect(
			nodeDataSchema.safeParse({
				id: "node",
				type: "frame",
				children: [{ id: 1, type: "invalid" }],
			}).success,
		).toBe(false)
	})
})
