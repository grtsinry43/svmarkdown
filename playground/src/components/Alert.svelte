<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    type?: string;
    title?: string;
    children?: Snippet;
  }

  let { type = "info", title = "Notice", children }: Props = $props();

  // Map types to colors for dynamic styling
  const colorMap: Record<string, string> = {
    info: "#6366f1", // Indigo
    warning: "#f59e0b", // Amber
    success: "#10b981", // Emerald
    error: "#ef4444", // Red
  };

  const iconMap: Record<string, string> = {
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    warning:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    success:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
  };
</script>

<aside class={`alert ${type}`}>
  <div class="icon-wrapper">
    {@html iconMap[type] || iconMap.info}
  </div>
  <div class="main-content">
    {#if title}
      <h4>{title}</h4>
    {/if}
    <div class="content">
      {@render children?.()}
    </div>
  </div>
</aside>

<style>
  .alert {
    position: relative;
    margin: 1.25rem 0;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    background: #f8fafc; /* Fallback */
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    gap: 1rem;
    /* Default Info (Indigo) */
    background: #eef2ff;
    border-color: #e0e7ff;
    color: #3730a3;
  }

  .icon-wrapper {
    flex-shrink: 0;
    margin-top: 0.1rem;
    color: currentColor;
    opacity: 0.85;
  }

  .alert.warning {
    background: #fffbeb;
    border-color: #fde68a;
    color: #92400e;
  }

  .alert.success {
    background: #ecfdf5;
    border-color: #d1fae5;
    color: #065f46;
  }

  .alert.error {
    background: #fef2f2;
    border-color: #fee2e2;
    color: #991b1b;
  }

  .main-content {
    flex: 1;
  }

  h4 {
    margin: 0 0 0.35rem;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.4;
  }

  .content :global(p) {
    margin: 0;
    font-size: 0.925rem;
    line-height: 1.6;
    opacity: 0.9;
  }

  .content :global(p + p) {
    margin-top: 0.75rem;
  }
</style>
