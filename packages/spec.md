# Design Editor Spec

DOM/React 기반 디자인 에디터. Figma와 달리 변환 레이어 없이, 에디터에서 렌더링되는 것이 곧 React 코드가 된다.

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│  Shell (editor-shell)                                        │
│  - Toolbar, LayersPanel, PropertiesPanel                     │
│  - Zustand로 상태 관리                                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Canvas (editor-canvas, iframe)                         │  │
│  │  - 실제 React 컴포넌트 렌더링                             │  │
│  │  - 드래그/리사이즈 인터랙션                               │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ↕ Penpal (postMessage)
```

**Shell/Canvas 분리 이유**: CSS/JS 격리. Canvas의 스타일이 Shell UI에 영향 주지 않도록.

---

## 패키지 구조

```
packages/
├── editor-core/       # 공유 타입, 스키마, codegen
├── editor-shell/      # 메인 앱 (좌측 패널, 우측 패널, 툴바)
├── editor-canvas/     # iframe 내부 앱 (렌더링, 인터랙션)
└── editor-components/ # 렌더링용 컴포넌트 레지스트리
```

### editor-core

| 파일                   | 역할                                                                      |
| ---------------------- | ------------------------------------------------------------------------- |
| `types/node.ts`        | NodeData, DocumentNode, Position, Size, ComponentDefinition, InstanceNode |
| `types/editor.ts`      | EditorState, EditorActions, EditorStore                                   |
| `codegen/serialize.ts` | NodeData → JSX 코드 문자열 변환                                           |

### editor-shell

| 파일                             | 역할                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| `store/editor.ts`                | Zustand 스토어 (document, selection, components 등)        |
| `protocol/types.ts`              | Shell↔Canvas 통신 인터페이스 (CanvasMethods, ShellMethods) |
| `components/Toolbar.tsx`         | 도구 선택, 줌, 컴포넌트 메뉴                               |
| `components/LayersPanel.tsx`     | 노드 트리, 순서 변경, 가시성/잠금 토글                     |
| `components/PropertiesPanel.tsx` | 스타일 편집, 코드 프리뷰                                   |

### editor-canvas

| 파일                          | 역할                             |
| ----------------------------- | -------------------------------- |
| `renderer/CanvasRenderer.tsx` | NodeData → React 컴포넌트 렌더링 |
| `renderer/NodeWrapper.tsx`    | 선택/드래그/리사이즈 인터랙션    |

### editor-components

| 파일                   | 역할                                            |
| ---------------------- | ----------------------------------------------- |
| `primitives/index.tsx` | Frame, Text, Flex 등 기본 컴포넌트 + 레지스트리 |

---

## 핵심 상태

**Source of Truth**: `document: DocumentNode`

```typescript
interface NodeData {
	id: string
	type: string // 'Frame', 'Text', 'Flex', '__INSTANCE__'
	props?: Record<string, unknown>
	style?: CSSProperties
	children?: NodeData[] | string
	visible?: boolean
	locked?: boolean
}

interface DocumentNode extends NodeData {
	meta?: { name?: string; createdAt?: string }
}
```

**EditorState**:

| 상태       | 타입                  | 설명                                   |
| ---------- | --------------------- | -------------------------------------- |
| document   | DocumentNode          | 노드 트리 (source of truth)            |
| components | ComponentDefinition[] | 정의된 컴포넌트들                      |
| selection  | string[]              | 선택된 노드 ID들                       |
| hoveredId  | string \| null        | 호버 중인 노드                         |
| activeTool | EditorTool            | 현재 도구 (select, frame, text, shape) |
| zoom       | number                | 줌 레벨                                |

---

## 통신 프로토콜 (Penpal)

Shell과 Canvas는 Penpal을 통해 양방향 통신. `methods`는 "상대방이 호출할 함수"를 정의.

| 방향           | 용도        | 설명                                    |
| -------------- | ----------- | --------------------------------------- |
| Shell → Canvas | 상태 동기화 | 문서, 선택, 줌 등 전체 상태 전달        |
| Canvas → Shell | 이벤트 전달 | 포인터/키보드 raw 이벤트를 Shell로 전달 |

**Canvas는 상태를 직접 변경하지 않음**. 이벤트만 Shell에 알리고, Shell이 상태 업데이트 후 다시 동기화.

---

## 이벤트 시스템

Shell이 모든 이벤트의 중앙 처리자. Canvas와 Shell 어디서 발생하든 동일한 흐름으로 처리.

```
┌─────────────────────────────────────────────────────────────────┐
│ Shell                                                           │
│                                                                 │
│  Canvas/Shell 이벤트                                            │
│        │                                                        │
│        ▼                                                        │
│  ┌──────────┐                                                   │
│  │ EventBus │  ← Pub/Sub 중앙 허브                              │
│  └────┬─────┘                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐                                                │
│  │ EventRouter │  ← 이벤트 종류에 따라 분기                      │
│  └──────┬──────┘                                                │
│         │                                                       │
│    ┌────┴────┐                                                  │
│    ▼         ▼                                                  │
│ 키보드     포인터                                                │
│    │         │                                                  │
│    ▼         ▼                                                  │
│ Keybinding  Tool                                                │
│ Registry    Registry                                            │
│    │         │                                                  │
│    ▼         │                                                  │
│ Command     현재 Tool에                                          │
│ Registry    위임                                                 │
│    │         │                                                  │
│    └────┬────┘                                                  │
│         ▼                                                       │
│      Store 업데이트 → syncState → Canvas                        │
└─────────────────────────────────────────────────────────────────┘
```

### 키보드 이벤트 흐름

```
키 입력 → EventBus → KeybindingRegistry(키 매칭) → CommandRegistry(실행)
```

### 포인터 이벤트 흐름

```
클릭/드래그 → EventBus → ToolRegistry → 현재 활성 Tool이 처리
```

---

## Tool 시스템

Strategy 패턴. 활성 Tool에 따라 같은 이벤트를 다르게 처리.

| Tool   | 포인터 다운 동작       |
| ------ | ---------------------- |
| Select | 노드 선택, 드래그 시작 |
| Frame  | 새 Frame 그리기 시작   |
| Text   | 새 Text 노드 생성      |

**Tool 추가**: Tool 인터페이스 구현 후 ToolRegistry에 등록.

---

## Command 시스템

Command 패턴. 액션을 객체로 정의하여 단축키, 메뉴, 툴바에서 재사용.

```
Command 예시: history:undo, history:redo, node:delete, selection:clear
```

**Keybinding**: 키 조합 → Command ID 매핑

```
Cmd+Z → history:undo
Delete → node:delete (선택된 노드 있을 때만)
Escape → selection:clear
```

**Command/Keybinding 추가**:

1. Command 함수 정의 후 CommandRegistry에 등록
2. keybindings/defaults.ts에 키 매핑 추가

---

## 컴포넌트/인스턴스 시스템

**ComponentDefinition**: 재사용 가능한 노드 템플릿

```typescript
interface ComponentDefinition {
	id: string
	name: string
	root: NodeData // 템플릿 노드
	createdAt: string
}
```

**InstanceNode**: 컴포넌트를 참조하는 노드

```typescript
interface InstanceNode {
	id: string
	type: "__INSTANCE__"
	componentId: string // 참조할 컴포넌트 ID
	style?: CSSProperties
	overrides?: { [nodeId: string]: { props?; style?; children? } }
}
```

렌더링 시 `componentId`로 ComponentDefinition 찾아서 `root`를 렌더링.

---

## Codegen

```typescript
serializeNode(node) // NodeData → JSX 문자열
serializeDocument(node) // NodeData → React 컴포넌트 문자열
```

```typescript
// 입력
{ type: 'div', style: { padding: 16 }, children: 'Hello' }

// serializeNode 출력
<div style={{ padding: 16 }}>Hello</div>

// serializeDocument 출력
export function Component() {
  return (
    <div style={{ padding: 16 }}>Hello</div>
  );
}
```

---

## 외부 라이브러리

| 라이브러리   | 용도                    |
| ------------ | ----------------------- |
| zustand      | 상태 관리               |
| penpal       | iframe 양방향 통신      |
| re-resizable | 노드 리사이즈           |
| @dnd-kit     | LayersPanel 드래그 정렬 |
