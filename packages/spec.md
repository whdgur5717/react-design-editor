# Design Editor Spec

DOM/React 기반 디자인 에디터. Figma와 달리 변환 레이어 없이, 에디터에서 렌더링되는 것이 곧 React 코드가 된다.

---

## 아키텍처 개요

```
index.html
├── iframe (pointer-events: none, z-index: -1)
│   └── Canvas (editor-canvas)
│       - React 컴포넌트 렌더링 전용
│       - Shell의 RPC 요청에 응답 (hit test, 노드 좌표)
│
└── #root
    └── Shell (editor-shell)
        - 상태 관리 (Zustand + immer)
        - 이벤트 캡처 (canvas-event-target)
        - 포인터 상태 머신 (XState)
        - 오버레이 렌더링 (선택, 호버, 리사이즈 핸들, 드래그 프리뷰)
        - UI 패널 (도구바, 레이어, 속성)
                        ↕ Penpal (postMessage)
```

**Shell/Canvas 분리 이유**: CSS/JS 격리. Canvas의 스타일이 Shell UI에 영향 주지 않도록. Canvas 내부의 각 노드는 페이지 단위로 스타일이 격리되어, 노드의 CSS가 다른 노드나 에디터 UI에 영향을 주지 않아야 한다.

iframe은 `index.html`에 정적으로 배치되며, Shell의 `#root`와 동일 레벨에 존재한다. Canvas iframe은 `pointer-events: none`으로 렌더링만 담당하고, Shell이 그 위에 투명한 이벤트 타겟(`canvas-event-target`)을 올려 포인터/키보드 이벤트를 직접 캡처한다.

---

## 패키지 역할

```
packages/
├── editor-core/       # 공유 타입, 통신 프로토콜, 코드젠
├── editor-shell/      # 메인 앱 (상태, 이벤트, 오버레이, UI 패널)
├── editor-canvas/     # iframe 앱 (렌더링 전용, RPC 제공)
└── editor-components/ # 렌더링용 컴포넌트 레지스트리
```

| 패키지            | 책임                                 | 주요 폴더                                                                                                   |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| editor-core       | 타입 정의, 통신 프로토콜, 코드젠     | `src/types/`, `src/codegen/`                                                                                |
| editor-shell      | 상태 관리, 이벤트 캡처, 오버레이, UI | `src/store/`, `src/services/`, `src/interaction/`, `src/tools/`, `src/commands/`, `src/components/overlay/` |
| editor-canvas     | 노드 렌더링, RPC 제공                | `src/renderer/`                                                                                             |
| editor-components | 컴포넌트 등록 및 조회                | `src/primitives/`, `src/registry.ts`                                                                        |

---

## 데이터 모델

**참조**: `editor-core/src/types/`

### 문서 계층

```
DocumentNode
 └── PageNode[]
      └── SceneNode[]
           ├── ElementNode    (HTML 요소)
           ├── InstanceNode   (컴포넌트 인스턴스)
           └── TextNode       (리치 텍스트)
```

- **DocumentNode**: 루트. 여러 PageNode를 포함
- **PageNode**: 하나의 작업 화면. SceneNode의 컨테이너
- **SceneNode**: `ElementNode | InstanceNode | TextNode`의 union

### 노드 타입

**BaseNode** — 모든 SceneNode의 공통 필드: `id`, `x?`, `y?`, `style?`, `visible?`, `locked?`

| 타입         | 역할              | 고유 필드                                 |
| ------------ | ----------------- | ----------------------------------------- |
| ElementNode  | HTML 태그 렌더링  | `tag`, `props?`, `children?: SceneNode[]` |
| InstanceNode | 컴포넌트 인스턴스 | `componentId`, `overrides?`               |
| TextNode     | 리치 텍스트       | `content` (JSON 구조)                     |

- SceneNode는 새로운 노드 타입을 추가하여 확장할 수 있다

### 컴포넌트 시스템 (미구현)

컴포넌트 정의(마스터)와 인스턴스의 관계를 통해, 재사용 가능한 컴포넌트를 지원할 예정.

---

## 데이터 흐름

### 상태 관리

**Source of Truth**: Shell의 Zustand 스토어 (`editor-shell/src/store/`)

- 문서 트리 (Document → Page → Node 계층)
- 컴포넌트 정의 목록
- 선택 상태, 호버 상태
- 활성 도구, 줌 레벨
- 노드 좌표 캐시 (Canvas에서 보고받은 렌더링 결과)

immer 미들웨어로 불변 업데이트를 간결하게 처리하고, `subscribeWithSelector`와 shallow 비교로 불필요한 Canvas 동기화를 방지한다. 노드 트리 탐색은 스토어 내부의 헬퍼 함수로 통합되어 있다.

### 동기화

```
Shell                              Canvas
  │                                  │
  │  ──── syncState() ──────────▶   │  상태 전달
  │  ──── hitTest(x, y) ───────▶   │  → nodeId (RPC)
  │  ──── getNodeRect(id) ─────▶   │  → Rect (RPC)
  │  ──── getNodeRects() ──────▶   │  → 전체 Rect 맵 (RPC)
  │                                  │
  │  ◀─── onNodeRectsUpdated() ──  │  좌표 캐시 갱신
  │  ◀─── onTextChange() ────────  │  텍스트 편집
  │                                  │
```

**원칙**:

- Canvas는 이벤트를 수신하지 않으며, Shell의 RPC 질의에만 응답
- Canvas는 상태를 직접 변경하지 않음
- Shell이 상태를 업데이트한 뒤 `syncState()`로 동기화
- 단방향 데이터 흐름

### 노드 위치 모델

- **루트 노드**: 캔버스 절대 좌표 (`x`, `y`). `fixed` + `transform`으로 배치
- **자식 노드**: 부모 기준 CSS 레이아웃 (`position`, `top`/`left` 등)
- 속성 패널에서도 이 구분이 반영됨 (루트 노드만 x/y 좌표 편집 가능)

---

## 이벤트 흐름

```
브라우저 포인터/키보드 이벤트
     │  (canvas-event-target에서 캡처)
     ▼
EditorService
     │
     ▼
포인터 상태 머신 (XState)
     │
     ├── hitTest RPC → Canvas iframe → 결과 반환
     │
     ├── 상태에 따라 분기
     │     ├── 키보드 → 키바인딩 매칭 → 단축키 실행
     │     └── 포인터 → 활성 도구에 위임
     │
     ▼
명령어 실행 → 스토어 업데이트 → syncState → Canvas 동기화
```

### 포인터 상태 머신

XState 기반. 동일한 포인터 이벤트를 현재 상태에 따라 다르게 처리한다.

```
idle ──POINTER_DOWN──▶ hitTesting ──HIT_TEST_DONE──▶ active
                                                       │
                                           ┌───────────┼───────────┐
                                           ▼           ▼           ▼
                                        pending    dragging    resizing
                                           │
                                      POINTER_UP
                                           ▼
                                       clicking
                                           │
                              ┌────────────┼────────────┐
                              ▼                         ▼
                      POINTER_DOWN              timeout
                      → doubleClick             → idle
```

- **hitTesting**: 비동기 `hitTest` RPC 결과를 기다리는 중간 상태
- **pending → dragging**: threshold 초과 시 드래그로 전환
- **pending → clicking**: threshold 미만에서 POINTER_UP 시 클릭 처리
- **clicking**: 더블클릭 판정 (타이머 기반)
- **resizing**: 리사이즈 핸들에서 시작된 경우 hitTest 없이 바로 진입

### EditorService

모든 서브시스템을 소유하는 중앙 조율자. React Context로 제공된다.

- 스토어, 명령어 히스토리, 도구 레지스트리, 단축키 레지스트리, 키바인딩 레지스트리, 포인터 상태 머신을 소유
- Canvas RPC 연결 관리 (`setCanvas()`, `hitTest()`, `getNodeRect()`, `syncToCanvas()`)
- 포인터/키보드 이벤트를 상태 머신에 전달하는 공개 메서드 제공

**참조**: `editor-shell/src/services/EditorService.ts`

### 도구 시스템 (Strategy 패턴)

활성 도구에 따라 같은 이벤트를 다르게 처리.

**참조**: `editor-shell/src/tools/`

### 명령어 시스템 (Command 패턴)

모든 상태 변경은 명령어를 통해 실행. Undo/Redo 지원.

**참조**: `editor-shell/src/commands/`

---

## 확장 포인트

| 추가할 것          | 수정할 폴더                            |
| ------------------ | -------------------------------------- |
| 새 노드 타입       | `editor-core/src/types/`               |
| 새 도구            | `editor-shell/src/tools/`              |
| 새 명령어/단축키   | `editor-shell/src/commands/`           |
| 새 렌더링 컴포넌트 | `editor-components/src/primitives/`    |
| 새 인터랙션 상태   | `editor-shell/src/interaction/`        |
| 새 오버레이        | `editor-shell/src/components/overlay/` |

---

## 외부 라이브러리

| 라이브러리    | 용도               |
| ------------- | ------------------ |
| zustand       | 상태 관리          |
| immer         | 불변 상태 업데이트 |
| xstate        | 포인터 상태 머신   |
| penpal        | iframe 양방향 통신 |
| @tiptap/react | 리치 텍스트 편집   |
