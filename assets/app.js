const searchInput = document.querySelector("#recipe-search");
const searchStatus = document.querySelector("#search-status");
const pluralRules = new Intl.PluralRules(
  document.documentElement.lang || undefined,
);

// Case and accent insensitive: "creme" matches "Crème".
function normalize(text, lang) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase(lang || undefined);
}

const tagButtons = [...document.querySelectorAll(".tag-cloud-item")];
const cards = [...document.querySelectorAll(".recipe-card")].map((element) => ({
  element,
  search: normalize(element.dataset.search, element.lang),
  tags: JSON.parse(element.dataset.tags),
}));
// Filters are kept in the URL (`?q=soup&tag=winter`), to share them or come back to them.
const params = new URLSearchParams(window.location.search);
let activeTag = params.get("tag") || "";
searchInput.value = params.get("q") || "";

function saveFilters() {
  const url = new URL(window.location.href);
  for (const [name, value] of [
    ["q", searchInput.value.trim()],
    ["tag", activeTag],
  ]) {
    if (value) {
      url.searchParams.set(name, value);
    } else {
      url.searchParams.delete(name);
    }
  }
  window.history.replaceState(null, "", url);
}

function updateRecipes() {
  const query = normalize(
    searchInput.value.trim(),
    document.documentElement.lang,
  );
  let count = 0;
  for (const card of cards) {
    card.element.hidden =
      !card.search.includes(query) ||
      Boolean(activeTag && !card.tags.includes(activeTag));
    count += card.element.hidden ? 0 : 1;
  }
  const { none, one, other } = searchStatus.dataset;
  const filtered = query || activeTag;
  const message = pluralRules.select(count) === "one" ? one : other;
  searchStatus.textContent = !filtered
    ? ""
    : count === 0
      ? none
      : message.replace("{count}", count);
  for (const button of tagButtons) {
    const active = button.dataset.tag === activeTag;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

for (const button of tagButtons) {
  button.addEventListener("click", () => {
    activeTag = activeTag === button.dataset.tag ? "" : button.dataset.tag;
    updateRecipes();
    saveFilters();
  });
}
searchInput.addEventListener("input", () => {
  updateRecipes();
  saveFilters();
});

for (const element of document.querySelectorAll("[data-requires-js]")) {
  element.hidden = false;
}
updateRecipes();
