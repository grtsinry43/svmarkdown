<script lang="ts">
  import { createParser, inferComponentBlocksFromMap } from './parser'
  import RenderNodes from './internal/RenderNodes.svelte'
  import type {
    SvmdComponentMap,
    SvmdComponentBlocks,
    SvmdParseOptions,
    SvmdRenderOptions,
    SvmdRoot,
  } from './types'

  interface Props {
    content: string
    components?: SvmdComponentMap
    parseOptions?: SvmdParseOptions
    renderOptions?: SvmdRenderOptions
    inferComponentBlocks?: boolean
  }

  let {
    content,
    components = {},
    parseOptions = {},
    renderOptions,
    inferComponentBlocks = true,
  }: Props = $props()

  const effectiveParseOptions = $derived(resolveParseOptions(parseOptions, components, inferComponentBlocks))
  const parser = $derived(createParser(effectiveParseOptions))
  const ast: SvmdRoot = $derived(parser(content))

  function resolveParseOptions(
    options: SvmdParseOptions,
    componentMap: SvmdComponentMap,
    shouldInferComponentBlocks: boolean,
  ): SvmdParseOptions {
    if (!shouldInferComponentBlocks) {
      return options
    }

    const inferredBlocks = inferComponentBlocksFromMap(componentMap)
    const mergedBlocks: SvmdComponentBlocks = {
      ...inferredBlocks,
      ...(options.componentBlocks ?? {}),
    }

    return {
      ...options,
      componentBlocks: mergedBlocks,
    }
  }
</script>

{#if ast.children.length > 0}
  <RenderNodes nodes={ast.children} {components} {renderOptions} />
{/if}
