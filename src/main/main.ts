import { figmaNodeToReactNode } from './node';

export default function () {
	figma.showUI(__html__, { width: 300, height: 260, themeColors: true });

	figma.on('selectionchange', async () => {
		console.log(await figmaNodeToReactNode(figma.currentPage.selection[0]));
	});
}
