import { useMemo } from "react"

const IMPORT_MAP = JSON.stringify({
	imports: {
		react: "https://esm.sh/react@18.3.1",
		"react/": "https://esm.sh/react@18.3.1/",
		"react-dom": "https://esm.sh/react-dom@18.3.1",
		"react-dom/": "https://esm.sh/react-dom@18.3.1/",
	},
})

function buildSrcdoc(compiledCode: string) {
	return `<!DOCTYPE html>
<html>
<head>
<script type="importmap">${IMPORT_MAP}</script>
<style>
body { margin: 0; padding: 16px; font-family: -apple-system, sans-serif; }
#root { width: 100%; }
#error { color: red; padding: 8px; font-size: 12px; white-space: pre-wrap; }
</style>
</head>
<body>
<div id="root"></div>
<div id="error"></div>
<script type="module">
try {
  const code = ${JSON.stringify(compiledCode)};
  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const mod = await import(url);
  URL.revokeObjectURL(url);

  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(document.getElementById("root"));
  root.render(React.createElement(mod.default));
} catch (e) {
  document.getElementById("error").textContent = e.message;
}
</script>
</body>
</html>`
}

export function Preview({ compiledCode, version }: { compiledCode: string; version: number }) {
	const srcdoc = useMemo(() => buildSrcdoc(compiledCode), [compiledCode])
	console.log(srcdoc)
	return (
		<iframe
			key={version}
			srcDoc={srcdoc}
			sandbox="allow-scripts allow-same-origin"
			style={{ width: "100%", height: "100%", border: "none" }}
			title="Component Preview"
		/>
	)
}
