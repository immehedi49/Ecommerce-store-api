let shoppingCart = [];
let allProductsData = [];
let appliedCoupon = 0;
let customDelivery = 0;
let customTaxPercent = 0;

const mainContent = document.getElementById("main-content");

//  Update cart count in button
function updateCartCount() {
  const cartCountSpan = document.getElementById("cart-count");
  if (!cartCountSpan) return;
  const count = shoppingCart.length;
  cartCountSpan.textContent = count > 0 ? `(${count})` : "";
}

//  Find product by id
function findProductById(id) {
  return allProductsData.find((a) => a.id === id);
}

//  Adds one product (used for quantity +)
function handleAddToCart(productId) {
  const product = findProductById(productId);
  if (!product) return;
  // Find if product already exists in cart
  const existingItem = shoppingCart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    shoppingCart.push({ ...product, quantity: 1 });
  }
  updateCartCount();
}

//  Adds only once from product page
function handleAddUniqueToCart(productId) {
  const isAlreadyInCart = shoppingCart.some((item) => item.id === productId);
  if (!isAlreadyInCart) handleAddToCart(productId);
}

//  Removes one instance
function removeOneFromCart(productId) {
  const item = shoppingCart.find((i) => i.id === productId);
  if (!item) return;

  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    // remove completely if only one left
    shoppingCart = shoppingCart.filter((i) => i.id !== productId);
  }
}


//  Removes all of a product
function removeAllFromCart(productId) {
  shoppingCart = shoppingCart.filter((item) => item.id !== productId);
}

//  RENDER PRODUCT PAGE
async function renderProductPage() {
  mainContent.innerHTML = `
    <section class="p-4 bg-white shadow-md mb-6 sticky">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="space-y-1">
          <p class="text-2xl font-bold text-gray-900">All Products available in store</p>
        </div>
        <button id="checkout-page-btn" class="bg-blue-600 p-2 px-4 rounded-xl text-white font-medium hover:bg-blue-700">
          Checkout <span id="cart-count"></span>
        </button>
      </div>
    </section>

    <div id="product-grid" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 text-center text-gray-500 ">
      Loading products...
    </div>
  `;

  document.getElementById("checkout-page-btn").addEventListener("click", renderShoppingCartPage);

  const productGrid = document.getElementById("product-grid");

  try {
    const response = await fetch("https://dummyjson.com/products");
    const data = await response.json();
    allProductsData = data.products;
    window.allProductsData = allProductsData
    window.productGrid = productGrid

    productGrid.innerHTML = allProductsData.map(renderProductCard).join("");

    productGrid.querySelectorAll(".add-to-cart-btn").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        handleAddUniqueToCart(Number(e.target.dataset.productId))
      )
    );

    updateCartCount();
  } catch (err) {
    console.error("Failed to fetch products:", err);
    productGrid.innerHTML = `<p class="col-span-full text-red-500">Failed to load products.</p>`;
  }
}

function renderProductCard(product) {
  const rating = Math.round(product.rating);
  return `
<div class="bg-white rounded-xl shadow-lg overflow-hidden w-full relative group transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-2xl hover:z-10">

  <div class="h-56 flex justify-center items-center p-6 bg-gray-50">
    <img src="${product.thumbnail}" alt="${product.title}" class="max-h-full max-w-full transition-transform duration-300 group-hover:scale-105">
  </div>

  <div class="p-4 space-y-2 relative">
    <h3 class="text-bold font-extrabold text-gray-900 line-clamp-2 text-left">${product.title}</h3>
    <div class="text-left">
      ${product.brand ? `<p class="text-sm text-gray-600">${product.brand}</p>` : ""}
      ${product.category ? `<p class="text-sm text-gray-600">${product.category}</p>` : ""}
    </div>
    <div class="pt-1">
      <div class="flex items-center justify-between mb-3">
        <p class="font-black text-gray-900">$${product.price}</p>
        <div>
          ${Array(rating).fill('<span class="fa fa-star text-yellow-300"></span>').join("")}
          ${Array(5 - rating).fill('<span class="fa fa-star text-yellow-200"></span>').join("")}
        </div>
      </div>
      
      </div>
  </div>

  <button
    class="bg-orange-500 text-white py-1 rounded-xl text-lg shadow-md transition-all duration-300 font-semibold
           absolute inset-0 m-auto w-3/4 h-fit opacity-0  group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-orange-600 add-to-cart-btn active:scale-[90%] transition-all"
           data-product-id="${product.id}"
  >
    Add to Cart
  </button>
</div>`;
}

function renderShoppingCartPage() {
  const grouped = groupCartItems();
  const totals = calculateTotals(grouped);

  mainContent.innerHTML = `
    <div class="max-w-7xl mx-auto p-4 md:p-6 lg:flex lg:space-x-8">
      ${renderCartItemsSection(grouped)}
      ${renderCartSummarySection(grouped, totals)}
    </div>
  `;

  document.getElementById("back-to-shop-btn").addEventListener("click", renderProductPage);

  document.querySelectorAll(".quantity-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => handleQuantityChange(e.target))
  );

  document.querySelectorAll(".remove-item-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      removeAllFromCart(+e.currentTarget.dataset.productId);
      renderShoppingCartPage();
      updateCartCount();
    })
  );

  //  Coupon apply
  const applyBtn = document.getElementById("apply-coupon-btn");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const code = document.getElementById("coupon-input").value.trim().toLowerCase();
      if (code === "m10" || code === "m50") {
        appliedCoupon = code;
      } else {
        appliedCoupon = null;
        alert("Invalid coupon code!");
      }
      renderShoppingCartPage();
    });
  }

  //  Custom delivery/tax inputs
  const deliveryInput = document.getElementById("delivery-input");
  const taxInput = document.getElementById("tax-input");

  if (deliveryInput) {
    deliveryInput.addEventListener("change", () => {
      customDelivery = parseFloat(deliveryInput.value) || 0;
      renderShoppingCartPage();
    });
  }

  if (taxInput) {
    taxInput.addEventListener("change", () => {
      customTaxPercent = parseFloat(taxInput.value) || 0;
      renderShoppingCartPage();
    });
  }
  const proceedBtn = document.getElementById("proceed-payment-btn");
  if (proceedBtn) {
    proceedBtn.addEventListener("click", showPaymentModal);
  }
}

function groupCartItems() {
  // ✅ Cart already contains quantity info now
  return shoppingCart.map(item => ({
    ...item,
    subtotal: item.price * (item.quantity || 1)
  }));
}


function calculateTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

  //  Coupon discount
  let discount = 0;
  if (appliedCoupon === "m10") discount = subtotal * 0.1;
  if (appliedCoupon === "m50") discount = subtotal * 0.5;

  const delivery = customDelivery !== 0 ? customDelivery : items.length ? 0 : 0;
  const taxPercent = customTaxPercent !== 0 ? customTaxPercent : 0;
  const tax = ((subtotal - discount) * taxPercent) / 100;
  const total = subtotal - discount + delivery + tax;

  return { subtotal, discount, delivery, tax, total, taxPercent };
}

function handleQuantityChange(target) {
  const btn = target.closest(".quantity-btn");
  if (!btn) return;
  const productId = +btn.dataset.productId;
  const action = btn.dataset.action;
  if (action === "increase") handleAddToCart(productId);
  if (action === "decrease") removeOneFromCart(productId);
  renderShoppingCartPage();
  updateCartCount();
}

function renderCartItemsSection(items) {
  if (!items.length)
    return `
      <div class="lg:w-2/3 bg-white p-6 rounded-xl shadow-lg mb-6 lg:mb-0 text-center">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Shopping Cart</h2>
        <p class="text-gray-600 py-12 text-lg">Your cart is currently empty.</p>
        <button id="back-to-shop-btn" class="text-blue-600 font-medium">← Back to Shop</button>
      </div>
    `;

  return `
    <div class="lg:w-2/3 bg-white p-6 rounded-xl shadow-lg mb-6 lg:mb-0">
      <div class="flex justify-between items-center mb-6 border-b pb-4">
        <h2 class="text-bold font-extrabold text-gray-900">Shopping Cart</h2>
        <button id="back-to-shop-btn" class="text-blue-600 font-medium">← Back to Shop</button>
      </div>
      <div class="hidden md:grid grid-cols-10 text-gray-500 font-medium border-b pb-3 mb-4">
        <div class="col-span-4">Product Name</div>
        <div class="col-span-2 text-center">Unit Price</div>
        <div class="col-span-2 text-center">Quantity</div>
        <div class="col-span-2 text-right">Total</div>
      </div>
      <div id="cart-items-container">${items.map(renderCartItem).join("")}</div>
    </div>
  `;
}

function renderCartItem(item) {
  return `
  <div class="grid grid-cols-1 md:grid-cols-10 items-center py-4 border-b last:border-b-0 gap-4" data-product-id="${item.id}">
    <div class="col-span-1 md:col-span-4 flex items-center space-x-4">
      <img src="${item.thumbnail}" alt="${item.title}" class="w-16 h-16 rounded-md border p-1">
      <div>
        <p class="font-semibold text-gray-900 line-clamp-2">${item.title}</p>
        <p class="text-xs text-gray-500">${item.brand}</p>
      </div>
    </div>
    <div class="col-span-1 md:col-span-2 text-center font-medium">$${item.price}</div>
    <div class="col-span-1 md:col-span-2 flex justify-center items-center space-x-2">
      <button class="quantity-btn p-1 border rounded-lg hover:bg-gray-100" data-action="decrease" data-product-id="${item.id}">-</button>
      <span class="w-6 text-center">${item.quantity}</span>
      <button class="quantity-btn p-1 border rounded-lg hover:bg-gray-100" data-action="increase" data-product-id="${item.id}">+</button>
    </div>
    <div class="col-span-1 md:col-span-2 text-right flex items-center justify-end space-x-4">
      <span class="text-lg font-bold text-gray-900">$${item.subtotal.toFixed(2)}</span>
      <button 
        class="remove-item-btn text-gray-400 hover:text-red-500 transition-colors duration-200" 
        data-product-id="${item.id}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke-width="1.5" 
            stroke="currentColor" 
            class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V4h6v3m-7 0h8l-1 13H8L7 7z" />
        </svg>
      </button>


    </div>
  </div>`;
}

function renderCartSummarySection(items, totals) {
  const { subtotal, discount, delivery, tax, total, taxPercent } = totals;
  return `
<div class="lg:w-1/3 space-y-6">
      <div class="bg-white p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-bold mb-4">Coupon Code</h3>
        
        <div class="relative flex">
          <input 
          id="coupon-input"
            type="text" 
            placeholder="Enter Coupon" 
            class="flex-grow border rounded-xl p-3 text-sm pr-24" value="${appliedCoupon || ""}"
          >
          <button 
           id="apply-coupon-btn"
            class="absolute right-0 top-0 bottom-0 bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm h-full hover:bg-orange-600 active:scale-[98%] transition-all"
          >
            Apply
          </button>
        </div>
        </div>

  <div class="bg-white p-6 rounded-xl shadow-lg">
    <h3 class="text-xl font-bold mb-4">Order Summary</h3>
    <div class="space-y-3 text-gray-700">
      <div class="flex justify-between"><span>Subtotal (${shoppingCart.length} items)</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="flex justify-between text-green-600"><span>Discount</span><span>-$${discount.toFixed(2)}</span></div>

      <!--  Delivery input + value display -->
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span>Delivery</span>
          <input id="delivery-input" type="number" placeholder="$" value="${delivery}" class="w-20 border rounded-md text-right p-1 text-sm 
          [appearance:textfield]
          [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none"">
        </div>
        <span id="delivery-display" class="font-medium">$${delivery.toFixed(2)}</span>
      </div>

      <!-- Tax input + value display -->
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span>Tax (%)</span>
          <input id="tax-input" type="number" placeholder="%" value="${taxPercent}" class="w-20 ml-2 border rounded-md text-right p-1 text-sm
          [appearance:textfield]
          [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none"">
        </div>
        <span id="tax-display" class="font-medium">$${tax.toFixed(2)}</span>
      </div>

      <div class="flex justify-between text-xl font-bold border-t pt-4 mt-4"><span>Total</span><span>$${total.toFixed(2)}</span></div>
    </div>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-lg">
    <h3 class="text-xl font-bold mb-4">Payment Method</h3>
    <div class="grid grid-cols-4 gap-2 mb-6">
      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" class="h-6 mx-auto" alt="PayPal">
      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" class="h-6 mx-auto" alt="Mastercard">
      <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" class="h-6 mx-auto" alt="Bitcoin">
      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" class="h-6 mx-auto" alt="Visa">
    </div>
    <button id="proceed-payment-btn" class="bg-green-600 text-white px-6 py-3 rounded-lg w-full font-bold text-lg hover:bg-green-700 shadow-md">Proceed to Payment</button>
  </div>
</div>`;
}



function showPaymentModal() {
  if (!shoppingCart.length) return; 

  const confirmation = confirm("Are you want to pay?");
  if (confirmation) {

  alert("Payment successful!");
    shoppingCart = [];
    appliedCoupon = 0;
    customDelivery = 0;
    customTaxPercent = 0;
    
    renderShoppingCartPage(); 
    
    updateCartCount();
} else {
    renderShoppingCartPage(); 
}
};



document.addEventListener("DOMContentLoaded", renderProductPage);
