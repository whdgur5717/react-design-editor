---
name: commit
description: 변경사항을 분석하여 atomic commit으로 나누고, 이모지 conventional commit 메시지를 생성합니다. "커밋해", "커밋 만들어", "/commit" 같은 요청 시 호출하세요.
---

# Commit 스킬

변경사항을 분석하고, 논리적 단위로 나눠서 atomic commit을 만든다.

## 옵션

- `--no-verify`: pre-commit 체크(lint, type-check, build) 건너뛰기

## 워크플로우

### 1단계: Pre-commit 체크

`--no-verify`가 아니면 실행:

- `pnpm lint`
- `pnpm type-check`
- `pnpm build`

실패 시 사용자에게 진행 여부를 묻는다.

### 2단계: 변경사항 분석

`git status`, `git diff`, `git diff --cached`를 병렬 실행하여 전체 변경사항을 파악한다. **이 시점에서는 아무것도 스테이징하지 않는다.**

### 3단계: 커밋 전략 수립 → 사용자 확인

분석 결과를 바탕으로 커밋 전략을 세운 뒤, **AskUserQuestion으로 사용자에게 제안하고 확인받는다.**

제안 시 포함할 내용:

- 몇 개의 커밋으로 나눌 것인지
- 각 커밋의 범위와 메시지
- 분리가 애매한 부분이 있으면 선택지를 제시

### 4단계: 커밋 실행

사용자가 확인한 전략대로 실행한다.

- 파일 단위로 나뉘면 `git add <파일>`
- 같은 파일 안에 다른 관심사가 섞여 있으면 `git add -p`로 hunk 단위 분리
- 여러 커밋이면: 백업(stash/임시 브랜치) → 부분 스테이징 → 커밋 → 반복 → 최종 확인
- 원본 변경사항이 누락되지 않도록 완료 후 `git diff` + `git status`로 검증

## 커밋 메시지 형식

`{emoji} {type}({scope}): {설명}`

**제목 한 줄이면 충분하다.** 본문은 diff를 요약하는 게 아니다. "왜 이렇게 했는지"가 제목만으로 자명하지 않을 때만 쓴다.

Good — 제목만:

```
✨ feat(instance): allow instance nodes to have children
```

Good — 본문이 필요한 경우 (왜가 자명하지 않을 때):

```
♻️ refactor(canvas): replace direct DOM measurement with cache

ResizeObserver 콜백이 렌더 사이클과 타이밍이 안 맞아서
getBoundingClientRect 대신 캐시된 값을 사용하도록 변경
```

Bad — diff를 그대로 나열:

```
✨ feat(instance): allow instance nodes to have children

- Move children from ElementNode to BaseNode
- Add renderRootContent to handle text/instance
- Extract renderInstanceContent for reuse
- Support text/instance serialization in codegen
```

### 이모지 매핑

| 이모지 | type     | 용도             |
| ------ | -------- | ---------------- |
| ✨     | feat     | 새 기능          |
| 🐛     | fix      | 버그 수정        |
| ♻️     | refactor | 리팩토링         |
| 📝     | docs     | 문서             |
| 💄     | style    | 코드 스타일/포맷 |
| ⚡️     | perf     | 성능 개선        |
| ✅     | test     | 테스트           |
| 🔧     | chore    | 설정/도구        |
| 🚀     | ci       | CI/CD            |
| 🔥     | fix      | 코드/파일 제거   |
| 🚑️     | fix      | 긴급 핫픽스      |
| 🏗️     | refactor | 아키텍처 변경    |
| 🏷️     | feat     | 타입 추가/수정   |
| 🦺     | feat     | 유효성 검증      |
| 🩹     | fix      | 사소한 수정      |

## 커밋 분리 기준

1. **다른 관심사**: 서로 무관한 코드 영역의 변경
2. **다른 변경 유형**: feat + fix + refactor가 섞여 있음
3. **파일 패턴**: 소스 코드 vs 문서 vs 설정 파일
4. **논리적 그룹**: 따로 리뷰하는 게 더 이해하기 쉬운 경우

## 규칙

- 커밋 제목은 72자 이내
- 현재형, 명령형으로 작성 ("add" not "added")
