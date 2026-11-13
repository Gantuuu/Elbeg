// Explicit opt-in, development only. Sample items never replace live products.
export const isDesignPreview = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("preview") === "design";
