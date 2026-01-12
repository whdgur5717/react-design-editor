# AGENTS.md

This file provides guidance when working with code in this repository.

## Project Overview

Figma 플러그인으로, 선택된 디자인 노드를 LLM 기반 코드 생성을 위한 정규화된 React-like 트리 구조로 변환합니다. 2단계 타입 변환 파이프라인(Extract → Normalize)을 통해 Figma의 복잡한 API를 타입 안전하고 LLM 친화적인 구조로 변환합니다.

**핵심 목적**: Figma 디자인의 레이아웃, 스타일, 텍스트, 효과, 디자인 토큰을 깔끔하게 정규화하여 LLM이 UI 코드를 생성할 수 있게 합니다.

## Development Commands

```bash
# 개발
pnpm install        # 의존성 설치
pnpm dev            # 개발 모드 (auto-rebuild)
pnpm build          # 프로덕션 빌드

# 코드 품질
pnpm lint           # ESLint
pnpm format         # Prettier 포맷팅
pnpm type-check     # TypeScript 타입 체크

# 테스트
pnpm vitest         # Vitest 실행
```

### Figma에서 테스트

1. `pnpm dev` 실행
2. Figma 데스크톱: `Cmd/Ctrl + K` → "Import plugin from manifest…" → `dist/manifest.json`
3. 개발 서버는 핫 리로드를 위해 계속 실행 유지

## Architecture: 2단계 타입 변환 파이프라인

### 전체 데이터 흐름

```
SceneNode (Figma API)
  ↓ Extract (src/main/pipeline/extract/)
ExtractedStyle
  ↓ Normalize (src/main/pipeline/normalize/)
NormalizedStyle
  ↓ Build Node (src/main/node/)
ReactNode (최종 출력)
```

### 1. Extract 단계

**목적**: Figma Plugin API에서 필요한 데이터만 원시 형태로 추출

**핵심 원칙**:

- Figma Mixin을 타입 가드로 체크 후 안전하게 접근
- `Partial<Pick<T, K>>` 패턴으로 필요한 키만 추출
- `figma.mixed` 값을 그대로 유지 (정규화는 다음 단계)
- 정규화/변환 로직 금지, 원시 데이터만 추출

**타입 가드 패턴**:

```typescript
const hasMinimalFillsMixin = (node: SceneNode): node is SceneNode & MinimalFillsMixin => 'fills' in node;

const isAutoLayoutContainer = (node: SceneNode): node is SceneNode & AutoLayoutMixin => 'layoutMode' in node;
```

**주요 추출 함수**:

- `extractFillProps()` - fills, fillStyleId
- `extractEffectProps()` - effects, effectStyleId
- `extractAutoLayout()` - 모든 레이아웃 속성 (x, y, width, height, layoutMode, padding, gap, ...)
- `extractTextProps()` - 텍스트 및 스타일 속성
- `extractStrokeProps()` - strokes, strokeWeight, strokeAlign, ...

**BoundVariables 수집**:

- fills, effects, stroke, text 각 영역에서 `VariableAlias` 재귀 수집
- Gradient stops, text segments 등 중첩 구조도 탐색
- 그룹별로 분류하고 전체 ID 리스트 유지

### 2. Normalize 단계

**목적**: 추출된 원시 데이터를 LLM 친화적인 일관된 형식으로 변환

**핵심 변환**:

- **figma.mixed 처리**: mixed 값을 타입화된 구조로 변환하거나 빈 배열/null 반환
- **TokenizedValue 래핑**: `VariableAlias` 존재 시 `{ tokenRef, fallback }` 형태로 래핑
- **색상 정규화**: RGB → `{ hex, rgb, rgba, opacity }` 객체로 변환
- **레이아웃 재구조화**: 평평한 속성들을 `container`/`child` 의미 단위로 분리
- **텍스트 세그먼트화**: 문자 범위별 스타일을 `NormalizedTextRun[]`로 변환

**주요 정규화 함수**:

- `normalizeFills()` - Paint[] → NormalizedFill[]
- `normalizeEffects()` - Effect[] → NormalizedEffect[]
- `normalizeLayout()` - ExtractedLayoutProps → NormalizedLayout (mode, position, container, child)
- `normalizeText()` - ExtractedTextProps → NormalizedText (characters, runs, alignment)
- `normalizeStroke()` - ExtractedStrokeProps → NormalizedStroke (paints, weight, align, cap, join)

## 핵심 타입 설계

### 1. BaseReactNode: 제네릭 노드 시스템

모든 노드 타입이 공통 구조를 유지하면서도 타입별로 확장 가능하도록 설계:

```typescript
interface BaseNodeProps<TStyle = NormalizedStyle> {
	id: string;
	name: string;
	style?: TStyle;
	boundVariables?: ExtractedBoundVariables;
}

interface BaseReactNode<
	TType extends SceneNode['type'] | string,
	TProps extends BaseNodeProps,
	TChildren = ReactNode[],
> {
	type: TType;
	props: TProps;
	children?: TChildren;
	instanceRef?: IRInstanceRef; // 컴포넌트 인스턴스 참조
	tokensRef?: IRTokenRef[]; // 디자인 토큰 참조
	assets?: IRAssetRef[]; // 이미지/벡터 에셋
}
```

**노드 타입별 확장**:

```typescript
type InstanceNodeProps = BaseNodeProps & {
  componentProperties?: ComponentProperties;
};

type InstanceReactNode = BaseReactNode<'INSTANCE', InstanceNodeProps>;
type FrameReactNode = BaseReactNode<'FRAME', BaseNodeProps>;
type TextReactNode = BaseReactNode<'TEXT', BaseNodeProps>;

type ReactNode = InstanceReactNode | FrameReactNode | TextReactNode | ...;
```

### 2. TokenizedValue: 디자인 토큰 보존

Figma Variable 바인딩 정보를 타입으로 표현:

```typescript
type TokenRef = {
	id: string;
	name?: string;
	collectionId?: string;
	collectionName?: string;
	modeId?: string;
	modeName?: string;
};

type TokenizedValue<T> = T | { tokenRef: TokenRef; fallback: T };
```

**사용 예시**:

```typescript
type NormalizedSolidFill = {
	type: 'solid';
	color: TokenizedValue<NormalizedColor>; // 토큰 또는 일반 값
};

// 런타임 변환
const toTokenizedValue = <T>(value: T, alias?: VariableAlias | null): TokenizedValue<T> =>
	alias ? { tokenRef: { id: alias.id }, fallback: value } : value;
```

**중요성**: LLM이 디자인 토큰을 인식하여 `var(--color-primary)` 같은 코드 생성 가능

### 3. NormalizedMixedValue: Mixed 값 타입화

Figma의 `figma.mixed` 상태를 타입 안전하게 표현:

```typescript
type NormalizedMixedValue<T> =
	| { type: 'uniform'; value: T }
	| { type: 'mixed'; values: T[] }
	| { type: 'range-based'; segments: Array<{ start: number; end: number; value: T }> };
```

**조합 사용**:

```typescript
type NormalizedCorner = {
	radius: NormalizedMixedValue<TokenizedValue<number>>; // Mixed + Tokenized 조합
};
```

### 4. NormalizedText: 텍스트 세그먼트

문자 범위별로 스타일을 분리하여 표현:

```typescript
type NormalizedText = {
	characters: string;
	runs: NormalizedTextRun[];
	textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
	textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
	// ...
};

type NormalizedTextRun = {
	start: number;
	end: number;
	characters: string;
	style: NormalizedTextRunStyle; // fontSize, fontName, fills, ...
};
```

## 노드 처리 흐름

### buildNodeTree() - 재귀 트리 생성 (`src/main/node/index.ts`)

1. 노드 타입별 빌더 호출 (switch-case로 분기)
2. `visible === false`인 자식 필터링
3. 자식 노드 재귀 처리
4. ReactNode 트리 반환

### 타입별 빌더 (`src/main/node/builders.ts`)

각 노드 타입(TEXT, FRAME, INSTANCE, ...)별로 전용 빌더 함수:

```typescript
export const buildTextNode = (node: TextNode): TextReactNode => ({
	type: 'TEXT',
	...buildNodeData(node),
});

export const buildInstanceNode = (node: InstanceNode): InstanceReactNode => {
	const data = buildNodeData(node);
	return {
		type: 'INSTANCE',
		...data,
		props: {
			...data.props,
			componentProperties: node.componentProperties,
		},
	};
};
```

### buildNodeData() - 공통 데이터 생성 (`src/main/node/props.ts`)

모든 노드에 공통으로 적용되는 처리:

1. `extractStyle()` - Figma 노드에서 원시 스타일 추출
2. `normalizeStyle()` - 추출된 스타일 정규화
3. `buildInstanceRef()` - 컴포넌트 인스턴스 정보 생성
4. `buildTokenRefs()` - 토큰 참조 리스트 생성
5. `buildAssetRefs()` - 이미지/벡터 에셋 리스트 생성

## 파일 구조

```
src/main/
├── main.ts                         # Entry point
├── node/
│   ├── index.ts                   # buildNodeTree() - 재귀 순회
│   ├── builders.ts                # 타입별 빌더
│   ├── props.ts                   # buildNodeData()
│   └── type.ts                    # ReactNode 타입 정의
├── pipeline/
│   ├── extract/
│   │   ├── style.ts              # extractStyle() 오케스트레이터
│   │   ├── fills.ts, effects.ts, layout.ts, text.ts, stroke.ts
│   │   └── types.ts              # ExtractedStyle, ExtractedFillProps, ...
│   ├── normalize/
│   │   ├── style.ts              # normalizeStyle() 오케스트레이터
│   │   ├── fills.ts, effects.ts, layout.ts, text.ts, stroke.ts
│   │   └── types.ts              # NormalizedStyle, TokenizedValue, ...
│   └── variables/                # 토큰/변수 레지스트리
└── utils/                         # deepPick 등
```

## 설계 원칙

### 1. 타입 안전성 최우선

**PRD**: "type-safe한 설계 및 유지보수 가능한 코드 구조가 중요"

- 모든 파이프라인 단계는 명확한 입력/출력 타입
- Figma Mixin은 타입 가드로 체크
- 제네릭 활용한 확장 가능한 노드 시스템

### 2. Figma Plugin API 이해 필수

**PRD**: "Figma Plugin API의 타입을 이해한 뒤 작업해야 함"

- [Figma Plugin API 문서](https://www.figma.com/plugin-docs/) 필수 확인
- Mixin 시스템 이해 (AutoLayoutMixin, GeometryMixin, MinimalFillsMixin, ...)
- `figma.mixed` 처리 방식 숙지

### 3. 파이프라인 단계 엄격 분리

- **Extract**: Figma API → Extracted 타입 (원시 데이터만, 변환 금지)
- **Normalize**: Extracted 타입 → Normalized 타입 (LLM 친화적 변환)
- 각 단계는 이전 단계의 출력만 사용

### 4. 토큰 보존

- `VariableAlias`는 파이프라인 전체에서 보존
- `TokenizedValue<T>` 패턴으로 래핑
- `boundVariables`는 Extract에서 수집하여 ReactNode까지 유지

### 5. LLM 우선 출력

- 구조 일관성 우선 (사람 가독성 < LLM 파싱 용이성)
- 색상: hex/rgb/rgba + opacity 객체
- 레이아웃: container/child 명확히 분리
- 텍스트: 문자 범위별 runs로 분해

## 새 기능 추가 절차

### 새 스타일 속성 추가

1. Extract 타입 정의 (`pipeline/extract/types.ts`)
2. Extract 함수 구현 (타입 가드 + 키 추출)
3. `ExtractedStyle`에 추가
4. `extractStyle()`에서 호출
5. Normalize 타입 정의 (`pipeline/normalize/types.ts`)
6. Normalize 함수 구현 (mixed 처리, TokenizedValue 래핑)
7. `NormalizedStyle`에 추가
8. `normalizeStyle()`에서 호출

### 새 노드 타입 추가

1. `node/type.ts`에 Props, ReactNode 타입 정의
2. `ReactNode` 유니온에 추가
3. `node/builders.ts`에 빌더 함수 구현
4. `node/index.ts` `buildNodeTree()`의 switch-case에 분기 추가

## 현재 상태

- ✅ Extract → Normalize 파이프라인 완성
- ✅ React-like 노드 시스템 완성
- ✅ 토큰 참조 수집 및 보존
- ✅ 에셋 참조 수집
- 🚧 MVP: Figma → LLM 데이터 파이프라인 집중
- 🔜 2차 MVP: UI 제작 및 서버 구현

## 참고

- **Main/UI Thread 분리**: `src/main/`은 Figma Plugin API 접근, `src/ui/`는 iframe (postMessage 통신)
- **빌드 도구**: [Plugma](https://plugma.dev/docs) (Vite 기반)
- **Figma API**: https://www.figma.com/plugin-docs/api/api-reference/
- **Figma API Type** : node_modules/@figma/plugin-typings
