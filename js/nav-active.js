export function markActiveNav() {
  const activePage = document.body.dataset.page;
  if (!activePage) return;
  document.querySelectorAll(".nav-links a[data-page], .nav-secondary a[data-page]").forEach((a) => {
    a.classList.toggle("active", a.dataset.page === activePage);
    if (a.dataset.page === activePage) a.setAttribute("aria-current", "page");
  });
}
