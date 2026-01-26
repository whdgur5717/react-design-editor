# SVG Fallback Strategy

## 배경: CSS의 한계

Figma는 웹 CSS보다 풍부한 시각적 표현력을 가진 디자인 도구다. Figma Plugin API가 제공하는 많은 속성들이 CSS로 직접 매핑되지 않는다.

### CSS로 변환 불가능한 속성 예시

#### Effects

| Effect          | CSS 불가 이유                                                       |
| --------------- | ------------------------------------------------------------------- |
| `NoiseEffect`   | CSS에 procedural noise 생성 기능 없음                               |
| `TextureEffect` | CSS에 procedural texture 생성 기능 없음                             |
| `GlassEffect`   | 굴절(refraction), 색분산(dispersion), 깊이(depth) 개념이 CSS에 없음 |

#### Fills

| Fill                   | CSS 불가 이유                                                          |
| ---------------------- | ---------------------------------------------------------------------- |
| Angular Gradient       | CSS는 `conic-gradient`가 있지만 Figma의 angular gradient와 동작이 다름 |
| Diamond Gradient       | CSS에 대응하는 gradient 타입 없음                                      |
| Image Fill (특정 모드) | `TILE`, `CROP` 등 일부 모드는 CSS `background` 속성으로 근사치만 가능  |

#### Blend Modes

| Blend Mode     | CSS 불가 이유               |
| -------------- | --------------------------- |
| `PASS_THROUGH` | CSS `mix-blend-mode`에 없음 |

#### Strokes

| Stroke                | CSS 불가 이유                                          |
| --------------------- | ------------------------------------------------------ |
| Inside/Outside stroke | CSS `border`는 center stroke만 지원, outline은 제한적  |
| Gradient stroke       | CSS border에 gradient 직접 적용 불가 (workaround 필요) |

#### 기타

| 속성                   | CSS 불가 이유                             |
| ---------------------- | ----------------------------------------- |
| 복잡한 Vector Networks | `<path>` 형태가 CSS로 표현 불가, SVG 필수 |
| 복잡한 Mask 조합       | CSS `mask`로 표현 한계 있음               |

이는 CSS 스펙 자체의 한계이며, 디자이너가 Figma에서 이러한 속성을 사용했다면 해당 디자인은 순수 CSS로 구현할 수 없다.

---

## 해결 전략: SVG Export

CSS로 표현 불가능한 효과가 포함된 노드는 Figma의 `exportAsync` API를 사용하여 SVG로 렌더링한다.

```typescript
const svgString = new TextDecoder().decode(await node.exportAsync({ format: "SVG" }))
```

### 이 전략의 장점

1. **시각적 충실도 100%**: Figma가 모든 효과를 직접 렌더링하여 SVG로 출력
2. **웹 네이티브**: SVG는 모든 브라우저에서 지원
3. **코드 단순성**: LLM은 `<img src="..." />` 또는 인라인 SVG로 바로 사용 가능
4. **합리적인 용량**: 테스트 결과 복잡한 효과가 적용된 노드도 ~100KB 수준

---

## 대안 검토: WebGL/WebGPU

Glass, Noise, Texture 효과를 실시간으로 렌더링하려면 WebGL 또는 WebGPU 셰이더가 필요하다.

### 기각 사유

| 기준            | SVG              | WebGL/WebGPU                 |
| --------------- | ---------------- | ---------------------------- |
| 브라우저 지원   | 100%             | WebGL 양호, WebGPU 제한적    |
| 사용 난이도     | HTML 태그 하나   | 셰이더 코드 + JS 초기화 로직 |
| 유지보수        | 누구나 수정 가능 | 셰이더 전문지식 필요         |
| LLM 출력 복잡도 | 낮음             | 매우 높음                    |

**프로젝트 목표는 "실제 사용할 수 있는 코드 생성"이다.**

대부분의 프로덕션 UI에서 Glass/Noise/Texture 효과는 장식적 요소이며, 이를 위해 셰이더 파이프라인을 구축하는 것은 over-engineering이다. LLM이 셰이더 코드까지 생성해야 한다면 출력 복잡도가 급격히 증가하고, 생성된 코드의 유지보수성이 크게 떨어진다.

---

## 결론

```
노드 분석 → CSS 불가 효과 존재?
  → Yes: exportAsync로 SVG 렌더링 → Asset으로 처리
  → No: 기존 파이프라인 (Extract → Normalize → ReactNode)
```

CSS의 표현력 한계를 인정하고, Figma의 렌더링 엔진을 활용하여 복잡한 효과를 SVG로 출력하는 것이 가장 실용적인 접근이다.
