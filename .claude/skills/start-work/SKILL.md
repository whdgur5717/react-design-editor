---
name: start-work
description: 구현 방향을 논의하고, GitHub Issue를 생성한 뒤, 연동 브랜치까지 만들어 작업을 시작합니다. "작업 시작", "브랜치 만들어", "이제 구현하자" 같은 요청 시 호출하세요.
---

# Start Work

새 작업을 시작할 때 사용합니다. 구현 방향 논의 → GitHub Issue 생성 → 연동 브랜치 생성까지 한 번에 진행합니다.

> 이미 Issue가 있는 상태에서 구현 방향만 논의하려면 `/discuss`를 사용하세요.

## 워크플로우

1. 작업 내용 파악 및 구현 방향 논의
2. GitHub Issue 생성
3. `gh issue develop`로 연동 브랜치 생성
4. 라벨 업데이트 (status:in-progress)

## 실행 방법

### 1. 구현 방향 논의

사용자가 요청한 작업에 대해 코드베이스를 탐색하고 논의합니다:

- 관련 파일 구조 파악
- 기존 패턴/컨벤션 확인
- 기술 선택, 인터페이스 설계, 엣지케이스 등을 사용자와 합의

### 2. GitHub Issue 생성

논의가 완료되면 Issue를 생성합니다:

```bash
gh issue create \
  --title "{type}: {간결한 제목}" \
  --body "$(cat <<'EOF'
## 목표

{합의된 구현 방향 요약}

## 변경 사항

- {수정/생성할 파일과 변경 내용}

## 검증

- [ ] {검증 항목}
EOF
)" \
  --label "{type},{area}"
```

### 3. 연동 브랜치 생성

```bash
gh issue develop {number} --name {type}/{number}-{slug}
```

이렇게 하면:

- Issue의 "Development" 섹션에 브랜치가 연결됨
- 이 브랜치에서 PR 만들면 자동으로 Issue와 연결됨
- PR 머지 시 Issue 자동 닫힘

### 4. 라벨 업데이트

```bash
gh issue edit {number} --add-label "status:in-progress"
```

## 브랜치 네이밍 규칙

```
{type}/{issue번호}-{slug}
```

예시:

- `feat/45-undo-redo-system`
- `fix/52-canvas-scroll-bug`
- `refactor/48-folder-structure`

## 입력

- 작업 설명 (필수) — 무엇을 만들지, 무엇을 고칠지

## 출력

- 합의된 구현 방향
- 생성된 Issue 번호 + URL
- 생성된 브랜치명
- 체크아웃 완료 확인
