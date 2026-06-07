# Design Editor SDK Runtime Flow

## Purpose

이 문서는 Design Editor SDK의 runtime-level 동작 흐름을 정의합니다.

함수, 컴포넌트, 파일 구조는 이 문서의 범위가 아닙니다. 이 문서의 목적은 처음 접하는 사람이 editor runtime의 전체 흐름을 이해할 수 있도록 하는 것입니다.

## Basic Idea

사용자는 SDK를 자신의 React 앱에 통합합니다.

SDK 내부에는 편집기를 구성하는 runtime들이 포함됩니다.

사용자가 편집하는 데이터는 `document data`입니다. 이 데이터는 DOM이나 React tree가 아니며, 저장 또는 export 가능한 디자인 데이터입니다.

이 데이터는 다음 구조로 이해할 수 있습니다.

```text
document data
  -> page
  -> node
```

`page`는 작업 화면이고, `node`는 page 안에 포함되는 content 단위입니다.

## Main Flow

전체 흐름은 다음과 같습니다.

```text
SDK 앱 통합
  -> document data 생성
  -> canvas: document data 렌더링
  -> canvas: 렌더링 결과의 위치와 크기 제공
  -> shell: geometry 기준으로 overlay와 사용자 조작 정렬
  -> 사용자 조작 발생
  -> shell: document data 변경
  -> canvas: 변경된 data 렌더링
```

핵심 책임은 다음과 같습니다.

```text
canvas: 화면 결과 생성
shell: 편집 조작 관리
overlay: 화면 결과 위에 배치되는 편집 전용 UI
```

## Shell, Canvas, Overlay

`shell`은 편집기 조작을 담당하는 runtime입니다.

Shell의 책임 범위에는 선택 상태, hover 상태, 현재 도구, 패널, 명령 흐름, undo/redo, 사용자 입력 처리가 포함됩니다. 사용자가 클릭, 드래그, 값 변경을 수행하면 shell은 해당 입력을 편집 의도로 해석합니다.

`canvas`는 사용자가 편집하는 데이터를 실제 화면 결과로 렌더링하는 runtime입니다.

Canvas는 document data를 DOM/React output으로 변환합니다. 사용자가 보는 디자인 결과는 canvas의 렌더링 결과입니다.

`overlay`는 canvas 위에 배치되는 편집 전용 UI입니다.

선택 테두리, hover 표시, resize handle, drag preview는 사용자가 만든 디자인 결과가 아닙니다. 이는 editor가 조작을 보조하기 위해 표시하는 UI입니다. 따라서 document data에 저장되지 않으며, export 대상도 아닙니다.

## Why Geometry Exists

Canvas는 document data를 실제 화면에 렌더링합니다.

Shell은 선택 테두리나 resize handle을 canvas 결과와 정확히 맞춰야 합니다. 이를 위해 shell은 렌더링된 node의 위치와 크기를 알아야 합니다.

Canvas는 렌더링된 결과의 위치와 크기를 shell에 제공합니다. 이 정보를 `geometry`라고 부릅니다.

```text
node
  -> canvas: node 렌더링
  -> geometry: 위치와 크기 계산
  -> shell: geometry 사용
  -> overlay: geometry 기준 위치 정렬
```

Geometry는 “데이터에 적힌 값”만 기준으로 결정할 수 없습니다. 실제 DOM/React output은 CSS, content, custom component에 의해 크기가 달라질 수 있습니다. 따라서 editor는 실제 렌더링 결과를 기준으로 overlay와 interaction을 정렬해야 합니다.

## User Interaction Flow

사용자 입력은 document data를 직접 변경하지 않습니다.

먼저 shell이 입력을 해석합니다.

```text
사용자 입력
  -> shell: 입력 의도 해석
  -> shell: 편집 명령 생성
  -> document data 변경
  -> canvas: 변경된 data 렌더링
  -> geometry 갱신
  -> overlay 갱신
```

이 흐름은 undo/redo, selection, drag, resize 같은 편집 동작을 일관되게 관리하기 위해 필요합니다.

## Extension Flow

SDK 사용자는 자신의 React component를 editor 안에서 렌더링할 수 있어야 합니다.

흐름은 다음과 같습니다.

```text
사용자 component
  -> SDK 등록
  -> node type 연결
  -> canvas 렌더링
  -> 화면 결과 생성
```

이 확장은 document output의 확장입니다.

사용자 component는 shell의 편집 상태나 overlay 동작을 소유하지 않습니다. 편집 상태와 조작 흐름은 shell이 관리하고, 사용자 component는 canvas에서 보이는 결과를 생성합니다.

사용자 component의 style은 canvas 안에서 정상적으로 적용되어야 합니다. Host app의 CSS에 우연히 의존하지 않아야 합니다.

## Package Roles

`sdk`는 외부 앱이 사용하는 공개 패키지입니다.

`editor-core`는 editor runtime이 공유하는 데이터 개념을 담당합니다.

`editor-components`는 document data를 화면에 렌더링할 때 사용할 기본 component layer를 담당합니다.

`editor-canvas`는 document data를 화면 결과로 렌더링하고 geometry를 제공합니다.

`editor-shell`은 편집 상태, 사용자 입력, 명령 흐름, 패널, overlay를 관리합니다.

## Boundaries

- Document data는 저장/export 대상입니다.
- Canvas output은 document data를 렌더링한 화면 결과입니다.
- Overlay는 편집 전용 UI이며 document data가 아닙니다.
- Shell은 편집 조작을 관리합니다.
- Canvas는 화면 결과를 생성합니다.
- 사용자 component는 화면 결과를 확장합니다.
- 사용자 component는 editor control을 소유하지 않습니다.

## What This Spec Avoids

이 문서에는 다음 내용을 포함하지 않습니다.

- 함수명
- 컴포넌트명
- hook 이름
- 파일 경로
- CSS class
- 테스트 ID
- 내부 DOM 구조
- 특정 라이브러리 사용 방식
- 임시 구현이나 migration 과정

이 문서는 구현 이름이 바뀌어도 유지되는 runtime 흐름만 다룹니다.
