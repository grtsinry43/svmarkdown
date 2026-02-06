import MarkdownIt from 'markdown-it'
import markdownItContainer from 'markdown-it-container'
import type Token from 'markdown-it/lib/token.mjs'
import type {
  SvmdCodeNode,
  SvmdComponentBlockConfig,
  SvmdComponentBlocks,
  SvmdComponentNode,
  SvmdNode,
  SvmdParseOptions,
  SvmdProps,
  SvmdRoot,
} from './types'

const FENCE_COMPONENT_PREFIX = 'component:'

interface NormalizedComponentBlock extends Required<Omit<SvmdComponentBlockConfig, 'parseProps'>> {
  parseProps: (raw: string, context: { name: string; syntax: 'container' | 'fence' }) => SvmdProps
}

interface ParseState {
  keySeed: number
  md: MarkdownIt
  options: SvmdParseOptions
  componentBlocks: Map<string, NormalizedComponentBlock>
  parseFragment: (markdown: string) => SvmdNode[]
}

export type SvmdParser = (markdown: string) => SvmdRoot

export function createParser(options: SvmdParseOptions = {}): SvmdParser {
  const componentBlocks = normalizeComponentBlocks(options.componentBlocks)
  const md = createMarkdownIt(options, componentBlocks)

  const parse = (markdown: string): SvmdRoot => {
    const state: ParseState = {
      keySeed: 0,
      md,
      options,
      componentBlocks,
      parseFragment: (fragment) => {
        const fragmentTokens = md.parse(fragment, {})
        return parseBlockTokens(fragmentTokens, state)
      },
    }

    const tokens = md.parse(markdown, {})

    return {
      kind: 'root',
      children: parseBlockTokens(tokens, state),
    }
  }

  return parse
}

export function parseMarkdown(markdown: string, options: SvmdParseOptions = {}): SvmdRoot {
  return createParser(options)(markdown)
}

export function inferComponentBlocksFromMap(components: Record<string, unknown>): SvmdComponentBlocks {
  const inferred: SvmdComponentBlocks = {}

  for (const name of Object.keys(components)) {
    if (!isLikelyCustomComponentName(name)) {
      continue
    }

    inferred[name] = {
      container: true,
      fence: true,
      parseFenceBodyAsMarkdown: false,
    }
  }

  return inferred
}

function isLikelyCustomComponentName(name: string): boolean {
  return /^[A-Z]/.test(name)
}

function createMarkdownIt(
  options: SvmdParseOptions,
  componentBlocks: Map<string, NormalizedComponentBlock>,
): MarkdownIt {
  const markdownIt =
    options.markdownIt ??
    new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true,
      ...options.markdownItOptions,
    })

  for (const [name, config] of componentBlocks) {
    if (!config.container) {
      continue
    }

    markdownIt.use(markdownItContainer, name)
  }

  for (const plugin of options.markdownItPlugins ?? []) {
    if (Array.isArray(plugin)) {
      const [pluginFn, ...params] = plugin
      markdownIt.use(pluginFn, ...params)
      continue
    }

    markdownIt.use(plugin)
  }

  return markdownIt
}

function normalizeComponentBlocks(componentBlocks?: SvmdComponentBlocks): Map<string, NormalizedComponentBlock> {
  const normalized = new Map<string, NormalizedComponentBlock>()

  for (const [name, blockConfig] of Object.entries(componentBlocks ?? {})) {
    if (!blockConfig) {
      continue
    }

    if (blockConfig === true) {
      normalized.set(name, {
        container: true,
        fence: true,
        parseFenceBodyAsMarkdown: false,
        parseProps: defaultParseProps,
      })
      continue
    }

    normalized.set(name, {
      container: blockConfig.container ?? true,
      fence: blockConfig.fence ?? true,
      parseFenceBodyAsMarkdown: blockConfig.parseFenceBodyAsMarkdown ?? false,
      parseProps: blockConfig.parseProps ?? defaultParseProps,
    })
  }

  return normalized
}

function parseBlockTokens(tokens: Token[], state: ParseState): SvmdNode[] {
  const nodes: SvmdNode[] = []

  let index = 0
  while (index < tokens.length) {
    const token = tokens[index]

    if (token.hidden && token.nesting !== 0) {
      index += 1
      continue
    }

    if (isContainerOpenToken(token, state.componentBlocks)) {
      const componentName = getContainerName(token.type)
      if (componentName) {
        const closeType = `container_${componentName}_close`
        const closeIndex = findCloseIndex(tokens, index, token.type, closeType)

        if (closeIndex !== -1) {
          const config = state.componentBlocks.get(componentName)
          const propsRaw = extractContainerPropsRaw(componentName, token.info)
          const props = (config?.parseProps ?? defaultParseProps)(propsRaw, {
            name: componentName,
            syntax: 'container',
          })

          nodes.push({
            key: nextKey(state),
            kind: 'component',
            name: componentName,
            syntax: 'container',
            props,
            children: parseBlockTokens(tokens.slice(index + 1, closeIndex), state),
          })

          index = closeIndex + 1
          continue
        }
      }
    }

    if (token.nesting === 1 && token.type.endsWith('_open')) {
      const closeType = openTypeToCloseType(token.type)
      const closeIndex = findCloseIndex(tokens, index, token.type, closeType)

      if (closeIndex === -1) {
        index += 1
        continue
      }

      const children = parseBlockTokens(tokens.slice(index + 1, closeIndex), state)

      if (token.hidden) {
        nodes.push(...children)
      } else {
        nodes.push({
          key: nextKey(state),
          kind: 'element',
          name: normalizeNodeName(token),
          attrs: attrsToRecord(token.attrs),
          children,
          block: token.block,
        })
      }

      index = closeIndex + 1
      continue
    }

    if (token.nesting === 0) {
      const parsed = parseBlockLeafToken(token, state)
      if (parsed) {
        nodes.push(...parsed)
      }
    }

    index += 1
  }

  return nodes
}

function parseBlockLeafToken(token: Token, state: ParseState): SvmdNode[] | null {
  if (token.type === 'inline') {
    return parseInlineTokens(token.children ?? [], state)
  }

  if (token.type === 'fence') {
    const maybeComponent = parseFenceComponent(token, state)
    if (maybeComponent) {
      return [maybeComponent]
    }

    const [lang] = token.info.trim().split(/\s+/, 1)

    return [
      {
        key: nextKey(state),
        kind: 'code',
        inline: false,
        text: token.content,
        lang: lang || undefined,
        info: token.info,
        attrs: attrsToRecord(token.attrs),
      } satisfies SvmdCodeNode,
    ]
  }

  if (token.type === 'code_block') {
    return [
      {
        key: nextKey(state),
        kind: 'code',
        inline: false,
        text: token.content,
        attrs: attrsToRecord(token.attrs),
      } satisfies SvmdCodeNode,
    ]
  }

  if (token.type === 'html_block') {
    return [
      {
        key: nextKey(state),
        kind: 'html',
        value: token.content,
        block: true,
      },
    ]
  }

  if (token.type === 'hr') {
    return [
      {
        key: nextKey(state),
        kind: 'element',
        name: 'hr',
        attrs: attrsToRecord(token.attrs),
        children: [],
        block: true,
      },
    ]
  }

  if (token.content) {
    return [
      {
        key: nextKey(state),
        kind: 'text',
        value: token.content,
      },
    ]
  }

  return null
}

function parseInlineTokens(tokens: Token[], state: ParseState): SvmdNode[] {
  const nodes: SvmdNode[] = []

  let index = 0
  while (index < tokens.length) {
    const token = tokens[index]

    if (token.type === 'text') {
      nodes.push({
        key: nextKey(state),
        kind: 'text',
        value: token.content,
      })
      index += 1
      continue
    }

    if (token.type === 'softbreak' || token.type === 'hardbreak') {
      nodes.push({
        key: nextKey(state),
        kind: 'break',
        hard: token.type === 'hardbreak',
      })
      index += 1
      continue
    }

    if (token.type === 'html_inline') {
      nodes.push({
        key: nextKey(state),
        kind: 'html',
        value: token.content,
        block: false,
      })
      index += 1
      continue
    }

    if (token.type === 'code_inline') {
      nodes.push({
        key: nextKey(state),
        kind: 'code',
        inline: true,
        text: token.content,
        attrs: attrsToRecord(token.attrs),
      })
      index += 1
      continue
    }

    if (token.type === 'image') {
      const attrs = attrsToRecord(token.attrs)
      if (!attrs.alt && token.content) {
        attrs.alt = token.content
      }

      nodes.push({
        key: nextKey(state),
        kind: 'element',
        name: token.tag || 'img',
        attrs,
        children: [],
        block: false,
      })
      index += 1
      continue
    }

    if (token.nesting === 1 && token.type.endsWith('_open')) {
      const closeType = openTypeToCloseType(token.type)
      const closeIndex = findCloseIndex(tokens, index, token.type, closeType)

      if (closeIndex !== -1) {
        const children = parseInlineTokens(tokens.slice(index + 1, closeIndex), state)

        nodes.push({
          key: nextKey(state),
          kind: 'element',
          name: normalizeNodeName(token),
          attrs: attrsToRecord(token.attrs),
          children,
          block: false,
        })

        index = closeIndex + 1
        continue
      }
    }

    if (token.content) {
      nodes.push({
        key: nextKey(state),
        kind: 'text',
        value: token.content,
      })
    }

    index += 1
  }

  return nodes
}

function parseFenceComponent(token: Token, state: ParseState): SvmdComponentNode | null {
  const info = token.info.trim()
  if (!info) {
    return null
  }

  const prefix = state.options.fenceComponentPrefix ?? FENCE_COMPONENT_PREFIX
  if (!info.startsWith(prefix)) {
    return null
  }

  const spec = info.slice(prefix.length).trim()
  if (!spec) {
    return null
  }

  const { name, propsRaw } = parseComponentSpec(spec)
  if (!name) {
    return null
  }

  const config = state.componentBlocks.get(name)
  if (config && !config.fence) {
    return null
  }

  const parseProps = config?.parseProps ?? defaultParseProps
  const props = parseProps(propsRaw, { name, syntax: 'fence' })

  const children = config?.parseFenceBodyAsMarkdown ? state.parseFragment(token.content) : []

  return {
    key: nextKey(state),
    kind: 'component',
    name,
    syntax: 'fence',
    props,
    children,
    source: token.content,
  }
}

function parseComponentSpec(spec: string): { name: string; propsRaw: string } {
  const firstSpace = spec.search(/\s/)
  if (firstSpace === -1) {
    return { name: spec.trim(), propsRaw: '' }
  }

  return {
    name: spec.slice(0, firstSpace).trim(),
    propsRaw: spec.slice(firstSpace).trim(),
  }
}

function extractContainerPropsRaw(name: string, info: string): string {
  const trimmed = info.trim()
  if (!trimmed) {
    return ''
  }

  if (!trimmed.startsWith(name)) {
    return trimmed
  }

  return trimmed.slice(name.length).trim()
}

function attrsToRecord(attrs: Token['attrs']): Record<string, string> {
  if (!attrs || attrs.length === 0) {
    return {}
  }

  return Object.fromEntries(attrs)
}

function isContainerOpenToken(token: Token, componentBlocks: Map<string, NormalizedComponentBlock>): boolean {
  if (!token.type.startsWith('container_') || !token.type.endsWith('_open')) {
    return false
  }

  const name = getContainerName(token.type)
  if (!name) {
    return false
  }

  const config = componentBlocks.get(name)
  return Boolean(config?.container)
}

function getContainerName(type: string): string | null {
  if (!type.startsWith('container_') || !type.endsWith('_open')) {
    return null
  }

  return type.slice('container_'.length, -'_open'.length)
}

function openTypeToCloseType(openType: string): string {
  if (!openType.endsWith('_open')) {
    return openType
  }

  return `${openType.slice(0, -'_open'.length)}_close`
}

function findCloseIndex(tokens: Token[], startIndex: number, openType: string, closeType: string): number {
  let depth = 0

  for (let index = startIndex; index < tokens.length; index += 1) {
    const token = tokens[index]

    if (token.type === openType) {
      depth += 1
      continue
    }

    if (token.type === closeType) {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

function normalizeNodeName(token: Token): string {
  if (token.tag) {
    return token.tag
  }

  const type = token.type
  if (type.endsWith('_open')) {
    return type.slice(0, -'_open'.length)
  }

  if (type.endsWith('_close')) {
    return type.slice(0, -'_close'.length)
  }

  return type
}

function defaultParseProps(raw: string): SvmdProps {
  const source = raw.trim()
  if (!source) {
    return {}
  }

  const jsonProps = parseJsonProps(source)
  if (jsonProps) {
    return jsonProps
  }

  const kvProps = parseKeyValueProps(source)
  if (Object.keys(kvProps).length > 0) {
    return kvProps
  }

  return { value: coercePrimitive(source) }
}

function parseJsonProps(source: string): SvmdProps | null {
  if (!(source.startsWith('{') && source.endsWith('}'))) {
    return null
  }

  try {
    const parsed = JSON.parse(source) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as SvmdProps
    }
  } catch {
    return null
  }

  return null
}

function parseKeyValueProps(source: string): SvmdProps {
  const props: SvmdProps = {}
  const keyValuePattern = /([A-Za-z_][\w-]*)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g

  for (const match of source.matchAll(keyValuePattern)) {
    const [, key, dqValue, sqValue, rawValue] = match
    const value = dqValue ?? sqValue ?? rawValue ?? ''
    props[key] = coercePrimitive(value)
  }

  return props
}

function coercePrimitive(value: string): SvmdProps[string] {
  const trimmed = value.trim()

  if (trimmed === 'true') {
    return true
  }

  if (trimmed === 'false') {
    return false
  }

  if (trimmed === 'null') {
    return null
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  return trimmed
}

function nextKey(state: ParseState): string {
  const key = state.keySeed
  state.keySeed += 1
  return `n_${key}`
}
