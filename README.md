# Design Editor

DOM/React 기반 디자인 에디터

https://design-editor-shell.pages.dev

## 프로젝트 개요

<!-- TODO: 프로젝트의 목적과 비전을 1~2 문단으로 서술 -->
<!-- - DOM/React 기반으로 동작하는 디자인 에디터임을 강조 -->
<!-- - Figma와 유사한 사용자 경험을 웹 기술만으로 구현하는 것이 목표 -->
<!-- - Shell(이벤트/상태 관리) + Canvas(iframe 렌더러) 아키텍처 설명 -->

## 주요 기능

<!-- TODO: 아래 기능 목록을 구체적인 설명과 함께 작성 -->
<!-- 각 항목에 1~2줄 설명 추가 -->

- **무한 캔버스** — <!-- TODO: 팬/줌을 통한 무한 캔버스 탐색 -->
- **컴포넌트 시스템** — <!-- TODO: ComponentRegistry 기반 컴포넌트 등록 및 인스턴스화, 코드 컴포넌트(esbuild-wasm 컴파일) -->
- **리치 텍스트 편집** — <!-- TODO: Tiptap 기반 인라인 텍스트 편집 (색상, 스타일 등) -->
- **Undo / Redo** — <!-- TODO: Command 패턴 + zundo 기반 이력 관리 (최대 50단계) -->
- **멀티 페이지** — <!-- TODO: Document → Page → SceneNode 계층 구조, 페이지 전환 -->
- **선택 & 다중 선택** — <!-- TODO: 클릭/Shift+클릭 선택, 오버레이 표시 -->
- **드래그 & 리페어런팅** — <!-- TODO: 노드 이동 및 부모 변경 (좌표 변환 포함) -->
- **키보드 단축키** — <!-- TODO: 도구 전환, Undo/Redo, 화살표 넛지(1px/10px) 등 -->
- **노드 잠금 & 숨기기** — <!-- TODO: 가시성/잠금 토글 -->

## 기술 스택

<!-- TODO: 각 카테고리별 기술 스택을 표 또는 목록으로 정리 -->

| 카테고리 | 기술 |
| --- | --- |
| UI 프레임워크 | <!-- TODO: React 18, TypeScript 5 --> |
| 빌드 도구 | <!-- TODO: Vite 6, pnpm workspaces --> |
| 상태 관리 | <!-- TODO: Zustand 5 + immer --> |
| Undo/Redo | <!-- TODO: zundo + Command 패턴 --> |
| 인터랙션 | <!-- TODO: XState (포인터 상태 머신), @dnd-kit --> |
| 텍스트 편집 | <!-- TODO: Tiptap (@tiptap/react) --> |
| iframe 통신 | <!-- TODO: Penpal (postMessage RPC) --> |
| 코드 편집/컴파일 | <!-- TODO: Monaco Editor, esbuild-wasm --> |
| 테스트 | <!-- TODO: Vitest, Playwright --> |
| 코드 품질 | <!-- TODO: ESLint, Prettier, husky + lint-staged --> |

## 패키지 구조

<!-- TODO: 각 패키지의 역할을 상세히 기술 -->

```
packages/
├── editor-core        # <!-- TODO: 공유 타입, 노드 정의, RPC 프로토콜, 스키마 -->
├── editor-components  # <!-- TODO: 컴포넌트 레지스트리 및 프리미티브 컴포넌트 -->
├── editor-canvas      # <!-- TODO: Canvas iframe 앱 (순수 렌더러, port 3001) -->
└── editor-shell       # <!-- TODO: 메인 애플리케이션 셸 (상태/이벤트/UI, port 3000) -->
```

<!-- TODO: 데이터 흐름 다이어그램 추가 -->
<!-- Browser Events → EditorService → Pointer State Machine → Command → Store → syncState → Canvas -->

## 시작하기

<!-- TODO: 설치 및 실행 방법 -->
<!-- ```bash -->
<!-- pnpm install -->
<!-- pnpm dev -->
<!-- ``` -->
