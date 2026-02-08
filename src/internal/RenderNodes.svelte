<script lang="ts">
  import type { SvmdComponentMap, SvmdNode, SvmdRenderOptions } from '../types'
  import RenderNode from './RenderNode.svelte'

  interface Props {
    nodes: SvmdNode[]
    components?: SvmdComponentMap
    renderOptions?: SvmdRenderOptions
    parent?: SvmdNode
  }

  let { nodes, components = {}, renderOptions, parent }: Props = $props()
</script>

{#each nodes as node (node.key)}
  <RenderNode {node} {components} {renderOptions} {parent} />
{/each}
