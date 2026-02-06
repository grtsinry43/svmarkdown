<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    href?: string;
    title?: string;
    children?: Snippet;
  }

  let { href = "#", title, children }: Props = $props();
  const external = $derived(/^https?:\/\//.test(href));
</script>

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
</style>
