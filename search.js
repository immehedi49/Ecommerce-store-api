




document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");

  if (!searchInput) return;

  searchInput.addEventListener("input", event => {
    const query = event.target.value.trim().toLowerCase();

    if (!window.allProductsData || !window.productGrid) return;

    const filtered = allProductsData.filter(product =>
      product.title.toLowerCase().includes(query)
    );

    if (filtered.length > 0) {
      productGrid.innerHTML = filtered.map(renderProductCard).join("");
    } else {
      productGrid.innerHTML =
        `<p class="col-span-full text-center text-gray-500">No products found.</p>`;
    }

    //"Add to Cart" buttons
    productGrid.querySelectorAll(".add-to-cart-btn").forEach(btn =>
      btn.addEventListener("click", event =>
        handleAddToCart(+event.target.dataset.productId)
      )
    );
  });
});
