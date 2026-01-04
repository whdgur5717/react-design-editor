import {
	extractFrameNode,
	extractGenericNode,
	extractGroupNode,
	extractInstanceNode,
	extractRectangleNode,
	extractTextNode,
} from './builders';
import type { ReactNode } from './type';

export const figmaNodeToReactNode = async (node: SceneNode): Promise<ReactNode> => {
	let baseNode: ReactNode;
	switch (node.type) {
		case 'TEXT':
			baseNode = extractTextNode(node);
			break;
		case 'RECTANGLE':
			baseNode = extractRectangleNode(node);
			break;
		case 'INSTANCE':
			baseNode = extractInstanceNode(node);
			break;
		case 'FRAME':
			baseNode = extractFrameNode(node);
			break;
		case 'GROUP':
			baseNode = extractGroupNode(node);
			break;
		default:
			baseNode = extractGenericNode(node);
	}

	const childrenNodes = 'children' in node ? node.children.filter((child) => child.visible !== false) : [];

	if (childrenNodes.length === 0) {
		return baseNode;
	}

	const children = await Promise.all(childrenNodes.map((child) => figmaNodeToReactNode(child)));
	return { ...baseNode, children };
};
