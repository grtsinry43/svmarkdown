# svmarkdown (Svelte Markdown)

Runtime-first Markdown rendering for Svelte.

- Parser: `markdown-it`
- Core output: custom AST/Blocks (not HTML strings)
- Renderer: declarative Svelte component tree (no DOM scan/mount pipeline)

[中文文档 (zh-CN)](./README.zh-CN.md)

## Install

```bash
pnpm add svmarkdown
```

## Quick Start

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

## Custom Component Syntax

### 1. Container (`:::`)

just use ::: [component] key="value" to create a component block, and the content inside will be passed as `children` prop.

```md
::: Alert type=warning title="Heads up"
This is **Markdown children**.
:::
```

### 2. Fence (```)

just use ```component:[component] {"key":"value"} to create a component block, and the content inside will be passed as `children` prop.

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

- `parseMarkdown(markdown, options)`: parse once, returns `SvmdRoot`
- `createParser(options)`: create a reusable parser for frequent updates
- `<Markdown />`: runtime rendering with an `AST -> Svelte tree` update path

## Parse Options

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

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run play
```

## Advanced Extensions

### Configure component blocks

```ts
const parseOptions: SvmdParseOptions = {
  componentBlocks: {
    Alert: true,
    Note: { container: true, fence: false },
    Chart: { container: false, fence: true },
    Card: { fence: true, parseFenceBodyAsMarkdown: true },
  },
}
```

### Custom props parsing

```ts
const parseOptions: SvmdParseOptions = {
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

### Custom fence prefix

```ts
const parseOptions: SvmdParseOptions = {
  fenceComponentPrefix: '@component:',
}
```

### Use markdown-it plugins

```ts
import footnote from 'markdown-it-footnote'
import container from 'markdown-it-container'

const parseOptions: SvmdParseOptions = {
  markdownItPlugins: [
    footnote,
    [container, 'spoiler', { marker: ':' }],
  ],
}
```

### Provide your own MarkdownIt instance

```ts
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: true, linkify: true })
const parseOptions: SvmdParseOptions = {
  markdownIt: md,
}
```

### Render raw HTML (unsafe)

```svelte
<Markdown
  content={md}
  parseOptions={{ markdownItOptions: { html: true } }}
  renderOptions={{ allowDangerousHtml: true }}
/>
```

### Soft break behavior

```svelte
<Markdown
  content={md}
  renderOptions={{ softBreak: 'space' }} // 'space' | 'newline' | 'br'
/>
```

### Link component layout (inline vs standalone)

```svelte
<!-- when overriding `a` -->
<script lang="ts">
  export let linkLayout // 'inline' | 'standalone'
  export let linkStandalone // boolean
</script>
```

### Control component inference

```svelte
<Markdown
  content={md}
  components={{ Alert, Chart }}
  inferComponentBlocks={false}
  parseOptions={{ componentBlocks: { Alert: true } }}
/>
```

### Access component metadata

```svelte
<script lang="ts">
  export let node
  export let syntax
  export let source
</script>
```

### Render AST nodes directly

```svelte
<script lang="ts">
  import { SvmdChildren, parseMarkdown } from 'svmarkdown'
  const ast = parseMarkdown(md)
</script>

<SvmdChildren nodes={ast.children} components={components} />
```

## License

MIT License
