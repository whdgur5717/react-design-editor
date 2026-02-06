#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const TASKS_FILE = ".taskmaster/tasks/tasks.json"

function parseArgs() {
	const args = process.argv.slice(2)
	const options = { all: false, id: null, noSubissues: false }

	for (const arg of args) {
		if (arg === "--all") options.all = true
		if (arg === "--no-subissues") options.noSubissues = true
		if (arg.startsWith("--id=")) options.id = arg.split("=")[1]
	}

	return options
}

function readTasks() {
	const filePath = path.resolve(process.cwd(), TASKS_FILE)
	if (!fs.existsSync(filePath)) {
		console.error(`tasks.json not found: ${filePath}`)
		process.exit(1)
	}

	const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
	return data.master?.tasks || []
}

function checkExistingIssue(title) {
	try {
		const result = execSync(`gh issue list --search "${title}" --json number,title`, {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		})
		const issues = JSON.parse(result)
		return issues.find((i) => i.title === title)
	} catch {
		return null
	}
}

function createIssueBody(task) {
	let body = ""

	// 목표
	body += `## 목표\n${task.description || "(설명 없음)"}\n\n`

	// 핵심기능 (subtasks를 체크리스트로)
	if (task.subtasks?.length > 0) {
		body += `## 핵심기능\n`
		for (const sub of task.subtasks) {
			body += `- [ ] ${sub.title}\n`
		}
		body += "\n"
	}

	body += `---\n`
	body += `**Priority**: ${task.priority || "medium"}\n`
	body += `**TaskMaster ID**: ${task.id}\n`

	return body
}

function createSubIssues(parentIssueNumber, subtasks, parentTaskId) {
	console.log(`   Creating ${subtasks.length} sub-issues for #${parentIssueNumber}...`)

	for (const subtask of subtasks) {
		const subTitle = `[Task ${parentTaskId}.${subtask.id}] ${subtask.title}`

		// 이미 존재하는지 체크
		const existing = checkExistingIssue(subTitle)
		if (existing) {
			console.log(`   ⏭  Skipped (exists): ${subTitle} → #${existing.number}`)
			continue
		}

		// 간소화된 본문 - 구체적 구현 내용 없이
		const subBody = `Parent: #${parentIssueNumber}\n\n---\n**TaskMaster ID**: ${parentTaskId}.${subtask.id}`

		const tmpFile = `/tmp/gh-subissue-body-${subtask.id}.md`
		fs.writeFileSync(tmpFile, subBody)

		try {
			// 라벨 없이 생성
			const cmd = `gh sub-issue create -p ${parentIssueNumber} -t "${subTitle}" -b "$(cat ${tmpFile})"`
			const result = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] })
			console.log(`   ✅ Sub-issue: ${subTitle} → ${result.trim()}`)
		} catch (err) {
			console.error(`   ❌ Failed sub-issue: ${subTitle}`)
			console.error(`      ${err.message}`)
		} finally {
			fs.unlinkSync(tmpFile)
		}
	}
}

function createIssue(task, createSubissues = true) {
	const title = `[Task ${task.id}] ${task.title}`

	const existing = checkExistingIssue(title)
	if (existing) {
		console.log(`⏭  Skipped (exists): ${title} → #${existing.number}`)

		// 서브이슈 생성 (기존 이슈에 대해서도)
		if (createSubissues && task.subtasks?.length > 0) {
			createSubIssues(existing.number, task.subtasks, task.id)
		}
		return existing.number
	}

	const body = createIssueBody(task)

	const tmpFile = `/tmp/gh-issue-body-${task.id}.md`
	fs.writeFileSync(tmpFile, body)

	let issueNumber = null

	try {
		// 라벨 없이 생성
		const cmd = `gh issue create -t "${title}" -F "${tmpFile}"`
		const result = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] })
		const issueUrl = result.trim()
		issueNumber = issueUrl.match(/\/issues\/(\d+)/)?.[1]
		console.log(`✅ Created: ${title} → ${issueUrl}`)

		// 서브이슈 생성
		if (createSubissues && task.subtasks?.length > 0 && issueNumber) {
			createSubIssues(issueNumber, task.subtasks, task.id)
		}
	} catch (err) {
		console.error(`❌ Failed: ${title}`)
		console.error(err.message)
	} finally {
		fs.unlinkSync(tmpFile)
	}

	return issueNumber
}

function main() {
	const options = parseArgs()
	const tasks = readTasks()

	if (tasks.length === 0) {
		console.log("No tasks found.")
		return
	}

	console.log(`Found ${tasks.length} tasks\n`)

	let targetTasks = tasks

	if (options.id) {
		targetTasks = tasks.filter((t) => String(t.id) === options.id)
		if (targetTasks.length === 0) {
			console.error(`Task not found: ${options.id}`)
			process.exit(1)
		}
	}

	for (const task of targetTasks) {
		createIssue(task, !options.noSubissues)
	}

	console.log("\nDone!")
}

main()
