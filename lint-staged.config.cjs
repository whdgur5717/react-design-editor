const packages = {
	"editor-core": "@open-editor-sdk/core",
	"editor-components": "@open-editor-sdk/components",
	"editor-canvas": "@open-editor-sdk/canvas",
	"editor-shell": "@open-editor-sdk/shell",
}

const config = {}

for (const [dir, name] of Object.entries(packages)) {
	config[`packages/${dir}/**/*.{ts,tsx}`] = (files) => [
		`pnpm --filter ${name} lint ${files.join(" ")}`,
		// `pnpm --filter ${name} type-check`,
	]
}

config["*"] = (files) => [`prettier --write --ignore-unknown ${files.join(" ")}`]

module.exports = config
