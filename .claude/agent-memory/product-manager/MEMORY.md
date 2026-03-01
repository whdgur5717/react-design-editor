# Product Manager Memory

## 제품 개요

- DOM/React 기반 디자인 에디터. 에디터에서 보이는 것이 곧 React 코드.
- 리포: `whdgur5717/react-design-editor`
- 주요 사용자(개발자): whdgur5717

## 아키텍처 핵심

- Shell(3000) + Canvas iframe(3001) 분리 구조 (CSS/JS 격리)
- Zustand + immer 상태관리, XState 포인터 상태머신, Penpal iframe 통신
- Command 패턴 (Undo/Redo), Strategy 패턴 (도구)
- 상세: `packages/spec.md`, `packages/CLAUDE.md`

## 기능 현황 (2026-03-01 기준)

- [상세](./feature-status.md)

## Open Issues

- #45: 스크롤 시 selection box 위치 어긋남 (버그)
- #36: 리사이즈 Undo가 step별로 쌓임 (버그, transaction 미사용)
- #35: E2E 테스트 인프라 구축 (일부 완료 - CI 설정됨, POM 등 미완)
- #20: 방향성 메모 (dnd-kit 검토)
- #13: 추가 구현사항 정리용 이슈
- #5: PropertiesPanel Figma용어 -> CSS용어 리팩토링

## 결정 사항

- PRD 저장 경로: `docs/prd/<기능명>.md`
- docs/prd/ 디렉토리 생성됨 (2026-03-01)
- 코드 컴포넌트 시스템 로드맵 작성됨: `docs/prd/code-component-system-roadmap.md`
  - Phase 1: 코드 생성 완성 (인스턴스 + TextNode)
  - Phase 2: PropertyControl 타입 확장 (image, array, object)
  - Phase 3: Export 워크플로우
  - Phase 4: 오버라이드 시스템
  - Phase 5: npm import + 빌트인 라이브러리
