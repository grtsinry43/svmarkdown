# svmarkdown (Svelte Markdown)

`svmarkdown` (Svelte Markdown) 是一个运行时 Markdown 渲染库：

- 解析层：`markdown-it`
- 输出格式：库自己的 AST/Blocks（非 HTML 字符串）
- 渲染结果：声明式 Svelte 组件树

## 安装

```bash
pnpm add svmarkdown
```

## 快速开始

```svelte
<script lang="ts">
  import { Markdown } from 'svmarkdown'
  import Link from './Link.svelte'
  import Image from './Image.svelte'
  import Code from './Code.svelte'

  let content = $state('Visit [Svelte](https://svelte.dev) and `inline code`')

  const components = {
    a: Link,
    img: Image,
    code: Code,
  }
</script>

<Markdown {content} {components} />
```

## 自定义组件语法

### 1. Container（`:::`）

你可以使用 ::: [组件名] key="value" 来创建一个组件块，块内的内容会作为 `children` prop 传入组件。

```md
::: Alert type=warning title="Heads up"
这里是 **Markdown children**。
:::
```

### 2. Fence（```）

你可以使用 ```component:[组件名] {"key":"value"} 来创建一个组件块，块内的内容会作为 `children` prop 传入组件。

````md
```component:Chart {"title":"Traffic"}
month,visits
Jan,421
Feb,530
```
````

## API

```ts
import { Markdown, createParser, parseMarkdown } from 'svmarkdown'
```

- `parseMarkdown(markdown, options)`：一次性解析，返回 `SvmdRoot`
- `createParser(options)`：创建可复用 parser，适合高频更新
- `<Markdown />`：运行时渲染组件，每次变更时 `AST -> Svelte` 更新链路

## parse options 定义

```ts
import type { SvmdParseOptions } from 'svmarkdown'

const options: SvmdParseOptions = {
  componentBlocks: {
    Alert: true,
    Chart: {
      container: false,
      fence: true,
      parseFenceBodyAsMarkdown: false,
    },
  },
  fenceComponentPrefix: 'component:',
}
```

## 开发

```bash
pnpm install
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run play
```

## 高级扩展用法

### 更多组件块配置项

```ts
const options: SvmdParseOptions = {
  componentBlocks: {
    Alert: true,
    Note: { container: true, fence: false },
    Chart: { container: false, fence: true },
    Card: { fence: true, parseFenceBodyAsMarkdown: true },
  },
}
```

### 自定义 props 解析

```ts
const options: SvmdParseOptions = {
  componentBlocks: {
    Alert: {
      parseProps(raw) {
        if (!raw) return {}
        if (raw.startsWith('yaml:')) {
          return { source: raw.slice(5).trim() }
        }
        return { text: raw }
      },
    },
  },
}
```

### 自定义 fence 前缀

```ts
const options: SvmdParseOptions = {
  fenceComponentPrefix: '@component:',
}
```

### 使用 markdown-it 插件

```ts
import footnote from 'markdown-it-footnote'
import container from 'markdown-it-container'

const options: SvmdParseOptions = {
  markdownItPlugins: [
    footnote,
    [container, 'spoiler', { marker: ':' }],
  ],
}
```

### 传入自定义 MarkdownIt 实例

```ts
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: true, linkify: true })
const options: SvmdParseOptions = {
  markdownIt: md,
}
```

### 渲染原始 HTML（不安全）

```svelte
<Markdown
  content={md}
  parseOptions={{ markdownItOptions: { html: true } }}
  renderOptions={{ allowDangerousHtml: true }}
/>
```

### 软换行渲染策略

```svelte
<Markdown
  content={md}
  renderOptions={{ softBreak: 'space' }} // 'space' | 'newline' | 'br'
/>
```

### 链接组件的行内/独立布局

```svelte
<!-- 当覆写 `a` 时 -->
<script lang="ts">
  export let linkLayout // 'inline' | 'standalone'
  export let linkStandalone // boolean
</script>
```

### 关闭组件块自动推断

```svelte
<Markdown
  content={md}
  components={{ Alert, Chart }}
  inferComponentBlocks={false}
  parseOptions={{ componentBlocks: { Alert: true } }}
/>
```

### 读取组件元信息

```svelte
<script lang="ts">
  export let node
  export let syntax
  export let source
</script>
```

### 直接渲染 AST 节点

```svelte
<script lang="ts">
  import { SvmdChildren, parseMarkdown } from 'svmarkdown'
  const ast = parseMarkdown(md)
</script>

<SvmdChildren nodes={ast.children} components={components} />
```

## License

MIT License
