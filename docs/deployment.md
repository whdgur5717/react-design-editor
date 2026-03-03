# 배포 가이드

## 개요

이 프로젝트는 Shell과 Canvas를 **cross-origin**으로 배포한다. 두 앱을 서로 다른 origin에 배치하면 브라우저의 Site Isolation이 각각을 별도 프로세스로 실행하고(OOPI — Out-of-Process Iframe), Canvas의 렌더링 작업이 Shell UI를 블로킹하지 않는다.

`*.pages.dev` 도메인은 [Public Suffix List](https://publicsuffix.org/)에 등록되어 있어, 같은 `pages.dev` 하위라도 서로 다른 origin으로 취급된다. 커스텀 도메인 없이도 OOPI가 보장된다.

## 인프라 구성

**Cloudflare Pages** (Direct Upload 모드)를 사용한다.

| 프로젝트 | 내용                             | Production URL               | Preview URL                                |
| -------- | -------------------------------- | ---------------------------- | ------------------------------------------ |
| Shell    | 메인 앱 (toolbar, panels, state) | `<shell-project>.pages.dev`  | `<commit-hash>.<shell-project>.pages.dev`  |
| Canvas   | iframe 렌더러                    | `<canvas-project>.pages.dev` | `<commit-hash>.<canvas-project>.pages.dev` |

> Direct Upload 모드는 GitHub 연동 빌드를 사용하지 않고, CI에서 빌드한 결과물을 `wrangler pages deploy`로 직접 업로드한다.

## GitHub 설정 (Secrets & Variables)

| 이름                    | 종류     | 용도                                                |
| ----------------------- | -------- | --------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Secret   | Cloudflare API 인증                                 |
| `CLOUDFLARE_ACCOUNT_ID` | Secret   | Cloudflare 계정 식별                                |
| `CF_SHELL_PROJECT`      | Variable | Shell Pages 프로젝트명                              |
| `CF_CANVAS_PROJECT`     | Variable | Canvas Pages 프로젝트명                             |
| `CANVAS_PRODUCTION_URL` | Variable | Canvas production URL (`main` 빌드 시 Shell에 주입) |

## 배포 흐름

**트리거**: `main` push 또는 PR (opened / synchronize)

**Concurrency**: 같은 ref에 대해 이전 배포가 진행 중이면 취소한다.

```
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```

**순서**:

```
1. deploy-canvas
   └─ Canvas 빌드 → Cloudflare Pages 배포 → deployment URL 출력

2. deploy-shell (needs: deploy-canvas)
   └─ Shell 빌드 (VITE_CANVAS_URL 주입) → Cloudflare Pages 배포
```

**Canvas URL 결정 로직**:

| 환경        | VITE_CANVAS_URL 값                                   |
| ----------- | ---------------------------------------------------- |
| `main` push | `vars.CANVAS_PRODUCTION_URL` (고정된 production URL) |
| PR          | `deploy-canvas` job의 output URL (preview URL)       |

## 배포 관련 파일 목록

| 파일                                       | 역할                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `.github/workflows/deploy.yml`             | CI 워크플로                                                                |
| `packages/editor-canvas/public/_headers`   | 보안 헤더 (`Cross-Origin-Resource-Policy: cross-origin` 포함)              |
| `packages/editor-shell/public/_headers`    | 보안 헤더                                                                  |
| `packages/editor-canvas/public/_redirects` | SPA 라우팅 폴백 (`/* /index.html 200`)                                     |
| `packages/editor-shell/public/_redirects`  | SPA 라우팅 폴백 (`/* /index.html 200`)                                     |
| `packages/editor-shell/index.html`         | iframe에 `sandbox="allow-scripts allow-same-origin"`, `allow=""` 속성 지정 |

Canvas의 `_headers`에만 `Cross-Origin-Resource-Policy: cross-origin`이 있다. Shell이 cross-origin iframe으로 Canvas를 로드하기 위해 필요하다.

## 로컬 개발

Shell은 `VITE_CANVAS_URL` 환경 변수로 Canvas URL을 결정한다. 미설정 시 `http://localhost:3001`로 폴백한다.

```ts
// packages/editor-shell/src/App.tsx
iframe.src = import.meta.env.VITE_CANVAS_URL ?? "http://localhost:3001"
```

로컬에서는 Shell(`pnpm dev` → `:3000`)과 Canvas(`pnpm dev` → `:3001`)를 각각 실행하면 된다.

## 커스텀 도메인 전환 시 주의사항

현재 `*.pages.dev`는 PSL에 등록되어 있어 자동으로 cross-origin이지만, 커스텀 도메인으로 전환할 경우:

- **같은 도메인의 서브도메인**으로 배포하면 (예: `shell.example.com` + `canvas.example.com`) 브라우저가 같은 사이트로 취급할 수 있다. 이 경우 `Origin-Agent-Cluster: ?1` 헤더를 추가해 OOPI를 명시적으로 요청해야 한다.
- Shell 쪽에 `frame-ancestors` CSP를 추가하여 Canvas가 허용된 부모에서만 embed되도록 제한하는 것을 고려한다.

## Cloudflare Pages 프로젝트 재생성

프로젝트를 처음부터 만들어야 할 경우:

```bash
# wrangler 설치
pnpm add -g wrangler

# 프로젝트 생성
wrangler pages project create <project-name>
```

생성 후 GitHub Secrets/Variables를 업데이트한다.
