# Design Editor

DOM/React 기반 디자인 에디터

## 데모

https://design-editor-shell.pages.dev

## 사전 요구사항

<!-- TODO: 최소 버전 확인 후 정확한 범위로 수정 -->

| 도구    | 버전       |
| ------- | ---------- |
| Node.js | >= 22      |
| pnpm    | >= 10.28.0 |

> `corepack enable` 을 실행하면 `package.json`의 `packageManager` 필드에 따라 올바른 pnpm 버전이 자동으로 활성화됩니다.

## 설치

```bash
# 저장소 클론
git clone https://github.com/whdgur5717/react-design-editor.git
cd react-design-editor

# 의존성 설치
pnpm install
```

## 개발 서버 실행

```bash
pnpm dev
```

<!-- TODO: 포트 충돌 시 대처 방법 또는 환경 변수 안내 추가 -->

Shell(`:3000`)과 Canvas(`:3001`)가 동시에 실행됩니다.
브라우저에서 `http://localhost:3000` 으로 접속하세요.

> Canvas URL은 `VITE_CANVAS_URL` 환경 변수로 변경할 수 있습니다. 미설정 시 `http://localhost:3001`로 폴백합니다.

## 빌드

```bash
# 전체 빌드
pnpm build

# 개별 패키지 빌드
pnpm build:shell
pnpm build:canvas
```

## 배포

이 프로젝트는 **Cloudflare Pages**(Direct Upload)로 배포됩니다.
자세한 배포 설정은 [`docs/deployment.md`](./docs/deployment.md) 를 참고하세요.

<!-- TODO: 배포 관련 간략 요약을 더 추가할지 결정 -->

## 린트 · 타입체크 · 테스트

```bash
pnpm lint          # ESLint
pnpm type-check    # TypeScript 타입 검사
pnpm test          # Vitest (watch 모드)
pnpm test:unit     # Vitest 단일 실행
pnpm test:e2e      # Playwright E2E 테스트
```

## 프로젝트 구조

```
packages/
├── editor-shell        # 메인 앱 (UI, 상태 관리) — :3000
├── editor-canvas       # iframe 렌더러 — :3001
├── editor-core         # 공유 타입, 프로토콜
└── editor-components   # 컴포넌트 레지스트리
```

<!-- TODO: 각 패키지에 대한 더 상세한 설명 링크 추가 -->
