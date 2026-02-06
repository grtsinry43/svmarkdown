<script lang="ts">
  import RenderNodes from './internal/RenderNodes.svelte'
  import type { SvmdComponentMap, SvmdNode, SvmdRenderOptions } from './types'

  interface Props {
    nodes: SvmdNode[]
    components?: SvmdComponentMap
    renderOptions?: SvmdRenderOptions
  }

  let { nodes, components = {}, renderOptions }: Props = $props()
</script>

<RenderNodes {nodes} {components} {renderOptions} />
