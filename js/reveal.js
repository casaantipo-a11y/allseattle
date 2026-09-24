const PREFERS_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Fades/slides in elements as they scroll into view. Call again after any
 * innerHTML re-render (filters, pagination, etc.) — already-visible items
 * are unaffected, only newly-added ones start hidden and get observed.
 */
export function initScrollReveal(selector = ".reveal-on-scroll", root = document) {
  const items = [...root.querySelectorAll(selector)].filter((el) => !el.classList.contains("is-visible"));
  if (!items.length) return;

  if (PREFERS_REDUCED_MOTION || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el, i) => {
    el.style.setProperty("--reveal-i", i % 8);
    observer.observe(el);
  });
}
