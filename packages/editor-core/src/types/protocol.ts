/**
 * 현재 PageNode 기준 노드 박스.
 * root x/y는 노드 데이터에서 오고, child x/y는 DOM layout offset에서 온다.
 * width/height는 DOM layout border-box 측정값이다.
 * pan/zoom, CSS transform 결과는 포함하지 않는다.
 */
export interface NodeRect {
	x: number
	y: number
	width: number
	height: number
}
