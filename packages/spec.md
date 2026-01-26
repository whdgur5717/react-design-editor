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

| 파일 | 역할 |
|------|------|
| `types/node.ts` | NodeData, DocumentNode, Position, Size, ComponentDefinition, InstanceNode |
| `types/editor.ts` | EditorState, EditorActions, EditorStore |
| `codegen/serialize.ts` | NodeData → JSX 코드 문자열 변환 |

### editor-shell

| 파일 | 역할 |
|------|------|
| `store/editor.ts` | Zustand 스토어 (document, selection, components 등) |
| `protocol/types.ts` | Shell↔Canvas 통신 인터페이스 (CanvasMethods, ShellMethods) |
| `components/Toolbar.tsx` | 도구 선택, 줌, 컴포넌트 메뉴 |
| `components/LayersPanel.tsx` | 노드 트리, 순서 변경, 가시성/잠금 토글 |
| `components/PropertiesPanel.tsx` | 스타일 편집, 코드 프리뷰 |

### editor-canvas

| 파일 | 역할 |
|------|------|
| `renderer/CanvasRenderer.tsx` | NodeData → React 컴포넌트 렌더링 |
| `renderer/NodeWrapper.tsx` | 선택/드래그/리사이즈 인터랙션 |

### editor-components

| 파일 | 역할 |
|------|------|
| `primitives/index.tsx` | Frame, Text, Flex 등 기본 컴포넌트 + 레지스트리 |

---

## 핵심 상태

**Source of Truth**: `document: DocumentNode`

```typescript
interface NodeData {
  id: string;
  type: string;              // 'Frame', 'Text', 'Flex', '__INSTANCE__'
  props?: Record<string, unknown>;
  style?: CSSProperties;
  children?: NodeData[] | string;
  visible?: boolean;
  locked?: boolean;
}

interface DocumentNode extends NodeData {
  meta?: { name?: string; createdAt?: string; };
}
```

**EditorState**:

| 상태 | 타입 | 설명 |
|------|------|------|
| document | DocumentNode | 노드 트리 (source of truth) |
| components | ComponentDefinition[] | 정의된 컴포넌트들 |
| selection | string[] | 선택된 노드 ID들 |
| hoveredId | string \| null | 호버 중인 노드 |
| activeTool | EditorTool | 현재 도구 (select, frame, text, shape) |
| zoom | number | 줌 레벨 |

---

## 통신 프로토콜 (Penpal)

**Shell → Canvas** (`CanvasMethods`):
- `syncState(document, components)` - 상태 동기화
- `selectNodes(ids)` - 선택 상태 동기화
- `setZoom(zoom)` - 줌 동기화

**Canvas → Shell** (`ShellMethods`):
- `onNodeClicked(id, shiftKey)` - 노드 클릭
- `onNodeHovered(id | null)` - 호버 변경
- `onNodeMoved(id, position)` - 드래그 이동
- `onNodeResized(id, size)` - 리사이즈

---

## 데이터 흐름

### 속성 편집 (PropertiesPanel)

```
input 변경 → updateNode(id, { style }) → Zustand 업데이트
→ useEffect에서 canvas.syncState() → Canvas 리렌더
```

### 드래그 (Canvas)

```
mouseDown → window에 mousemove 리스너 등록
→ mousemove → onNodeMoved(id, position)
→ Shell의 moveNode() → document 업데이트
→ syncState → Canvas 리렌더
```

---

## 컴포넌트/인스턴스 시스템

**ComponentDefinition**: 재사용 가능한 노드 템플릿

```typescript
interface ComponentDefinition {
  id: string;
  name: string;
  root: NodeData;       // 템플릿 노드
  createdAt: string;
}
```

**InstanceNode**: 컴포넌트를 참조하는 노드

```typescript
interface InstanceNode {
  id: string;
  type: '__INSTANCE__';
  componentId: string;  // 참조할 컴포넌트 ID
  style?: CSSProperties;
  overrides?: { [nodeId: string]: { props?, style?, children? } };
}
```

렌더링 시 `componentId`로 ComponentDefinition 찾아서 `root`를 렌더링.

---

## Codegen

```typescript
serializeNode(node)      // NodeData → JSX 문자열
serializeDocument(node)  // NodeData → React 컴포넌트 문자열
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

| 라이브러리 | 용도 |
|-----------|------|
| zustand | 상태 관리 |
| penpal | iframe 양방향 통신 |
| re-resizable | 노드 리사이즈 |
| @dnd-kit | LayersPanel 드래그 정렬 |
