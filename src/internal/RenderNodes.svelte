<script lang="ts">
  import type { SvmdComponentMap, SvmdNode, SvmdRenderOptions } from '../types'
  import RenderNode from './RenderNode.svelte'

  interface Props {
    nodes: SvmdNode[]
    components?: SvmdComponentMap
    renderOptions?: SvmdRenderOptions
  }

  let { nodes, components = {}, renderOptions }: Props = $props()
</script>

{#each nodes as node (node.key)}
  <RenderNode {node} {components} {renderOptions} />
{/each}
