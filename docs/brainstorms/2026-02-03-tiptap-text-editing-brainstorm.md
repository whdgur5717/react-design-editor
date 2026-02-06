---
date: 2026-02-03
topic: tiptap-text-editing
---

# TipTap 텍스트 편집 기능

## What We're Building

에디터에 TipTap 라이브러리를 사용한 텍스트 편집 기능을 추가합니다. 사용자가 텍스트 노드를 더블클릭하면 편집 모드로 진입하고, TipTap 에디터로 텍스트를 편집할 수 있습니다.

## Why This Approach

### 선택지

1. **contentEditable 직접 구현**: 커서, IME, 브라우저 호환성 등 엣지케이스가 너무 많음
2. **TipTap 라이브러리 사용**: 검증된 라이브러리로 엣지케이스 처리됨, 리치 텍스트 확장 가능

### 결정

**TipTap 사용** - contentEditable 직접 구현은 지옥이고, TipTap이 이런 문제를 다 처리해줌

## Key Decisions

- **노드 타입**: ElementNode 유지 (TextNode 별도 생성 안 함)
- **데이터 저장**: `children: string` (plain text)
- **TipTap 범위**: Canvas 렌더링/편집 레이어에서만 사용 (노드 타입에 침범하지 않음)
- **편집 진입**: 더블클릭 (Figma/Sketch 업계 표준)
- **편집 종료**: ESC 키 또는 외부 클릭

## Architecture

```
더블클릭 (Canvas)
    ↓
onCanvasPointerEvent({ type: "dblclick", targetNodeId })
    ↓
Shell: setEditingNode(nodeId)
    ↓
syncState({ ..., editingNodeId })
    ↓
Canvas: NodeWrapper가 TipTap 렌더링
    ↓
사용자 타이핑 → TipTap onUpdate
    ↓
onCanvasTextUpdate({ nodeId, content })
    ↓
Shell: updateNodeContent(nodeId, content)
    ↓
ESC 또는 외부 클릭 → editingNodeId = null
```

## Implementation

### Modified Files

- `editor-core/src/types/event.ts` - dblclick 타입, CanvasTextUpdateEvent 추가
- `editor-core/src/types/protocol.ts` - editingNodeId, onCanvasTextUpdate 추가
- `editor-core/src/types/editor.ts` - editingNodeId, setEditingNode, updateNodeContent 추가
- `editor-shell/src/store/editor.ts` - 편집 모드 상태와 액션 추가
- `editor-shell/src/App.tsx` - Penpal 이벤트 핸들러 추가
- `editor-canvas/src/components/TextEditor.tsx` - TipTap 래퍼 (신규)
- `editor-canvas/src/renderer/NodeWrapper.tsx` - 편집 모드 로직 추가
- `editor-canvas/src/renderer/NodeWrapper.css` - 편집 모드 스타일 추가
- `editor-canvas/src/renderer/CanvasRenderer.tsx` - 편집 관련 props 전달
- `editor-canvas/src/App.tsx` - 편집 이벤트 핸들러 추가

### Packages Installed

```bash
cd packages/editor-canvas
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/pm
```

## Open Questions

- 리치 텍스트(bold, italic 등) 지원 여부 → 추후 확장 가능
- Undo/Redo 통합 최적화 → debounce 적용 가능

## Next Steps

→ 테스트 및 검증
→ 필요시 리치 텍스트 확장
