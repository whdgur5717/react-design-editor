# PRD - Figma Node -> React+CSS MCP

## 개요

Figma 노드 트리를 구조화된 스키마로 변환하고, 단일 LLM 에이전트가 React element 유사 객체 트리와 CSS 스키마를 생성하도록 한다. 결과물은 즉시 실행 가능한 React+CSS 코드로 변환 가능해야 한다.

## 목표

- Figma node.type 기반 `inputSchema` 정의 및 정규화.
- 단일 LLM이 `outputSchema`(React element 트리 + CSS 타입 스키마)로 변환.
- 변환 결과를 바로 React+CSS 코드로 출력.
- 타입 안정성: TypeScript에서 `any`/`as` 금지, discriminated union 사용.

## 비목표

- Tailwind 변환.
- 멀티 에이전트 오케스트레이션(LangGraph/Vercel AI SDK).
- 고급 벡터 연산/복잡 마스크의 완전 대응.

## 사용자 시나리오

1. Figma에서 노드를 선택한다.
2. 플러그인이 노드 트리를 추출하여 `inputSchema`로 정규화한다.
3. MCP가 `outputSchema`를 반환한다.
4. 코드 생성기가 React+CSS 코드를 출력한다.

## 시스템 구성

- Figma Plugin: 노드 트리 추출, 변수 ID 조회, `inputSchema` 생성.
- MCP 서버: `inputSchema` → `outputSchema` 변환.
- Codegen: `outputSchema` → React+CSS 변환.

## 파이프라인

1. **Raw Extractor**: node.type별 속성 추출
2. **Normalizer**: 단위/형식 통일, 변수 바인딩 정규화
3. **LLM 변환**: `inputSchema` → `outputSchema`
4. **Codegen**: React+CSS 출력

## 스키마 설계

스키마의 기준은 Zod v4이며, 모든 필드는 `.meta()`로 출처와 의미를 명시한다.

### 공통 타입

```ts
type Id = string;

type ValueRef<T> = {
	value: T;
	variable?: {
		id: string;
		name: string;
	};
};

type Geometry = {
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number;
};

type RGBA = {
	r: number;
	g: number;
	b: number;
	a: number;
};

type GradientStop = {
	position: number;
	color: ValueRef<RGBA>;
};
```

### Paint/Effect

```ts
type SolidPaint = {
	kind: 'SOLID';
	color: ValueRef<RGBA>;
	opacity: number;
	visible: boolean;
	blendMode: string;
};

type GradientPaint = {
	kind: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
	gradientStops: GradientStop[];
	opacity: number;
	visible: boolean;
	blendMode: string;
};

type ImagePaint = {
	kind: 'IMAGE';
	imageRef: string;
	scaleMode: string;
	opacity: number;
	visible: boolean;
	blendMode: string;
};

type Paint = SolidPaint | GradientPaint | ImagePaint;

type Effect = {
	kind: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
	radius: number;
	offsetX: number;
	offsetY: number;
	spread: number;
	color?: ValueRef<RGBA>;
	visible: boolean;
};
```

### Layout

```ts
type Layout = {
	layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
	layoutWrap: 'NO_WRAP' | 'WRAP';
	itemSpacing: number;
	padding: { top: number; right: number; bottom: number; left: number };
	primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
	counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE' | 'STRETCH';
	primaryAxisSizingMode: 'FIXED' | 'AUTO';
	counterAxisSizingMode: 'FIXED' | 'AUTO';
	clipsContent: boolean;
};

type ChildLayout = {
	layoutGrow: number;
	layoutAlign: 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX';
	layoutPositioning: 'AUTO' | 'ABSOLUTE';
	constraints: {
		horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
		vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
	};
};
```

### InputSchema (LLM 입력)

```ts
type BaseNode = {
	id: Id;
	name: string;
	type: string;
	visible: boolean;
	opacity: number;
	geometry: Geometry;
	fills: Paint[];
	strokes: Paint[];
	effects: Effect[];
	blendMode: string;
};

type TextNode = BaseNode & {
	type: 'TEXT';
	characters: string;
	fontName: ValueRef<string>;
	fontSize: ValueRef<number>;
	lineHeight: ValueRef<number>;
	letterSpacing: ValueRef<number>;
	textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
	textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
	textCase: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
	textDecoration: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
	childLayout: ChildLayout;
};

type FrameNode = BaseNode & {
	type: 'FRAME' | 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE';
	layout: Layout;
	cornerRadius: ValueRef<number>;
	children: InputNode[];
};

type GroupNode = BaseNode & {
	type: 'GROUP';
	children: InputNode[];
};

type ShapeNode = BaseNode & {
	type: 'RECTANGLE' | 'ELLIPSE' | 'LINE' | 'POLYGON' | 'STAR' | 'VECTOR' | 'BOOLEAN_OPERATION';
	cornerRadius?: ValueRef<number>;
	childLayout: ChildLayout;
};

type InputNode = TextNode | FrameNode | GroupNode | ShapeNode;
```

### OutputSchema (LLM 출력)

```ts
type CSSProperties = Record<string, string | number>;

type OutputNode = {
	type: 'div' | 'span' | 'img' | 'svg' | 'button' | 'p';
	props: {
		id?: string;
		className?: string;
		style?: CSSProperties;
		src?: string;
		alt?: string;
	};
	children?: Array<OutputNode> | string;
	meta?: {
		sourceId: Id;
		tokens?: Array<{ id: string; name: string }>;
		issues?: Array<{ code: string; message: string }>;
	};
};
```

### Zod v4 스키마 예시(메타데이터 포함)

```ts
import { z } from "zod";

const ValueRefSchema = <T extends z.ZodType<unknown>>(value: T) =>
	z
		.object({
			value: value.meta({ figmaProp: "value", normalized: true }),
			variable: z
				.object({
					id: z.string().meta({ figmaProp: "boundVariables.id" }),
					name: z.string().meta({ source: "variableId->name" })
				})
				.optional()
				.meta({ figmaProp: "boundVariables" })
		})
		.meta({ kind: "ValueRef" });

const GeometrySchema = z
	.object({
		x: z.number().meta({ unit: "px", source: "absoluteBoundingBox.x" }),
		y: z.number().meta({ unit: "px", source: "absoluteBoundingBox.y" }),
		width: z.number().meta({ unit: "px", source: "absoluteBoundingBox.width" }),
		height: z.number().meta({ unit: "px", source: "absoluteBoundingBox.height" }),
		rotation: z.number().meta({ unit: "deg", source: "rotation" })
	})
	.meta({ kind: "Geometry" });

const TextNodeSchema = z
	.object({
		id: z.string().meta({ figmaProp: "id" }),
		name: z.string().meta({ figmaProp: "name" }),
		type: z.literal("TEXT"),
		visible: z.boolean().meta({ figmaProp: "visible" }),
		opacity: z.number().meta({ figmaProp: "opacity" }),
		geometry: GeometrySchema,
		characters: z.string().meta({ figmaProp: "characters" }),
		fontName: ValueRefSchema(z.string()).meta({ figmaProp: "fontName" }),
		fontSize: ValueRefSchema(z.number()).meta({ figmaProp: "fontSize" })
	})
	.meta({ nodeType: "TEXT" });

type OutputNode = {
	type: "div" | "span" | "img" | "svg" | "button" | "p";
	props: { id?: string; className?: string; style?: CSSProperties; src?: string; alt?: string };
	children?: Array<OutputNode> | string;
	meta?: { sourceId: Id; tokens?: Array<{ id: string; name: string }> };
};

const OutputNodeSchema: z.ZodType<OutputNode> = z.lazy(() =>
	z
		.object({
			type: z.enum(["div", "span", "img", "svg", "button", "p"]).meta({ output: "tag" }),
			props: z
				.object({
					id: z.string().optional().meta({ output: "id" }),
					className: z.string().optional().meta({ output: "className" }),
					style: z.record(z.union([z.string(), z.number()])).optional().meta({ output: "style" }),
					src: z.string().optional().meta({ output: "src" }),
					alt: z.string().optional().meta({ output: "alt" })
				})
				.meta({ output: "props" }),
			children: z
				.union([z.array(OutputNodeSchema), z.string()])
				.optional()
				.meta({ output: "children" }),
			meta: z
				.object({
					sourceId: z.string().meta({ output: "sourceId" }),
					tokens: z
						.array(z.object({ id: z.string(), name: z.string() }))
						.optional()
						.meta({ output: "tokens" })
				})
				.optional()
				.meta({ output: "meta" })
		})
		.meta({ output: "OutputNode" })
);
```

## 예시 페이로드

### InputSchema 예시

```json
{
  "id": "1:1",
  "name": "Card",
  "type": "FRAME",
  "visible": true,
  "opacity": 1,
  "geometry": { "x": 0, "y": 0, "width": 320, "height": 120, "rotation": 0 },
  "fills": [
    {
      "kind": "SOLID",
      "color": {
        "value": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "variable": { "id": "VariableID:1", "name": "color.surface" }
      },
      "opacity": 1,
      "visible": true,
      "blendMode": "NORMAL"
    }
  ],
  "strokes": [],
  "effects": [],
  "blendMode": "NORMAL",
  "layout": {
    "layoutMode": "HORIZONTAL",
    "layoutWrap": "NO_WRAP",
    "itemSpacing": 12,
    "padding": { "top": 16, "right": 16, "bottom": 16, "left": 16 },
    "primaryAxisAlignItems": "MIN",
    "counterAxisAlignItems": "CENTER",
    "primaryAxisSizingMode": "AUTO",
    "counterAxisSizingMode": "AUTO",
    "clipsContent": false
  },
  "cornerRadius": { "value": 12 },
  "children": [
    {
      "id": "1:2",
      "name": "Avatar",
      "type": "RECTANGLE",
      "visible": true,
      "opacity": 1,
      "geometry": { "x": 0, "y": 0, "width": 48, "height": 48, "rotation": 0 },
      "fills": [
        {
          "kind": "SOLID",
          "color": { "value": { "r": 230, "g": 230, "b": 230, "a": 1 } },
          "opacity": 1,
          "visible": true,
          "blendMode": "NORMAL"
        }
      ],
      "strokes": [],
      "effects": [],
      "blendMode": "NORMAL",
      "cornerRadius": { "value": 24 },
      "childLayout": {
        "layoutGrow": 0,
        "layoutAlign": "CENTER",
        "layoutPositioning": "AUTO",
        "constraints": { "horizontal": "MIN", "vertical": "MIN" }
      }
    },
    {
      "id": "1:3",
      "name": "Title",
      "type": "TEXT",
      "visible": true,
      "opacity": 1,
      "geometry": { "x": 0, "y": 0, "width": 200, "height": 24, "rotation": 0 },
      "fills": [],
      "strokes": [],
      "effects": [],
      "blendMode": "NORMAL",
      "characters": "Profile",
      "fontName": {
        "value": "Inter",
        "variable": { "id": "VariableID:2", "name": "font.body" }
      },
      "fontSize": { "value": 16 },
      "lineHeight": { "value": 24 },
      "letterSpacing": { "value": 0 },
      "textAlignHorizontal": "LEFT",
      "textAlignVertical": "CENTER",
      "textCase": "ORIGINAL",
      "textDecoration": "NONE",
      "childLayout": {
        "layoutGrow": 1,
        "layoutAlign": "CENTER",
        "layoutPositioning": "AUTO",
        "constraints": { "horizontal": "MIN", "vertical": "MIN" }
      }
    }
  ]
}
```

### OutputSchema 예시

```json
{
  "type": "div",
  "props": {
    "id": "card",
    "style": {
      "display": "flex",
      "flexDirection": "row",
      "gap": 12,
      "padding": 16,
      "backgroundColor": "rgba(255,255,255,1)",
      "borderRadius": 12
    }
  },
  "children": [
    {
      "type": "div",
      "props": {
        "id": "avatar",
        "style": {
          "width": 48,
          "height": 48,
          "borderRadius": 24,
          "backgroundColor": "rgba(230,230,230,1)",
          "alignSelf": "center"
        }
      },
      "meta": {
        "sourceId": "1:2",
        "tokens": []
      }
    },
    {
      "type": "span",
      "props": {
        "id": "title",
        "style": {
          "fontFamily": "Inter",
          "fontSize": 16,
          "lineHeight": "24px",
          "flexGrow": 1
        }
      },
      "children": "Profile",
      "meta": {
        "sourceId": "1:3",
        "tokens": [
          { "id": "VariableID:2", "name": "font.body" }
        ]
      }
    }
  ],
  "meta": {
    "sourceId": "1:1",
    "tokens": [
      { "id": "VariableID:1", "name": "color.surface" }
    ]
  }
}
```

## 변수 바인딩(필수)

- `boundVariables`는 노드 레벨뿐 아니라 `fills[]`, `strokes[]`, `effects[]`, 텍스트 속성 등 **중첩 리프 값**에 존재할 수 있음.
- Normalizer에서 **deep traversal**로 모든 리프 값을 검사.
- `variableId → variableName` 해석을 **Normalizer 단계에서 수행**해 LLM 입력에 포함.
- `ValueRef<T>` 형태로 value와 variable 정보를 함께 전달.

## 정규화 규칙

- 색상: RGBA(0~1) → RGBA(0~255)로 통일 + 소수점 정밀도 고정.
- 길이: px 단위 기준 숫자.
- 그라데이션: stop 정렬 및 0~1 position 보장.
- 이펙트: blur/shadow 구조화.

## 매핑 규칙(핵심)

- `layoutMode` 기반 컨테이너 CSS 생성:
    - `HORIZONTAL` → `display:flex; flex-direction:row`
    - `VERTICAL` → `display:flex; flex-direction:column`
    - `itemSpacing` → `gap`
    - `padding` → `padding`
    - 축 정렬 → `justify-content`, `align-items`
- 자식 레이아웃:
    - `layoutGrow` → `flex-grow`
    - `layoutAlign` → `align-self`
    - `layoutPositioning=ABSOLUTE` → `position:absolute` + `left/top`
- 도형/텍스트:
    - `SOLID` fill → `background-color`
    - gradient fill → `background-image: linear-gradient(...)`
    - stroke → `border` 또는 `outline`
    - effects → `box-shadow`/`filter`로 변환 가능한 범위는 매핑, 불가능한 경우 `meta.issues`에 기록
- constraints:
    - `MIN/MAX/CENTER/STRETCH/SCALE`를 CSS `left/right/top/bottom/transform`으로 계산해 적용
    - 계산에 필요한 치수는 트리의 geometry를 이용해 산출

## 정확성 기준

- 변환 불가 항목은 **누락하지 않고** `meta.issues`로 기록.
- 스키마 검증 실패는 즉시 실패 처리(재시도/수정 루프 가능).

## 엔지니어링 제약

- TypeScript에서 `any`/`as` 사용 금지.
- Zod v4 사용, 모든 필드에 `.meta()` 메타데이터 필수.
- `@figma/plugin-typings` 타입은 전역 제공이므로 import 금지.
- 타입 SSOT 유지: Figma 타입을 로컬에서 재선언 금지, `Pick`/`Omit`/`extends`로 확장.
- 타입을 먼저 선언하고 그 다음 구현(타입 우선 개발).
- `es-toolkit` 유틸을 적극 사용하고, 불필요한 자체 유틸 함수 선언 금지.
- 모든 노드는 discriminated union으로 정의.
- 런타임 검증(Zod)과 타입 정의가 1:1로 일치해야 함.

## 구현 순서(계획)

1. 스키마 정의
    - Input/Output Zod v4 스키마 정의(`.meta()` 포함)
    - TypeScript 타입과 1:1 매핑
2. Extractor
    - node.type별 추출 함수 작성
    - deep traversal로 `boundVariables` 추출
3. Normalizer
    - 색상/길이/그라데이션/이펙트 정규화
    - `variableId → variableName` 해석
4. LLM 변환
    - 프롬프트/툴 입력을 `inputSchema`로 고정
    - 출력 검증 및 스키마 실패 시 재요청
5. Codegen
    - OutputSchema → React 변환(모든 스타일은 `style` prop)
    - constraints 계산 로직 적용
6. 테스트
    - 노드 타입별 단위 테스트
    - 스키마 검증 테스트
    - 샘플 Figma 파일 기반 스냅샷 테스트

## 성공 지표

- 스키마 검증 실패율 < 5%
- 코드 생성 실패율 < 5%
- 수동 평가 기준 레이아웃 정합성 80% 이상

## 리스크 및 대응

- 복수 stroke/effect의 CSS 한계 → `meta.issues`로 명시
- 이미지 fill 리소스 → asset export 전략 필요

## 출력 정책

- LLM 출력은 React element 객체 트리이며, 스타일은 `props.style`에만 포함한다.
- CSS 파일 분리는 1차 범위에서 제외한다.
