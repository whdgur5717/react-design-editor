import { css, cx } from "@design-editor/theme/css"
import { Slot } from "radix-ui"
import type { ComponentPropsWithoutRef } from "react"
import { forwardRef } from "react"

import { recipe, type ButtonVariantProps } from "./recipe"

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
	asChild?: boolean
} & ButtonVariantProps

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ asChild, className, ...props }, ref) => {
	const Comp = asChild ? Slot.Root : "button"
	const [variantProps, componentProps] = recipe.splitVariantProps(props)
	const styles = recipe.raw(variantProps)
	return <Comp ref={ref} className={cx(css(styles), className)} {...componentProps} />
})

Button.displayName = "Button"
