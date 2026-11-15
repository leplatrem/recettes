const recipe = await fetch(`../data/${document.body.dataset.recipe}.json`).then(
  (response) => response.json(),
);
const title = document.querySelector("#recipe-title");
const tags = document.querySelector("#recipe-tags");
const properties = document.querySelector("#recipe-properties");
const content = document.querySelector("#recipe-content");
const gallery = document.querySelector("#recipe-gallery");
const ingredientList = document.querySelector("#ingredient-list");
const servingsControl = document.querySelector("#servings-control");
const servingsCount = document.querySelector("#servings-count");
const controls = [...document.querySelectorAll("[data-servings-step]")];
const formatter = new Intl.NumberFormat(recipe.lang || undefined, {
  maximumFractionDigits: 2,
});

document.documentElement.lang = recipe.lang || "";
document.title = recipe.title;
title.textContent = recipe.title;

function addTags() {
  const template = document.querySelector("#recipe-tag-template");
  for (const tag of recipe.tags) {
    const fragment = template.content.cloneNode(true);
    const link = fragment.querySelector("[data-recipe-tag]");
    link.href = `../index.html?tag=${encodeURIComponent(tag)}`;
    link.textContent = tag;
    tags.append(fragment);
  }
}

function displayValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return value == null ? "" : String(value);
}

function addProperties() {
  const template = document.querySelector("#recipe-property-template");
  for (const property of recipe.properties) {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector("[data-property-name]").textContent = property.name;
    fragment.querySelector("[data-property-value]").textContent = displayValue(
      property.value,
    );
    properties.append(fragment);
  }
  properties.hidden = recipe.properties.length === 0;
}

function addInlineIngredients() {
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const pattern = /RECIPEINGREDIENTTOKEN(\d+)END/g;
    let match;
    let cursor = 0;
    let found = false;
    const fragment = document.createDocumentFragment();
    while ((match = pattern.exec(node.textContent))) {
      found = true;
      if (match.index > cursor) {
        fragment.append(
          document.createTextNode(node.textContent.slice(cursor, match.index)),
        );
      }
      const ingredient = recipe.ingredients[Number(match[1])];
      const span = document.createElement("span");
      span.dataset.ingredientIndex = match[1];
      span.textContent = ingredient.raw;
      fragment.append(span);
      cursor = pattern.lastIndex;
    }
    if (found) {
      if (cursor < node.textContent.length) {
        fragment.append(
          document.createTextNode(node.textContent.slice(cursor)),
        );
      }
      node.replaceWith(fragment);
    }
  }
}

function renderIngredient(ingredient, portionScale) {
  if (ingredient.amount == null) return ingredient.name || ingredient.raw;
  const amount = formatter.format(ingredient.amount * portionScale);
  return [amount, ingredient.unit, ingredient.name].filter(Boolean).join(" ");
}

function updateQuantities() {
  const scale = recipe.portions == null ? 1 : servings / recipe.portions;
  for (const element of document.querySelectorAll("[data-ingredient-index]")) {
    const ingredient =
      recipe.ingredients[Number(element.dataset.ingredientIndex)];
    element.textContent = renderIngredient(ingredient, scale);
  }
  for (const [index, element] of [...ingredientList.children].entries()) {
    element.textContent = renderIngredient(
      recipe.ingredient_list[index],
      scale,
    );
  }
}

function addIngredients() {
  const template = document.querySelector("#ingredient-template");
  for (const ingredient of recipe.ingredient_list) {
    const fragment = template.content.cloneNode(true);
    ingredientList.append(fragment);
  }

  if (recipe.portions == null) {
    servingsControl.hidden = true;
    return;
  }
  servings = recipe.portions;
  servingsControl.hidden = false;
  servingsCount.textContent = servings;
  updateQuantities();
}

function addImages() {
  const template = document.querySelector("#photo-template");
  recipe.images.forEach((image, index) => {
    const fragment = template.content.cloneNode(true);
    const photo = fragment.querySelector("img");
    photo.src = `../assets/images/${encodeURIComponent(image)}`;
    photo.alt = `${recipe.title} ${index + 1}`;
    gallery.append(fragment);
  });
}

let servings = recipe.portions;
addTags();
addProperties();
content.innerHTML = recipe.content;
addInlineIngredients();
addIngredients();
addImages();
updateQuantities();

for (const control of controls) {
  control.addEventListener("click", () => {
    servings = Math.max(1, servings + Number(control.dataset.servingsStep));
    servingsCount.textContent = servings;
    updateQuantities();
  });
}
