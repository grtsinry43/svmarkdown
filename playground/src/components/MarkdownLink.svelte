<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    href?: string;
    title?: string;
    children?: Snippet;
    linkLayout?: "inline" | "standalone";
    linkStandalone?: boolean;
  }

  let {
    href = "#",
    title,
    children,
    linkLayout = "inline",
    linkStandalone,
  }: Props = $props();
  const external = $derived(/^https?:\/\//.test(href));
  const standalone = $derived(linkStandalone ?? linkLayout === "standalone");
</script>

{#if standalone}
  <a
    class="link-card"
    {href}
    {title}
    target={external ? "_blank" : undefined}
    rel={external ? "noreferrer noopener" : undefined}
  >
    <div class="card-main">
      <div class="card-title">{@render children?.()}</div>
      <div class="card-url">{href}</div>
    </div>
    <div class="card-meta">
      {#if external}
        <span aria-hidden="true" class="external">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            ><line x1="7" y1="17" x2="17" y2="7"></line><polyline
              points="7 7 17 7 17 17"
            ></polyline></svg
          >
        </span>
      {/if}
    </div>
  </a>
{:else}
  <a
    class="md-link"
    {href}
    {title}
    target={external ? "_blank" : undefined}
    rel={external ? "noreferrer noopener" : undefined}
  >
    <span class="label">{@render children?.()}</span>
    {#if external}
      <span aria-hidden="true" class="external">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          ><line x1="7" y1="17" x2="17" y2="7"></line><polyline
            points="7 7 17 7 17 17"
          ></polyline></svg
        >
      </span>
    {/if}
  </a>
{/if}

<style>
  .md-link {
    display: inline-flex;
    align-items: baseline;
    gap: 0.15rem;
    color: #4f46e5;
    text-decoration: none;
    font-weight: 500;
    border-radius: 4px;
    padding: 0 0.1em;
    margin: 0 -0.1em;
    transition: all 0.2s ease;
    position: relative;
  }

  .md-link::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background-color: currentColor;
    opacity: 0.3;
    transition:
      height 0.2s ease,
      opacity 0.2s ease;
  }

  .md-link:hover {
    color: #4338ca;
    background: rgba(79, 70, 229, 0.05);
  }

  .md-link:hover::after {
    height: 2px;
    opacity: 0.8;
  }

  .external {
    font-size: 0.75em;
    transform: translateY(0em);
    opacity: 0.6;
    transition: opacity 0.2s ease;
  }

  .md-link:hover .external {
    opacity: 1;
  }

  .link-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1rem;
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;
    background: #f7f8ff;
    text-decoration: none;
    color: #1f2937;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;
  }

  .link-card:hover {
    border-color: rgba(99, 102, 241, 0.55);
    box-shadow: 0 8px 18px -12px rgba(79, 70, 229, 0.6);
    transform: translateY(-1px);
  }

  .card-title {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .card-url {
    margin-top: 0.2rem;
    font-size: 0.78rem;
    color: #6b7280;
    word-break: break-all;
  }

  .card-meta .external {
    opacity: 0.7;
  }
</style>
