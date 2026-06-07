# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 패키지 개요

`editor-canvas`는 document data를 React DOM으로 렌더링하는 패키지다.

이 패키지의 책임:

1. page와 node 데이터를 받아서 React 컴포넌트로 렌더링
2. 렌더링된 DOM의 위치와 크기를 측정해서 보고
3. 커스텀 컴포넌트를 해결하고 렌더링

Canvas는 편집 상태를 소유하지 않고, 사용자 입력을 처리하지 않으며, command를 관리하지 않는다. 모든 편집 로직은 `editor-shell`에 있다.

이 패키지가 제공하는 컴포넌트는 `@design-editor/sdk`에서 Shadow DOM 안에 mount되어 CSS/JS 격리를 보장한다.

## 아키텍처

### 핵심 원칙

1. **순수 렌더러**: Canvas 컴포넌트에 이벤트 핸들러를 추가하지 말 것. 모든 포인터/키보드 이벤트는 Shell이 캡처한다.

2. **단방향 데이터 흐름**: Canvas는 props로 상태를 받고, 렌더링한 뒤, geometry를 콜백으로 보고한다. Canvas는 절대 상태 변경을 요청하지 않는다.

### 데이터 흐름

```text
Shell → props → Canvas 렌더링 → DOM 측정 → geometry 콜백 → Shell
```

### Geometry 측정

Canvas는 렌더링된 DOM 요소의 **page-space 좌표**를 측정한다.

- Root 노드: document data의 위치 값 사용
- 중첩 노드: 부모 geometry + DOM layout offset으로 계산

Geometry는 실제 렌더링된 DOM에서 측정해야 한다. CSS, content, 커스텀 컴포넌트가 최종 크기에 영향을 주기 때문이다.

측정이 필요한 시점을 감지하기 위해 ResizeObserver와 MutationObserver를 사용한다.

### 컴포넌트 해결

element node를 렌더링할 때:

1. 전달받은 커스텀 resolver로 컴포넌트 찾기
2. 내장 component registry에서 찾기
3. 네이티브 HTML 요소로 fallback

커스텀 컴포넌트는 DOM props를 forward해야 측정이 제대로 작동한다.

## 테스트 규칙

- **파일 네이밍**: E2E 테스트는 `*.spec.ts`, 단위/통합 테스트는 `*.test.ts`
- **테스트 설명은 한글로**: 무엇을 검증하는지 서술. 구현 디테일은 포함하지 않는다.

```ts
// Good
describe("노드 측정", () => {
  it("페이지 변경 시 새로운 geometry를 발행한다", () => { ... })
})

// Bad
describe("collectNodeRects", () => {
  it("calls onNodeRectsChange with measured rects", () => { ... })
})
```

- **브라우저 테스트**: Vitest browser mode + Playwright (Chromium)
- **Visual regression**: 스크린샷은 `src/__screenshots__/`

## 일반 작업

### 새 노드 타입 추가

1. `editor-core`의 node type union에 타입 추가
2. 새 renderer 생성
3. node dispatcher에 case 추가
4. 테스트 추가

### Geometry 문제 디버깅

- DOM에 node identity 속성이 제대로 붙었는지 확인
- 측정 대상 요소가 올바른지 확인
- 커스텀 컴포넌트가 props를 forward하는지 확인

### 커스텀 컴포넌트 통합

커스텀 컴포넌트는 style, props, children을 받는다.

측정을 지원하려면:

- 모든 props를 루트 요소에 forward (권장)
- 또는 측정용 속성이 측정 가능한 루트 요소에 적용되도록 보장

## 의존성

- **React 18**: 렌더링 엔진
- **TipTap**: Rich text 편집
- **@design-editor/core**: 공유 타입
- **@design-editor/components**: 내장 컴포넌트 registry
- **es-toolkit**: 유틸리티 (lodash 대신)

## 관련 문서

- `packages/spec.md`: 전체 SDK runtime flow
- `packages/CLAUDE.md`: 아키텍처 불변 조건
- Root `README.md`: 프로젝트 개요
