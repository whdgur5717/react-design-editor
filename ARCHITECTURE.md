# 아키텍처(폴더/파일 설계)

## 디렉터리 구조(초안)

```
src/main/
  main.ts
  pipeline/
    extract/
      index.ts
      nodes/
        frame.ts
        text.ts
        shape.ts
        group.ts
        instance.ts
      traverse.ts
      variables.ts
    normalize/
      index.ts
      geometry.ts
      layout.ts
      paint.ts
      effects.ts
      text.ts
  schema/
    input.types.ts
    output.types.ts
    zod/
      common.ts
      input.ts
      output.ts
  ai/
    client.ts
    transform.ts
  codegen/
    index.ts
    constraints.ts
  issues/
    catalog.ts
```

## 역할 분리

- `pipeline/extract/*`: Figma 노드에서 원본 데이터를 손실 없이 추출.
- `pipeline/normalize/*`: 단위/형식/값 구조 정규화, 변수 바인딩 정리.
- `schema/*`: 타입 정의 SSOT.
- `schema/zod/*`: Zod v4 스키마 + `.meta()` 메타데이터.
- `ai/*`: AI SDK 연결 및 변환 호출.
- `codegen/*`: outputSchema → React element 객체 트리.
- `issues/*`: 변환 불가 항목의 코드/메시지 정의.

## 함수명 규칙(노드 타입별)

- `build*` 대신 **extract** 접두사 사용.
- 파일명과 함수명을 1:1 매칭.

예시:

- `nodes/frame.ts` → `extractFrameNode`
- `nodes/text.ts` → `extractTextNode`
- `nodes/shape.ts` → `extractShapeNode`
- `nodes/group.ts` → `extractGroupNode`
- `nodes/instance.ts` → `extractInstanceNode`

## 파이프라인 함수명 규칙

- 추출: `extract*`
- 정규화: `normalize*`
- AI 변환: `transformInputToOutput`
- 코드 생성: `createReactElementTree`
