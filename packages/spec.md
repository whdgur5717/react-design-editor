# Design Editor Spec

DOM/React 기반 디자인 에디터. Figma와 달리 변환 레이어 없이, 에디터에서 렌더링되는 것이 곧 React 코드가 된다.

---

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│  Shell (editor-shell)                                       │
│  - 상태 관리 (Zustand)                                       │
│  - 이벤트 처리 (제스처 라우팅, 도구, 단축키)                    │
│  - UI 패널 (도구바, 레이어, 속성)                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Canvas (editor-canvas, iframe)                        │  │
│  │  - React 컴포넌트 렌더링                                 │  │
│  │  - 드래그/리사이즈 인터랙션                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                        ↕ Penpal (postMessage)
```

**Shell/Canvas 분리 이유**: CSS/JS 격리. Canvas의 스타일이 Shell UI에 영향 주지 않도록.

---

## 패키지 역할

```
packages/
├── editor-core/       # 공유 타입, 통신 프로토콜, 코드젠
├── editor-shell/      # 메인 앱 (상태, 이벤트, UI 패널)
├── editor-canvas/     # iframe 앱 (렌더링, 인터랙션)
└── editor-components/ # 렌더링용 컴포넌트 레지스트리
```

| 패키지            | 책임                       | 주요 폴더                                                    |
| ----------------- | -------------------------- | ------------------------------------------------------------ |
| editor-core       | 타입 정의, 통신 프로토콜   | `src/types/`                                                 |
| editor-shell      | 상태 관리, 이벤트 처리, UI | `src/store/`, `src/tools/`, `src/commands/`, `src/gestures/` |
| editor-canvas     | 노드 렌더링, 인터랙션 처리 | `src/renderer/`                                              |
| editor-components | 컴포넌트 등록 및 조회      | `src/primitives/`, `src/registry.ts`                         |

---

## 데이터 흐름

### 상태 관리

**Source of Truth**: Shell의 Zustand 스토어 (`editor-shell/src/store/`)

- 문서 트리 (Document → Page → Node 계층)
- 컴포넌트 정의 목록
- 선택 상태, 호버 상태
- 활성 도구, 줌 레벨

### 동기화

```
Shell                          Canvas
  │                              │
  │  ───── syncState() ─────▶   │  상태 전체 전달
  │                              │
  │  ◀──── onGesture() ─────    │  이벤트만 전달 (상태 변경 X)
  │                              │
```

**원칙**:

- Canvas는 상태를 직접 변경하지 않음
- 이벤트만 Shell에 전달, Shell이 상태 업데이트 후 동기화
- 단방향 데이터 흐름

---

## 이벤트 흐름

```
Canvas에서 발생한 인터랙션
        │
        ▼
   제스처로 추상화 (클릭, 드래그, 리사이즈, 키보드, 텍스트변경)
        │
        │ Penpal
        ▼
┌─────────────────────────────────────────────────────┐
│ Shell                                                │
│                                                     │
│   제스처 라우터 (`src/gestures/`)                     │
│        │                                            │
│   ┌────┴────┐                                       │
│   ▼         ▼                                       │
│ 키보드    포인터                                      │
│   │         │                                       │
│   ▼         ▼                                       │
│ 단축키    도구에                                      │
│ 처리      위임                                       │
│   │         │                                       │
│   └────┬────┘                                       │
│        ▼                                            │
│   스토어 업데이트 → syncState → Canvas               │
└─────────────────────────────────────────────────────┘
```

### 도구 시스템 (Strategy 패턴)

활성 도구에 따라 같은 이벤트를 다르게 처리.

**참조**: `editor-shell/src/tools/`

### 명령어 시스템 (Command 패턴)

모든 상태 변경은 명령어를 통해 실행. Undo/Redo 지원.

**참조**: `editor-shell/src/commands/`

---

## 확장 포인트

| 추가할 것          | 수정할 폴더                         |
| ------------------ | ----------------------------------- |
| 새 노드 타입       | `editor-core/src/types/`            |
| 새 도구            | `editor-shell/src/tools/`           |
| 새 명령어/단축키   | `editor-shell/src/commands/`        |
| 새 렌더링 컴포넌트 | `editor-components/src/primitives/` |
| 새 제스처 핸들러   | `editor-shell/src/gestures/`        |

---

## 외부 라이브러리

| 라이브러리    | 용도               |
| ------------- | ------------------ |
| zustand       | 상태 관리          |
| penpal        | iframe 양방향 통신 |
| re-resizable  | 노드 리사이즈      |
| @dnd-kit      | 드래그앤드롭       |
| @tiptap/react | 리치 텍스트 편집   |
