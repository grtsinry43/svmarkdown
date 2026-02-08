<script lang="ts">
  import {
    Markdown,
    createParser,
    type SvmdComponentMap,
    type SvmdNode,
    type SvmdParseOptions,
    type SvmdRoot,
  } from "../../src";
  import Alert from "./components/Alert.svelte";
  import Chart from "./components/Chart.svelte";
  import MarkdownCode from "./components/MarkdownCode.svelte";
  import MarkdownImage from "./components/MarkdownImage.svelte";
  import MarkdownLink from "./components/MarkdownLink.svelte";

  const parseOptions: SvmdParseOptions = {
    componentBlocks: {
      Alert: true,
      Chart: {
        container: false,
        fence: true,
      },
    },
  };

  const components: SvmdComponentMap = {
    a: MarkdownLink,
    img: MarkdownImage,
    code: MarkdownCode,
    Alert,
    Chart,
  };

  const baseMarkdown = [
    "# svmarkdown playground",
    "",
    "Supports runtime updates and Svelte component overrides:",
    "",
    'Visit [Svelte](https://svelte.dev "Svelte Official Site").',
    "",
    '![A random image](https://picsum.photos/seed/svmd/720/260 "Runtime image")',
    "",
    "Inline code `const now = Date.now()` and code blocks:",
    "",
    "```ts",
    "export function greet(name: string) {",
    "  return `Hello, ${name}`",
    "}",
    "```",
    "",
    '::: Alert type=warning title="Container Component"',
    "This is an **Alert** component, content is standard Markdown.",
    ":::",
    "",
    "https://svelte.dev",
    "",
    '```component:Chart {"title":"Fence Component"}',
    "month,visits",
    "Jan,421",
    "Feb,530",
    "Mar,489",
    "```",
    "",
    "---",
    "",
    "## Typography Test",
    "Standard text should act like this. The quick brown fox jumps over the lazy dog.",
    "",
    "> Blockquotes are essential for highlighting content.",
    "",
    "- List item one",
    "- List item two",
    "  - Nested item",
  ].join("\n");

  let markdown = $state(baseMarkdown);
  let activeTab = $state<"preview" | "ast">("preview");

  const parser = $derived(createParser(parseOptions));

  let ast = $state<SvmdRoot>({ kind: "root", children: [] });
  let parseCount = $state(0);
  let parseLastMs = $state(0);
  let parseMaxMs = $state(0);
  let parseTotalMs = $state(0);
  let nodeCount = $state(0);
  let parseCountRaw = 0;
  let parseTotalMsRaw = 0;
  let parseMaxMsRaw = 0;

  let streaming = $state(false);
  let streamChunkSize = $state(32);
  let streamIntervalMs = $state(45);
  let streamSourceSize = $state(80);
  let streamChunks = $state<string[]>([]);
  let streamIndex = $state(0);
  let streamChars = $state(0);

  let streamTimer: ReturnType<typeof setInterval> | null = null;
  let streamStartedAt = $state(0);
  let streamTickAt = $state(0);

  const parseAvgMs = $derived(parseCount === 0 ? 0 : parseTotalMs / parseCount);
  const streamProgress = $derived(
    streamChunks.length === 0 ? 0 : streamIndex / streamChunks.length,
  );
  const streamElapsedMs = $derived(
    streamStartedAt === 0 ? 0 : streamTickAt - streamStartedAt,
  );
  const streamRate = $derived(
    streamElapsedMs === 0 ? 0 : (streamChars / streamElapsedMs) * 1000,
  );

  $effect(() => {
    const start = performance.now();
    const nextAst = parser(markdown);
    const duration = performance.now() - start;

    parseCountRaw += 1;
    parseTotalMsRaw += duration;
    parseMaxMsRaw = Math.max(parseMaxMsRaw, duration);

    ast = nextAst;
    parseCount = parseCountRaw;
    parseLastMs = duration;
    parseTotalMs = parseTotalMsRaw;
    parseMaxMs = parseMaxMsRaw;
    nodeCount = countNodes(nextAst.children);
  });

  $effect(() => {
    return () => stopStreaming();
  });

  function buildStreamPayload(sectionCount: number): string {
    const lines: string[] = ["# Streaming benchmark", ""];

    for (let index = 1; index <= sectionCount; index += 1) {
      lines.push(`## Section ${index}`);
      lines.push(`- item ${index}.1`);
      lines.push(`- item ${index}.2 with [link](https://example.com/${index})`);

      if (index % 5 === 0) {
        lines.push("");
        lines.push(`::: Alert type=info title="Window ${index}"`);
        lines.push(`This alert is generated at stream chunk ${index}.`);
        lines.push(":::");
      }

      if (index % 7 === 0) {
        lines.push("");
        lines.push('```component:Chart {"title":"Batch ' + index + '"}');
        lines.push("month,visits");
        lines.push(`m1,${index * 11}`);
        lines.push(`m2,${index * 13}`);
        lines.push("```");
      }

      lines.push("");
      lines.push("```ts");
      lines.push(`export const value${index} = ${index} * 2`);
      lines.push("```");
      lines.push("");
    }

    return lines.join("\n");
  }

  function splitByChunk(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];

    for (let index = 0; index < text.length; index += chunkSize) {
      chunks.push(text.slice(index, index + chunkSize));
    }

    return chunks;
  }

  function resetMetrics(): void {
    parseCountRaw = 0;
    parseTotalMsRaw = 0;
    parseMaxMsRaw = 0;
    parseCount = 0;
    parseLastMs = 0;
    parseMaxMs = 0;
    parseTotalMs = 0;
    nodeCount = 0;
  }

  function resetToBase(): void {
    stopStreaming();
    resetMetrics();
    markdown = baseMarkdown;
  }

  function startStreaming(): void {
    stopStreaming();
    resetMetrics();

    const payload = buildStreamPayload(streamSourceSize);
    streamChunks = splitByChunk(payload, streamChunkSize);
    streamIndex = 0;
    streamChars = 0;
    streamStartedAt = Date.now();
    streamTickAt = streamStartedAt;

    markdown = "";
    streaming = true;

    streamTimer = setInterval(() => {
      if (streamIndex >= streamChunks.length) {
        stopStreaming();
        return;
      }

      const chunk = streamChunks[streamIndex];
      markdown += chunk;
      streamIndex += 1;
      streamChars += chunk.length;
      streamTickAt = Date.now();
    }, streamIntervalMs);
  }

  function stopStreaming(): void {
    if (streamTimer) {
      clearInterval(streamTimer);
      streamTimer = null;
    }

    streaming = false;
    streamTickAt = Date.now();
  }

  function countNodes(nodes: SvmdNode[]): number {
    let total = 0;

    for (const node of nodes) {
      total += 1;

      if (node.kind === "element" || node.kind === "component") {
        total += countNodes(node.children);
      }
    }

    return total;
  }

  function formatMs(value: number): string {
    return `${value.toFixed(2)} ms`;
  }

  function formatRate(value: number): string {
    return `${value.toFixed(0)} chars/s`;
  }
</script>

<div class="app-layout">
  <header class="app-header">
    <div class="logo">
      <h1>svmarkdown</h1>
      <span class="badge">Playground</span>
    </div>
    <div class="header-controls">
      <div class="control-group">
        <div class="metrics-pill">
          <span>{parseCount} updates</span>
          <span class="divider"></span>
          <span>{formatMs(parseAvgMs)} avg</span>
          <span class="divider"></span>
          <span>{nodeCount} nodes</span>
        </div>
      </div>
    </div>
  </header>

  <main class="workspace">
    <section class="pane editor-pane">
      <div class="pane-header">
        <h2>Markdown Input</h2>
      </div>
      <div class="pane-content">
        <textarea
          bind:value={markdown}
          spellcheck="false"
          placeholder="Type markdown here..."
        ></textarea>
      </div>
    </section>

    <section class="pane preview-pane">
      <div class="pane-header tabs-header">
        <div class="tabs">
          <button
            type="button"
            class="tab-btn"
            class:active={activeTab === "preview"}
            onclick={() => (activeTab = "preview")}
          >
            Preview
          </button>
          <button
            type="button"
            class="tab-btn"
            class:active={activeTab === "ast"}
            onclick={() => (activeTab = "ast")}
          >
            AST View
          </button>
        </div>
      </div>
      <div class="pane-content scrollable">
        {#if activeTab === "preview"}
          <div class="markdown-body">
            <Markdown content={markdown} {components} {parseOptions} />
          </div>
        {:else}
          <div class="ast-view">
            <pre>{JSON.stringify(ast, null, 2)}</pre>
          </div>
        {/if}
      </div>
    </section>
  </main>

  <footer class="controls-bar">
    <div class="control-section">
      <h3>Streaming Simulation</h3>
      <div class="inputs">
        <label>
          <span>Sections ({streamSourceSize})</span>
          <input
            type="range"
            min="20"
            max="240"
            step="10"
            bind:value={streamSourceSize}
            disabled={streaming}
          />
        </label>
        <label>
          <span>Chunk ({streamChunkSize})</span>
          <input
            type="range"
            min="8"
            max="180"
            step="4"
            bind:value={streamChunkSize}
            disabled={streaming}
          />
        </label>
        <label>
          <span>Interval ({streamIntervalMs}ms)</span>
          <input
            type="range"
            min="8"
            max="220"
            step="4"
            bind:value={streamIntervalMs}
            disabled={streaming}
          />
        </label>
      </div>
      <div class="actions">
        {#if streaming}
          <button class="btn secondary" onclick={stopStreaming}>Stop</button>
        {:else}
          <button class="btn primary" onclick={startStreaming}
            >Start Stream</button
          >
        {/if}
        <button class="btn text" onclick={resetToBase}>Reset</button>
      </div>
      <div class="stream-status">
        <span class="status-label">Progress:</span>
        {(streamProgress * 100).toFixed(1)}%
        <span class="separator">•</span>
        {formatRate(streamRate)}
      </div>
    </div>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family:
      "Inter",
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Open Sans",
      "Helvetica Neue",
      sans-serif;
    background-color: #fafafa;
    color: #1f2937;
    height: 100vh;
    overflow: hidden;
  }

  .app-layout {
    display: grid;
    grid-template-rows: auto 1fr auto;
    height: 100vh;
    max-width: 100vw;
  }

  /* Header */
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #111827;
  }

  .badge {
    padding: 0.15rem 0.5rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #4b5563;
  }

  .metrics-pill {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.35rem 0.85rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    font-feature-settings: "tnum";
  }

  .metrics-pill .divider {
    width: 1px;
    height: 12px;
    background: #d1d5db;
  }

  /* Workspace */
  .workspace {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: #e5e7eb; /* Divider color */
    overflow: hidden;
  }

  .pane {
    background: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .pane-header {
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid #f3f4f6;
    height: 3.5rem;
    display: flex;
    align-items: center;
    box-sizing: border-box;
  }

  .pane-header h2 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #9ca3af;
  }

  /* Tabs */
  .tabs-header {
    padding: 0 1rem;
    gap: 1rem;
  }

  .tabs {
    display: flex;
    height: 100%;
    align-items: stretch;
  }

  .tab-btn {
    border: none;
    background: transparent;
    padding: 0 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: #374151;
  }

  .tab-btn.active {
    color: #111827;
    border-bottom-color: #111827;
  }

  .pane-content {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .pane-content.scrollable {
    overflow-y: auto;
  }

  textarea {
    width: 100%;
    height: 100%;
    border: none;
    padding: 1.25rem;
    resize: none;
    font-family: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #374151;
    background: #ffffff;
    outline: none;
    box-sizing: border-box;
  }

  textarea:focus {
    background: #fafbfd;
  }

  .markdown-body {
    padding: 2rem 3rem;
    max-width: 760px;
    margin: 0 auto;
  }

  .ast-view {
    padding: 1.5rem;
    background: #111827;
    min-height: 100%;
  }

  .ast-view pre {
    margin: 0;
    font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
    font-size: 0.8rem;
    color: #e5e7eb;
    line-height: 1.6;
  }

  /* Controls Footer */
  .controls-bar {
    background: #ffffff;
    border-top: 1px solid #e5e7eb;
    padding: 0.75rem 1.5rem;
  }

  .control-section {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .control-section h3 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: #374151;
    margin-right: 0.5rem;
  }

  .inputs {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .inputs label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: #6b7280;
    min-width: 120px;
  }

  input[type="range"] {
    display: block;
    width: 100%;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: #ffffff;
    border: 2px solid #3b82f6; /* Accent color */
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-left: auto;
  }

  .btn {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    border: 1px solid transparent;
    padding: 0.45rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn.primary {
    background: #111827;
    color: #ffffff;
    border-color: #111827;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .btn.primary:hover {
    background: #000000;
    border-color: #000000;
    transform: translateY(-1px);
  }

  .btn.secondary {
    background: #fff0f0;
    color: #e11d48;
    border-color: #ffe4e6;
  }

  .btn.secondary:hover {
    background: #ffe4e6;
  }

  .btn.text {
    color: #6b7280;
  }

  .btn.text:hover {
    background: #f3f4f6;
    color: #111827;
  }

  .stream-status {
    font-size: 0.8rem;
    color: #1f2937;
    font-variant-numeric: tabular-nums;
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 180px;
    justify-content: flex-end;
  }

  .status-label {
    color: #9ca3af;
    font-weight: 500;
  }

  .separator {
    color: #d1d5db;
  }

  /* Markdown Styling Override for Preview */
  .markdown-body :global(h1) {
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    margin-bottom: 1.5rem;
  }

  .markdown-body :global(p) {
    line-height: 1.75;
    margin-bottom: 1.25rem;
  }

  .markdown-body :global(img) {
    border-radius: 8px;
    max-width: 100%;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  @media (max-width: 900px) {
    .workspace {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr 1fr;
    }

    .controls-bar {
      overflow-x: auto;
    }

    .control-section {
      width: 100%;
      flex-wrap: wrap;
    }

    .actions {
      margin-left: 0;
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
