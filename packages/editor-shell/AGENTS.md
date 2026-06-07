# editor-shell 작업 메모

- `@design-editor/shell`은 에디터 제어 런타임을 맡는다.
- 이 패키지의 중심:
  - selection, hover
  - pan/zoom
  - 도구 전환
  - 포인터 입력, 단축키
  - undo/redo
  - 레이어/속성 패널
  - overlay affordance
- 문서 모델 타입은 `@design-editor/core`에 기대고, 렌더된 node의 위치와 크기는 `nodeRectsCache`로 받아 overlay와 hit test에 사용한다.

## 핵심 흐름

- `Editor`
  - 런타임 조립 지점이다.
  - store, receiver, command history, action registry, keybinding registry, tool registry, clipboard runtime, usecase를 만들고 연결한다.
  - React 쪽은 `EditorProvider`로 `Editor` 인스턴스를 주입하고, 컴포넌트는 `useEditorState`로 필요한 상태만 구독한다.
- Store
  - Zustand/Immer 기반 상태 원본이다.
  - 문서 트리, 현재 페이지, selection, hoveredId, activeTool, pan/zoom, drag preview, node rect cache를 가진다.
  - undo 대상이 되는 사용자 동작은 command/usecase/receiver를 거쳐 store에 들어간다.
- Command / Receiver
  - command는 undo/redo 가능한 변경 단위다.
  - `CommandHistory`가 실행, undo/redo stack, transaction, 연속 변경 병합을 관리한다.
  - receiver는 command와 store 사이의 write port다.
  - 하나의 사용자 동작이 여러 변경을 만들면 transaction으로 한 undo 단위에 묶는다.
- Interaction
  - 입력 이벤트는 `CanvasInteractionSurface`에서 수집되어 `Editor`의 send 메서드로 들어간다.
  - xstate pointer machine이 click/drag/resize/wheel/key 흐름을 해석한다.
  - pointer machine은 hit test, drag preview, resize, pan/zoom, keybinding matching을 담당한다.
  - 최종 편집 의도는 active tool 또는 action registry로 위임한다.
- Tool
  - 현재 선택된 도구의 전략이다.
  - selection 변경, node 생성, drag 종료 처리, keyboard nudge 같은 편집 의도를 다룬다.
  - `ToolService`의 좁은 인터페이스와 command 실행 helper를 사용한다.
- Usecase
  - 단축키나 패널에서 호출되는 편집 작업을 작게 감싼다.
  - 선택 삭제/복제, 전체 선택, canvas text 변경 반영, 속성 변경처럼 UI 이벤트와 command 생성 사이에 정책이 필요한 작업이 여기에 있다.
- Overlay / Hit test
  - overlay는 편집 전용 제어층이다.
  - selection border, hover highlight, resize handle, drag preview는 cached rect와 pan/zoom을 기준으로 정렬된다.
  - hit test는 렌더 순서와 cached rect를 기준으로 screen 좌표를 data 좌표로 바꿔 계산한다.

## 기능을 추가할 때

- 새 기능은 먼저 비슷한 기존 기능의 흐름을 따라가며 시작한다.
  - 단축키 기반 편집: keybinding -> action -> usecase/command
  - 포인터 동작: `CanvasInteractionSurface` -> pointer machine -> tool/command
  - 속성 패널 편집: schema/control -> `useNodeProperty` -> usecase -> command
- 기존 패턴을 확인한 다음 같은 성격의 레이어에 붙인다.
- undo/redo가 필요한 문서 변경은 command 흐름을 확인한다.
  - command는 실행 전 복원에 필요한 이전 상태나 위치를 보관한다.
  - store 변경은 receiver를 통해 수행한다.
  - 연속 입력으로 command가 많이 생기는 resize/style 변경류는 merge key를 확인한다.
- UI만의 일시 상태와 공유 editor state를 구분한다.
  - 패널 접힘처럼 화면 내부에만 필요한 값은 컴포넌트 state로 둘 수 있다.
  - selection, hover, pan/zoom, active tool처럼 여러 영역이 공유하는 값은 editor store를 따른다.

## 코드 작성 지침

- 의미 없는 barrel file이나 convenience re-export를 만들지 않는다. public export는 SDK packaging용 package entry file인 `src/index.tsx`에서 의도적으로 관리한다.

## 테스트와 확인

- 테스트는 Vitest browser mode와 Playwright provider를 사용한다.
- 현재 중요한 테스트 축:
  - command 병합/transaction
  - pointer resize 시작값
  - hit test 좌표 변환
  - clipboard copy/cut/paste와 undo/redo
- undo 가능한 편집 흐름, 좌표 변환, 페이지를 넘나드는 동작을 바꾸면 같은 축의 테스트를 같이 보강한다.
- 자주 쓰는 확인 명령:
  - `pnpm type-check`
  - `pnpm build`
- 테스트를 돌릴 때는 저장소 스크립트 구성을 확인하고, 이 패키지의 Vitest 설정이 `src/**/*.test.{ts,tsx}`를 대상으로 한다는 점을 기준으로 실행한다.
