# Design Editor

DOM/React 기반 디자인 에디터

https://design-editor-shell.pages.dev

## 아키텍처 개요

<!-- TODO: 아키텍처 다이어그램 추가 (ASCII 또는 이미지) -->

### Shell-Canvas iframe 분리 구조

에디터는 **Shell**과 **Canvas** 두 개의 독립적인 애플리케이션으로 구성되며, iframe 경계를 통해 CSS/JS를 완전히 격리합니다.

```
Shell (editor-shell, port 3000)
├── Toolbar, UI Panels, Overlays
├── 이벤트 캡처 (포인터/키보드)
├── 상태 관리 (Zustand store)
└── 명령 패턴 (undo/redo)

Canvas iframe (editor-canvas, port 3001)
├── React 노드 렌더링 (CanvasRenderer)
├── 코드 컴포넌트 런타임
└── Penpal RPC 메서드
```

<!-- TODO: 각 영역의 핵심 책임을 더 구체적으로 설명 -->

**핵심 원칙:**

- **iframe 격리:** Canvas는 반드시 iframe 내에서만 렌더링됩니다.
- **단방향 데이터 흐름:** Shell의 Zustand store가 단일 진실 원천(Single Source of Truth)이며, `syncState()`를 통해 Canvas에 전달합니다.
- **이벤트 분리:** Canvas는 순수 렌더러입니다. 모든 포인터/키보드 이벤트는 Shell에서 처리합니다.
- **Command 패턴:** 모든 문서 변경은 Command를 통해 실행되어 undo/redo를 지원합니다.

### 통신 방식: Penpal 기반 RPC

Shell과 Canvas는 [Penpal](https://github.com/nickersoft/penpal) 라이브러리를 통해 양방향 RPC로 통신합니다.

<!-- TODO: 주요 RPC 메서드 목록 및 호출 흐름 설명 보강 -->

| 방향 | 메서드 | 설명 |
|------|--------|------|
| Shell → Canvas | `syncState()` | 문서 상태, 선택, 뷰포트 정보 전달 |
| Shell → Canvas | `hitTest(x, y)` | 화면 좌표의 노드 ID 조회 |
| Shell → Canvas | `getNodeRect(id)` | 렌더링된 노드의 DOMRect 조회 |
| Canvas → Shell | `onNodeRectsUpdated()` | 렌더링된 노드 위치 정보 전달 |
| Canvas → Shell | `onTextChange()` | 텍스트 편집 내용 전달 |

### 패키지 구조

```
packages/
├── editor-core/       # 공유 타입, 스키마, 코드 생성
├── editor-shell/      # Shell 앱 (상태, 도구, 명령, UI)
├── editor-canvas/     # Canvas 앱 (렌더러, Penpal 연결)
└── editor-components/ # 렌더링 가능한 React 컴포넌트
```

<!-- TODO: 각 패키지의 주요 진입점 및 의존 관계 설명 추가 -->

### 상세 문서

- **[packages/spec.md](packages/spec.md)** — 전체 아키텍처 명세 (데이터 모델, 상태 관리, 이벤트 흐름 등)
- **[docs/deployment.md](docs/deployment.md)** — Cloudflare Pages 배포 전략
- **[docs/architecture-refactoring-2026-02.md](docs/architecture-refactoring-2026-02.md)** — Shell/Canvas 리팩토링 히스토리

## 시작하기

<!-- TODO: 필요한 환경 (Node.js, pnpm 버전 등) 명시 -->

```bash
pnpm install
pnpm dev          # Shell(3000) + Canvas(3001) 동시 실행
```

## 기여 가이드

<!-- TODO: CONTRIBUTING.md 분리 여부 검토 -->

### 개발 환경

```bash
pnpm install               # 의존성 설치
pnpm dev                   # 개발 서버 실행
pnpm lint                  # ESLint 검사
pnpm format                # Prettier 포맷팅
pnpm type-check            # TypeScript 타입 검사
npx vitest run             # 단위 테스트
npx playwright test        # E2E 테스트
```

### 코딩 컨벤션

- **유틸리티:** `es-toolkit` 사용 (lodash 대신)
- **TypeScript:** `as`, `any` 사용 금지. 타입 추론 활용, 필요 시 `satisfies` 사용
- **테스트 설명:** 한국어로 작성 (예: `it("노드를 클릭하면 선택된다", ...)`)
- **배럴 파일 금지:** `index.ts` 재수출 파일 사용하지 않음

<!-- TODO: 커밋 메시지 컨벤션 (conventional commits) 상세 설명 추가 -->
<!-- TODO: PR 리뷰 프로세스 설명 추가 -->

### 확장 포인트

| 기능 | 위치 |
|------|------|
| 새 노드 타입 | `editor-core/src/types/node.ts` |
| 새 도구 | `editor-shell/src/tools/` |
| 새 명령/단축키 | `editor-shell/src/commands/` |
| 새 렌더 컴포넌트 | `editor-components/src/primitives/` |
| 새 인터랙션 상태 | `editor-shell/src/interaction/` |
| 새 오버레이 | `editor-shell/src/components/overlay/` |

## 라이선스

<!-- TODO: 라이선스 정보 확인 후 추가 (LICENSE 파일 필요) -->
