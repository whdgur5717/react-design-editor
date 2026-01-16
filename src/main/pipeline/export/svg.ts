export const exportSvg = async (node: SceneNode): Promise<string> => {
	const bytes = await node.exportAsync({ format: 'SVG' });
	return new TextDecoder().decode(bytes);
};
