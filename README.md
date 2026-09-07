# Design Editor SDK

React 앱 안에 비주얼 에디터를 넣기 위한 SDK.

> Preview package. 사용 방식, 컴포넌트 구성, import 경로 변경 가능.

[Live Demo](https://design-editor-shell.pages.dev)

## 제공 기능

- 문서 모델 기반 캔버스 렌더링
- 선택, 이동, 리사이즈, 텍스트 편집
- undo / redo history
- toolbar, layers panel, properties panel
- 커스텀 React 컴포넌트 등록

## 설치

```bash
pnpm add open-editor-sdk react react-dom
```

아직 배포 전 preview 환경에서는 `packages/demo`의 workspace 사용 방식 기준.

## 빠른 사용

```tsx
import "open-editor-sdk/styles.css"

import { createEditor } from "open-editor-sdk/createEditor"
import { EditorCanvas } from "open-editor-sdk/EditorCanvas"
import { EditorProvider } from "open-editor-sdk/EditorProvider"
import { EditorRoot } from "open-editor-sdk/EditorRoot"
import { LayersPanel } from "open-editor-sdk/LayersPanel"
import { PropertiesPanel } from "open-editor-sdk/PropertiesPanel"
import { Toolbar } from "open-editor-sdk/Toolbar"
import { useMemo } from "react"

export function App() {
	const editor = useMemo(() => {
		return createEditor({
			document: {
				id: "doc-root",
				children: [{ id: "page-1", name: "Page 1", children: [] }],
			},
			currentPageId: "page-1",
		})
	}, [])

	return (
		<EditorProvider editor={editor}>
			<EditorRoot>
				<Toolbar />
				<LayersPanel />
				<EditorCanvas />
				<PropertiesPanel />
			</EditorRoot>
		</EditorProvider>
	)
}
```

흐름은 단순함.

1. `createEditor()`로 editor 객체 생성
2. `EditorProvider`에 editor 전달
3. `EditorCanvas`와 패널 컴포넌트 배치

## 커스텀 컴포넌트

캔버스에서 렌더링할 React 컴포넌트는 `components` 옵션으로 등록.

```tsx
const editor = createEditor({
	document,
	currentPageId: "page-1",
	components: {
		HeroCard: {
			component: HeroCard,
			displayName: "Hero Card",
			styles: heroCardStyles,
		},
	},
})
```

등록한 컴포넌트는 문서 노드의 `tag` 값으로 사용.

```ts
{
	id: "hero-card",
	type: "element",
	tag: "HeroCard",
	x: 64,
	y: 56,
	props: {
		title: "Launch readiness",
	},
	style: {
		width: 520,
		minHeight: 320,
	},
	children: [],
}
```

## 주요 import

| Import path                       | 용도                       |
| --------------------------------- | -------------------------- |
| `open-editor-sdk/createEditor`    | editor 객체 생성           |
| `open-editor-sdk/EditorProvider`  | React 트리에 editor 연결   |
| `open-editor-sdk/EditorRoot`      | 기본 editor layout wrapper |
| `open-editor-sdk/EditorCanvas`    | 문서 캔버스 렌더링         |
| `open-editor-sdk/Toolbar`         | 기본 툴바                  |
| `open-editor-sdk/LayersPanel`     | 문서 레이어 패널           |
| `open-editor-sdk/PropertiesPanel` | 선택 노드 속성 패널        |
| `open-editor-sdk/useEditor`       | editor 객체 접근 hook      |
| `open-editor-sdk/styles.css`      | 기본 editor 스타일         |

## 패키지 구성

| Package                       | 역할                                |
| ----------------------------- | ----------------------------------- |
| `open-editor-sdk`             | 앱에서 사용하는 SDK entry package   |
| `@open-editor-sdk/shell`      | 상태, 액션, 툴, history runtime     |
| `@open-editor-sdk/canvas`     | 캔버스 렌더링과 DOM geometry 측정   |
| `@open-editor-sdk/core`       | 문서 모델, 공통 타입, serialization |
| `@open-editor-sdk/components` | 기본 component registry             |
| `@open-editor-sdk/demo`       | SDK 사용 예시 앱                    |

## 로컬 개발

```bash
pnpm install

# demo app
pnpm --filter @open-editor-sdk/demo dev

# build
pnpm --filter @open-editor-sdk/demo build
pnpm --filter open-editor-sdk build

# checks
pnpm type-check
pnpm lint
pnpm test:unit
pnpm test:e2e
```

## 참고 문서

- [SDK direction](docs/sdk-direction.md)
- [Editor runtime service migration](docs/editor-runtime-service-migration.md)
- [Deployment](docs/deployment.md)
