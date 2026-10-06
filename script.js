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
const continueToPaymentButton = document.getElementById("continue-to-payment");
const paymentView = document.getElementById("payment-view");
const paymentSuccessView = document.getElementById("payment-success");
const digitalReceiptView = document.getElementById("digital-receipt");
const receiptItems = document.getElementById("receipt-items");
const paymentOptions = document.querySelectorAll(".payment-option");
const paymentPanels = {
  cash: document.getElementById("cash-payment-panel"),
  qr: document.getElementById("qr-payment-panel"),
  card: document.getElementById("card-payment-panel"),
};
const cashPaymentForm = document.getElementById("cash-payment-form");
const cashPaymentInput = document.getElementById("amount-paid");
const cashFeedback = document.getElementById("cash-feedback");
const cardProcessingMessage = document.getElementById(
  "card-processing-message",
);
const processCardButton = document.getElementById("process-card-payment");
const backToSummaryButton = document.getElementById("back-to-summary");
const viewReceiptButton = document.getElementById("view-receipt");
const newTransactionButton = document.getElementById("new-transaction");
const cart = new Map();
const paymentDetails = {
  method: null,
  amountPaidInCents: 0,
  changeInCents: 0,
};
let cardProcessingTimer = null;
let completedTransaction = null;
let transactionSequence = 0;

function formatPrice(amountInCents) {
  return `₱${(amountInCents / 100).toFixed(2)}`;
}

function generateTransactionReference() {
  transactionSequence += 1;
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `POS-${Date.now()}-${transactionSequence}-${randomPart}`;
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

  if (cart.size === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "cart-empty";
    emptyMessage.id = "cart-empty";
    emptyMessage.textContent = "No items selected.";
    cartItems.append(emptyMessage);
  } else {
    for (const [productId, product] of cart) {
      cartItems.append(createCartItem(productId, product));
    }
  }

  orderTotal.textContent = formatPrice(calculateCartTotalInCents());
  summaryFeedback.hidden = true;
  summaryFeedback.textContent = "";
}

function calculateCartTotalInCents() {
  let totalInCents = 0;

  for (const product of cart.values()) {
    totalInCents += product.unitPriceInCents * product.quantity;
  }

  return totalInCents;
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

  for (const product of cart.values()) {
    summaryItems.append(createSummaryItem(product));
  }

  summaryTotal.textContent = formatPrice(calculateCartTotalInCents());
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

function updatePaymentAmounts() {
  const formattedTotal = formatPrice(calculateCartTotalInCents());
  document.getElementById("cash-total").textContent = formattedTotal;
  document.getElementById("qr-total").textContent = formattedTotal;
  document.getElementById("card-total").textContent = formattedTotal;
}

function showPaymentView() {
  if (cart.size === 0) {
    orderSummary.hidden = true;
    itemSelectionView.hidden = false;
    summaryFeedback.textContent =
      "Your order is empty. Select at least one item before continuing.";
    summaryFeedback.hidden = false;
    return;
  }

  updatePaymentAmounts();
  orderSummary.hidden = true;
  paymentView.hidden = false;
  document.getElementById("payment-heading").focus();
}

function selectPaymentMethod(method) {
  if (!paymentPanels[method] || cardProcessingTimer !== null) {
    return;
  }

  paymentDetails.method = method;
  paymentDetails.amountPaidInCents = 0;
  paymentDetails.changeInCents = 0;
  cashFeedback.hidden = true;
  cashFeedback.textContent = "";
  cardProcessingMessage.hidden = true;
  cardProcessingMessage.textContent = "";

  for (const option of paymentOptions) {
    const isSelected = option.dataset.paymentMethod === method;
    option.setAttribute("aria-pressed", String(isSelected));
  }

  for (const [panelMethod, panel] of Object.entries(paymentPanels)) {
    panel.hidden = panelMethod !== method;
  }
}

function completePayment(method, amountPaidInCents, changeInCents) {
  paymentDetails.method = method;
  paymentDetails.amountPaidInCents = amountPaidInCents;
  paymentDetails.changeInCents = changeInCents;

  completedTransaction = {
    reference: generateTransactionReference(),
    date: new Date(),
    items: Array.from(cart.values(), (product) => ({ ...product })),
    totalInCents: calculateCartTotalInCents(),
    method,
    amountPaidInCents,
    changeInCents,
  };

  document.getElementById("success-reference").textContent =
    completedTransaction.reference;
  document.getElementById("success-method").textContent = method;
  document.getElementById("success-total").textContent = formatPrice(
    completedTransaction.totalInCents,
  );
  document.getElementById("success-amount-paid").textContent =
    formatPrice(amountPaidInCents);
  document.getElementById("success-change").textContent =
    formatPrice(changeInCents);

  paymentView.hidden = true;
  paymentSuccessView.hidden = false;
  document.getElementById("payment-success-heading").focus();
}

function createReceiptRow(product) {
  const row = document.createElement("tr");
  const productName = document.createElement("th");
  productName.scope = "row";
  productName.textContent = product.name;

  const quantity = document.createElement("td");
  quantity.textContent = String(product.quantity);

  const unitPrice = document.createElement("td");
  unitPrice.textContent = formatPrice(product.unitPriceInCents);

  const subtotal = document.createElement("td");
  subtotal.textContent = formatPrice(
    product.unitPriceInCents * product.quantity,
  );

  row.append(productName, quantity, unitPrice, subtotal);
  return row;
}

function renderReceipt() {
  if (!completedTransaction) {
    return;
  }

  document.getElementById("receipt-reference").textContent =
    completedTransaction.reference;
  document.getElementById("receipt-date").textContent =
    completedTransaction.date.toLocaleString();
  document.getElementById("receipt-total").textContent = formatPrice(
    completedTransaction.totalInCents,
  );
  document.getElementById("receipt-method").textContent =
    completedTransaction.method;
  document.getElementById("receipt-amount-paid").textContent = formatPrice(
    completedTransaction.amountPaidInCents,
  );
  document.getElementById("receipt-change").textContent = formatPrice(
    completedTransaction.changeInCents,
  );

  receiptItems.replaceChildren();

  for (const product of completedTransaction.items) {
    receiptItems.append(createReceiptRow(product));
  }
}

function showReceipt() {
  renderReceipt();

  if (!completedTransaction) {
    return;
  }

  paymentSuccessView.hidden = true;
  digitalReceiptView.hidden = false;
  document.getElementById("receipt-heading").focus();
}

function startNewTransaction() {
  cancelCardProcessing();
  cart.clear();
  paymentDetails.method = null;
  paymentDetails.amountPaidInCents = 0;
  paymentDetails.changeInCents = 0;
  completedTransaction = null;

  renderCart();
  updatePaymentAmounts();
  summaryItems.replaceChildren();
  summaryTotal.textContent = formatPrice(0);
  cashPaymentInput.value = "";
  cashFeedback.textContent = "";
  cashFeedback.hidden = true;
  cardProcessingMessage.textContent = "";
  cardProcessingMessage.hidden = true;
  processCardButton.disabled = false;
  processCardButton.textContent = "Process Payment";

  for (const option of paymentOptions) {
    option.setAttribute("aria-pressed", "false");
    option.disabled = false;
  }

  for (const panel of Object.values(paymentPanels)) {
    panel.hidden = true;
  }

  for (const id of [
    "success-reference",
    "success-method",
    "success-total",
    "success-amount-paid",
    "success-change",
    "receipt-reference",
    "receipt-date",
    "receipt-total",
    "receipt-method",
    "receipt-amount-paid",
    "receipt-change",
  ]) {
    document.getElementById(id).textContent = "";
  }

  receiptItems.replaceChildren();
  digitalReceiptView.hidden = true;
  paymentSuccessView.hidden = true;
  paymentView.hidden = true;
  orderSummary.hidden = true;
  itemSelectionView.hidden = false;
  productList.querySelector(".product-card").focus();
}

function handleCashPayment(event) {
  event.preventDefault();

  const amountText = cashPaymentInput.value.trim();

  if (cashPaymentInput.validity.badInput || !amountText) {
    cashFeedback.textContent = amountText
      ? "Enter a valid amount."
      : "Enter the amount paid.";
    cashFeedback.hidden = false;
    return;
  }

  const amountPaid = Number(amountText);

  if (
    !Number.isFinite(amountPaid) ||
    amountPaid < 0 ||
    cashPaymentInput.validity.stepMismatch
  ) {
    cashFeedback.textContent = "Enter a valid non-negative amount.";
    cashFeedback.hidden = false;
    return;
  }

  const amountPaidInCents = Math.round(amountPaid * 100);
  const totalInCents = calculateCartTotalInCents();

  if (amountPaidInCents < totalInCents) {
    cashFeedback.textContent = `Insufficient payment. Please enter at least ${formatPrice(totalInCents)}.`;
    cashFeedback.hidden = false;
    return;
  }

  completePayment("Cash", amountPaidInCents, amountPaidInCents - totalInCents);
}

function cancelCardProcessing() {
  if (cardProcessingTimer === null) {
    return;
  }

  window.clearTimeout(cardProcessingTimer);
  cardProcessingTimer = null;
  processCardButton.disabled = false;
  processCardButton.textContent = "Process Payment";
  cardProcessingMessage.hidden = true;
  cardProcessingMessage.textContent = "";

  for (const option of paymentOptions) {
    option.disabled = false;
  }
}

function processCardPayment() {
  if (paymentDetails.method !== "card" || cardProcessingTimer !== null) {
    return;
  }

  processCardButton.disabled = true;
  processCardButton.textContent = "Processing...";
  cardProcessingMessage.textContent = "Processing simulated card payment...";
  cardProcessingMessage.hidden = false;

  for (const option of paymentOptions) {
    option.disabled = true;
  }

  cardProcessingTimer = window.setTimeout(() => {
    cardProcessingTimer = null;
    completePayment("Credit/Debit Card", calculateCartTotalInCents(), 0);
  }, 1000);
}

function returnToOrderSummary() {
  cancelCardProcessing();
  paymentView.hidden = true;
  orderSummary.hidden = false;
  document.getElementById("summary-heading").focus();
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
continueToPaymentButton.addEventListener("click", showPaymentView);
backToSummaryButton.addEventListener("click", returnToOrderSummary);
cashPaymentForm.addEventListener("submit", handleCashPayment);
document.getElementById("confirm-qr-payment").addEventListener("click", () => {
  if (paymentDetails.method === "qr") {
    completePayment("QR Payment", calculateCartTotalInCents(), 0);
  }
});
processCardButton.addEventListener("click", processCardPayment);
viewReceiptButton.addEventListener("click", showReceipt);
newTransactionButton.addEventListener("click", startNewTransaction);

for (const option of paymentOptions) {
  option.addEventListener("click", () => {
    selectPaymentMethod(option.dataset.paymentMethod);
  });
}
