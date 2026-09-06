# Editor Runtime Service Migration

## 목적

이 문서는 `packages/editor-shell/src/services/Editor.ts`를 중심으로 한 editor runtime 구조를 어떻게 정리할지 설명합니다.

핵심 목표는 `Editor` class에 모여 있는 상태 접근, 상태 변경 규칙, tool/action/keybinding 등록, pointer machine lifecycle을 분리하고, 각 책임이 어떤 경로로 호출되는지 명확하게 만드는 것입니다.

이 문서는 구현 diff가 아닙니다. 마이그레이션 시 어떤 구조를 목표로 삼아야 하는지 설명하는 설계 문서입니다.

## 현재 문제

현재 `Editor` class는 다음 책임을 동시에 가집니다.

```text
Editor
  - store 생성
  - receiver 생성
  - commandHistory 생성
  - toolRegistry 생성
  - actionRegistry 생성
  - keybindingRegistry 생성
  - built-in tool 등록
  - built-in action 등록
  - pointer machine actor 생성
  - document/session/viewport/geometry method 제공
```

현재 구조의 대표적인 문제는 `Editor`가 상태 관리자처럼 보이지만, 실제로는 내부 구현을 public field로 노출한다는 점입니다.

```ts
export class Editor {
	readonly store: EditorStoreApi
	readonly commandHistory: CommandHistory
	readonly receiver: EditorReceiverImpl
	readonly toolRegistry: ToolRegistry
	readonly actionRegistry: ActionRegistry
	readonly keybindingRegistry: KeybindingRegistry
}
```

이 구조에서는 외부 코드가 `editor.store.getState().updateNode(...)`처럼 `Editor`의 규칙을 우회할 수 있습니다.

## 현재 구조와 목표 구조

| 현재 위치                                        | 현재 역할                        | 목표 위치                                                  |
| ------------------------------------------------ | -------------------------------- | ---------------------------------------------------------- |
| `Editor.store`                                   | Zustand store 직접 노출          | `EditorStateRepository` 내부 구현                          |
| `Editor.receiver`                                | document read/write gateway      | `DocumentService`와 `DocumentRead/MutationRepository`      |
| `Editor.commandHistory`                          | undo/redo stack                  | `HistoryService`                                           |
| `editor.store.getState().updateNode(...)`        | demo/test 초기 document 구성     | `createEditor({ document })` 또는 `DocumentSessionService` |
| `Editor.setSelection()`                          | selection session state 변경     | `SelectionService`                                         |
| `Editor.setZoom()` / `setPan()`                  | viewport state 변경              | `ViewportService`                                          |
| `Editor.setNodeRectsCache()` / `hitTestNodeId()` | geometry cache와 hit test        | `GeometryService`                                          |
| `Editor.toolRegistry`                            | tool 등록과 active tool dispatch | extension contribution으로 설치되는 `ToolRegistry`         |
| `Editor.actionRegistry`                          | action id 실행                   | extension contribution으로 설치되는 `ActionRegistry`       |
| `Editor.keybindingRegistry`                      | keybinding match                 | extension contribution으로 설치되는 `KeybindingRegistry`   |
| `Editor.pointerActor`                            | XState actor lifecycle           | `InteractionRuntime`                                       |

## 설계 원칙

마이그레이션의 기준은 다음과 같습니다.

```text
1. Store 생성은 Editor class 밖에서 수행합니다.
2. 외부 read/subscription은 EditorStateApi로 제한합니다.
3. Service read/write는 repository interface를 통해 수행합니다.
4. 사용자 편집 document 변경은 history/command 경로를 통과합니다.
5. 초기 document 구성과 document load/reset은 DocumentSessionService 경로를 사용합니다.
6. Tool/action/keybinding은 extension contribution으로 등록합니다.
7. Pointer machine은 Editor 전체가 아니라 InteractionRuntimeDeps만 사용합니다.
8. 외부에 공개되는 editor object는 안정적인 API만 노출합니다.
9. 하위호환 wrapper를 유지하지 않습니다. 기존 internal public field와 우회 API는 새 API로 교체한 뒤 제거합니다.
```

## 계층 구조

목표 구조는 다음과 같습니다.

```text
createEditor()
  -> Composition Root
      -> createEditorStore()
      -> EditorStateRepository
      -> Services
      -> Registries
      -> ExtensionInstaller
      -> InteractionRuntime
      -> Editor API object
```

각 계층의 역할은 다음과 같습니다.

```text
Editor API object
  - 외부 소비자가 사용하는 진입점
  - store/receiver/actor/concrete registry를 노출하지 않음

Composition Root
  - store, repository, service, registry, interaction runtime을 조립
  - built-in extension과 user extension을 설치

EditorStateRepository
  - service가 필요한 state read/write를 담당
  - 외부에 공개하지 않음

EditorStateApi
  - 외부 read/subscription을 담당
  - mutation method를 제공하지 않음

Services
  - 상태 변경 규칙을 담당
  - document, documentSession, selection, viewport, geometry, history로 분리

Registries
  - tool/action/keybinding contribution을 저장하고 조회

InteractionRuntime
  - pointer/key/wheel event를 machine에 전달
  - machine actor lifecycle을 소유

Extensions
  - tool/action/keybinding/component를 하나의 기능 단위로 선언
```

## EditorModel과 Snapshot

Editor 상태의 source of truth는 하나여야 합니다.

별도의 snapshot 상태를 만들고 Zustand state와 동기화하지 않습니다. 대신 하나의 `EditorModel`을 정의하고, Zustand store는 이 모델을 저장하며, 외부 read API는 같은 모델을 readonly 타입으로 바라봅니다.

```text
EditorModel
  - editor 상태의 canonical shape

Zustand store
  - StoreApi<EditorModel>
  - EditorModel을 저장

EditorSnapshot
  - ReadonlyDeep<EditorModel>
  - 외부 읽기 전용 view
```

예시는 다음과 같습니다.

```ts
type EditorModel = {
	document: DocumentNode
	currentPageId: string

	selection: string[]
	hoveredId: string | null
	activeTool: string

	viewport: {
		zoom: number
		pan: { x: number; y: number }
	}

	interaction: {
		dragPreview: DragPreview | null
	}

	geometry: {
		nodeRects: Record<string, NodeRect>
	}
}

type EditorSnapshot = ReadonlyDeep<EditorModel>
type DocumentSnapshot = ReadonlyDeep<DocumentNode>
type PageSnapshot = ReadonlyDeep<PageNode>
type NodeSnapshot = ReadonlyDeep<SceneNode>
```

현재 store type처럼 state와 action을 합친 타입을 외부 read model로 쓰지 않습니다.

```ts
// 피해야 할 형태
type EditorStore = EditorState & EditorActions
```

외부 read API에는 mutation method가 없어야 합니다.

```text
EditorSnapshot에 포함하지 않는 것:
  - updateNode()
  - addNode()
  - removeNode()
  - setSelection()
  - setZoom()
  - setNodeRectsCache()
```

상태 읽기와 구독은 `EditorStateApi`가 담당합니다.

```ts
class EditorStateApi {
	constructor(private readonly store: StoreApi<EditorModel>) {}

	getSnapshot(): EditorSnapshot {
		return this.store.getState() as EditorSnapshot
	}

	subscribe(listener: () => void) {
		return this.store.subscribe(listener)
	}

	select<T>(selector: (snapshot: EditorSnapshot) => T): T {
		return selector(this.getSnapshot())
	}
}
```

React hook은 `editor.store`를 직접 구독하지 않고 `editor.state`를 구독합니다.

```ts
function useEditorState<T>(selector: (snapshot: EditorSnapshot) => T): T {
	const editor = useEditor()

	return useSyncExternalStore(editor.state.subscribe, () => selector(editor.state.getSnapshot()))
}
```

이 방식의 목적은 다음과 같습니다.

```text
1. Zustand store를 public field로 노출하지 않습니다.
2. getter method를 상태마다 만들지 않습니다.
3. React re-render를 위한 subscription source를 유지합니다.
4. 외부 읽기는 selector 기반으로 통일합니다.
5. 외부 쓰기는 service/action API로만 수행합니다.
```

외부 읽기는 selector로 수행합니다.

```ts
const selection = editor.state.select((state) => state.selection)
const zoom = editor.state.select((state) => state.viewport.zoom)
```

외부 쓰기는 service나 action으로 수행합니다.

```ts
editor.selection.set(["root"])
editor.viewport.setZoom(1.25)
editor.document.updateNodeStyle("root", "width", 520)
editor.actions.execute("history:undo")
```

`EditorSnapshot`은 컴파일 타임에 readonly입니다. 런타임 clone/freeze는 이 마이그레이션의 기본 요구사항이 아닙니다.

```ts
const snapshot = editor.state.getSnapshot()

snapshot.selection.push("root")
// Type error

snapshot.viewport.zoom = 2
// Type error
```

Document read API도 같은 기준을 적용합니다. 외부에 반환하는 document/page/node reference는 `ReadonlyDeep` 기반 snapshot 타입으로 노출합니다.

```ts
type DocumentSnapshot = ReadonlyDeep<DocumentNode>
type PageSnapshot = ReadonlyDeep<PageNode>
type NodeSnapshot = ReadonlyDeep<SceneNode>

interface DocumentService {
	getCurrentPage(): PageSnapshot | null
	findNode(id: NodeId): NodeSnapshot | null
}
```

이 문제는 우선 TypeScript 컴파일 타임 보호로만 해결합니다. read path에서 런타임 clone/freeze를 기본으로 수행하지 않습니다.

```ts
const node = editor.document.findNode("root")

node.style.width = 999
// Type error
```

## Repository

Repository 계층은 Zustand store 접근을 service 밖으로 격리하는 state access boundary입니다.

Repository interface는 service가 의존하는 계약입니다. `EditorStateRepository`는 그 repository interface들을 구현하고, 내부에서 Zustand store에 접근하는 concrete adapter입니다.

이 프로젝트에서는 repository 구현체를 섹션별로 여러 개 만들지 않습니다. 저장소가 `StoreApi<EditorModel>` 하나이므로 repository 구현체도 하나로 시작합니다.

용어 기준은 다음과 같습니다.

```text
DocumentReadRepository / SelectionRepository / ViewportRepository
  - service가 store-backed state를 읽고 쓰기 위해 의존하는 좁은 interface
  - 이름은 Repository로 고정

EditorStateRepository
  - 위 repository interface들을 구현하는 concrete adapter
  - 내부에서 Zustand store에 접근
```

```ts
class EditorStateRepository
	implements
		DocumentReadRepository,
		DocumentMutationRepository,
		SelectionRepository,
		InteractionSessionRepository,
		ViewportRepository,
		GeometryRepository
{
	constructor(private readonly store: StoreApi<EditorModel>) {}
}
```

중요한 점은 구현체는 하나지만, service가 받는 타입은 좁은 interface여야 한다는 점입니다.

```ts
interface SelectionRepository {
	getSelectedIds(): string[]
	setSelectedIds(ids: string[]): void
}

interface InteractionSessionRepository {
	getHoveredId(): string | null
	setHoveredId(id: string | null): void
	getDragPreview(): DragPreview | null
	setDragPreview(preview: DragPreview | null): void
}

interface DocumentReadRepository {
	getCurrentPage(): PageSnapshot | null
	findNode(id: string): NodeSnapshot | null
	existsNode(id: string): boolean
}

interface DocumentMutationRepository {
	updateNodeStyle(id: string, style: Partial<CSSProperties>): MutationResult
	updateNodePosition(id: string, position: Position): MutationResult
	reorderNode(parentId: string, fromIndex: number, toIndex: number): MutationResult
	toggleVisibility(id: string): MutationResult
	toggleLocked(id: string): MutationResult
	updateTextContent(id: string, content: unknown): MutationResult
	removeNode(id: string): MutationResult
	addNode(parentId: string, node: SceneNode, index?: number): MutationResult
}

interface DocumentSessionRepository {
	replaceDocument(input: { document: DocumentNode; currentPageId: PageId }): void
	clearTransientState(): void
	resetViewport(): void
}

interface ViewportRepository {
	getZoom(): number
	setZoom(zoom: number): void
	getPan(): { x: number; y: number }
	setPan(x: number, y: number): void
}

interface GeometryRepository {
	getRects(): Record<string, NodeRect>
	setRects(rects: Record<string, NodeRect>): void
	getRenderedRect(id: string): NodeRect | null
}
```

`EditorStateRepository`는 내부에서만 Zustand를 사용합니다.

```ts
class EditorStateRepository implements SelectionRepository, ViewportRepository {
	constructor(private readonly store: StoreApi<EditorModel>) {}

	getSelectedIds() {
		return this.store.getState().selection
	}

	setSelectedIds(ids: string[]) {
		this.store.setState({ selection: ids })
	}

	getZoom() {
		return this.store.getState().viewport.zoom
	}

	setZoom(zoom: number) {
		const current = this.store.getState()
		this.store.setState({
			viewport: {
				...current.viewport,
				zoom,
			},
		})
	}
}
```

규칙은 다음과 같습니다.

```text
store.getState() 호출 가능:
  - EditorStateRepository
  - EditorStateApi

store.getState() 호출 금지:
  - Editor API object
  - Service
  - Tool
  - Action
  - Keybinding
  - Pointer machine
  - React component
```

구분은 다음과 같습니다.

```text
EditorStateApi
  - 외부 read/subscription boundary
  - getSnapshot(), select(), subscribe() 제공
  - state mutation method를 제공하지 않음

EditorStateRepository
  - service mutation boundary
  - service가 요청한 raw read/write를 store에 반영
  - 외부에 공개하지 않음
```

## Services

Service는 상태 변경 규칙을 담당합니다.

Repository가 저장소 접근을 담당한다면, service는 “어떤 상태 변경이 허용되는지”, “어떤 변경은 history를 타야 하는지”, “다른 상태를 읽어 검증해야 하는지”를 담당합니다.

### DocumentService

문서 데이터의 읽기와 undoable document 변경 workflow를 담당합니다.

```ts
interface DocumentService {
	getCurrentPage(): PageSnapshot | null
	findNode(id: NodeId): NodeSnapshot | null
	findNodeLocation(id: NodeId): NodeLocation | null

	updateNodeStyle(id: NodeId, key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]): CommandResult

	updateNodePosition(id: NodeId, position: Position): CommandResult
	reorderNode(parentId: NodeId | PageId, fromIndex: number, toIndex: number): CommandResult
	toggleVisibility(id: NodeId): CommandResult
	toggleLocked(id: NodeId): CommandResult
	applyTextChangeFromCanvas(id: NodeId, content: unknown): CommandResult
	deleteSelectedNodes(): CommandResult
}
```

사용자 편집으로 발생한 document 변경은 service에서 repository를 직접 호출하지 않고 history command를 통과합니다.

Repository는 raw mutation만 담당합니다. `deleteSelectedNodes()`처럼 selection을 읽고 transaction을 구성하는 workflow는 repository에 두지 않습니다.

```ts
class DefaultDocumentService implements DocumentService {
	constructor(
		private readonly document: DocumentReadRepository,
		private readonly mutations: DocumentMutationRepository,
		private readonly selection: SelectionRepository,
		private readonly history: HistoryService,
	) {}

	findNode(id: NodeId) {
		return this.document.findNode(id)
	}

	updateNodeStyle(id: NodeId, key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]) {
		return this.history.execute(new UpdateStyleCommand(this.document, this.mutations, id, { [key]: value }))
	}

	toggleVisibility(id: NodeId) {
		return this.history.execute(new ToggleVisibilityCommand(this.document, this.mutations, id))
	}

	deleteSelectedNodes() {
		const selectedIds = this.selection.getSelectedIds()
		const topLevelIds = filterToTopLevelSelectedNodes(selectedIds, this.document)
		if (topLevelIds.length === 0) return { applied: false, reason: "empty selection" }

		return this.history.transaction("Delete selected nodes", () => {
			for (const id of topLevelIds) {
				this.history.execute(new RemoveNodeCommand(this.document, this.mutations, id))
			}
			this.selection.setSelectedIds([])
		})
	}
}
```

### DocumentSessionService

문서 로딩, 교체, 초기화처럼 editor lifecycle에 속하는 document 반영을 담당합니다.

별도 session store를 만들지 않습니다. `DocumentSessionService`도 같은 `EditorModel`을 대상으로 동작하며, service의 책임만 사용자 편집 workflow와 분리합니다.

`DocumentService`와의 기준은 사용자 편집 여부입니다.

```text
DocumentService
  - 사용자가 편집한 document 변경
  - history/command 대상

DocumentSessionService
  - 저장소에서 읽은 document를 editor state에 올림
  - initial document, import, load, reset 대상
  - history/command 대상 아님
```

예시는 다음과 같습니다.

```ts
interface DocumentSessionService {
	loadDocument(input: { document: DocumentNode; currentPageId?: PageId; resetViewport?: boolean }): void

	resetDocument(): void
}
```

저장된 문서를 다시 여는 흐름은 다음과 같습니다.

```text
persistence.load(documentId)
  -> 저장소에서 document를 읽음
  -> documentSession.loadDocument(...)
  -> repository.replaceDocument(...)
  -> selection/hover/dragPreview/geometry cache 초기화
  -> history.clear()
  -> undo 기록 없음
```

`DocumentSessionService`는 저장소 I/O를 직접 수행하지 않습니다. DB, API, localStorage, file system에서 document를 읽는 책임은 persistence adapter나 persistence service에 둡니다. `DocumentSessionService`는 이미 읽어온 document를 runtime state에 반영하는 책임만 가집니다.

```ts
class DefaultDocumentSessionService implements DocumentSessionService {
	constructor(
		private readonly session: DocumentSessionRepository,
		private readonly history: HistoryService,
		private readonly defaultDocument: () => DocumentNode,
	) {}

	loadDocument(input: { document: DocumentNode; currentPageId?: PageId; resetViewport?: boolean }) {
		const currentPageId = input.currentPageId ?? resolveFirstPageId(input.document)

		this.session.replaceDocument({
			document: input.document,
			currentPageId,
		})

		this.session.clearTransientState()

		if (input.resetViewport !== false) {
			this.session.resetViewport()
		}

		this.history.clear()
	}

	resetDocument() {
		this.loadDocument({
			document: this.defaultDocument(),
			resetViewport: true,
		})
	}
}
```

따라서 demo나 test의 초기 구성도 `editor.store.getState().updateNode(...)`로 처리하지 않습니다.

```ts
const editor = createEditor({
	document: launchCardDocument,
	components,
})
```

이미 생성된 editor에 저장된 document를 다시 올릴 때는 다음 경로를 사용합니다.

```ts
const saved = await persistence.load(documentId)

editor.documentSession.loadDocument({
	document: saved.document,
	currentPageId: saved.currentPageId,
})
```

### SelectionService

선택 상태를 담당합니다.

Selection은 저장/export 대상이 아니며, 일반적으로 undo 대상도 아닙니다.

```ts
interface SelectionService {
	get(): NodeId[]
	set(ids: NodeId[]): void
	toggle(id: NodeId): void
	clear(): void
	contains(id: NodeId): boolean
}
```

SelectionService는 document를 수정하지 않습니다. 다만 존재하지 않는 node id를 선택하지 않도록 document read만 사용할 수 있습니다.

```ts
class DefaultSelectionService implements SelectionService {
	constructor(
		private readonly selection: SelectionRepository,
		private readonly document: Pick<DocumentReadRepository, "existsNode">,
	) {}

	set(ids: NodeId[]) {
		const validIds = ids.filter((id) => this.document.existsNode(id))
		this.selection.setSelectedIds(validIds)
	}

	clear() {
		this.selection.setSelectedIds([])
	}
}
```

### ViewportService

화면을 보는 방식인 zoom/pan을 담당합니다.

```ts
interface ViewportService {
	getZoom(): number
	setZoom(zoom: number): void
	getPan(): { x: number; y: number }
	setPan(x: number, y: number): void
}
```

ViewportService는 document를 수정하지 않습니다.

```ts
class DefaultViewportService implements ViewportService {
	constructor(private readonly viewport: ViewportRepository) {}

	setZoom(zoom: number) {
		this.viewport.setZoom(Math.max(0.1, Math.min(4, zoom)))
	}
}
```

### GeometryService

Canvas가 측정한 node rect cache와 hit test를 담당합니다.

Geometry는 document data가 아닙니다. Canvas render 결과에서 나온 measurement cache입니다.

```ts
interface GeometryService {
	setRects(rects: Record<NodeId, NodeRect>): void
	getRects(): Record<NodeId, NodeRect>
	getRenderedRect(id: NodeId): NodeRect | null
	hitTest(clientX: number, clientY: number): NodeId | null
}
```

Hit test는 geometry rect, current page, viewport 상태를 함께 읽습니다.

```ts
class DefaultGeometryService implements GeometryService {
	constructor(
		private readonly geometry: GeometryRepository,
		private readonly document: Pick<DocumentReadRepository, "getCurrentPage">,
		private readonly viewport: ViewportRepository,
	) {}

	hitTest(clientX: number, clientY: number) {
		const page = this.document.getCurrentPage()
		if (!page) return null

		const rects = this.geometry.getRects()
		const zoom = this.viewport.getZoom()
		const pan = this.viewport.getPan()

		return hitTestNodeIdInPage(page, rects, zoom, pan.x, pan.y, clientX, clientY)
	}
}
```

## Tool, Action, Keybinding

Tool/action/keybinding은 상태 저장 계층이 아닙니다.

역할은 사용자 입력이나 명령을 service 호출로 변환하는 것입니다.

```text
Tool
  - 현재 편집 모드에서 pointer event를 해석

Action
  - 실행 가능한 action id와 handler

Keybinding
  - keyboard event를 action id로 변환
```

Action과 Command는 다른 개념입니다.

```text
Action
  - UI, keybinding, tool에서 실행하는 명령 진입점
  - ActionRegistry에 action id와 handler로 등록
  - undo stack에 직접 들어가지 않음

Command
  - undo/redo가 가능한 history 단위
  - HistoryService가 실행하고 stack에 기록
  - document 변경을 되돌리기 위한 execute/undo 구현
```

예시는 다음과 같습니다.

```text
node.delete action
  -> DocumentService.deleteSelectedNodes()
  -> HistoryService.execute(RemoveNodeCommand)
  -> Command가 undo stack에 기록됨

history.undo action
  -> HistoryService.undo()
  -> 새 Command를 만들지 않음
```

최종 호출 흐름은 다음과 같습니다.

```text
Pointer event
  -> InteractionRuntime
  -> pointer machine
  -> active Tool
  -> Service
  -> Repository
  -> Store

Keyboard event
  -> InteractionRuntime
  -> KeybindingRegistry.match()
  -> ActionRegistry.execute()
  -> Service
  -> Repository
  -> Store
```

Tool은 repository를 직접 호출하지 않습니다.

```ts
class SelectTool implements Tool {
	constructor(
		private readonly ctx: {
			selection: SelectionService
		},
	) {}

	onClick(nodeId: NodeId | null, payload: ClickPayload) {
		if (!nodeId) {
			this.ctx.selection.clear()
			return
		}

		if (payload.shiftKey) {
			this.ctx.selection.toggle(nodeId)
			return
		}

		this.ctx.selection.set([nodeId])
	}
}
```

Action도 repository를 직접 호출하지 않습니다.

```ts
actions.register({
	id: "node.delete",
	run: (ctx) => ctx.services.document.deleteSelectedNodes(),
})
```

## Extension Contribution

Tool, action, keybinding을 각각 다른 파일에서 수동 등록하지 않습니다.

하나의 기능이 필요한 contribution을 한곳에서 선언합니다.

```ts
type EditorExtension = {
	id: string
	contributes: EditorContribution[]
	activate?: (ctx: ExtensionContext) => Disposable | void
}

type EditorContribution = ToolContribution | ActionContribution | KeybindingContribution | ComponentContribution
```

예를 들어 select tool은 tool, action, keybinding을 함께 제공합니다.

```ts
const selectExtension: EditorExtension = {
	id: "builtin.select",
	contributes: [
		{
			type: "tool",
			id: "select",
			label: "Select",
			create: (ctx) =>
				new SelectTool({
					selection: ctx.services.selection,
				}),
		},
		{
			type: "action",
			id: "tool.select",
			run: (ctx) => ctx.registries.tools.activate("select"),
		},
		{
			type: "keybinding",
			key: "v",
			action: "tool.select",
			when: "editor.focused",
		},
	],
}
```

History 기능은 tool 없이 action과 keybinding만 제공합니다.

```ts
const historyExtension: EditorExtension = {
	id: "builtin.history",
	contributes: [
		{
			type: "action",
			id: "history.undo",
			run: (ctx) => ctx.services.history.undo(),
			isEnabled: (ctx) => ctx.services.history.getSnapshot().canUndo,
		},
		{
			type: "keybinding",
			key: "z",
			modifiers: { meta: true },
			action: "history.undo",
		},
	],
}
```

Extension installer는 contribution type에 따라 registry에 등록합니다.

```ts
class ExtensionInstaller {
	constructor(private readonly ctx: ExtensionContext) {}

	install(extension: EditorExtension) {
		const disposables: Disposable[] = []

		for (const contribution of extension.contributes) {
			switch (contribution.type) {
				case "tool":
					disposables.push(this.ctx.registries.tools.register(contribution))
					break
				case "action":
					disposables.push(this.ctx.registries.actions.register(contribution))
					break
				case "keybinding":
					disposables.push(this.ctx.registries.keybindings.register(contribution))
					break
				case "component":
					disposables.push(this.ctx.registries.components.register(contribution))
					break
			}
		}

		const activation = extension.activate?.(this.ctx)
		if (activation) disposables.push(activation)

		return {
			dispose() {
				for (const disposable of disposables.reverse()) {
					disposable.dispose()
				}
			},
		}
	}
}
```

이 구조의 목적은 built-in과 user extension을 같은 경로로 설치하는 것입니다.

```ts
const extensions = [...builtinExtensions, ...(options.extensions ?? [])]

for (const extension of extensions) {
	extensionInstaller.install(extension)
}
```

## 추가 논의사항

다음 항목은 extension 구조를 구현하기 전에 별도로 결정해야 합니다. 이 문서에서는 해결 방안을 확정하지 않고, 논의가 필요한 범위만 기록합니다.

```text
Extension 등록 충돌
  - 같은 extension id가 두 번 들어오면 어떻게 처리할지
  - 같은 tool id가 두 번 등록되면 어떻게 처리할지
  - 같은 action id가 두 번 등록되면 어떻게 처리할지

Builtin과 user extension 관계
  - user extension이 builtin tool/action/keybinding을 override할 수 있는지
  - override를 허용한다면 명시적인 opt-in이 필요한지
  - builtin 설치 순서와 user extension 설치 순서를 어떻게 정의할지

Keybinding 충돌
  - 같은 key 조합이 여러 action에 연결되면 어떻게 판정할지
  - context 조건이 겹칠 때 어떤 keybinding이 실행될지
  - priority나 ordering 개념을 둘지

Extension lifecycle
  - install 결과를 dispose할 수 있어야 하는지
  - dispose 시 등록된 tool/action/keybinding/component를 함께 제거할지
  - activate()에서 만든 listener, timer, subscription을 어떻게 정리할지

Active tool fallback
  - 현재 active tool이 extension 제거로 사라지면 어떤 상태로 돌아갈지
  - fallback tool을 builtin select로 고정할지, 설정 가능한 값으로 둘지

Registry 책임 범위
  - registry가 단순 저장소인지, conflict resolution까지 담당하는지
  - conflict resolution을 ExtensionInstaller가 담당할지 별도 ExtensionHost가 담당할지
```

## InteractionRuntime

Pointer machine은 `Editor` 전체를 받지 않습니다.

현재 형태는 다음과 같습니다.

```ts
const machine = createPointerMachine(this)
```

목표 형태는 interaction runtime에 필요한 의존성만 받는 것입니다.

`InteractionRuntimeDeps`는 새 service나 manager가 아닙니다. `Editor` 전체를 넘기지 않기 위해, runtime 실행에 필요한 service/registry만 묶은 constructor input입니다.

```ts
interface InteractionRuntimeDeps {
	hitTest(clientX: number, clientY: number): NodeId | null

	selection: SelectionService
	session: InteractionSessionService
	viewport: ViewportService

	tools: {
		handleClick(nodeId: NodeId | null, payload: ClickPayload): void
		handleDragEnd(nodeId: NodeId | null, payload: DragPayload): void
		handleKeyDown(payload: KeyPayload): void
	}

	actions: {
		execute(id: string): boolean
	}

	keybindings: {
		match(event: KeyEventLike): string | null
	}
}
```

InteractionRuntime은 actor lifecycle을 소유합니다.

```ts
class InteractionRuntime {
	private actor: AnyActor | null = null

	constructor(private readonly deps: InteractionRuntimeDeps) {}

	start() {
		if (this.actor) return
		this.actor = createActor(createPointerMachine(this.deps))
		this.actor.start()
	}

	dispose() {
		this.actor?.stop()
		this.actor = null
	}

	sendPointerDown(event: PointerDownInput) {
		this.actor?.send({ type: "POINTER_DOWN", ...event })
	}
}
```

이렇게 하면 XState actor의 start/stop lifecycle이 `Editor` class에 섞이지 않습니다.

## createEditor 흐름

최종 조립은 `createEditor` 또는 별도 `createEditorRuntime`에서 수행합니다.

```ts
export function createEditor(options: CreateEditorOptions = {}): EditorApi {
	const store = createEditorStore({
		document: options.document,
	})

	const repository = new EditorStateRepository(store)

	const history = new DefaultHistoryService()
	const documentRead: DocumentReadRepository = repository
	const documentMutations: DocumentMutationRepository = repository
	const documentSessionState: DocumentSessionRepository = repository
	const selectionState: SelectionRepository = repository
	const sessionState: InteractionSessionRepository = repository
	const viewportState: ViewportRepository = repository
	const geometryState: GeometryRepository = repository

	const services = {
		document: new DefaultDocumentService(documentRead, documentMutations, selectionState, history),
		documentSession: new DefaultDocumentSessionService(documentSessionState, history, createDefaultDocument),
		selection: new DefaultSelectionService(selectionState, documentRead),
		viewport: new DefaultViewportService(viewportState),
		geometry: new DefaultGeometryService(geometryState, documentRead, viewportState),
		session: new DefaultInteractionSessionService(sessionState),
		history,
	}

	const registries = {
		tools: new ToolRegistry(),
		actions: new ActionRegistry(),
		keybindings: new KeybindingRegistry(),
		components: new ComponentRegistry(),
	}

	const extensionContext = {
		services,
		registries,
	}

	const extensionInstaller = new ExtensionInstaller(extensionContext)

	for (const extension of [...builtinExtensions, ...(options.extensions ?? [])]) {
		extensionInstaller.install(extension)
	}

	const interaction = new InteractionRuntime(
		createInteractionRuntimeDeps({
			services,
			registries,
		}),
	)

	return createEditorApi({
		services,
		registries,
		interaction,
	})
}
```

외부 사용자는 store나 concrete registry를 직접 보지 않습니다.

```ts
const editor = createEditor({
	document: loadedDocument,
	extensions: [customToolExtension],
})

editor.selection.set(["root"])
editor.document.updateNodeStyle("root", "width", 520)
editor.viewport.setZoom(1.25)
editor.actions.execute("history.undo")
```

## 단계별 마이그레이션

### 1단계: store 생성 외부화

`Editor` constructor에서 `createEditorStore()` 호출을 제거합니다.

```ts
// before
class Editor {
	constructor() {
		this.store = createEditorStore()
	}
}

// after
function createEditor() {
	const store = createEditorStore()
	return createEditorFromStore(store)
}
```

### 2단계: setup/load API 추가

`editor.store.getState().updateNode(...)`로 처리하던 demo/test 초기 document 구성을 공식 API로 이동합니다.

```ts
// before
const editor = createEditor()
editor.store.getState().updateNode("root", launchCardRootUpdates)

// after
const editor = createEditor({
	document: launchCardDocument,
})
```

이미 생성된 editor에 저장된 document를 다시 올리는 경우에는 `DocumentSessionService`를 사용합니다.

```ts
const saved = await persistence.load(documentId)

editor.documentSession.loadDocument({
	document: saved.document,
	currentPageId: saved.currentPageId,
})
```

이 경로는 history command를 만들지 않습니다. load/reset 후에는 transient state를 비우고 history를 초기화합니다.

```text
documentSession.loadDocument(...)
  -> replaceDocument(...)
  -> clearTransientState()
  -> history.clear()
```

### 3단계: store public 노출 제거

`editor.store` 직접 접근을 제거합니다.

demo/test의 `editor.store.getState()` 사용은 새 API로 교체합니다. 교체가 끝나면 `editor.store` public field는 유지하지 않습니다.

```ts
// before
editor.store.getState().updateNodeStyle("root", { width: 520 })

// after
editor.document.updateNodeStyle("root", "width", 520)
```

단, 사용자 편집 document write API는 history/command 경로를 타도록 구현합니다.

읽기와 구독은 `editor.state`로 이동합니다.

```ts
// before
const selection = editor.store.getState().selection

// after
const selection = editor.state.select((state) => state.selection)
```

React hook도 store를 직접 구독하지 않습니다.

```ts
function useEditorState<T>(selector: (snapshot: EditorSnapshot) => T): T {
	const editor = useEditor()

	return useSyncExternalStore(editor.state.subscribe, () => selector(editor.state.getSnapshot()))
}
```

### 4단계: EditorStateRepository 추가

Service가 사용하는 `store.getState()` 호출을 repository로 이동합니다. 외부 read/subscription은 `EditorStateApi`가 담당합니다.

```text
Editor/service/tool/component에서 store.getState() 제거
EditorStateRepository는 service read/write boundary
EditorStateApi는 external read/subscription boundary
```

### 5단계: Service 분리

현재 `Editor`의 flat method를 service로 이동합니다.

```text
findNode/getCurrentPage/updateNodeStyle/reorderNode
  -> DocumentService

loadDocument/resetDocument
  -> DocumentSessionService

getSelection/setSelection/toggleSelection
  -> SelectionService

getZoom/setZoom/getPan/setPan
  -> ViewportService

setNodeRectsCache/getNodeRenderedRect/hitTestNodeId
  -> GeometryService
```

### 6단계: user edit document write history 통일

다음 사용자 편집 method는 command/history 경로로 이동해야 합니다.

```text
reorderNode
toggleVisibility
toggleLocked
updateNodeStyleProperty
updateNodePosition
applyTextChangeFromCanvas
resizeNode
```

### 7단계: contribution 기반 tool/action/keybinding 설치

`Editor` constructor 안의 register 호출을 extension contribution으로 이동합니다.

```text
ToolRegistry.register(...)
ActionRegistry.register(...)
KeybindingRegistry defaults
  -> builtin extensions
```

### 8단계: InteractionRuntime 도입

`Editor`가 pointer actor를 직접 소유하지 않게 합니다.

```text
Editor.start()
  -> interaction.start()

Editor.dispose()
  -> interaction.dispose()
```

`createPointerMachine(editor)`는 `createPointerMachine(interactionRuntimeDeps)`로 바꿉니다.

## 검증 전략

마이그레이션은 TDD 기준으로 진행합니다. 각 단계는 목표 구조를 요구하는 테스트를 먼저 작성하고, 그 테스트가 실패하는 것을 확인한 뒤 구현합니다.

```text
1. 목표 구조 기준 테스트 작성
2. 현재 구현에서 실패 확인
3. 구현
4. 새 테스트 통과
5. 기존 behavior 테스트 통과
6. 구조 검증 통과
```

새 migration contract 테스트와 기존 behavior 테스트는 파일 단위로 분리합니다. 같은 동작을 검증하더라도 목적이 다르면 같은 파일에 섞지 않습니다.

기존 behavior 테스트는 사용자-visible 동작을 보호합니다. 하위호환용 internal API를 보호하지 않습니다. 테스트가 `editor.store`, `receiver`, `commandHistory`, concrete registry 같은 내부 구조를 직접 사용하면 같은 파일 안에서 setup/mock/호출 방식만 새 public API 기준으로 수정합니다.

새 migration contract 테스트는 목표 구조를 강제하는 새 파일로 작성합니다. 기존 behavior 테스트 파일은 새 contract 테스트를 추가하는 위치가 아닙니다.

### 테스트 실패 처리 원칙

충분한 로직 변경 후에도 테스트가 실패하면, 테스트 코드를 임의로 수정해서 통과시키지 않습니다.

먼저 현재 상황을 보고합니다.

```text
- 어떤 테스트가 실패했는지
- 실패가 실제 로직 결함인지
- 실패가 목표 구조 변경 때문에 기존 테스트 setup/mock/API 접근 방식이 낡아서 발생했는지
- 왜 추가 로직 개선이 아니라 테스트 코드 수정이 필요한지
- 테스트를 수정한다면 어떤 검증 의도는 유지하고 어떤 내부 호출 방식만 바꾸는지
```

테스트 수정은 위 판단이 명확할 때만 진행합니다. 목적은 실패를 없애는 것이 아니라, 같은 behavior 또는 같은 migration contract를 새 구조 기준으로 검증하게 만드는 것입니다.

### 목표 API 테스트

Public editor 계약을 먼저 테스트합니다.

```text
createEditor()
  - EditorApi를 반환
  - editor.state.select/getSnapshot/subscribe 제공
  - editor.store를 public API로 노출하지 않음
  - receiver/commandHistory/concrete registry를 public API로 노출하지 않음
```

후보 테스트 위치:

```text
packages/sdk/src/createEditor/createEditor.test.ts
```

### State 구독 테스트

React 구독은 `editor.store`가 아니라 `editor.state`를 사용해야 합니다.

```text
useEditorState(selector)
  - selector는 EditorSnapshot을 받음
  - editor.state.subscribe를 통해 re-render 됨
  - selection/viewport/document 변경 후 UI가 갱신됨
```

후보 테스트 위치:

```text
packages/editor-shell/src/services/EditorContext.test.tsx
```

### Setup/load 테스트

초기 document 구성과 저장된 document load는 history 대상이 아닙니다.

```text
createEditor({ document })
  - 초기 document를 반영
  - editor.store 직접 접근 없이 setup 가능

documentSession.loadDocument(...)
  - document/currentPageId 교체
  - selection 초기화
  - hoveredId 초기화
  - dragPreview 초기화
  - geometry cache 초기화
  - history.clear() 수행
  - undo stack에 command를 추가하지 않음
```

후보 테스트 위치:

```text
packages/sdk/src/createEditor/createEditor.test.ts
packages/editor-shell/src/services/DocumentSessionService.test.ts
```

### Readonly snapshot 타입 테스트

Public read API는 TypeScript 컴파일 단계에서 mutation을 막아야 합니다.

```ts
const node = editor.document.findNode("root")

// @ts-expect-error public node snapshot is readonly
node.style.width = 999
```

후보 테스트 위치:

```text
packages/sdk/src/createEditor/editor-api.types.test.ts
```

### Repository boundary 테스트

Repository는 store-backed state access에만 사용합니다. `store.getState()` 호출은 허용 위치 밖에 남기지 않습니다.

```text
허용:
  - store factory
  - EditorStateApi
  - EditorStateRepository
  - composition root

금지:
  - components
  - tools
  - actions
  - keybindings
  - services
  - interaction machine
  - sdk
  - demo
```

구조 검증 명령:

```bash
rg "editor\\.store|\\.store\\.getState\\(" packages/sdk packages/demo packages/editor-shell/src/components
rg "\\.receiver|\\.commandHistory|\\.toolRegistry|\\.actionRegistry|\\.keybindingRegistry" packages/sdk packages/demo packages/editor-shell/src/components
rg "createPointerMachine\\(editor|createPointerMachine\\(.*Editor" packages
```

### InteractionRuntime 테스트

Pointer machine은 `Editor` concrete class 없이 `InteractionRuntimeDeps` mock으로 동작해야 합니다.

```text
createPointerMachine(interactionRuntimeDeps)
  - pointer down hit test
  - click dispatch
  - drag preview
  - drag end
  - resize 시작 rect
  - keybinding/action dispatch
  - wheel pan/zoom
```

새 migration contract 테스트 위치:

```text
packages/editor-shell/src/interaction/InteractionRuntimeDeps.test.ts
packages/editor-shell/src/interaction/InteractionRuntime.test.ts
```

`packages/editor-shell/src/interaction/pointerMachine.test.ts`는 기존 behavior 회귀 테스트 파일로 유지합니다. 이 파일에는 새 contract 테스트를 추가하지 않고, 기존 검증이 새 `InteractionRuntimeDeps` 기준으로 실행되도록 mock/setup만 수정합니다.

### Action/Command 테스트

Action은 실행 진입점이고 Command는 undo/redo history 단위입니다.

```text
node.delete action
  - DocumentService.deleteSelectedNodes() 호출
  - HistoryService가 RemoveNodeCommand를 실행
  - Command가 undo stack에 기록됨

history.undo action
  - HistoryService.undo() 호출
  - 새 Command를 생성하지 않음
```

후보 테스트 위치:

```text
packages/editor-shell/src/commands/ActionRegistry.test.ts
packages/editor-shell/src/services/DocumentService.test.ts
```

### 기존 behavior 회귀 테스트

기존 테스트는 새 구조에서도 계속 통과해야 합니다. 이 목록의 파일은 새 migration contract 테스트를 추가하는 위치가 아니라, 기존 behavior 회귀 테스트를 새 API 기준으로 유지하는 위치입니다.

```bash
pnpm test:unit
pnpm --filter open-editor-sdk test
pnpm test:e2e
pnpm type-check
```

핵심 테스트 파일:

```text
packages/editor-shell/src/commands/test/CommandHistory.test.ts
packages/editor-shell/src/services/Editor.clipboard.test.ts
packages/editor-shell/src/interaction/pointerMachine.test.ts
packages/editor-shell/src/document/hitTest.test.ts
packages/editor-canvas/src/CanvasSurface.test.tsx
packages/editor-canvas/src/dom/nodeMeasurement.test.ts
packages/sdk/src/EditorCanvas/EditorCanvas.test.tsx
e2e/tests/editor.spec.ts
e2e/tests/node-interaction.spec.ts
e2e/tests/clipboard.spec.ts
```

## 금지할 구조

다음 구조는 마이그레이션 목표가 아닙니다.

```ts
new DocumentRepository(store)
new SelectionRepository(store)
new ViewportRepository(store)
new GeometryRepository(store)
```

이 방식은 store wrapper가 섹션 수만큼 늘어납니다.

다음 구조도 목표가 아닙니다.

```ts
class SelectionService {
	constructor(private readonly store: StoreApi<EditorModel>) {}
}
```

이 방식은 `Editor`의 store 의존을 service로 옮긴 것뿐입니다.

다음 구조도 피해야 합니다.

```ts
class SelectionService {
	constructor(private readonly repo: EditorStateRepository) {}
}
```

이 방식은 service가 repository 전체 권한을 갖게 됩니다.

서비스는 필요한 interface만 받아야 합니다.

```ts
class SelectionService {
	constructor(
		private readonly selection: SelectionRepository,
		private readonly document: Pick<DocumentReadRepository, "existsNode">,
	) {}
}
```

## 최종 기준

마이그레이션이 완료된 상태는 다음 기준을 만족해야 합니다.

```text
1. Editor class 또는 editor API object는 store를 노출하지 않습니다.
2. 상태의 canonical shape는 EditorModel 하나입니다.
3. EditorSnapshot은 ReadonlyDeep<EditorModel>이며 별도 sync 대상이 아닙니다.
4. 외부로 반환되는 document/page/node read type은 ReadonlyDeep 기반 snapshot type입니다.
5. 외부 read/subscription은 EditorStateApi를 통해 수행합니다.
6. Service read/write는 repository interface를 통해 수행합니다.
7. EditorStateRepository는 repository interface들을 구현하는 concrete adapter입니다.
8. 사용자 편집 document 변경은 history/command를 우회하지 않습니다.
9. Action은 실행 진입점이고 Command는 undo/redo history 단위입니다.
10. 초기 document 구성과 저장된 document load/reset은 DocumentSessionService를 통과합니다.
11. DocumentSessionService load/reset은 undo 기록을 만들지 않고 history를 초기화합니다.
12. Tool/action/keybinding은 extension contribution으로 설치됩니다.
13. Pointer machine은 Editor concrete class에 의존하지 않습니다.
14. Built-in 기능과 user extension은 같은 설치 경로를 사용합니다.
15. UI component는 store나 repository가 아니라 editor API/service만 사용합니다.
16. 하위호환용 wrapper나 deprecated 우회 API를 남기지 않습니다.
```
