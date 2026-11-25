const servingsControl = document.querySelector("#servings-control");
const servingsCount = document.querySelector("#servings-count");
const simpleToggle = document.querySelector("#simple-toggle");
const portions = Number(servingsControl.dataset.portions) || null;
const formatter = new Intl.NumberFormat(
  document.documentElement.lang || undefined,
  { maximumFractionDigits: 2 },
);
let servings = portions;

// "Simple" mode: measure with a glass and a tablespoon instead of a scale.
const GLASS_ML = 200;
const SPOON_ML = 15;
const SIMPLE_KEY = "recettes-simple";
const FRACTIONS = [
  [0, ""],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [1, ""],
];

function formatFraction(value) {
  let whole = Math.floor(value);
  const [fraction, glyph] = FRACTIONS.reduce((best, candidate) =>
    Math.abs(candidate[0] - (value - whole)) <
    Math.abs(best[0] - (value - whole))
      ? candidate
      : best,
  );
  whole += fraction === 1 ? 1 : 0;
  return `${whole || ""}${glyph}` || "0";
}

function simpleAmount(ml) {
  if (ml >= GLASS_ML / 2) {
    return `${formatFraction(ml / GLASS_ML)} 🥛`;
  }
  if (ml < SPOON_ML / 8) {
    return "🤏";
  }
  return `${formatFraction(ml / SPOON_ML)} 🥄`;
}

function updateQuantities() {
  const scale = portions == null ? 1 : servings / portions;
  const simple = simpleToggle.checked;
  for (const element of document.querySelectorAll("[data-amount]")) {
    const { amount, unit, name, ml } = element.dataset;
    const quantity =
      simple && ml
        ? [simpleAmount(Number(ml) * scale)]
        : [formatter.format(Number(amount) * scale), unit];
    element.textContent = [...quantity, name].filter(Boolean).join(" ");
  }
}

// Storage can be unavailable (e.g. blocked cookies): the switch then works for the page only.
function loadPreference() {
  try {
    return localStorage.getItem(SIMPLE_KEY) === "1";
  } catch {
    return false;
  }
}

function savePreference(value) {
  try {
    localStorage.setItem(SIMPLE_KEY, value ? "1" : "0");
  } catch {
    // Not remembered for the next pages.
  }
}

simpleToggle.checked = loadPreference();
simpleToggle.addEventListener("change", () => {
  savePreference(simpleToggle.checked);
  updateQuantities();
});

// Re-render once to localize number formatting (e.g. "0,5" in French).
updateQuantities();

for (const control of document.querySelectorAll("[data-servings-step]")) {
  control.addEventListener("click", () => {
    servings = Math.max(1, servings + Number(control.dataset.servingsStep));
    servingsCount.textContent = servings;
    updateQuantities();
  });
}
