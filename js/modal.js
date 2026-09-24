export function openModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

export function closeModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

export function wireModal(overlayId, openBtnId, closeBtnId) {
  const overlay = document.getElementById(overlayId);
  const openBtn = openBtnId ? document.getElementById(openBtnId) : null;
  const closeBtn = closeBtnId ? document.getElementById(closeBtnId) : null;
  if (openBtn) openBtn.addEventListener("click", () => openModal(overlayId));
  if (closeBtn) closeBtn.addEventListener("click", () => closeModal(overlayId));
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlayId);
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal(overlayId);
  });
}
