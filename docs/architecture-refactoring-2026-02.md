# 에디터 Shell/Canvas 아키텍처 리팩토링 상세 기록

## 근본 원인

에디터 상태에 접근하는 **단일 계층(Single Entry Point)이 없었다.**

비-React 코드(PointerStateMachine, SelectTool, nodePosition 등)가 각자 `useEditorStore.getState()`, `receiver`, `commandHistory`, `canvasRef` 등을 직접 import해서 사용하고 있었고, 이로 인해 5가지 구조적 문제가 발생했다.

---

## 문제 #1: 의존성 분산 — 모든 곳에서 모든 것에 직접 접근

### 문제 상황

`PointerStateMachine`이 4개의 서로 다른 모듈을 직접 import하고 있었다:

```ts
// PointerStateMachine.ts (변경 전)
import { commandHistory, receiver, ResizeNodeCommand } from "../commands"
import { useEditorStore } from "../store/editor"

export class PointerStateMachine {
  private canvasRef: AsyncMethodReturns<CanvasMethods> | null = null

  async handlePointerDown(e: PointerEvent) {
    const nodeId = useEditorStore.getState().selection[0]    // store 직접 접근
    const node = receiver.findNode(nodeId)                    // receiver 직접 접근
    // ...
  }

  async handlePointerMove(e: PointerEvent) {
    const zoom = useEditorStore.getState().zoom               // store 직접 접근
    this.canvasRef?.updateDragPosition(...)                    // canvasRef 직접 접근
    commandHistory.execute(command)                            // commandHistory 직접 접근
  }
}

export const pointerStateMachine = new PointerStateMachine()  // 싱글톤
```

`tools/index.ts`도 마찬가지로 모듈 레벨에서 모든 의존성을 직접 조립:

```ts
// tools/index.ts (변경 전)
import { commandHistory, receiver } from "../commands"
import { useEditorStore } from "../store/editor"

const toolService = new ToolServiceImpl(useEditorStore, commandHistory, receiver)
```

**결과:** 새로운 기능을 추가할 때마다 어떤 모듈에서 뭘 가져와야 하는지 추적이 어렵고, 같은 데이터에 대해 서로 다른 경로로 접근하는 코드가 곳곳에 산재.

### 해결: EditorService — 단일 데이터 접근 계층

```ts
// services/EditorService.ts (신규)
export class EditorService {
  private canvasRef: AsyncMethodReturns<CanvasMethods> | null = null

  constructor(
    private readonly store: typeof useEditorStore,
    private readonly commandHistory: CommandHistory,
    private readonly receiver: EditorReceiver,
  ) {}

  // Canvas RPC
  async hitTest(x: number, y: number) { ... }

  // 읽기
  findNode(id: string): SceneNode | null { return this.receiver.findNode(id) }
  getZoom() { return this.store.getState().zoom }
  getSelection() { return this.store.getState().selection }

  // 쓰기
  setSelection(ids: string[]) { this.store.getState().setSelection(ids) }
  setHoveredId(id: string | null) { ... }
  setDragPreview(preview: {...} | null) { ... }

  // Command 실행
  executeCommand(cmd: Command) { this.commandHistory.execute(cmd) }
  beginTransaction() { ... }
  commitTransaction() { ... }
}
```

**조립은 App.tsx에서 한 번만:**

```ts
// App.tsx (변경 후)
const editorService = new EditorService(useEditorStore, commandHistory, receiver)
initTools(editorService)
const pointerMachine = createPointerMachine(editorService)
```

**규칙:**

- React 컴포넌트 → `useEditorStore` hook (구독 + 읽기)
- 순수 유틸 함수 → 데이터를 **인자로** 받음
- 비-React 로직 → `EditorService` (유일한 진입점)

---

## 문제 #2: 수동 상태 관리 — if 분기 폭발 + 불가능한 상태 발생

### 문제 상황

`PointerStateMachine`이 문자열 enum으로 상태를 관리:

```ts
// PointerStateMachine.ts (변경 전)
type PointerState = "idle" | "pending" | "dragging" | "resizing"

export class PointerStateMachine {
  private state: PointerState = "idle"
  private pending: PendingInfo | null = null
  private drag: DragInfo | null = null
  private resize: ResizeInfo | null = null

  async handlePointerMove(e: PointerEvent) {
    if (this.state === "pending" && this.pending) { ... }
    if (this.state === "dragging" && this.drag?.nodeId) { ... }
    if (this.state === "resizing" && this.resize) { ... }
    if (this.state === "idle") { ... }
  }
}
```

**문제점:**

1. **상태와 데이터가 분리됨**: `state`가 `"dragging"`인데 `drag`가 `null`인 불가능한 상태가 타입 시스템에서 허용됨
2. **전이 규칙이 코드에 흩어짐**: 어떤 상태에서 어떤 이벤트를 받으면 어디로 가는지가 if/else 체인 속에 묻힘
3. **더블클릭 감지 불가**: 클릭/더블클릭 구분을 위한 타이머 상태를 추가하려면 `state` 문자열과 `setTimeout`을 수동으로 관리해야 함
4. **확장성 부족**: 새로운 상태(예: 마키 선택, 펜 드로잉)를 추가하려면 모든 핸들러의 if 분기를 건드려야 함

### 해결: XState Hierarchical State Machine

```
pointer (XState HSM)
  ├─ idle
  │    POINTER_MOVE → updateHover
  │    POINTER_DOWN + isResizeHandle → active.resizing
  │    POINTER_DOWN → hitTesting
  │
  ├─ hitTesting (async hitTest 결과 대기)
  │    HIT_TEST_DONE → active.pending
  │
  ├─ active (부모 상태)
  │    ├─ pending
  │    │    POINTER_MOVE + exceedsThreshold → dragging
  │    │    POINTER_UP → clicking
  │    ├─ dragging
  │    │    POINTER_MOVE → updateDragPreview
  │    │    POINTER_UP → commitDrag → idle
  │    └─ resizing
  │         POINTER_MOVE → updateResize
  │         POINTER_UP → idle
  │
  └─ clicking
       └─ awaitingSecond
            after 300ms → singleClick → idle
            POINTER_DOWN → doubleClick → idle
```

**핵심 변경:**

1. **상태와 데이터가 결합됨** — context에 현재 상태에 필요한 모든 데이터가 assign으로 관리:

```ts
context: {
  startX, startY, nodeId, pointerId,
  shiftKey, metaKey, target,
  initialNodePosition,          // dragging 상태에서만 의미 있음
  startWidth, startHeight,      // resizing 상태에서만 의미 있음
  resizeHandle,
}
```

2. **전이 로직과 사이드이펙트가 완전 분리** — actions 객체에 모든 side effect가 선언적으로 정의되고, 상태 기계는 "언제 뭘 호출하는지"만 기술:

```ts
actions: {
  updateHover:      (_, params) => editorService.hitTest(...).then(id => editorService.setHoveredId(id)),
  updateDragPreview:(ctx, params) => editorService.setDragPreview({ nodeId, dx, dy }),
  commitDrag:       (ctx, params) => { editorService.setDragPreview(null); ... toolRegistry.handleDragEnd(...) },
  singleClick:      (ctx) => toolRegistry.handleClick(ctx.nodeId, { ... }),
  doubleClick:      (ctx) => toolRegistry.handleClick(ctx.nodeId, { ... }),
}
```

3. **async hitTest를 상태로 모델링** — 기존에는 `await this.canvasRef?.hitTest()`로 async 호출을 메서드 내부에서 처리했지만, XState에서는 `hitTesting` 중간 상태를 도입하여 `HIT_TEST_DONE` 이벤트로 결과를 받음. 이렇게 하면 hitTest 진행 중에 다른 이벤트가 들어와도 상태 기계가 올바르게 무시할 수 있음.

4. **더블클릭 감지** — `after` (delayed transition)를 사용해 300ms 타이머를 선언적으로 처리:

```ts
clicking: {
  initial: "awaitingSecond",
  states: {
    awaitingSecond: {
      after: { DOUBLE_CLICK_TIMEOUT: { target: "#pointer.idle", actions: "singleClick" } },
      on:    { POINTER_DOWN: { target: "#pointer.idle", actions: "doubleClick" } },
    },
  },
}
```

---

## 문제 #3: 불순 유틸 함수 — receiver를 직접 import하는 nodePosition

### 문제 상황

```ts
// nodePosition.ts (변경 전)
import { receiver } from "../commands"

export function getAbsolutePosition(nodeId: string): { x: number; y: number } {
	const pageId = receiver.getCurrentPageId() // 전역 싱글톤 직접 접근
	while (currentId !== pageId) {
		const node = receiver.findNode(currentId) // 전역 싱글톤 직접 접근
		const location = receiver.findNodeLocation(currentId)
		// ...
	}
}
```

이 함수를 호출하는 `SelectTool`도 같은 패턴:

```ts
// SelectTool.ts (변경 전 — 파일 내부에 중복된 getAbsolutePosition)
function getAbsolutePosition(service: ToolService, nodeId: string) {
	const pageId = service.getCurrentPageId()
	while (currentId !== pageId) {
		const node = service.findNode(currentId)
		// ...
	}
}
```

**문제점:**

1. **같은 로직이 두 곳에 존재**: `nodePosition.ts`와 `SelectTool.ts`에 각각 다른 시그니처로 동일한 절대 좌표 계산 로직이 중복
2. **테스트 불가**: receiver 싱글톤에 의존하므로 단위 테스트에서 mock이 어려움
3. **호출 시점의 데이터 불일치**: 함수 호출 시점에 receiver가 반환하는 page와, React가 렌더링에 사용하는 page가 다를 수 있음

### 해결: 순수 함수로 변환

```ts
// nodePosition.ts (변경 후)
export function getAbsolutePosition(nodeId: string, page: PageNode): { x: number; y: number } {
	while (currentId !== page.id) {
		const node = findNodeInPage(page, currentId) // 로컬 헬퍼
		const parentId = findParentId(page, currentId) // 로컬 헬퍼
		// ...
	}
}

export function getNodeScreenRect(nodeId: string, zoom: number, page: PageNode): Rect | null {
	// page를 인자로 받아서 순수하게 계산
}
```

SelectTool에서의 중복 제거:

```ts
// SelectTool.ts (변경 후)
import { getAbsolutePosition } from "../utils/nodePosition"

const page = receiver.getCurrentPage()
const oldParentAbs = getAbsolutePosition(location.parentId, page) // 순수 함수 호출
const newParentAbs = getAbsolutePosition(newParentId, page)
```

---

## 문제 #4: 빈 구독 패턴 — ToolManagerOverlay

### 문제 상황

```tsx
// ToolManagerOverlay.tsx (변경 전)
export function ToolManagerOverlay() {
	const selection = useEditorStore((s) => s.selection)
	const zoom = useEditorStore((s) => s.zoom)
	useEditorStore((s) => s.document) // ← 빈 구독: 리턴값을 사용하지 않음

	const rect = getNodeScreenRect(nodeId, zoom) // receiver 내부 접근
}
```

**문제점:**

1. `s.document`를 구독하지만 반환값을 사용하지 않음 — document 객체의 어떤 부분이 변경되든 전체 리렌더 발생
2. 실제 필요한 데이터는 "현재 페이지"인데, document 전체를 구독하므로 다른 페이지 변경에도 리렌더
3. `getNodeScreenRect`가 내부에서 receiver를 통해 데이터를 읽으므로, React가 "왜 이 컴포넌트가 리렌더되는지" 추적할 수 없음

### 해결: 실제 사용하는 데이터만 구독 + 순수 함수에 직접 전달

```tsx
// ToolManagerOverlay.tsx (변경 후)
export function ToolManagerOverlay() {
	const selection = useEditorStore((s) => s.selection)
	const zoom = useEditorStore((s) => s.zoom)
	const page = useEditorStore((s) => s.document.children.find((p) => p.id === s.currentPageId))

	// 순수 함수에 page 직접 전달 — receiver 접근 없음
	const rect = getNodeScreenRect(nodeId, zoom, page)
}
```

**효과:**

- 구독 범위가 "현재 페이지"로 좁아짐
- getNodeScreenRect이 순수 함수가 되면서 데이터 흐름이 투명해짐
- React의 구독 시스템이 정확한 의존성을 추적 가능

---

## 문제 #5: 이중 렌더링 경로 — Canvas에서 드래그 프리뷰를 CSS로 처리

### 문제 상황

```ts
// Canvas App.tsx (변경 전)
const dragOverridesRef = useRef<Map<string, { x: number; y: number }>>(new Map())
const dragStyleRef = useRef<HTMLStyleElement | null>(null)

// Shell → Canvas RPC
updateDragPosition(nodeId: string, position: { x: number; y: number }) {
  dragOverridesRef.current.set(nodeId, position)
  // CSS rule 삽입: [data-node-id="id"] { transform: translate(x, y); }
  dragStyleRef.current.textContent = rules
}
```

```ts
// PointerStateMachine.ts (변경 전)
if (this.state === "dragging" && this.drag?.nodeId) {
	this.canvasRef?.updateDragPosition(this.drag.nodeId, { x: dx, y: dy })
}
```

**문제점:**

1. **두 가지 렌더링 경로**: 정적 렌더링은 React, 드래그 중에는 CSS transform override. Canvas가 순수 렌더러가 아닌 "렌더러 + 드래그 시각화" 역할을 겸함
2. **드랍 위치 버그**: Canvas 내에서 노드가 CSS transform으로 이동하면, `elementFromPoint` hitTest가 이동된 위치의 노드를 감지함. 이 때문에 "자기 자신 위에 드랍" 같은 잘못된 reparent가 발생
3. **syncState 타이밍 문제**: `syncState()`가 호출되면 `dragOverridesRef`를 clear하면서 드래그 중인 노드가 순간적으로 원래 위치로 돌아감

### 해결: 드래그 프리뷰를 Shell 오버레이로 이동

**Canvas에서 제거한 것:**

- `dragOverridesRef`, `dragStyleRef`, `updateDragStyleTag` — 전부 제거
- `<style id="drag-overrides">` 엘리먼트 — 제거
- `updateDragPosition` Penpal 메서드 — 프로토콜에서도 제거

**Shell에 추가한 것:**

Store에 드래그 상태:

```ts
// EditorState (변경 후)
dragPreview: { nodeId: string; dx: number; dy: number } | null
```

Shell 오버레이에서 렌더링:

```tsx
// DragPreview.tsx (신규)
export function DragPreview({ nodeId, dx, dy, zoom, page }: DragPreviewProps) {
	const rect = getNodeScreenRect(nodeId, zoom, page)
	return (
		<div
			style={{
				transform: `translate(${rect.x + dx * zoom}px, ${rect.y + dy * zoom}px)`,
				outline: "2px solid #0d99ff",
				pointerEvents: "none", // hitTest에 영향 없음
			}}
		/>
	)
}
```

**효과:**

- Canvas는 진짜 순수 렌더러가 됨 (syncState로 받은 데이터만 렌더링)
- 드래그 중에도 Canvas 노드는 원래 위치에 있으므로 hitTest가 올바른 드랍 타겟을 반환
- `syncState` 호출에 드래그 상태가 영향을 받지 않음

### reparent 가드 강화

Canvas에서 드래그 노드가 원래 위치에 있으므로 hitTest가 자연스럽게 올바른 결과를 반환하지만, 방어적으로 SelectTool에 3가지 가드 추가:

```ts
// SelectTool.ts (변경 후)
if (isReparent) {
	if (newParentId === nodeId) return // 1. 자기 자신 안으로 불가
	const targetNode = this.service.findNode(newParentId)
	if (!targetNode) return
	if (targetNode.type === "text") return // 2. text 노드는 컨테이너 아님
	// 3. 조상 체크는 store.reparentNode 내부의 isAncestorOf에서 이미 처리
}
```

---

## 변경 파일 요약

| 파일                                        | 변경 유형                                   | 관련 문제 |
| ------------------------------------------- | ------------------------------------------- | --------- |
| `services/EditorService.ts`                 | 신규                                        | #1        |
| `tools/ToolServiceImpl.ts`                  | 수정: EditorService 래핑으로 변경           | #1        |
| `tools/index.ts`                            | 수정: 모듈 레벨 초기화 → `initTools()` 함수 | #1        |
| `interaction/pointerMachine.ts`             | 신규 (XState HSM)                           | #2        |
| `interaction/PointerStateMachine.ts`        | 삭제                                        | #2        |
| `utils/nodePosition.ts`                     | 수정: 순수 함수화 (page 인자)               | #3        |
| `components/overlay/ToolManagerOverlay.tsx` | 수정: 빈 구독 제거 + page 직접 전달         | #4        |
| `components/overlay/DragPreview.tsx`        | 신규                                        | #5        |
| `editor-canvas/src/App.tsx`                 | 수정: 드래그 관련 코드 전부 제거            | #5        |
| `editor-core/types/protocol.ts`             | 수정: `updateDragPosition` 제거             | #5        |
| `editor-core/types/editor.ts`               | 수정: `dragPreview` + `setDragPreview` 추가 | #5        |
| `store/editor.ts`                           | 수정: `dragPreview` 상태 + setter 추가      | #5        |
| `tools/SelectTool.ts`                       | 수정: 순수 함수 사용 + reparent 가드 강화   | #3, #5    |
| `App.tsx`                                   | 수정: Composition Root (EditorService 조립) | #1, #2    |

## 데이터 접근 규칙 (변경 후)

```
┌─────────────────────────────────────────────────┐
│                  React 컴포넌트                   │
│  useEditorStore((s) => s.selection)  ← hook 구독  │
│  getNodeScreenRect(nodeId, zoom, page) ← 순수 함수 │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│              비-React 로직 (Tools, FSM)           │
│  editorService.getSelection()                    │
│  editorService.findNode(id)                      │
│  editorService.executeCommand(cmd)               │
│  editorService.hitTest(x, y)                     │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│           EditorService (유일한 진입점)            │
│  ┌───────┐ ┌──────────────┐ ┌────────┐ ┌──────┐ │
│  │ Store │ │ CommandHistory│ │Receiver│ │Canvas│ │
│  └───────┘ └──────────────┘ └────────┘ └──────┘ │
└─────────────────────────────────────────────────┘
```
