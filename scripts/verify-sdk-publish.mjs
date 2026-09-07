import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
let registry = ""

const packages = [
	{ name: "@open-editor-sdk/core", dir: "packages/editor-core" },
	{ name: "@open-editor-sdk/components", dir: "packages/editor-components" },
	{ name: "@open-editor-sdk/shell", dir: "packages/editor-shell" },
	{ name: "@open-editor-sdk/canvas", dir: "packages/editor-canvas" },
	{ name: "open-editor-sdk", dir: "packages/sdk" },
]

function run(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: options.cwd ?? repoRoot,
			env: {
				...process.env,
				...options.env,
			},
			stdio: options.stdio ?? (options.input ? ["pipe", "inherit", "inherit"] : "inherit"),
		})

		if (options.input) {
			child.stdin?.write(options.input)
			child.stdin?.end()
		}

		let stdout = ""
		let stderr = ""
		if (options.stdio === "pipe") {
			child.stdout?.on("data", (chunk) => {
				stdout += chunk
			})
			child.stderr?.on("data", (chunk) => {
				stderr += chunk
			})
		}

		child.on("error", reject)
		child.on("close", (code) => {
			if (code === 0) {
				resolve({ stdout, stderr })
				return
			}

			const rendered = [command, ...args].join(" ")
			reject(new Error(`${rendered} failed with exit code ${code}\n${stdout}${stderr}`))
		})
	})
}

async function waitForRegistry(url, timeoutMs = 45_000) {
	const started = Date.now()
	let lastError

	while (Date.now() - started < timeoutMs) {
		try {
			const response = await fetch(url)
			if (response.ok) return
			lastError = new Error(`${url} returned ${response.status}`)
		} catch (error) {
			lastError = error
		}

		await new Promise((resolve) => setTimeout(resolve, 500))
	}

	throw lastError ?? new Error(`Timed out waiting for ${url}`)
}

async function createVerdaccioUser(npmConfigPath) {
	const username = "design-editor"
	const password = "password"
	const response = await fetch(`${registry}/-/user/org.couchdb.user:${username}`, {
		method: "PUT",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({
			name: username,
			password,
			email: "verify@example.com",
			type: "user",
			roles: [],
			date: new Date().toISOString(),
		}),
	})

	if (!response.ok) {
		throw new Error(`Could not create Verdaccio user: ${response.status} ${await response.text()}`)
	}

	const body = await response.json()
	if (!body.token) throw new Error("Verdaccio user creation did not return an auth token")

	const registryUrl = new URL(registry)
	await writeFile(
		npmConfigPath,
		[`registry=${registry}`, `//${registryUrl.host}/:_authToken=${body.token}`, ""].join("\n"),
	)
}

async function findOpenPort() {
	return new Promise((resolve, reject) => {
		const server = createServer()
		server.listen(0, "127.0.0.1", () => {
			const address = server.address()
			const port = typeof address === "object" && address ? address.port : null
			server.close(() => {
				if (port) resolve(port)
				else reject(new Error("Could not allocate a local port"))
			})
		})
		server.on("error", reject)
	})
}

async function startVerdaccio(workDir, port) {
	const configPath = path.join(workDir, "verdaccio.yaml")
	const storagePath = path.join(workDir, "storage")
	await mkdir(storagePath, { recursive: true })
	await writeFile(
		configPath,
		[
			`storage: ${storagePath}`,
			"auth:",
			"  htpasswd:",
			`    file: ${path.join(workDir, "htpasswd")}`,
			"uplinks:",
			"  npmjs:",
			"    url: https://registry.npmjs.org/",
			"packages:",
			"  '@open-editor-sdk/*':",
			"    access: $all",
			"    publish: $all",
			"    unpublish: $all",
			"  '**':",
			"    access: $all",
			"    publish: $all",
			"    unpublish: $all",
			"    proxy: npmjs",
			"logs:",
			"  - {type: stdout, format: pretty, level: warn}",
			"",
		].join("\n"),
	)

	const child = spawn("pnpm", ["dlx", "verdaccio", "--config", configPath, "--listen", `127.0.0.1:${port}`], {
		cwd: repoRoot,
		env: process.env,
		stdio: ["ignore", "pipe", "pipe"],
	})

	let logs = ""
	child.stdout.on("data", (chunk) => {
		logs += chunk
	})
	child.stderr.on("data", (chunk) => {
		logs += chunk
	})

	await waitForRegistry(`${registry}/-/ping`)

	return {
		stop: async () => {
			if (child.exitCode !== null) return
			child.kill("SIGTERM")
			await new Promise((resolve) => child.once("close", resolve))
		},
		logs: () => logs,
	}
}

async function packAndAssertManifest(packageDir, packDir) {
	const { stdout } = await run(
		"pnpm",
		["--config.ignore-scripts=true", "--dir", packageDir, "pack", "--json", "--pack-destination", packDir],
		{
			stdio: "pipe",
		},
	)
	const parsed = JSON.parse(stdout)
	const packResult = Array.isArray(parsed) ? parsed[0] : parsed
	const tarballPath = path.join(packDir, path.basename(packResult.filename))
	const { stdout: manifestJson } = await run("tar", ["-xOf", tarballPath, "package/package.json"], { stdio: "pipe" })
	const manifest = JSON.parse(manifestJson)

	if (manifest.name === "open-editor-sdk") {
		if (!manifest.exports?.["."]?.import?.startsWith("./dist/")) {
			throw new Error("open-editor-sdk packed manifest is missing a root dist export")
		}
		if (!manifest.sideEffects?.includes("**/*.css")) {
			throw new Error("open-editor-sdk packed manifest is missing sideEffects CSS preservation")
		}
	}

	if (manifest.publishConfig?.access !== "public") {
		throw new Error(`${manifest.name} packed manifest is missing publishConfig.access=public`)
	}

	return { manifest, tarballPath }
}

async function createConsumerApp(consumerDir, port, sdkVersion) {
	await mkdir(path.join(consumerDir, "src"), { recursive: true })

	await writeFile(
		path.join(consumerDir, "package.json"),
		JSON.stringify(
			{
				name: "open-editor-sdk-publish-smoke",
				private: true,
				type: "module",
				scripts: {
					build: "vite build",
					dev: `vite --host 127.0.0.1 --port ${port} --strictPort`,
					measure: "node measure.mjs",
				},
				dependencies: {
					"open-editor-sdk": sdkVersion,
					"@vitejs/plugin-react": "^4.7.0",
					vite: "^6.4.1",
					react: "18.3.1",
					"react-dom": "18.3.1",
				},
			},
			null,
			2,
		),
	)

	await writeFile(
		path.join(consumerDir, "vite.config.js"),
		[
			'import { defineConfig } from "vite"',
			'import react from "@vitejs/plugin-react"',
			"",
			"export default defineConfig({",
			"  plugins: [react()],",
			"})",
			"",
		].join("\n"),
	)

	await writeFile(
		path.join(consumerDir, "index.html"),
		'<div id="root"></div><script type="module" src="/src/main.jsx"></script>\n',
	)

	await writeFile(
		path.join(consumerDir, "src/main.jsx"),
		[
			'import React from "react"',
			'import { createRoot } from "react-dom/client"',
			"import {",
			"  createEditor,",
			"  EditorCanvas,",
			"  EditorProvider,",
			"  EditorRoot,",
			"  LayersPanel,",
			"  PropertiesPanel,",
			"  Toolbar,",
			'} from "open-editor-sdk"',
			'import "open-editor-sdk/styles.css"',
			"",
			"const editor = createEditor()",
			"window.__designEditorSmoke = { editor }",
			"",
			"const style = document.createElement('style')",
			"style.textContent = `",
			"html, body, #root { height: 100%; margin: 0; }",
			".de-editor-root {",
			"  grid-template-columns: 240px minmax(0, 1fr) 280px;",
			"  grid-template-rows: 48px minmax(0, 1fr);",
			"  grid-template-areas: 'toolbar toolbar toolbar' 'layers canvas properties';",
			"}",
			".toolbar { grid-area: toolbar; }",
			".layers-panel { grid-area: layers; min-height: 0; }",
			".properties-panel { grid-area: properties; min-height: 0; }",
			".de-editor-canvas-host { grid-area: canvas; background: #f5f5f5; }",
			"`",
			"document.head.append(style)",
			"",
			"function App() {",
			"  return (",
			"    <EditorProvider editor={editor}>",
			"      <EditorRoot>",
			"        <Toolbar />",
			"        <LayersPanel />",
			"        <EditorCanvas />",
			"        <PropertiesPanel />",
			"      </EditorRoot>",
			"    </EditorProvider>",
			"  )",
			"}",
			"",
			"createRoot(document.getElementById('root')).render(<App />)",
			"",
		].join("\n"),
	)

	await writeFile(
		path.join(consumerDir, "measure.mjs"),
		[
			'import { build } from "vite"',
			'import react from "@vitejs/plugin-react"',
			'import { gzipSync } from "node:zlib"',
			"",
			"const entries = {",
			"  createOnly: `",
			'    import { createEditor } from "open-editor-sdk"',
			"    const editor = createEditor()",
			"    console.log(editor.state.getSnapshot().document.id)",
			"  `,",
			"  editorScreen: `",
			'    import "open-editor-sdk/styles.css"',
			'    import { createEditor, EditorCanvas, EditorProvider, EditorRoot, LayersPanel, PropertiesPanel, Toolbar } from "open-editor-sdk"',
			"    const editor = createEditor()",
			"    console.log(editor.state.getSnapshot().document.id, EditorCanvas, EditorProvider, EditorRoot, LayersPanel, PropertiesPanel, Toolbar)",
			"  `,",
			"}",
			"",
			"const external = [",
			'  "react",',
			'  "react-dom",',
			'  "react-dom/client",',
			'  "react-dom/server",',
			'  "react/jsx-runtime",',
			'  "react/jsx-dev-runtime",',
			"]",
			"",
			"async function measure(name) {",
			"  const result = await build({",
			"    configFile: false,",
			"    root: process.cwd(),",
			"    plugins: [",
			"      react(),",
			"      {",
			'        name: "virtual-sdk-entry",',
			"        resolveId(id) {",
			"          if (id === `virtual:${name}`) return `\\0virtual:${name}`",
			"        },",
			"        load(id) {",
			"          if (id === `\\0virtual:${name}`) return entries[name]",
			"          return null",
			"        },",
			"      },",
			"    ],",
			"    build: {",
			"      write: false,",
			"      sourcemap: false,",
			'      minify: "esbuild",',
			"      cssCodeSplit: true,",
			"      rollupOptions: {",
			"        input: `virtual:${name}`,",
			"        external,",
			"        output: {",
			'          format: "esm",',
			'          entryFileNames: "[name].js",',
			'          chunkFileNames: "chunks/[name]-[hash].js",',
			'          assetFileNames: "assets/[name]-[hash][extname]",',
			"        },",
			"      },",
			"    },",
			'    logLevel: "silent",',
			"  })",
			"  const output = Array.isArray(result) ? result[0].output : result.output",
			"  const files = output.map((item) => {",
			"    const source = item.type === 'chunk' ? item.code : item.source",
			"    const buffer = Buffer.isBuffer(source) ? source : Buffer.from(source)",
			"    return {",
			"      type: item.type,",
			"      file: item.fileName,",
			"      bytes: buffer.length,",
			"      gzip: gzipSync(buffer).length,",
			"      isEntry: item.type === 'chunk' ? item.isEntry : false,",
			"      isDynamicEntry: item.type === 'chunk' ? item.isDynamicEntry : false,",
			"      imports: item.type === 'chunk' ? item.imports : [],",
			"      dynamicImports: item.type === 'chunk' ? item.dynamicImports : [],",
			"    }",
			"  })",
			"  const outputByFile = new Map(files.map((file) => [file.file, file]))",
			"  const initialFiles = new Set()",
			"  function addInitialFile(fileName) {",
			"    if (initialFiles.has(fileName)) return",
			"    initialFiles.add(fileName)",
			"    const file = outputByFile.get(fileName)",
			"    if (!file) return",
			"    for (const imported of file.imports) addInitialFile(imported)",
			"  }",
			"  for (const file of files) if (file.isEntry) addInitialFile(file.file)",
			"  for (const file of files) if (file.type === 'asset') initialFiles.add(file.file)",
			"  const initialGzip = [...initialFiles].reduce((sum, fileName) => sum + (outputByFile.get(fileName)?.gzip ?? 0), 0)",
			"  const totalGzip = files.reduce((sum, file) => sum + file.gzip, 0)",
			"  return {",
			"    name,",
			"    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),",
			"    totalGzip,",
			"    initialGzip,",
			"    lazyGzip: totalGzip - initialGzip,",
			"    initialFiles: [...initialFiles],",
			"    files,",
			"  }",
			"}",
			"",
			"const results = [await measure('createOnly'), await measure('editorScreen')]",
			"if (results[0].totalGzip > 80_000) {",
			"  throw new Error(`createOnly root import is too large: ${results[0].totalGzip} gzip bytes`)",
			"}",
			"console.log(JSON.stringify(results, null, 2))",
			"",
		].join("\n"),
	)
}

async function runBrowserSmoke(consumerDir, port) {
	const server = spawn("npm", ["run", "dev"], {
		cwd: consumerDir,
		env: process.env,
		stdio: ["ignore", "pipe", "pipe"],
	})

	let serverOutput = ""
	server.stdout.on("data", (chunk) => {
		serverOutput += chunk
	})
	server.stderr.on("data", (chunk) => {
		serverOutput += chunk
	})

	try {
		await waitForRegistry(`http://127.0.0.1:${port}`)
		const { chromium } = await import("@playwright/test")
		const browser = await chromium.launch()
		const page = await browser.newPage()
		const errors = []

		page.on("pageerror", (error) => errors.push(error.message))
		page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text())
		})

		await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "networkidle" })
		await page.locator(".de-editor-root").waitFor()
		await page.locator(".toolbar").waitFor()
		await page.locator(".layers-panel").waitFor()
		await page.locator(".properties-panel").waitFor()
		await page.locator("[data-design-editor-canvas-shadow-host]").waitFor()

		const hasShadowMount = await page.locator("[data-design-editor-canvas-shadow-host]").evaluate((host) => {
			return Boolean(host.shadowRoot?.querySelector("[data-design-editor-canvas-mount]"))
		})
		if (!hasShadowMount) throw new Error("Canvas shadow root mount was not created")

		const documentId = await page.evaluate(() => window.__designEditorSmoke?.editor?.state.getSnapshot().document.id)
		if (documentId !== "doc-root") throw new Error(`Unexpected editor document id: ${documentId}`)

		if (errors.length) throw new Error(`Browser console/runtime errors:\n${errors.join("\n")}`)
		await browser.close()
	} finally {
		if (server.exitCode === null) {
			server.kill("SIGTERM")
			await new Promise((resolve) => server.once("close", resolve))
		}
	}
}

async function main() {
	const tempRoot = await mkdtemp(path.join(tmpdir(), "design-editor-sdk-publish-"))
	const consumerDir = path.join(tempRoot, "consumer")
	const npmConfigPath = path.join(tempRoot, ".npmrc")
	const registryPort = await findOpenPort()
	const port = await findOpenPort()
	registry = `http://127.0.0.1:${registryPort}`
	let verdaccio

	try {
		console.log("1/7 build packages")
		await run("pnpm", [
			"--filter",
			"@open-editor-sdk/core",
			"--filter",
			"@open-editor-sdk/components",
			"--filter",
			"@open-editor-sdk/shell",
			"--filter",
			"@open-editor-sdk/canvas",
			"--filter",
			"open-editor-sdk",
			"build",
		])

		console.log("2/7 inspect packed manifests")
		const packDir = path.join(tempRoot, "pack")
		await mkdir(packDir, { recursive: true })
		for (const pkg of packages) {
			const packed = await packAndAssertManifest(path.join(repoRoot, pkg.dir), packDir)
			pkg.tarballPath = packed.tarballPath
			pkg.version = packed.manifest.version
		}

		console.log("3/7 start local registry")
		verdaccio = await startVerdaccio(tempRoot, registryPort)
		await createVerdaccioUser(npmConfigPath)

		console.log("4/7 publish packages to local registry")
		for (const pkg of packages) {
			await run("pnpm", ["publish", pkg.tarballPath, "--registry", registry, "--no-git-checks"], {
				env: {
					NPM_CONFIG_REGISTRY: registry,
					NPM_CONFIG_USERCONFIG: npmConfigPath,
				},
			})
		}

		console.log("5/7 install SDK only in clean consumer app")
		const sdkPackage = packages.find((pkg) => pkg.name === "open-editor-sdk")
		if (!sdkPackage?.version) throw new Error("Could not determine the packed SDK version")
		await createConsumerApp(consumerDir, port, sdkPackage.version)
		await run("npm", ["install", "--registry", registry], {
			cwd: consumerDir,
			env: {
				NPM_CONFIG_REGISTRY: registry,
				NPM_CONFIG_USERCONFIG: npmConfigPath,
			},
		})

		const consumerPackage = JSON.parse(await readFile(path.join(consumerDir, "package.json"), "utf8"))
		const directSdkDependencies = Object.keys(consumerPackage.dependencies).filter(
			(name) => name === "open-editor-sdk" || name.startsWith("@open-editor-sdk/"),
		)
		if (directSdkDependencies.length !== 1 || directSdkDependencies[0] !== "open-editor-sdk") {
			throw new Error("Consumer app must depend directly on open-editor-sdk only")
		}

		console.log("6/7 build and measure consumer bundle")
		await run("npm", ["run", "build"], { cwd: consumerDir })
		const { stdout: bundleReport } = await run("node", ["measure.mjs"], { cwd: consumerDir, stdio: "pipe" })
		await writeFile(path.join(repoRoot, "docs/reports/sdk-publish-smoke-bundle-report.json"), bundleReport)

		console.log("7/7 run browser smoke")
		await runBrowserSmoke(consumerDir, port)

		console.log("SDK publish smoke passed")
	} catch (error) {
		if (verdaccio) {
			console.error("Verdaccio logs:")
			console.error(verdaccio.logs())
		}
		throw error
	} finally {
		if (verdaccio) await verdaccio.stop()
		await rm(tempRoot, { recursive: true, force: true })
	}
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
