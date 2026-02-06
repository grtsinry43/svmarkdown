<script lang="ts">
  interface Props {
    title?: string;
    source?: string;
  }

  let { title = "Chart payload", source = "" }: Props = $props();
</script>

<section class="chart-wrapper">
  <header>
    <span class="icon">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        ><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line
          x1="3"
          y1="9"
          x2="21"
          y2="9"
        ></line><line x1="9" y1="21" x2="9" y2="9"></line></svg
      >
    </span>
    {title}
  </header>
  <div class="code-block">
    <pre>{source}</pre>
  </div>
</section>

<style>
  .chart-wrapper {
    margin: 1.5rem 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .chart-wrapper:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  header {
    padding: 0.65rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #4b5563;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon {
    display: flex;
    align-items: center;
    color: #9ca3af;
  }

  .code-block {
    position: relative;
    background: #ffffff;
  }

  pre {
    margin: 0;
    padding: 1rem;
    font-size: 0.8rem;
    font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
    line-height: 1.6;
    color: #374151;
    white-space: pre-wrap;
    word-break: break-word;
    background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  }
</style>
