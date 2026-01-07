// ============================
// Utility Functions
// ============================

/**
 * Format amount as Indian Rupee string
 * @param {number} amount
 * @returns {string}
 */
function formatINR(amount) {
  return `₹${amount.toFixed(0)}`;
}

// ============================
// State
// ============================

// Cart represented as Map<itemId, { id, name, price, quantity }>
const cart = new Map();

// Cached DOM elements
const cartItemsContainer = document.querySelector(".cart-items");
const cartEmptyMessage = document.querySelector(".cart-empty");
const itemsTotalEl = document.getElementById("itemsTotal");
const grandTotalEl = document.getElementById("grandTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const qrCodeContainer = document.getElementById("qrCode");
const qrAmountEl = document.getElementById("qrAmount");

// Navbar / year
const navToggleBtn = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const yearEl = document.getElementById("year");

// ============================
// Cart Logic
// ============================

/**
 * Add an item to cart or increase its quantity
 * @param {Object} item
 * @param {string} item.id
 * @param {string} item.name
 * @param {number} item.price
 */
function addToCart(item) {
  const existing = cart.get(item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.set(item.id, { ...item, quantity: 1 });
  }
  renderCart();
}

/**
 * Update quantity of an item in the cart
 * @param {string} id
 * @param {number} delta (+1 or -1)
 */
function updateQuantity(id, delta) {
  const item = cart.get(id);
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    cart.delete(id);
  } else {
    item.quantity = newQty;
  }
  renderCart();
}

/**
 * Remove an item from the cart
 * @param {string} id
 */
function removeFromCart(id) {
  cart.delete(id);
  renderCart();
}

/**
 * Clear cart
 */
function clearCart() {
  cart.clear();
  renderCart();
}

/**
 * Calculate totals: items total and grand total (no GST)
 * @returns {{itemsTotal: number, grandTotal: number}}
 */
function calculateTotals() {
  let itemsTotal = 0;
  cart.forEach((item) => {
    itemsTotal += item.price * item.quantity;
  });

  const grandTotal = itemsTotal;

  return { itemsTotal, grandTotal };
}

/**
 * Render cart rows and totals in DOM
 */
function renderCart() {
  // Clear existing items
  cartItemsContainer.innerHTML = "";

  if (cart.size === 0) {
    cartEmptyMessage.style.display = "block";
    checkoutBtn.disabled = true;
    clearCartBtn.disabled = true;
  } else {
    cartEmptyMessage.style.display = "none";
    checkoutBtn.disabled = false;
    clearCartBtn.disabled = false;

    cart.forEach((item) => {
      const lineTotal = item.price * item.quantity;

      const row = document.createElement("div");
      row.className = "cart-item-row";
      row.dataset.id = item.id;

      row.innerHTML = `
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-qty-cell">
          <div class="cart-qty-control">
            <button class="cart-qty-btn" data-action="decrease">-</button>
            <span class="cart-qty-value">${item.quantity}</span>
            <button class="cart-qty-btn" data-action="increase">+</button>
          </div>
        </span>
        <span class="cart-price">${formatINR(item.price)}</span>
        <span class="cart-line-total">${formatINR(lineTotal)}</span>
        <span class="cart-remove-cell">
          <button class="cart-remove-btn">Remove</button>
        </span>
      `;

      cartItemsContainer.appendChild(row);
    });
  }

  // Update totals
  const { itemsTotal, grandTotal } = calculateTotals();
  itemsTotalEl.textContent = formatINR(itemsTotal);
  grandTotalEl.textContent = formatINR(grandTotal);

  // Update QR Code
  updateQRCode(grandTotal);
}

// ============================
// QR Code Generation
// ============================

/**
 * Generate QR code with payment amount
 * @param {number} amount - Total amount to pay
 */
function updateQRCode(amount) {
  const qrCodeImage = document.getElementById("qrCodeImage");
  
  if (!qrCodeImage) return;

  // Create UPI payment URL with amount
  const upiUrl = `upi://pay?pa=harishkannan1813-1@okicici&pn=South%20Spice%20Restaurant&am=${amount.toFixed(2)}&cu=INR&tn=Restaurant%20Bill`;
  
  // Update QR code image source with new amount
  qrCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  
  // Update amount display
  qrAmountEl.textContent = `Total Amount: ${formatINR(amount)}`;
}

// ============================
// Event Listeners
// ============================

function setupMenuButtons() {
  const addButtons = document.querySelectorAll(".add-to-cart");
  addButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".menu-card");
      if (!card) return;

      const id = card.dataset.id;
      const name = card.dataset.name;
      const price = Number(card.dataset.price);

      if (!id || !name || Number.isNaN(price)) return;

      addToCart({ id, name, price });
    });
  });
}

function setupCartEvents() {
  // Delegate quantity and remove controls to container
  cartItemsContainer.addEventListener("click", (event) => {
    const target = event.target;
    const row = target.closest(".cart-item-row");
    if (!row) return;

    const id = row.dataset.id;
    if (!id) return;

    if (target.matches(".cart-qty-btn")) {
      const action = target.dataset.action;
      if (action === "increase") {
        updateQuantity(id, 1);
      } else if (action === "decrease") {
        updateQuantity(id, -1);
      }
    }

    if (target.matches(".cart-remove-btn")) {
      removeFromCart(id);
    }
  });

  // Clear cart
  clearCartBtn.addEventListener("click", () => {
    if (cart.size === 0) return;
    clearCart();
  });

  // Checkout
  checkoutBtn.addEventListener("click", () => {
    if (cart.size === 0) return;

    const { itemsTotal, grandTotal } = calculateTotals();
    const itemLines = [];
    cart.forEach((item) => {
      itemLines.push(`${item.name} x ${item.quantity} = ${formatINR(item.price * item.quantity)}`);
    });

    const message = [
      "Thank you for your order at South Spice! 🥘",
      "",
      "Order Summary:",
      ...itemLines,
      "",
      `Items Total: ${formatINR(itemsTotal)}`,
      `Grand Total: ${formatINR(grandTotal)}`,
      "",
      "Your order has been received. Please proceed to the counter for payment.",
    ].join("\n");

    // Simple alert for confirmation as requested
    alert(message);

    // Optionally clear cart after confirmation
    clearCart();
  });
}

function setupNavbar() {
  if (navToggleBtn && navLinks) {
    navToggleBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });

    // Close mobile nav when clicking a link
    navLinks.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() === "a") {
        navLinks.classList.remove("show");
      }
    });
  }
}

function setupYear() {
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}

// ============================
// Init
// ============================

document.addEventListener("DOMContentLoaded", () => {
  setupMenuButtons();
  setupCartEvents();
  setupNavbar();
  setupYear();

  // Initial render
  renderCart();
  
  // Initialize QR code
  updateQRCode(0);
});

