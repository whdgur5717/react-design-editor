import type { CSSProperties, HTMLAttributes, ReactNode } from "react"

export { default as launchCardStyles } from "./LaunchCard.css?inline"

type LaunchCardProps = Record<string, unknown> & {
	children?: ReactNode
	className?: string
	eyebrow?: string
	status?: string
	style?: CSSProperties
	title?: string
}

export function LaunchCard({
	children,
	className,
	eyebrow = "SDK consumer",
	status = "Ready",
	style,
	title = "Launch board",
	...props
}: LaunchCardProps) {
	const sectionProps = props as HTMLAttributes<HTMLElement>
	const classes = ["demo-launch-card", className].filter(Boolean).join(" ")

	return (
		<section {...sectionProps} className={classes} style={style} data-demo-component="registered-react-function">
			<div className="demo-launch-card__topline">
				<span className="demo-launch-card__eyebrow">{eyebrow}</span>
				<span className="demo-launch-card__status">{status}</span>
			</div>
			<h1 className="demo-launch-card__title">{title}</h1>
			<div className="demo-launch-card__rule" />
			{children ? <div className="demo-launch-card__copy">{children}</div> : null}
		</section>
	)
}
