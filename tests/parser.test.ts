import { describe, expect, it } from 'vitest'
import { createParser, parseMarkdown } from '../src/parser'
import type { SvmdComponentNode, SvmdElementNode } from '../src/types'

describe('parseMarkdown', () => {
  it('parses standard markdown to AST blocks', () => {
    const ast = parseMarkdown('# Title\n\nVisit [Svelte](https://svelte.dev) and `inline` ![kitten](https://img.test/1.png)')

    expect(ast.kind).toBe('root')
    expect(ast.children[0]).toMatchObject({ kind: 'element', name: 'h1' })

    const paragraph = ast.children[1] as SvmdElementNode
    expect(paragraph.kind).toBe('element')
    expect(paragraph.name).toBe('p')

    const linkNode = paragraph.children.find(
      (node) => node.kind === 'element' && node.name === 'a',
    )
    expect(linkNode).toBeDefined()

    const codeNode = paragraph.children.find((node) => node.kind === 'code')
    expect(codeNode).toMatchObject({ kind: 'code', inline: true, text: 'inline' })

    const imageNode = paragraph.children.find(
      (node) => node.kind === 'element' && node.name === 'img',
    )
    expect(imageNode).toMatchObject({
      kind: 'element',
      name: 'img',
      attrs: {
        src: 'https://img.test/1.png',
        alt: 'kitten',
      },
    })
  })

  it('parses blockquotes with soft and hard breaks', () => {
    const ast = parseMarkdown(
      [
        '> line1',
        '> line2',
        '',
        '> line1  ',
        '> line2',
      ].join('\n'),
    )

    const firstQuote = ast.children[0] as SvmdElementNode
    expect(firstQuote.kind).toBe('element')
    expect(firstQuote.name).toBe('blockquote')

    const firstParagraph = firstQuote.children[0] as SvmdElementNode
    expect(firstParagraph.name).toBe('p')
    expect(firstParagraph.children.map((node) => node.kind)).toEqual([
      'text',
      'break',
      'text',
    ])
    expect(firstParagraph.children[0]).toMatchObject({ kind: 'text', value: 'line1' })
    expect(firstParagraph.children[1]).toMatchObject({ kind: 'break', hard: false })
    expect(firstParagraph.children[2]).toMatchObject({ kind: 'text', value: 'line2' })

    const secondQuote = ast.children[1] as SvmdElementNode
    const secondParagraph = secondQuote.children[0] as SvmdElementNode
    expect(secondParagraph.children.map((node) => node.kind)).toEqual([
      'text',
      'break',
      'text',
    ])
    expect(secondParagraph.children[0]).toMatchObject({ kind: 'text', value: 'line1' })
    expect(secondParagraph.children[1]).toMatchObject({ kind: 'break', hard: true })
    expect(secondParagraph.children[2]).toMatchObject({ kind: 'text', value: 'line2' })
  })

  it('parses ::: container components with props and markdown children', () => {
    const parser = createParser({
      componentBlocks: {
        Alert: true,
      },
    })

    const ast = parser('::: Alert type=info title="Heads up"\n**Runtime** content\n:::')
    const componentNode = ast.children[0] as SvmdComponentNode

    expect(componentNode.kind).toBe('component')
    expect(componentNode.name).toBe('Alert')
    expect(componentNode.syntax).toBe('container')
    expect(componentNode.props).toEqual({
      type: 'info',
      title: 'Heads up',
    })

    expect(componentNode.children[0]).toMatchObject({ kind: 'element', name: 'p' })
  })

  it('parses ```component:Name fences as component blocks', () => {
    const ast = parseMarkdown('```component:Chart {"theme":"dark"}\n1,2,3\n```')
    const componentNode = ast.children[0] as SvmdComponentNode

    expect(componentNode.kind).toBe('component')
    expect(componentNode.name).toBe('Chart')
    expect(componentNode.syntax).toBe('fence')
    expect(componentNode.props).toEqual({ theme: 'dark' })
    expect(componentNode.source).toBe('1,2,3\n')
  })

  it('can parse fence body as markdown for selected component blocks', () => {
    const parser = createParser({
      componentBlocks: {
        Card: {
          fence: true,
          container: false,
          parseFenceBodyAsMarkdown: true,
        },
      },
    })

    const ast = parser('```component:Card\nHello **svmd**\n```')
    const componentNode = ast.children[0] as SvmdComponentNode

    expect(componentNode.kind).toBe('component')
    expect(componentNode.children[0]).toMatchObject({ kind: 'element', name: 'p' })
  })
})
