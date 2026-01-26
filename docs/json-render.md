# @json-render 라이브러리 분석

LLM 기반 UI 생성을 위한 Vercel Labs 라이브러리.
GitHub: https://github.com/vercel-labs/json-render

---

## 패키지 구성

| 패키지 | 버전 | 설명 |
|--------|------|------|
| `@json-render/core` | 0.3.0 | 프레임워크 독립적인 핵심 로직 |
| `@json-render/react` | 0.2.0 | React 렌더러 및 훅 |

---

## 핵심 데이터 구조

### UITree (Flat Tree 구조)

LLM 생성에 최적화된 **플랫 트리 구조**. 중첩 대신 key 참조 방식.

```typescript
interface UITree {
  root: string;                           // 루트 요소의 key
  elements: Record<string, UIElement>;    // key → element 맵
}

interface UIElement<T = string, P = Record<string, unknown>> {
  key: string;              // 고유 식별자
  type: T;                  // 컴포넌트 타입 (catalog에서 정의)
  props: P;                 // 컴포넌트 props
  children?: string[];      // 자식 요소 key 배열
  parentKey?: string | null; // 부모 요소 key
  visible?: VisibilityCondition; // 조건부 표시
}
```

**예시:**
```json
{
  "root": "card-1",
  "elements": {
    "card-1": {
      "key": "card-1",
      "type": "Card",
      "props": { "title": "Dashboard" },
      "children": ["btn-1", "btn-2"]
    },
    "btn-1": {
      "key": "btn-1",
      "type": "Button",
      "props": { "label": "Save" },
      "parentKey": "card-1"
    },
    "btn-2": {
      "key": "btn-2",
      "type": "Button",
      "props": { "label": "Cancel" },
      "parentKey": "card-1"
    }
  }
}
```

### DynamicValue (런타임 데이터 바인딩)

값을 직접 지정하거나, 데이터 모델의 경로를 참조.

```typescript
type DynamicValue<T = unknown> = T | { path: string };

// 예시
{ path: '/user/name' }      // 런타임에 dataModel.user.name 으로 해석
'John'                      // 리터럴 값
```

**경로 형식:** JSON Pointer (`/`로 구분된 객체 키 체인)
```typescript
const dataModel = {
  user: { name: 'John', profile: { avatar: 'url.png' } },
  items: ['a', 'b', 'c']
};

'/user/name'            → 'John'
'/user/profile/avatar'  → 'url.png'
'/items/0'              → 'a'
```

### VisibilityCondition (조건부 표시)

```typescript
type VisibilityCondition =
  | boolean                              // true/false
  | { path: string }                     // 데이터 경로가 truthy면 표시
  | { auth: 'signedIn' | 'signedOut' }   // 인증 상태
  | LogicExpression;                     // 복합 조건

type LogicExpression =
  | { and: LogicExpression[] }
  | { or: LogicExpression[] }
  | { not: LogicExpression }
  | { path: string }
  | { eq: [DynamicValue, DynamicValue] }
  | { neq: [DynamicValue, DynamicValue] }
  | { gt: [DynamicValue<number>, DynamicValue<number>] }
  | { gte: [DynamicValue<number>, DynamicValue<number>] }
  | { lt: [DynamicValue<number>, DynamicValue<number>] }
  | { lte: [DynamicValue<number>, DynamicValue<number>] };
```

**예시:**
```json
{
  "visible": {
    "and": [
      { "path": "/user/isAdmin" },
      { "gt": [{ "path": "/items/length" }, 0] }
    ]
  }
}
```

---

## @json-render/core API

### Catalog (컴포넌트 정의)

Zod 스키마로 컴포넌트와 액션을 정의.

```typescript
import { createCatalog } from '@json-render/core';
import { z } from 'zod';

const catalog = createCatalog({
  name: 'My Catalog',
  components: {
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
      hasChildren: true,
      description: 'A card container',
    },
    Button: {
      props: z.object({
        label: z.string(),
        variant: z.enum(['primary', 'secondary']).optional(),
      }),
      description: 'A clickable button',
    },
  },
  actions: {
    submit: { description: 'Submit the form' },
    navigate: {
      params: z.object({ to: z.string() }),
      description: 'Navigate to a page',
    },
  },
  functions: {
    isEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
  },
});

// AI 프롬프트 생성
const prompt = generateCatalogPrompt(catalog);
```

**Catalog 메서드:**
- `catalog.hasComponent(type)` - 컴포넌트 존재 확인
- `catalog.hasAction(name)` - 액션 존재 확인
- `catalog.validateElement(element)` - 요소 검증
- `catalog.validateTree(tree)` - 트리 검증

### Visibility 평가

```typescript
import { evaluateVisibility, visibility } from '@json-render/core';

// 평가
const isVisible = evaluateVisibility(
  { path: '/user/isAdmin' },
  { dataModel: { user: { isAdmin: true } } }
); // true

// 헬퍼 함수
visibility.when('/user/isAdmin')           // { path: '/user/isAdmin' }
visibility.signedIn                        // { auth: 'signedIn' }
visibility.and(cond1, cond2)               // { and: [cond1, cond2] }
visibility.or(cond1, cond2)                // { or: [cond1, cond2] }
visibility.not(cond)                       // { not: cond }
visibility.eq(left, right)                 // { eq: [left, right] }
visibility.gt(left, right)                 // { gt: [left, right] }
```

### Action 처리

```typescript
import { resolveAction, executeAction, ActionSchema } from '@json-render/core';

// Action 정의
const buttonAction: Action = {
  name: 'refund',
  params: {
    paymentId: { path: '/selected/id' },  // DynamicValue
    amount: 100,                          // 리터럴
  },
  confirm: {
    title: 'Confirm Refund',
    message: 'Refund $100?',
    variant: 'danger',
  },
  onSuccess: { navigate: '/payments' },
  onError: { set: { '/ui/error': '$error.message' } },
};

// DynamicValue 해석
const resolved = resolveAction(buttonAction, dataModel);
// resolved.params = { paymentId: 'pay_123', amount: 100 }

// 액션 실행
await executeAction({
  action: resolved,
  handler: async (params) => api.refund(params),
  setData: (path, value) => { /* 데이터 모델 업데이트 */ },
  navigate: (path) => { /* 페이지 이동 */ },
});
```

### Validation

```typescript
import { runValidation, check, builtInValidationFunctions } from '@json-render/core';

const config: ValidationConfig = {
  checks: [
    check.required('Email is required'),
    check.email('Invalid email format'),
    check.maxLength(100, 'Too long'),
  ],
  validateOn: 'blur',
};

const result = runValidation(config, {
  value: 'user@example.com',
  dataModel: {},
});
// result = { valid: true, errors: [], checks: [...] }
```

**내장 체크 함수:**
- `check.required(message)`
- `check.email(message)`
- `check.minLength(n, message)`
- `check.maxLength(n, message)`
- `check.min(n, message)`
- `check.max(n, message)`
- `check.pattern(regex, message)`
- `check.url(message)`
- `check.matches(otherPath, message)`

### 유틸리티

```typescript
import { getByPath, setByPath, resolveDynamicValue, interpolateString } from '@json-render/core';

// JSON Pointer 경로로 값 접근
getByPath(obj, '/user/name');           // 값 읽기
setByPath(obj, '/user/name', 'Jane');   // 값 쓰기

// DynamicValue 해석
resolveDynamicValue({ path: '/user/name' }, dataModel);  // 'John'
resolveDynamicValue('literal', dataModel);               // 'literal'

// 문자열 보간 (${path} 형식)
interpolateString('Hello, ${/user/name}!', dataModel);   // 'Hello, John!'
```

---

## @json-render/react API

### Providers

#### JSONUIProvider (통합 Provider)

```tsx
import { JSONUIProvider, Renderer } from '@json-render/react';

<JSONUIProvider
  registry={componentRegistry}
  initialData={{ user: { name: 'John' } }}
  authState={{ isSignedIn: true }}
  actionHandlers={{
    submit: async (params) => api.submit(params),
  }}
  navigate={(path) => router.push(path)}
  validationFunctions={{
    isPhoneNumber: (value) => /^\d{10,11}$/.test(String(value)),
  }}
  onDataChange={(path, value) => console.log(path, value)}
>
  <Renderer tree={uiTree} registry={componentRegistry} />
</JSONUIProvider>
```

#### 개별 Providers

```tsx
import {
  DataProvider,
  VisibilityProvider,
  ActionProvider,
  ValidationProvider,
} from '@json-render/react';

// 필요한 Provider만 선택적으로 사용 가능
<DataProvider initialData={data} authState={auth}>
  <VisibilityProvider>
    <ActionProvider handlers={handlers}>
      {children}
    </ActionProvider>
  </VisibilityProvider>
</DataProvider>
```

### Hooks

#### 데이터 관련

```typescript
// 전체 데이터 컨텍스트
const { data, get, set, update } = useData();
get('/user/name');                    // 값 읽기
set('/user/name', 'Jane');            // 값 쓰기
update({ '/user/name': 'Jane', '/user/age': 30 }); // 일괄 업데이트

// 단일 값 읽기
const name = useDataValue<string>('/user/name');

// 양방향 바인딩 (useState와 유사)
const [name, setName] = useDataBinding<string>('/user/name');
```

#### Visibility 관련

```typescript
// 컨텍스트 접근
const { isVisible, ctx } = useVisibility();
const visible = isVisible({ path: '/user/isAdmin' });

// 단순 체크
const isAdmin = useIsVisible({ path: '/user/isAdmin' });
```

#### Action 관련

```typescript
// 전체 컨텍스트
const {
  execute,
  loadingActions,
  pendingConfirmation,
  confirm,
  cancel,
  registerHandler
} = useActions();

await execute(action);
const isLoading = loadingActions.has('submit');

// 특정 액션
const { execute, isLoading } = useAction(submitAction);
```

#### Validation 관련

```typescript
// 전체 컨텍스트
const { validate, touch, clear, validateAll, fieldStates } = useValidation();

// 필드별 검증
const {
  errors,
  isValid,
  validate,
  touch,
  clear,
  state
} = useFieldValidation('/form/email', {
  checks: [check.required(), check.email()],
  validateOn: 'blur',
});
```

### Renderer

```tsx
import { Renderer } from '@json-render/react';

// 컴포넌트 레지스트리 정의
const registry: ComponentRegistry = {
  Card: ({ element, children }) => (
    <div className="card">
      <h3>{element.props.title}</h3>
      {children}
    </div>
  ),
  Button: ({ element, onAction }) => (
    <button onClick={() => onAction?.(element.props.action)}>
      {element.props.label}
    </button>
  ),
};

// 렌더링
<Renderer
  tree={uiTree}
  registry={registry}
  loading={isStreaming}
  fallback={({ element }) => <div>Unknown: {element.type}</div>}
/>
```

**ComponentRenderProps:**
```typescript
interface ComponentRenderProps<P = Record<string, unknown>> {
  element: UIElement<string, P>;  // 요소 정의
  children?: ReactNode;           // 렌더링된 자식
  onAction?: (action: Action) => void;  // 액션 콜백
  loading?: boolean;              // 스트리밍 중 여부
}
```

### Streaming

```typescript
import { useUIStream } from '@json-render/react';

const {
  tree,        // 현재 UITree (스트리밍 중 점진적 업데이트)
  isStreaming, // 스트리밍 중 여부
  error,       // 에러
  send,        // 프롬프트 전송
  clear,       // 트리 초기화
} = useUIStream({
  api: '/api/generate',
  onComplete: (tree) => console.log('Done:', tree),
  onError: (err) => console.error('Error:', err),
});

// 사용
await send('Create a dashboard', { context: 'data' });
```

### 유틸리티

```typescript
import { flatToTree, createRendererFromCatalog } from '@json-render/react';

// flat 배열 → UITree 변환
const tree = flatToTree([
  { key: 'root', type: 'Card', props: {}, children: ['child-1'] },
  { key: 'child-1', type: 'Button', props: {}, parentKey: 'root' },
]);

// Catalog 기반 Renderer 생성
const MyRenderer = createRendererFromCatalog(catalog, registry);
<MyRenderer tree={tree} loading={false} />
```

---

## 스키마 (Zod)

```typescript
import {
  // 타입 스키마
  DynamicValueSchema,
  DynamicStringSchema,
  DynamicNumberSchema,
  DynamicBooleanSchema,
  VisibilityConditionSchema,
  LogicExpressionSchema,

  // Action 스키마
  ActionSchema,
  ActionConfirmSchema,
  ActionOnSuccessSchema,
  ActionOnErrorSchema,

  // Validation 스키마
  ValidationCheckSchema,
  ValidationConfigSchema,
} from '@json-render/core';
```

---

## 아키텍처 요약

```
┌─────────────────────────────────────────────────────────────┐
│                        @json-render/core                     │
├─────────────────────────────────────────────────────────────┤
│  Catalog          │  Visibility      │  Actions             │
│  - createCatalog  │  - evaluate      │  - resolve           │
│  - generatePrompt │  - helpers       │  - execute           │
│  - validate       │                  │  - interpolate       │
├───────────────────┼──────────────────┼──────────────────────┤
│  Validation       │  Utilities                              │
│  - runValidation  │  - getByPath / setByPath                │
│  - check.*        │  - resolveDynamicValue                  │
│  - builtIns       │                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       @json-render/react                     │
├─────────────────────────────────────────────────────────────┤
│  Providers                    │  Hooks                       │
│  - JSONUIProvider             │  - useData / useDataBinding  │
│  - DataProvider               │  - useVisibility / useIsVisible│
│  - VisibilityProvider         │  - useActions / useAction    │
│  - ActionProvider             │  - useValidation / useField  │
│  - ValidationProvider         │  - useUIStream               │
├───────────────────────────────┼──────────────────────────────┤
│  Renderer                     │  Utilities                   │
│  - Renderer component         │  - flatToTree                │
│  - ComponentRegistry          │  - createRendererFromCatalog │
│  - ConfirmDialog              │                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 선택적 사용 가이드

전체 기능을 사용하지 않고 필요한 부분만 선택적으로 사용 가능:

### 최소 구성 (렌더링만)

```tsx
import { Renderer } from '@json-render/react';

// Provider 없이 단순 렌더링만
<Renderer tree={uiTree} registry={registry} />
```

### 데이터 바인딩 추가

```tsx
<DataProvider initialData={data}>
  <Renderer tree={uiTree} registry={registry} />
</DataProvider>
```

### Visibility 추가

```tsx
<DataProvider initialData={data}>
  <VisibilityProvider>
    <Renderer tree={uiTree} registry={registry} />
  </VisibilityProvider>
</DataProvider>
```

### Core만 사용 (직접 렌더러 구현)

```typescript
import {
  evaluateVisibility,
  resolveDynamicValue,
  getByPath
} from '@json-render/core';

// React 렌더러 직접 구현
function renderElement(element: UIElement, dataModel: DataModel) {
  // visibility 평가
  if (!evaluateVisibility(element.visible, { dataModel })) {
    return null;
  }

  // props의 DynamicValue 해석
  const resolvedProps = resolveProps(element.props, dataModel);

  // 컴포넌트 렌더링
  const Component = registry[element.type];
  return <Component {...resolvedProps} />;
}
```
