<script lang="ts">
  interface Props {
    src?: string;
    alt?: string;
    title?: string;
  }

  let { src = "", alt = "", title }: Props = $props();
</script>

<figure class="md-image">
  <div class="image-wrapper">
    <img {src} {alt} loading="lazy" />
  </div>
  {#if title}
    <figcaption>{title}</figcaption>
  {/if}
</figure>

<style>
  .md-image {
    margin: 1.5rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .image-wrapper {
    overflow: hidden;
    border-radius: 8px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.05);
    background: #f3f4f6;
  }

  img {
    max-width: 100%;
    display: block;
    height: auto;
    transition: transform 0.3s ease;
  }

  img:hover {
    transform: scale(1.01);
  }

  figcaption {
    margin-top: 0.75rem;
    color: #6b7280;
    font-size: 0.85rem;
    text-align: center;
    font-style: italic;
  }
</style>
