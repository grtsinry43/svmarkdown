<script lang="ts">
  interface Props {
    inline: boolean;
    text: string;
    lang?: string;
  }

  let { inline, text, lang }: Props = $props();
</script>

{#if inline}
  <code class="inline">{text}</code>
{:else}
  <section class="block-wrapper">
    <header>
      <div class="dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <span class="lang">{lang ?? "plain"}</span>
    </header>
    <div class="code-container">
      <pre><code>{text}</code></pre>
    </div>
  </section>
{/if}

<style>
  .inline {
    font-family: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    font-size: 0.85em;
    padding: 0.2em 0.4em;
    margin: 0 0.1em;
    border-radius: 6px;
    background: #eff6ff;
    color: #1e3a8a;
    border: 1px solid #dbeafe;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .block-wrapper {
    margin: 1.5rem 0;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    overflow: hidden;
    background: #1f2937;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: #111827;
    border-bottom: 1px solid #374151;
  }

  .dots {
    display: flex;
    gap: 6px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .dot.red {
    background-color: #ef4444;
  }
  .dot.yellow {
    background-color: #f59e0b;
  }
  .dot.green {
    background-color: #10b981;
  }

  .lang {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #9ca3af;
    font-weight: 600;
  }

  .code-container {
    padding: 0;
    overflow-x: auto;
  }

  pre {
    margin: 0;
    padding: 1rem 1.25rem;
    background: transparent;
    color: #e5e7eb;
    font-size: 0.875rem;
    line-height: 1.6;
    overflow: visible; /* Container handles overflow */
  }

  code {
    font-family: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
  }
</style>
