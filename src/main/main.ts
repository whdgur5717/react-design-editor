import { buildNodeTree } from './node';

export default function () {
	figma.showUI(__html__, { width: 300, height: 260, themeColors: true });

	figma.on('selectionchange', async () => {
		const selectedNode = figma.currentPage.selection[0];
		if (selectedNode) {
			console.log(await buildNodeTree(selectedNode));
		}
	});
}
