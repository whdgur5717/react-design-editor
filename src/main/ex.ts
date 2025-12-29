export const figmaNodeToReactNode = async (node: SceneNode): Promise<ReactFigmaNode> => {
	let baseNode: ReactFigmaNode;

	switch (node.type) {
		case 'TEXT':
			return buildTextNode(node);
		case 'RECTANGLE':
			return buildRectangleNode(node);
		case 'INSTANCE': {
			baseNode = await buildInstanceNode(node);
			break;
		}
		case 'FRAME':
		case 'COMPONENT':
		case 'COMPONENT_SET': {
			//COMPONENT,COMPONENT_SET node는 Frame node와 유사하게 취급
			baseNode = await buildFrameNode(node as FrameNode);
			break;
		}
		case 'GROUP': {
			baseNode = await buildGroupNode(node);
			break;
		}
		default: {
			baseNode = await buildGenericNode(node);
		}
	}

	const childrenNodes = getVisibleChildren(node);
	if (childrenNodes.length === 0) {
		return baseNode;
	}

	const children = await Promise.all(childrenNodes.map((child) => figmaNodeToReactNode(child)));
	return { ...baseNode, children };
};
