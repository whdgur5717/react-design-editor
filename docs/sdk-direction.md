# SDK Direction

## 목적

`open-editor-sdk`는 외부 React 앱이 디자인 에디터를 자기 제품 안에 넣고, 필요한 UI를 조합하고, canvas에 렌더될 요소를 자기 React 컴포넌트로 확장할 수 있게 하는 공개 패키지다.

이 SDK의 핵심은 완성된 앱 하나를 그대로 노출하는 것이 아니라, 호스트 앱이 editor를 구성할 수 있는 계약을 제공하는 것이다.

## SDK가 제공해야 하는 것

SDK는 최소한 다음 계약을 제공해야 한다.

1. editor instance 생성
2. React tree에 editor instance 주입
3. canvas 영역 렌더
4. toolbar, layers, properties 같은 editor UI 조각 제공
5. document node를 React 컴포넌트로 렌더하는 확장점
6. Shadow DOM 안에서 동작하는 style/provider 확장점

현재 공개 사용 형태는 다음 방향이다.

```tsx
const editor = createEditor({
	components: {
		LaunchCard: {
			component: LaunchCard,
			styles: launchCardStyles,
		},
	},
})

export function App() {
	return (
		<EditorProvider editor={editor}>
			<EditorRoot>
				<Toolbar />
				<LayersPanel />
				<EditorCanvas />
				<PropertiesPanel />
			</EditorRoot>
		</EditorProvider>
	)
}
```

이 예시는 현재 구현이 확인한 사용 형태다. 최종 API라는 의미는 아니다.

## Editor Instance

`createEditor()`는 editor instance를 만드는 진입점이다.

현재 구현은 `@open-editor-sdk/shell`의 `Editor`를 생성해서 반환한다.

```ts
export function createEditor(options: CreateEditorOptions = {}) {
	const editor = new Editor()
	registerEditorComponents(editor, options.components ?? {})
	return editor
}
```

현재 `CreateEditorOptions`는 `components`만 받는다.

앞으로 결정해야 할 것은 `createEditor`가 어떤 설정까지 받을지다.

- 초기 document
- custom components
- editor UI 설정
- tools / commands / plugins
- persistence hooks

이 항목들은 아직 인터페이스로 확정하지 않는다.

## Document Node와 React Component

canvas에 렌더되는 대상은 document node다.

element node는 `tag`를 가진다.

```ts
{
	type: "element",
	tag: "LaunchCard",
	props: {},
	style: {},
	children: [],
}
```

SDK는 이 `tag`를 사용자가 제공한 React component와 연결할 수 있어야 한다.

현재 확인한 방향은 `createEditor({ components })`에서 component를 제공하는 방식이다.

```ts
createEditor({
	components: {
		LaunchCard: {
			component: LaunchCard,
			styles: launchCardStyles,
		},
	},
})
```

여기서 `"LaunchCard"`는 document node의 `tag`와 매칭된다.

아직 결정해야 할 것은 다음이다.

- component를 `createEditor`에서만 받을지, editor instance에서 동적으로 추가할 수 있게 할지
- component props 타입을 어떻게 정의할지
- node `props`와 React component props를 어떻게 매핑할지
- component별 style을 어떤 입력 형태로 받을지

## User Component Contract

사용자가 등록한 React component는 canvas 안에서 실제 DOM을 렌더해야 한다.

canvas renderer는 component에 다음 값을 넘긴다.

```ts
{
	...defaultProps,
	...node.props,
	style,
	children,
}
```

사용자 component는 `style`과 `children`을 자기 root DOM에 반영하는 것이 기본 계약이다.

```tsx
function LaunchCard({ children, style }) {
	return <section style={style}>{children}</section>
}
```

`data-node-id`와 `data-node-measure-id`는 사용자 component에 강제로 맡기지 않는다. editor renderer가 node마다 별도 wrapper DOM을 만들고 그 wrapper가 editor identity를 가진다.

이 방향의 이유는 사용자가 작성한 component props 계약과 editor 내부 DOM 계약을 분리하기 위해서다. 사용자는 자기 component의 HTML/CSS 결과를 그대로 확인해야 하고, editor는 wrapper를 통해 selection, hover, drag, resize에 필요한 node identity와 측정 지점을 관리한다.

wrapper는 code export 대상이 아니다. export는 DOM을 읽지 않고 document node의 `tag`, `props`, `style`, `children`을 기준으로 만들어야 한다.

앞으로 결정해야 할 것은 wrapper가 drag/drop 라이브러리와 어떤 계약을 가질지, nested node wrapper를 계속 `display: contents`로 둘지, 실제 boxed DOM이 필요한 interaction을 어떻게 처리할지다.

## EditorCanvas

`EditorCanvas`는 SDK 사용자가 배치하는 canvas 영역 component다.

현재 역할은 다음이다.

1. `EditorProvider`에서 editor instance를 읽는다.
2. 현재 page, zoom, pan 값을 읽는다.
3. ShadowRoot를 만든다.
4. ShadowRoot 안에 canvas mount를 만든다.
5. canvas renderer를 mount 안에 React portal로 렌더한다.
6. editor interaction layer를 canvas result DOM과 분리해서 렌더한다.

ShadowRoot 내부 구조는 다음이다.

```html
<style data-design-editor-canvas-base-styles></style>
<style data-design-editor-registered-component-styles></style>
<div data-design-editor-canvas-mount></div>
```

`data-design-editor-canvas-mount`가 canvas renderer의 portal target이다.

`Portal` component는 container에 children을 portal 하는 역할만 가진다.

```tsx
export function Portal({ container, children }) {
	if (!container) return null
	return createPortal(children, container)
}
```

## Styling

canvas result DOM은 ShadowRoot 안에 들어간다. 따라서 호스트 앱의 CSS가 자동으로 들어오지 않는다.

SDK는 canvas에 필요한 기본 CSS를 ShadowRoot 안에 넣는다.

사용자 component style은 별도 경로로 ShadowRoot 안에 넣어야 한다.

현재 지원하는 style source는 다음 방향이다.

```ts
type CanvasStyleSource = string | CSSStyleSheet | { cssText: string }
```

처리 방향:

- CSS string은 ShadowRoot 내부 `<style>`에 삽입
- `{ cssText }`도 ShadowRoot 내부 `<style>`에 삽입
- `CSSStyleSheet`는 `shadowRoot.adoptedStyleSheets`에 삽입

CSS-in-JS는 style tag 삽입 위치를 지정해야 할 수 있다. 이를 위해 `EditorCanvas`는 provider를 주입할 수 있는 확장점을 열어둔다.

```tsx
<EditorCanvas
	renderCanvasProviders={(children, env) => <StyleProvider container={env.shadowRoot}>{children}</StyleProvider>}
/>
```

이 provider API의 이름과 shape는 아직 확정하지 않는다.

## 현재 구현 상태

현재 코드에서 확인된 상태:

- `createEditor`는 editor instance를 만든다.
- `createEditor({ components })`로 React component를 넘길 수 있다.
- `EditorProvider`는 editor instance를 React tree에 제공한다.
- `EditorCanvas`는 ShadowRoot를 만들고 canvas renderer를 portal로 렌더한다.
- 등록된 component CSS string은 ShadowRoot 내부 style 태그에 들어간다.
- `CSSStyleSheet`는 ShadowRoot의 `adoptedStyleSheets`에 들어간다.
- demo는 SDK 소비처로 `LaunchCard` component를 등록해서 렌더한다.

현재 코드에서 아직 public contract로 정리되지 않은 상태:

- demo의 document 변경은 `editor.store.getState().updateNode(...)`를 직접 사용한다.
- `createEditor` options는 `components`만 받는다.
- editor instance가 shell `Editor` 그대로 노출된다.
- user component가 받는 props 계약이 타입으로 충분히 표현되지 않는다.
- editor wrapper DOM과 code export 사이의 계약이 문서 수준에 머물러 있다.
- Shadow DOM 안으로 넣을 component style 입력 계약이 아직 정리되지 않았다.

## 다음에 결정할 것

1. `createEditor`가 받을 options 범위
2. document 초기화와 수정 API
3. custom component 등록 API
4. user component props 타입
5. Shadow DOM 안으로 넣을 component style 입력 API
6. CSS-in-JS provider 주입 API
7. editor instance public API를 shell `Editor` 그대로 둘지 여부
8. canvas renderer component 이름과 파일 경계
9. SDK package export와 build output 구조

## 현재 방향 요약

현재 SDK 방향은 다음이다.

```text
호스트 React 앱이 editor를 만들고,
React component를 document node tag에 연결하고,
EditorCanvas가 ShadowRoot 안에서 그 component를 canvas result DOM으로 렌더한다.
```
