---
name: task-to-issue
description: TaskMaster 태스크를 GitHub Issue + Sub-issues로 등록합니다. 구현 디테일은 제거하고 "무엇을 만들어야 하는지"만 기술합니다. "다음 작업 이슈로", "태스크 이슈 등록" 같은 요청 시 호출하세요.
---

# Task to GitHub Issue

TaskMaster 태스크를 GitHub Issue로 등록합니다. **구현 디테일은 제거**하고 핵심만 남깁니다.

## 워크플로우

1. 태스크 ID가 없으면 `task-master next`로 다음 작업 선정
2. `task-master show <id>`로 태스크 정보 가져오기
3. **구현 디테일 제거** 후 Issue 생성
4. 서브태스크가 있으면 Sub-issue로 생성

## Issue 본문 형식

```markdown
## 목표
{description에서 핵심만 추출}

## Acceptance Criteria
{testStrategy를 체크리스트로 변환}

---
**Priority**: {priority}
**Dependencies**: {dependencies}
**TaskMaster ID**: {id}

> 구체적인 구현 방식은 작업자와 논의 후 결정합니다.
```

**주의**: `details` 필드는 **포함하지 않습니다**. 세부 구현은 `/discuss`에서 논의합니다.

## 실행 방법

### 다음 작업을 이슈로 등록

```bash
# 1. 다음 태스크 확인
task-master next

# 2. Parent Issue 생성
gh issue create -t "[Task {id}] {title}" -F body.md -l "status:pending"

# 3. Sub-issues 생성 (서브태스크마다)
gh sub-issue create -p {parentNumber} -t "Task {parentId}.{subId}: {title}" -b "{body}" -l "status:pending"
```

### 특정 태스크를 이슈로 등록

```bash
task-master show {id}
# 이후 동일
```

## 출력

- Parent Issue 번호 + URL
- Sub-issue 번호들 목록

## 다음 단계

이슈 생성 후 `/discuss {issue번호}`로 구현 방향을 논의하세요.
