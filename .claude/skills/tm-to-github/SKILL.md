---
name: tm-to-github
description: 사용자가 TaskMaster 태스크를 GitHub Issues로 등록/동기화하고 싶을 때 사용합니다. "GitHub 이슈로 만들어줘", "이슈 등록해", "GitHub에 싱크해" 같은 요청 시 호출하세요.
---

# Task Master to GitHub Issues

TaskMaster 태스크를 GitHub Issue로 등록합니다.

## 이슈 작성 형식

### Parent Issue
```markdown
# [Task {id}] {제목}

## 목표
{무엇을 할 수 있는지 - 사용자 관점}

## 핵심기능
- [ ] 기능1
- [ ] 기능2
```

### Sub-issues
- 개발 관점에서 작업 단위
- 구체적인 파일명/클래스명/구현코드 없이
- 구현 방식은 작업자가 판단

### 상태 관리
- 라벨 사용 안 함
- **assignee** = 작업 중
- **PR 열림** = 리뷰 중
- **PR 머지** (`Closes #n`) = 완료

## 실행 순서

1. `task-master next`로 다음 태스크 확인
2. 태스크 내용을 사용자와 논의 (목표/핵심기능 정리)
3. 논의 완료 후 GitHub 이슈로 등록

```bash
# 1. 다음 태스크 확인
task-master next

# 2. 태스크 내용 확인 및 논의
task-master show <태스크ID>

# 3. 논의 완료 후 이슈 등록
node .claude/skills/tm-to-github/sync.js --id=<태스크ID>
```

## 옵션

전체 태스크 등록:

```bash
node .claude/skills/tm-to-github/sync.js --all
```

서브이슈 없이 (서브태스크를 체크리스트로만):

```bash
node .claude/skills/tm-to-github/sync.js --no-subissues
```

## 스크립트

@./sync.js
