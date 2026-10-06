const productList = document.getElementById("product-list");
const cartItems = document.getElementById("cart-items");
const orderTotal = document.getElementById("order-total");
const itemSelectionView = document.getElementById("item-selection-view");
const orderSummary = document.getElementById("order-summary");
const summaryItems = document.getElementById("summary-items");
const summaryTotal = document.getElementById("summary-total");
const summaryFeedback = document.getElementById("summary-feedback");
const proceedButton = document.getElementById("proceed-button");
const backButton = document.getElementById("back-to-items");
const cart = new Map();

function formatPrice(amountInCents) {
  return `₱${(amountInCents / 100).toFixed(2)}`;
}

function addProduct(productCard) {
  const productId = productCard.dataset.productId;
  const productName = productCard
    .querySelector(".product-name")
    .textContent.trim();
  const unitPrice = Number(productCard.dataset.price);

  if (!productId || !productName || !Number.isFinite(unitPrice)) {
    return;
  }

  const existingProduct = cart.get(productId);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.set(productId, {
      name: productName,
      unitPriceInCents: Math.round(unitPrice * 100),
      quantity: 1,
    });
  }

  renderCart();
}

function createCartItem(productId, product) {
  const item = document.createElement("li");
  item.className = "cart-item";

  const details = document.createElement("div");
  details.className = "cart-item-details";

  const name = document.createElement("span");
  name.className = "cart-item-name";
  name.textContent = product.name;

  const quantity = document.createElement("span");
  quantity.className = "cart-item-quantity";
  quantity.textContent = `Quantity: ${product.quantity}`;

  const unitPrice = document.createElement("span");
  unitPrice.className = "cart-item-unit-price";
  unitPrice.textContent = `Unit price: ${formatPrice(product.unitPriceInCents)}`;

  const subtotal = document.createElement("span");
  subtotal.className = "cart-item-subtotal";
  subtotal.textContent = `Subtotal: ${formatPrice(product.unitPriceInCents * product.quantity)}`;

  details.append(name, quantity, unitPrice, subtotal);

  const controls = document.createElement("div");
  controls.className = "cart-item-controls";

  const decreaseButton = createCartButton("-", "decrease", productId);
  decreaseButton.setAttribute(
    "aria-label",
    `Decrease ${product.name} quantity`,
  );

  const increaseButton = createCartButton("+", "increase", productId);
  increaseButton.setAttribute(
    "aria-label",
    `Increase ${product.name} quantity`,
  );

  const removeButton = createCartButton("Remove", "remove", productId);
  removeButton.className = "remove-button";

  controls.append(decreaseButton, increaseButton, removeButton);
  item.append(details, controls);

  return item;
}

function createCartButton(label, action, productId) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quantity-button";
  button.dataset.action = action;
  button.dataset.productId = productId;
  button.textContent = label;
  return button;
}

function renderCart() {
  cartItems.replaceChildren();

  let totalInCents = 0;

  if (cart.size === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "cart-empty";
    emptyMessage.id = "cart-empty";
    emptyMessage.textContent = "No items selected.";
    cartItems.append(emptyMessage);
  } else {
    for (const [productId, product] of cart) {
      totalInCents += product.unitPriceInCents * product.quantity;
      cartItems.append(createCartItem(productId, product));
    }
  }

  orderTotal.textContent = formatPrice(totalInCents);
  summaryFeedback.hidden = true;
  summaryFeedback.textContent = "";
}

function createSummaryItem(product) {
  const item = document.createElement("li");
  item.className = "summary-item";

  const name = document.createElement("span");
  name.className = "summary-product-name";
  name.textContent = product.name;

  const quantity = document.createElement("span");
  quantity.textContent = `Quantity: ${product.quantity}`;

  const unitPrice = document.createElement("span");
  unitPrice.textContent = `Unit price: ${formatPrice(product.unitPriceInCents)}`;

  const subtotal = document.createElement("span");
  subtotal.className = "summary-item-subtotal";
  subtotal.textContent = `Subtotal: ${formatPrice(product.unitPriceInCents * product.quantity)}`;

  item.append(name, quantity, unitPrice, subtotal);
  return item;
}

function renderOrderSummary() {
  summaryItems.replaceChildren();

  let totalInCents = 0;

  for (const product of cart.values()) {
    totalInCents += product.unitPriceInCents * product.quantity;
    summaryItems.append(createSummaryItem(product));
  }

  summaryTotal.textContent = formatPrice(totalInCents);
}

function showOrderSummary() {
  if (cart.size === 0) {
    summaryFeedback.textContent =
      "Your order is empty. Select at least one item before continuing.";
    summaryFeedback.hidden = false;
    return;
  }

  renderOrderSummary();
  itemSelectionView.hidden = true;
  orderSummary.hidden = false;
  document.getElementById("summary-heading").focus();
}

function returnToItemSelection() {
  orderSummary.hidden = true;
  itemSelectionView.hidden = false;
  proceedButton.focus();
}

productList.addEventListener("click", (event) => {
  const productCard = event.target.closest(".product-card");

  if (productCard && productList.contains(productCard)) {
    addProduct(productCard);
  }
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button || !cartItems.contains(button)) {
    return;
  }

  const product = cart.get(button.dataset.productId);

  if (!product) {
    return;
  }

  if (button.dataset.action === "increase") {
    product.quantity += 1;
  } else if (button.dataset.action === "decrease") {
    product.quantity -= 1;

    if (product.quantity <= 0) {
      cart.delete(button.dataset.productId);
    }
  } else if (button.dataset.action === "remove") {
    cart.delete(button.dataset.productId);
  }

  renderCart();
});

proceedButton.addEventListener("click", showOrderSummary);
backButton.addEventListener("click", returnToItemSelection);
