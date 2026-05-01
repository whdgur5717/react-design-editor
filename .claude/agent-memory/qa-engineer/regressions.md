# Regressions

<!--
Each entry:
## YYYY-MM-DD: [Short title]
- **Area**: shell | canvas | integration | codegen
- **Repro Steps**:
- **Expected**:
- **Actual**:
- **Evidence**: (logs, screenshot path, Playwright trace)
- **Status**: open | mitigated | fixed (link to issue or PR)
-->

## 2026-03-12: Flex Child 섹션이 절대 표시되지 않음 (parentStyle 미전달)

- **Area**: shell
- **Repro Steps**:
  1. root 노드를 선택하고 display를 "flex"로 변경
  2. 자식 노드(text-1)를 선택
  3. Properties Panel에서 "Flex Child" 섹션 확인
- **Expected**: Flex Child 섹션(flexGrow, flexShrink, flexBasis, alignSelf)이 표시된다
- **Actual**: Flex Child 섹션이 표시되지 않음
- **Root Cause**: `packages/editor-shell/src/components/PropertiesPanel/index.tsx:48`에서 `<DesignTab node={selectedNode} />`로 호출하면서 `parentStyle` prop을 전달하지 않음. `DesignTab`은 `parentStyle`이 없으면 `isSectionVisible`에서 `target: "parent"` 조건이 항상 false를 반환.
- **Fix**: `PropertiesPanel`에서 선택된 노드의 부모 노드를 찾아 `parentStyle`을 전달해야 함
- **Impact**: designTabSchema의 Flex Child 섹션(flexGrow, flexShrink, flexBasis, alignSelf)이 전혀 동작하지 않음. P0 blocking bug — flex child 속성을 설정할 수 없으므로 capability gap.
- **Status**: open
