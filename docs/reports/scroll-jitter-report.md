# Scroll Jitter 원인 분석 보고서

## 1. 문제 현상

캔버스에서 스크롤(pan) 시, selection overlay(파란색 보더)와 실제 Canvas 콘텐츠 사이에 시각적 어긋남(jitter)이 발생한다.

## 2. 아키텍처 배경

이 에디터는 Shell(메인 앱, :3000)과 Canvas(iframe, :3001) 두 개의 독립적인 앱으로 구성된다.

실제 DOM 구조 (`packages/editor-shell/index.html` + React 트리):

```
body
├── #root                                ← React 앱 (Shell)
│   └── .app
│       ├── canvas-event-target          ← 모든 pointer/keyboard 이벤트 수신
│       │   ├── .canvas-area
│       │   └── ToolManagerOverlay       ← transform: translate(panX, panY) scale(zoom)
│       │       ├── SelectionOverlay         pointerEvents: none
│       │       ├── ResizeHandles            드래그 인터랙션 있음
│       │       ├── HoverHighlight           pointerEvents: none
│       │       └── DragPreview              pointerEvents: none
│       ├── Toolbar
│       ├── LayersPanel
│       └── PropertiesPanel
│
└── iframe#canvas-iframe                 ← body 직속, z-index: -1, pointer-events: none
    └── #canvas-container                ← transform: translate(panX, panY) scale(zoom)
        └── 노드들
```

iframe은 React 트리 바깥, `body` 직속에 `z-index: -1`로 깔려 있다.
Shell UI(`#root`)가 그 위에 올라가는 레이어 구조다.
두 요소는 DOM 트리 상 형제(sibling)이며, 부모-자식 관계가 아니다.

스크롤 시 데이터 흐름 — `setPan()` 하나가 두 갈래로 소비된다:

```
Wheel event
  → pointerMachine handleWheel
    → store.setPan(newPanX, newPanY)
      │
      ├─ Shell overlay (동기)
      │   Zustand selector → React re-render → transform 즉시 업데이트
      │
      └─ Canvas iframe (비동기)
          store.subscribe → syncToCanvas() → penpal postMessage (macrotask)
          → iframe 수신 → setState × 5 → React re-render → transform 업데이트
```

같은 `setPan()` 호출이지만, Shell overlay는 동기적으로 즉시 반영되고,
Canvas iframe은 postMessage를 거치므로 반영 시점이 다음 paint frame으로 밀릴 수 있다.

## 3. 가설

> Shell overlay는 Zustand store 변경을 동기적으로 구독하여 즉시 리렌더하지만,
> Canvas iframe은 postMessage(비동기 macrotask)를 거쳐 state를 받으므로
> 두 경로 사이에 프레임 차이가 발생하여, 같은 paint frame에서 서로 다른 panY 값을 렌더한다.

## 4. 측정 방법

### 4.1. 측정 대상

**같은 paint frame**에서 Shell overlay와 Canvas iframe의 CSS `transform: translateY` 값을 비교한다.

- Shell overlay: `ToolManagerOverlay`를 감싸는 div의 `transform`
- Canvas: `#canvas-container`의 `transform`

### 4.2. 동기화 방법

Shell과 Canvas는 서로 다른 browsing context에서 실행되므로 `performance.now()` 시간 기준이 다르다.
따라서 **`Date.now()` (Unix epoch 기준 절대 시간)**을 사용하고, 양쪽의 `requestAnimationFrame` 콜백에서 기록한 값 중 **±3ms 이내**인 것을 같은 paint frame으로 매칭했다.

### 4.3. 스크롤 시뮬레이션

```js
// 8ms 간격, deltaY=50px, 40회 = 실제 빠른 스크롤 시뮬레이션
setTimeout(fireWheel, 8) // ~120fps 입력 속도
```

실제 macOS 트랙패드/마우스 휠은 8~16ms 간격으로 이벤트를 발생시킨다.
50ms 간격의 첫 번째 테스트에서는 jitter가 0이었으나, 8ms 간격으로 줄이자 재현되었다.

### 4.4. 측정 환경

- Playwright + Chromium (headless: false)
- Shell: localhost:3003, Canvas iframe: localhost:3001
- 모니터 refresh rate: 60Hz (약 16.67ms per frame)

## 5. 예상 결과

가설이 맞다면:

| 항목       | 예상                                                       |
| ---------- | ---------------------------------------------------------- |
| delta 방향 | Shell이 Canvas보다 **앞서** 움직임 (음수 delta)            |
| delta 크기 | deltaY의 정수배 (50px 단위)                                |
| 발생 빈도  | 입력 속도 > frame rate일 때 발생 (8ms 입력 vs 16ms 프레임) |
| 발생 패턴  | 간헐적 (postMessage가 같은 프레임에 도착하면 delta=0)      |

## 6. 실제 결과

### 6.1. Raw 데이터 (스크롤 구간 발췌)

```
timestamp        shellY    canvasY    Δ(px)
─────────────────────────────────────────────
...050793        -50.0      -50.0      0.0
...050809       -150.0     -150.0      0.0
...050826       -250.0     -250.0      0.0
...050843       -350.0     -300.0    -50.0  ← JITTER
...050859       -400.0     -400.0      0.0
...050876       -500.0     -500.0      0.0
...050892       -600.0     -600.0      0.0
...050909       -700.0     -650.0    -50.0  ← JITTER
...050925       -750.0     -750.0      0.0
...050942       -850.0     -850.0      0.0
...050959       -950.0     -950.0      0.0
...050975      -1050.0    -1050.0      0.0
...050993      -1150.0    -1100.0    -50.0  ← JITTER
...051013      -1200.0    -1200.0      0.0
...051026      -1300.0    -1300.0      0.0
...051043      -1400.0    -1350.0    -50.0  ← JITTER
...051059      -1450.0    -1450.0      0.0
...051076      -1550.0    -1550.0      0.0
...051092      -1650.0    -1650.0      0.0
...051109      -1750.0    -1700.0    -50.0  ← JITTER
```

### 6.2. 통계 요약

스크롤이 멈춘 후 정지 프레임(panY 변화 없음)은 제외하고, **panY가 변하고 있는 프레임만** 집계한다.

| 항목                  | 값                                        |
| --------------------- | ----------------------------------------- |
| 스크롤 중 측정 프레임 | 23                                        |
| jitter 프레임 (Δ ≠ 0) | 5                                         |
| **jitter 발생률**     | **5/23 = 21.7%**                          |
| 최대 delta            | **-50.0px**                               |
| delta 값              | 항상 정확히 0px 또는 -50px (중간 값 없음) |

## 7. 해석

### 7.1. 가설 검증: 확인됨

| 예상                         | 실제                           | 일치 |
| ---------------------------- | ------------------------------ | ---- |
| Shell이 Canvas보다 앞서 이동 | delta가 항상 음수 (-50px)      | O    |
| delta가 deltaY의 정수배      | 정확히 -50px (= deltaY 1회분)  | O    |
| 간헐적 발생                  | 스크롤 중 23프레임 중 5프레임  | O    |
| 빠른 입력에서만 발생         | 50ms 간격: 0%, 8ms 간격: 21.7% | O    |

### 7.2. 왜 -50px인가

delta가 0 아니면 정확히 **-50px (= wheel deltaY 1회분)**만 나온다는 것은:

- Shell overlay는 N번째 wheel의 panY를 이미 반영했지만
- Canvas iframe은 아직 (N-1)번째까지만 반영한 상태

즉, **postMessage 전달이 다음 paint frame으로 밀리면서 Canvas가 정확히 1 wheel 이벤트만큼 뒤처진다.**

### 7.3. 왜 매 프레임이 아닌가

- Wheel 이벤트는 8ms 간격, 화면 갱신은 ~16ms 간격이므로 **한 paint frame 안에 wheel + postMessage 처리가 모두 끝나는 경우**가 더 많다
- 다만 wheel 이벤트 처리와 postMessage 수신이 **paint deadline을 사이에 두고 갈리는 경우**, Canvas 업데이트가 다음 프레임으로 밀린다
- 이 "갈림"이 스크롤 중 약 5번에 1번꼴로 발생한다

### 7.4. 실제 사용 시 체감

- 빠른 스크롤 중 약 **5프레임에 1번**, selection이 캔버스 콘텐츠보다 50px 앞서 있다가 다음 프레임에 따라잡힌다
- 50px은 사람이 명확하게 인지할 수 있는 크기이므로, "selection이 떨리는" 느낌으로 보인다

## 8. 버그 원인

**`postMessage`는 비동기(macrotask)다.**

Shell overlay와 Canvas iframe은 같은 `panY` 값을 써야 하는데, 전달 방식이 다르다.

- Shell overlay: `setPan()` → Zustand가 동기적으로 React 리렌더를 트리거 → **같은 콜스택 안에서 DOM 반영**
- Canvas iframe: `setPan()` → `store.subscribe` → `syncToCanvas()` → `penpal.postMessage()` → **macrotask queue에 들어감** → Canvas가 수신 → `setState` → DOM 반영

`postMessage`는 현재 실행 중인 콜스택이 끝난 뒤 macrotask로 처리된다.
브라우저가 paint를 먼저 하고 그다음에 macrotask를 처리하면, Canvas는 **이전 프레임의 panY**로 그려진다.

그 결과, 같은 화면에 Shell overlay는 새 panY, Canvas는 이전 panY가 렌더되어 50px 어긋난다.
