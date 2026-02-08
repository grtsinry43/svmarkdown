import type MarkdownIt from 'markdown-it'
import type {
  Options as MarkdownItOptions,
  PluginSimple as MarkdownItPluginSimple,
  PluginWithOptions as MarkdownItPluginWithOptions,
  PluginWithParams as MarkdownItPluginWithParams,
} from 'markdown-it'
import type { Component } from 'svelte'

export type SvmdPrimitive = string | number | boolean | null
export type SvmdPropValue = SvmdPrimitive | SvmdPropValue[] | { [key: string]: SvmdPropValue }
export type SvmdProps = Record<string, SvmdPropValue>

interface SvmdNodeBase {
  key: string
}

export interface SvmdRoot {
  kind: 'root'
  children: SvmdNode[]
}

export interface SvmdTextNode extends SvmdNodeBase {
  kind: 'text'
  value: string
}

export interface SvmdBreakNode extends SvmdNodeBase {
  kind: 'break'
  hard: boolean
}

export interface SvmdHtmlNode extends SvmdNodeBase {
  kind: 'html'
  value: string
  block: boolean
}

export interface SvmdElementNode extends SvmdNodeBase {
  kind: 'element'
  name: string
  attrs: Record<string, string>
  children: SvmdNode[]
  block: boolean
}

export interface SvmdCodeNode extends SvmdNodeBase {
  kind: 'code'
  inline: boolean
  text: string
  lang?: string
  info?: string
  attrs: Record<string, string>
}

export interface SvmdComponentNode extends SvmdNodeBase {
  kind: 'component'
  name: string
  syntax: 'container' | 'fence'
  props: SvmdProps
  children: SvmdNode[]
  source?: string
}

export type SvmdNode =
  | SvmdTextNode
  | SvmdBreakNode
  | SvmdHtmlNode
  | SvmdElementNode
  | SvmdCodeNode
  | SvmdComponentNode

export type SvmdComponent = Component<any>
export type SvmdComponentMap = Record<string, SvmdComponent | undefined>

export type SvmdMarkdownItPlugin =
  | MarkdownItPluginSimple
  | MarkdownItPluginWithParams
  | [MarkdownItPluginSimple | MarkdownItPluginWithOptions<any> | MarkdownItPluginWithParams, ...unknown[]]

export interface SvmdComponentBlockConfig {
  container?: boolean
  fence?: boolean
  parseFenceBodyAsMarkdown?: boolean
  parseProps?: (raw: string, context: { name: string; syntax: 'container' | 'fence' }) => SvmdProps
}

export type SvmdComponentBlocks = Record<string, boolean | SvmdComponentBlockConfig>

export interface SvmdParseOptions {
  markdownIt?: MarkdownIt
  markdownItOptions?: MarkdownItOptions
  markdownItPlugins?: SvmdMarkdownItPlugin[]
  componentBlocks?: SvmdComponentBlocks
  fenceComponentPrefix?: string
}

export interface SvmdRenderOptions {
  allowDangerousHtml?: boolean
  softBreak?: 'space' | 'newline' | 'br'
}
