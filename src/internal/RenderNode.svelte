<script lang="ts">
  import type {
    SvmdCodeNode,
    SvmdComponentMap,
    SvmdElementNode,
    SvmdNode,
    SvmdRenderOptions,
  } from '../types'
  import RenderNodes from './RenderNodes.svelte'

  const VOID_TAGS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ])

  interface Props {
    node: SvmdNode
    components?: SvmdComponentMap
    renderOptions?: SvmdRenderOptions
    parent?: SvmdNode
  }

  let { node, components = {}, renderOptions, parent }: Props = $props()

  function isVoidElement(elementNode: SvmdElementNode): boolean {
    return VOID_TAGS.has(elementNode.name)
  }

  function codeClassName(codeNode: SvmdCodeNode): string | undefined {
    if (!codeNode.lang) {
      return undefined
    }

    return `language-${codeNode.lang}`
  }

  function renderSoftBreak(): 'space' | 'newline' | 'br' {
    return renderOptions?.softBreak ?? 'space'
  }

  function linkLayout(node: SvmdElementNode): 'inline' | 'standalone' {
    if (node.name !== 'a') {
      return 'inline'
    }

    if (!parent || parent.kind !== 'element') {
      return 'inline'
    }

    if (!parent.block) {
      return 'inline'
    }

    if (parent.children.length !== 1) {
      return 'inline'
    }

    if (parent.children[0] !== node) {
      return 'inline'
    }

    return 'standalone'
  }
</script>

{#if node.kind === 'text'}
  {node.value}
{:else if node.kind === 'break'}
  {#if node.hard}
    <br />
  {:else}
    {#if renderSoftBreak() === 'br'}
      <br />
    {:else if renderSoftBreak() === 'newline'}
      {'\n'}
    {:else}
      {' '}
    {/if}
  {/if}
{:else if node.kind === 'html'}
  {#if renderOptions?.allowDangerousHtml}
    {@html node.value}
  {:else}
    {node.value}
  {/if}
{:else if node.kind === 'code'}
  {@const CodeRenderer = components.code}

  {#if CodeRenderer}
    <CodeRenderer
      node={node}
      inline={node.inline}
      text={node.text}
      lang={node.lang}
      info={node.info}
      attrs={node.attrs}
    />
  {:else if node.inline}
    <code {...node.attrs}>{node.text}</code>
  {:else}
    <pre>
      <code class={codeClassName(node)} {...node.attrs}>{node.text}</code>
    </pre>
  {/if}
{:else if node.kind === 'component'}
  {@const ComponentRenderer = components[node.name]}

  {#if ComponentRenderer}
    <ComponentRenderer {...node.props} node={node} syntax={node.syntax} source={node.source}>
      {#if node.children.length > 0}
        <RenderNodes nodes={node.children} {components} {renderOptions} parent={node} />
      {/if}
    </ComponentRenderer>
  {:else}
    {#if node.children.length > 0}
      <RenderNodes nodes={node.children} {components} {renderOptions} parent={node} />
    {:else if node.source}
      <pre><code>{node.source}</code></pre>
    {/if}
  {/if}
{:else}
  {@const ElementRenderer = components[node.name]}

  {#if ElementRenderer}
    {#if node.name === 'a'}
      <ElementRenderer
        {...node.attrs}
        node={node}
        linkLayout={linkLayout(node)}
        linkStandalone={linkLayout(node) === 'standalone'}
      >
        {#if node.children.length > 0}
          <RenderNodes nodes={node.children} {components} {renderOptions} parent={node} />
        {/if}
      </ElementRenderer>
    {:else}
      <ElementRenderer {...node.attrs} node={node}>
        {#if node.children.length > 0}
          <RenderNodes nodes={node.children} {components} {renderOptions} parent={node} />
        {/if}
      </ElementRenderer>
    {/if}
  {:else if isVoidElement(node)}
    <svelte:element this={node.name} {...node.attrs} />
  {:else}
    <svelte:element this={node.name} {...node.attrs}>
      {#if node.children.length > 0}
        <RenderNodes nodes={node.children} {components} {renderOptions} parent={node} />
      {/if}
    </svelte:element>
  {/if}
{/if}
