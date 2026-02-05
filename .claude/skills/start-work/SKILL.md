---
name: start-work
description: 논의가 완료된 GitHub Issue에서 연동 브랜치를 생성하고 작업을 시작합니다. "작업 시작", "브랜치 만들어", "이제 구현하자" 같은 요청 시 호출하세요.
---

# Start Work

논의가 완료된 Issue에서 Development 섹션에 연동되는 브랜치를 생성하고 작업을 시작합니다.

## 워크플로우

1. Issue 정보 확인
2. 브랜치명 생성
3. `gh issue develop`로 브랜치 생성 (자동 연동)
4. 라벨 업데이트 (pending → in-progress)
5. TaskMaster 상태 업데이트

## 실행 방법

### 1. Issue 정보 확인 (라벨, 본문 등 전체 메타데이터)

```bash
gh issue view {number} --json title,number,body,labels,milestone,assignees
```

이슈의 전체 컨텍스트를 파악:
- **title**: 작업 제목
- **body**: 구현 요구사항, 상세 설명
- **labels**: 타입(feat/fix/refactor), 우선순위, 영역 등
- **milestone**: 마일스톤 정보
- **assignees**: 담당자

### 2. 브랜치 생성 (Development 섹션 자동 연동)

```bash
gh issue develop {number} --name feature/{number}-{slug}
```

예시:

```bash
gh issue develop 45 --name feature/45-undo-redo-system
```

이렇게 하면:

- Issue #45의 "Development" 섹션에 브랜치가 연결됨
- 이 브랜치에서 PR 만들면 자동으로 Issue와 연결됨
- PR 머지 시 Issue 자동 닫힘

### 3. 라벨 업데이트

```bash
gh issue edit {number} --remove-label "status:pending" --add-label "status:in-progress"
```

### 4. TaskMaster 상태 업데이트

```bash
task-master set-status --id={taskId} --status=in-progress
```

## 입력

- GitHub Issue 번호 (필수)
- 브랜치명 (선택, 없으면 자동 생성)

## 출력

- 생성된 브랜치명
- 체크아웃 완료 확인

## 브랜치 네이밍 규칙

```
feature/{issue번호}-{slug}
```

예시:

- `feature/45-undo-redo-system`
- `feature/46-history-middleware-types`

## 다음 단계

Issue는 초안이다. 브랜치 생성 후 작업자와 논의하며 구현 방향을 확정한다.

1. **Issue 분석**: body, labels 등 전체 컨텍스트 파악
2. **비판적 검토**: 구현 디테일이 있더라도 그대로 따르지 말고 비판적으로 판단
3. **논의 및 확정**: 작업자와 최종 구현 범위/방식 합의
4. **Issue 수정**: 필요시 본문, 라벨 등 이슈 자체를 수정
5. **구현 진행**

```bash
# Issue 수정 (필요시)
gh issue edit {number} --body "수정된 내용"
gh issue edit {number} --add-label "area:shell" --remove-label "area:canvas"
```

완료 후:

```bash
# PR 생성 (Issue 자동 연결됨)
gh pr create --title "feat: undo/redo system" --body "Closes #{issue번호}"

# TaskMaster 완료 처리
task-master set-status --id={taskId} --status=done
```
