const recipes = await fetch("./recipes.json").then((response) =>
  response.json(),
);
const searchInput = document.querySelector("#recipe-search");
const tagCloud = document.querySelector("#tag-cloud");
const recipeGrid = document.querySelector("#recipe-grid");
const tagTemplate = document.querySelector("#tag-cloud-item-template");
const cardTemplate = document.querySelector("#recipe-card-template");
const recipeTagTemplate = document.querySelector("#recipe-tag-template");
const params = new URLSearchParams(window.location.search);
let activeTag = params.get("tag") || "";
const languages = new Set(recipes.map((recipe) => recipe.lang).filter(Boolean));
document.documentElement.lang = languages.size === 1 ? [...languages][0] : "";

const tagCounts = new Map();
for (const recipe of recipes) {
  for (const tag of recipe.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
}
const maxCount = Math.max(...tagCounts.values(), 1);

for (const [tag, count] of [...tagCounts].sort(([left], [right]) =>
  left.localeCompare(right),
)) {
  const fragment = tagTemplate.content.cloneNode(true);
  const button = fragment.querySelector("button");
  button.dataset.tag = tag;
  button.style.setProperty("--tag-weight", 1 + (count - 1) / maxCount);
  button.querySelector("[data-tag-name]").textContent = tag;
  button.querySelector("[data-tag-count]").textContent = count;
  button.addEventListener("click", () => {
    activeTag = activeTag === tag ? "" : tag;
    updateRecipes();
  });
  tagCloud.append(fragment);
}

for (const recipe of recipes) {
  const fragment = cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".recipe-card");
  const link = card.querySelector("a");
  link.href = `recipes/${encodeURIComponent(recipe.slug)}.html`;
  card.dataset.search = recipe.search.toLocaleLowerCase(
    recipe.lang || undefined,
  );
  card.dataset.tags = JSON.stringify(recipe.tags);
  card.querySelector("[data-recipe-title]").textContent = recipe.title;
  const excerpt = card.querySelector("[data-recipe-excerpt]");
  excerpt.textContent = recipe.excerpt;
  excerpt.hidden = !recipe.excerpt;
  const recipeTags = card.querySelector("[data-recipe-tags]");
  for (const tag of recipe.tags) {
    const tagFragment = recipeTagTemplate.content.cloneNode(true);
    tagFragment.querySelector("[data-tag-label]").textContent = tag;
    recipeTags.append(tagFragment);
  }
  recipeGrid.append(fragment);
}

const cards = [...recipeGrid.querySelectorAll(".recipe-card")];
const tagButtons = [...tagCloud.querySelectorAll(".tag-cloud-item")];

function updateRecipes() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  for (const card of cards) {
    const tags = JSON.parse(card.dataset.tags);
    card.hidden =
      !card.dataset.search.includes(query) ||
      Boolean(activeTag && !tags.includes(activeTag));
  }
  for (const button of tagButtons) {
    const active = button.dataset.tag === activeTag;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

searchInput.addEventListener("input", updateRecipes);
updateRecipes();
