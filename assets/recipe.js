const servingsControl = document.querySelector("#servings-control");
const servingsCount = document.querySelector("#servings-count");
const portions = Number(servingsControl.dataset.portions) || null;
const formatter = new Intl.NumberFormat(
  document.documentElement.lang || undefined,
  { maximumFractionDigits: 2 },
);
let servings = portions;

function updateQuantities() {
  const scale = portions == null ? 1 : servings / portions;
  for (const element of document.querySelectorAll("[data-amount]")) {
    const { amount, unit, name } = element.dataset;
    element.textContent = [formatter.format(Number(amount) * scale), unit, name]
      .filter(Boolean)
      .join(" ");
  }
}

// Re-render once to localize number formatting (e.g. "0,5" in French).
updateQuantities();

for (const control of document.querySelectorAll("[data-servings-step]")) {
  control.addEventListener("click", () => {
    servings = Math.max(1, servings + Number(control.dataset.servingsStep));
    servingsCount.textContent = servings;
    updateQuantities();
  });
}
