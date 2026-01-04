import { extractBaseProps } from './props';
import type {
	ExtractNodeType,
	FrameReactNode,
	GenericReactNode,
	GroupReactNode,
	InstanceReactNode,
	RectangleReactNode,
	TextReactNode,
} from './type';

export const extractTextNode = (node: TextNode): TextReactNode => ({
	type: 'TEXT',
	props: extractBaseProps(node),
});

export const extractFrameNode = (node: FrameNode): FrameReactNode => ({
	type: 'FRAME',
	props: extractBaseProps(node),
});

export const extractInstanceNode = (node: InstanceNode): InstanceReactNode => ({
	type: 'INSTANCE',
	props: {
		...extractBaseProps(node),
		componentProperties: node.componentProperties,
	},
});

export const extractGroupNode = (node: GroupNode): GroupReactNode => ({
	type: 'GROUP',
	props: extractBaseProps(node),
});

export const extractRectangleNode = (node: RectangleNode): RectangleReactNode => ({
	type: 'RECTANGLE',
	props: extractBaseProps(node),
});

export const extractGenericNode = (
	node: Extract<SceneNode, { type: Exclude<SceneNode['type'], ExtractNodeType> }>,
): GenericReactNode => ({
	type: node.type,
	props: extractBaseProps(node),
});
