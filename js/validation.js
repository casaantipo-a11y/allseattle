export function showError(form, name, message) {
  const field = form.querySelector(`[data-field="${name}"]`);
  if (!field) return;
  field.classList.add("invalid");
  const input = field.querySelector("input, select, textarea");
  if (input) input.setAttribute("aria-invalid", "true");
  const errorNode = field.querySelector(".field-error");
  if (errorNode) errorNode.textContent = message;
}

export function clearErrors(form) {
  form.querySelectorAll(".field.invalid").forEach((field) => {
    field.classList.remove("invalid");
    const input = field.querySelector("input, select, textarea");
    if (input) input.removeAttribute("aria-invalid");
  });
}

export function digits(value) {
  return (value || "").replace(/\D/g, "");
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

/**
 * rules: { fieldName: (value, data) => errorMessage | null }
 * Returns true if valid, false otherwise; writes inline errors as a side effect.
 */
export function validate(form, data, rules) {
  clearErrors(form);
  let ok = true;
  for (const [name, check] of Object.entries(rules)) {
    const message = check(data[name], data);
    if (message) {
      showError(form, name, message);
      ok = false;
    }
  }
  return ok;
}
