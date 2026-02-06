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
  }

  let { node, components = {}, renderOptions }: Props = $props()

  function isVoidElement(elementNode: SvmdElementNode): boolean {
    return VOID_TAGS.has(elementNode.name)
  }

  function codeClassName(codeNode: SvmdCodeNode): string | undefined {
    if (!codeNode.lang) {
      return undefined
    }

    return `language-${codeNode.lang}`
  }
</script>

{#if node.kind === 'text'}
  {node.value}
{:else if node.kind === 'break'}
  {#if node.hard}
    <br />
  {:else}
    {'\n'}
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
        <RenderNodes nodes={node.children} {components} {renderOptions} />
      {/if}
    </ComponentRenderer>
  {:else}
    {#if node.children.length > 0}
      <RenderNodes nodes={node.children} {components} {renderOptions} />
    {:else if node.source}
      <pre><code>{node.source}</code></pre>
    {/if}
  {/if}
{:else}
  {@const ElementRenderer = components[node.name]}

  {#if ElementRenderer}
    <ElementRenderer {...node.attrs} node={node}>
      {#if node.children.length > 0}
        <RenderNodes nodes={node.children} {components} {renderOptions} />
      {/if}
    </ElementRenderer>
  {:else if isVoidElement(node)}
    <svelte:element this={node.name} {...node.attrs} />
  {:else}
    <svelte:element this={node.name} {...node.attrs}>
      {#if node.children.length > 0}
        <RenderNodes nodes={node.children} {components} {renderOptions} />
      {/if}
    </svelte:element>
  {/if}
{/if}
