# 아키텍처 플로우 도식화

현재 `NodeTreeBuilder.build()` (`src/main/node/index.ts`)부터 시작하여, 전체 아키텍처가 어떻게 진행되는지 도식화한 문서입니다.

## 전체 아키텍처 플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. ENTRY POINT: NodeTreeBuilder.build() (src/main/node/index.ts)   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────┐
        │ 노드 타입별 Builder 함수 선택 (switch-case)      │
        │ • TEXT → buildTextNode()                        │
        │ • FRAME → buildFrameNode()                      │
        │ • INSTANCE → buildInstanceNode()                │
        │ • RECTANGLE → buildRectangleNode()              │
        │ • GROUP → buildGroupNode()                      │
        │ • default → buildGenericNode()                  │
        └─────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. NODE DATA BUILDING: NodeDataBuilder.build() (src/main/node/props.ts)│
│    의존성: StyleExtractor, StyleNormalizer, TokenRegistryPort (주입) │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                   ┌──────────────┼──────────────┐
                   ▼              ▼              ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Extract Stage│ │ Normalize    │ │ Token        │
        │              │ │ Stage        │ │ Resolution   │
        └──────────────┘ └──────────────┘ └──────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│ 3. EXTRACT STAGE: StyleExtractor.extract() (pipeline/extract/style.ts)│
│ 목적: Figma Plugin API에서 raw 데이터 안전하게 추출                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │FillExtractor│         │TextExtractor│         │LayoutExtrac │
  │.extract()   │         │.extract()   │         │tor.extract()│
  └─────────────┘         └─────────────┘         └─────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │EffectsExtra │         │StrokeExtrac │         │ collect     │
  │ctor.extract │         │tor.extract()│         │ BoundVari   │
  │()           │         │             │         │ ables()     │
  └─────────────┘         └─────────────┘         └─────────────┘
         │
         └────────────────► ExtractedStyle
                            • fills: ExtractedFillProps
                            • effects: ExtractedEffectProps
                            • layout: ExtractedLayoutProps
                            • text: ExtractedTextProps
                            • stroke: ExtractedStrokeProps
                            • boundVariables: VariableAlias[] (재귀 수집)
                            • nodeBoundVariables: raw boundVariables


┌─────────────────────────────────────────────────────────────────────┐
│ 4. NORMALIZE STAGE: StyleNormalizer.normalize() (pipeline/normalize/style.ts)│
│ 목적: Raw 데이터를 LLM 친화적 구조로 변환                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │PaintNormali │         │EffectsNorma │         │LayoutNormal │
  │zer.normalize│         │lizer.normal │         │izer.normali │
  │Fills()      │         │izeEffects() │         │zeLayout()   │
  │ • mixed 처리│         │ • blur      │         │ • container │
  │ • RGB→hex   │         │ • shadow    │         │ • child     │
  └─────────────┘         └─────────────┘         └─────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
  ┌─────────────┐                                  ┌─────────────┐
  │TextNormalize│                                  │StrokeNormal │
  │r.normalizeT │                                  │izer.normali │
  │ext()        │                                  │zeStroke()   │
  │ • runs 분할  │                                  └─────────────┘
  └─────────────┘
         │
         └────────────────► NormalizedStyle
                            • fills: NormalizedValue<NormalizedFill[]>
                            • effects: NormalizedValue<NormalizedEffect[]>
                            • layout: NormalizedLayout
                            • text: NormalizedText | null
                            • stroke: NormalizedStroke | null


┌─────────────────────────────────────────────────────────────────────┐
│ 5. TOKEN RESOLUTION & ENRICHMENT (src/main/node/props.ts)          │
│ 목적: VariableAlias → TokenRef 변환 및 TokenizedValue 래핑          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
  │buildTokenRef│        │buildTokenRef│        │enrichStyle()│
  │s()          │───────►│Map()        │───────►│             │
  │TokenRegistry│        │Map<id,Token │        │ • apply     │
  │Port로 해석   │        │Ref>         │        │   TokenRef  │
  └─────────────┘        └─────────────┘        │ • wrap as   │
         │                                       │   Tokenized │
         │                                       │   Value<T>  │
         │                                       └─────────────┘
         └────────────────► TokenRefMapping[]
                            { variableId, token: TokenRef }

  enrichStyle() 내부에서 각 속성별로 token 적용:
  ┌────────────────────────────────────────────────────────┐
  │ • resolveFillTokens()   : fill.color에 tokenRef 적용    │
  │ • resolveEffectTokens() : effect 속성에 tokenRef 적용   │
  │ • resolveStrokeTokens() : stroke.paints에 tokenRef 적용│
  │ • resolveLayoutTokens() : layout 속성에 tokenRef 적용   │
  │ • resolveTextTokens()   : text run 속성에 tokenRef 적용│
  │ • buildLayoutGrids()    : grid 속성에 tokenRef 적용    │
  └────────────────────────────────────────────────────────┘
                            │
                            ▼
                   OutputNormalizedStyle
                   • fills: NormalizedValue<TokenizedValue<NormalizedFill>[]>
                   • effects: NormalizedValue<TokenizedValue<NormalizedEffect>[]>
                   • stroke: OutputNormalizedStroke | null
                   • layout: OutputNormalizedLayout
                   • text: NormalizedText (runs 안에 TokenizedValue)
                   • visible?: TokenizedValue<boolean>
                   • opacity?: TokenizedValue<number>


┌─────────────────────────────────────────────────────────────────────┐
│ 6. REFERENCE & ASSET COLLECTION                                     │
└─────────────────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
  ┌────────────┐          ┌────────────┐
  │buildInstanc│          │buildAssetRe│
  │eRef()      │          │fs()        │
  │ • componen │          │ • image    │
  │   tId      │          │ • vector   │
  │ • variant  │          │ • mask     │
  └────────────┘          └────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│ 7. FINAL OUTPUT: ReactNode                                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                   ┌──────────────────────────┐
                   │ BaseReactNode<T>         │
                   │ {                        │
                   │   type: NodeType         │
                   │   props: {               │
                   │     id                   │
                   │     name                 │
                   │     style                │
                   │     boundVariables       │
                   │   }                      │
                   │   children?: ReactNode[] │
                   │   instanceRef?           │
                   │   tokensRef?             │
                   │   assets?                │
                   │ }                        │
                   └──────────────────────────┘
                                  │
                                  ▼
                   ┌──────────────────────────┐
                   │ 재귀: 자식 노드 처리       │
                   │ this.build(child)        │
                   │ visible=false는 필터링    │
                   └──────────────────────────┘
```

## 의존성 주입 구조

```
NodeDataBuilder (src/main/node/props.ts)
├── extractor: StyleExtractor        ← 주입 (기본값: styleExtractor 싱글톤)
├── normalizer: StyleNormalizer      ← 주입 (기본값: styleNormalizer 싱글톤)
└── tokenRegistry: TokenRegistryPort ← 주입 (기본값: variableRegistry)

StyleExtractor (src/main/pipeline/extract/style.ts)
├── fills: FillExtractor
├── effects: EffectsExtractor
├── layout: LayoutExtractor
├── text: TextExtractor
└── stroke: StrokeExtractor

StyleNormalizer (src/main/pipeline/normalize/style.ts)
├── paint: PaintNormalizer
├── effects: EffectsNormalizer
├── layout: LayoutNormalizer
├── text: TextNormalizer
└── stroke: StrokeNormalizer
```

## 핵심 데이터 변환 과정

```
SceneNode (Figma API)
    ↓
ExtractedStyle
    • fills: Paint[] | figma.mixed
    • effects: Effect[] | figma.mixed
    • text: { characters, fills, ... }
    • boundVariables: { ids: string[] }
    ↓
NormalizedStyle
    • fills: NormalizedValue<NormalizedFill[]>
        - solid: { color: { hex, rgb, rgba } }
        - gradient: { stops: ColorStop[] }
    • effects: NormalizedValue<NormalizedEffect[]>
    • layout: { position, container, child }
    • text: { runs: NormalizedTextRun[] }
    ↓
TokenRefMapping[]
    { variableId, token: TokenRef }
    (VariableRegistry를 통해 VariableAlias 해석)
    ↓
OutputNormalizedStyle (enrichStyle)
    • fills: NormalizedValue<TokenizedValue<NormalizedFill>[]>
        - TokenizedValue<T> = T | { tokenRef, fallback: T }
    • visible: TokenizedValue<boolean>
    • opacity: TokenizedValue<number>
    ↓
ReactNode
    • type, props, children
    • instanceRef (컴포넌트 참조)
    • tokensRef (디자인 토큰 참조)
    • assets (이미지/벡터 자산)
```

## 주요 특징

1. **2-Stage Pipeline**: Extract(추출) → Normalize(정규화)가 명확히 분리됨
2. **Class-Based Architecture**: 각 단계가 클래스로 구현되어 응집도 향상
3. **Dependency Injection**: 생성자를 통한 의존성 주입으로 테스트 용이성 확보
4. **Singleton Instances**: 각 클래스는 싱글톤 인스턴스로 export되어 일관된 사용
5. **Token Preservation**: VariableAlias를 TokenizedValue로 보존하여 LLM이 토큰 시스템을 이해 가능
6. **Recursive Processing**: NodeTreeBuilder가 재귀적으로 전체 트리 순회
7. **Type Safety**: 각 단계마다 타입이 명확히 정의됨

## 각 단계별 파일 위치

| 단계                  | 파일 경로                                  | 클래스              | 메서드                                      |
| --------------------- | ------------------------------------------ | ------------------- | ------------------------------------------- |
| Entry Point           | `src/main/node/index.ts`                   | `NodeTreeBuilder`   | `build()`                                   |
| Type Builders         | `src/main/node/builders.ts`                | -                   | `buildTextNode()`, `buildFrameNode()`, etc. |
| Node Data Building    | `src/main/node/props.ts`                   | `NodeDataBuilder`   | `build()`                                   |
| Extract               | `src/main/pipeline/extract/style.ts`       | `StyleExtractor`    | `extract()`                                 |
| Extract - Fills       | `src/main/pipeline/extract/fills.ts`       | `FillExtractor`     | `extract()`                                 |
| Extract - Effects     | `src/main/pipeline/extract/effects.ts`     | `EffectsExtractor`  | `extract()`                                 |
| Extract - Layout      | `src/main/pipeline/extract/layout.ts`      | `LayoutExtractor`   | `extract()`                                 |
| Extract - Text        | `src/main/pipeline/extract/text.ts`        | `TextExtractor`     | `extract()`                                 |
| Extract - Stroke      | `src/main/pipeline/extract/stroke.ts`      | `StrokeExtractor`   | `extract()`                                 |
| Extract - Value Types | `src/main/pipeline/extract/value-types.ts` | -                   | 타입 정의                                   |
| Normalize             | `src/main/pipeline/normalize/style.ts`     | `StyleNormalizer`   | `normalize()`                               |
| Normalize - Fills     | `src/main/pipeline/normalize/fills.ts`     | `PaintNormalizer`   | `normalizeFills()`                          |
| Normalize - Effects   | `src/main/pipeline/normalize/effects.ts`   | `EffectsNormalizer` | `normalizeEffects()`                        |
| Normalize - Layout    | `src/main/pipeline/normalize/layout.ts`    | `LayoutNormalizer`  | `normalizeLayout()`                         |
| Normalize - Text      | `src/main/pipeline/normalize/text.ts`      | `TextNormalizer`    | `normalizeText()`                           |
| Normalize - Stroke    | `src/main/pipeline/normalize/stroke.ts`    | `StrokeNormalizer`  | `normalizeStroke()`                         |
| Variable Resolution   | `src/main/pipeline/variables/registry.ts`  | `VariableRegistry`  | `resolveAlias()`                            |
| Schema Validation     | `src/main/pipeline/shared/schemas.ts`      | -                   | Zod 스키마 정의                             |

## 타입 정의 위치

| 타입                     | 파일 경로                                  |
| ------------------------ | ------------------------------------------ |
| ReactNode 관련           | `src/main/node/type.ts`                    |
| ExtractedStyle 관련      | `src/main/pipeline/extract/types.ts`       |
| Extracted Value Types    | `src/main/pipeline/extract/value-types.ts` |
| NormalizedStyle 관련     | `src/main/pipeline/normalize/types.ts`     |
| TokenizedValue, TokenRef | `src/main/pipeline/normalize/types.ts`     |
| InstanceRef, AssetRef    | `src/main/node/type.ts`                    |
