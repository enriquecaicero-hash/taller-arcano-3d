// =============================
// CONFIGURACIÓN
// =============================

// Cambia este número por tu WhatsApp (52 + lada + número, sin signos)
const WHATSAPP_NUMBER = "525630902942; // <-- CAMBIA ESTO

let products = []; // se llenará desde products.json

const categories = [
  { id: "todo",               label: "✨ Todo" },
  { id: "figuras-3d",         label: "Figuras 3D" },
  { id: "tablas-tableros",    label: "Tablas & Tableros" },
  { id: "velas-rituales",     label: "Velas & Rituales" },
  { id: "llaveros-detalles",  label: "Llaveros & Detalles" },
  { id: "decoracion",         label: "Decoración esotérica" }
];

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(value);

// =============================
// CARGAR CATALOGO (products.json)
// =============================

async function loadProducts() {
  try {
    const res = await fetch("products.json?_=" + Date.now());
    if (!res.ok) throw new Error("No se pudo leer products.json");
    const data = await res.json();
    products = data;
    renderCategories();
    renderProducts();
    updateCartUI();
  } catch (err) {
    console.error("Error cargando catálogo:", err);
    const grid = document.getElementById("productsGrid");
    if (grid) {
      grid.innerHTML = "<p style='font-size:0.85rem;color:var(--muted);'>No se pudo cargar el catálogo. Revisa el archivo <strong>products.json</strong>.</p>";
    }
  }
}

// =============================
// RENDER CATEGORÍAS
// =============================

const categoriesList = document.getElementById("categoriesList");
const productsGrid = document.getElementById("productsGrid");
let activeCategory = "todo";

function renderCategories() {
  categoriesList.innerHTML = "";
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "category-pill" + (cat.id === activeCategory ? " active" : "");
    btn.textContent = cat.label;
    btn.dataset.categoryId = cat.id;
    btn.addEventListener("click", () => {
      activeCategory = cat.id;
      renderCategories();
      renderProducts();
    });
    categoriesList.appendChild(btn);
  });
}

// =============================
// RENDER PRODUCTOS
// =============================

function renderProducts() {
  productsGrid.innerHTML = "";

  const filtered =
    activeCategory === "todo"
      ? products
      : products.filter((p) => p.category === activeCategory);

  if (!filtered.length) {
    productsGrid.innerHTML = "<p style='font-size:0.85rem;color:var(--muted);'>Aún no hay productos en esta categoría.</p>";
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-img-wrap">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400x400?text=TA3D';" />
        ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ""}
      </div>
      <div class="product-body">
        <div class="product-name">${product.name}</div>
        <div class="product-desc">${product.description || ""}</div>
        <div class="product-meta">
          <div>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="product-size">${product.size || ""}</div>
          </div>
          <div class="badge-small">
            Aprox. 3–5 días de producción
          </div>
        </div>
        <div class="product-actions">
          <button class="btn-add" data-id="${product.id}">
            ➕ Agregar
          </button>
        </div>
      </div>
    `;

    productsGrid.appendChild(card);
  });

  document.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      addToCart(id);
    });
  });
}

// =============================
// CARRITO (LÓGICA)
// =============================

let cart = {}; // { productId: { product, qty } }

const cartTotalLabel = document.getElementById("cartTotalLabel");
const cartItemsLabel = document.getElementById("cartItemsLabel");
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartTotalDetail = document.getElementById("cartTotalDetail");

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  if (!cart[productId]) {
    cart[productId] = { product, qty: 1 };
  } else {
    cart[productId].qty += 1;
  }

  updateCartUI();
}

function changeQty(productId, delta) {
  if (!cart[productId]) return;
  cart[productId].qty += delta;
  if (cart[productId].qty <= 0) {
    delete cart[productId];
  }
  updateCartUI();
}

function removeFromCart(productId) {
  if (cart[productId]) {
    delete cart[productId];
  }
  updateCartUI();
}

function clearCart() {
  cart = {};
  updateCartUI();
}

function getCartSummary() {
  let items = 0;
  let total = 0;
  Object.values(cart).forEach(({ product, qty }) => {
    items += qty;
    total += product.price * qty;
  });
  return { items, total };
}

function updateCartUI() {
  const { items, total } = getCartSummary();

  cartTotalLabel.textContent = formatPrice(total);
  cartItemsLabel.textContent = items === 1 ? "1 artículo" : items + " artículos";
  cartTotalDetail.textContent = formatPrice(total);

  cartItemsContainer.innerHTML = "";

  if (items === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        Tu carrito está vacío.<br />
        Agrega algunas piezas esotéricas para comenzar 🧿
      </div>
    `;
    return;
  }

  Object.values(cart).forEach(({ product, qty }) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-img">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/120x120?text=TA3D';" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${product.name}</div>
        <div style="font-size:0.75rem;color:var(--muted);">${product.size || ""}</div>
        <div class="cart-item-meta">
          <div class="cart-qty-controls">
            <button class="cart-qty-btn" data-id="${product.id}" data-delta="-1">−</button>
            <span>${qty}</span>
            <button class="cart-qty-btn" data-id="${product.id}" data-delta="1">+</button>
          </div>
          <div>
            <div style="font-size:0.78rem;">${formatPrice(product.price * qty)}</div>
            <div class="cart-remove" data-id="${product.id}">Quitar</div>
          </div>
        </div>
      </div>
    `;
    cartItemsContainer.appendChild(row);
  });

  document.querySelectorAll(".cart-qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const delta = parseInt(btn.dataset.delta, 10);
      changeQty(id, delta);
    });
  });

  document.querySelectorAll(".cart-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      removeFromCart(id);
    });
  });
}

// =============================
// MODAL & SCROLL
// =============================

const cartModal = document.getElementById("cartModal");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const whatsappBtn = document.getElementById("whatsappBtn");
const scrollCatalogBtn = document.getElementById("scrollCatalogBtn");

function openCart() {
  cartModal.style.display = "flex";
}

function closeCart() {
  cartModal.style.display = "none";
}

openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);

cartModal.addEventListener("click", (e) => {
  if (e.target === cartModal) {
    closeCart();
  }
});

clearCartBtn.addEventListener("click", () => {
  if (confirm("¿Vaciar todo el carrito?")) {
    clearCart();
  }
});

scrollCatalogBtn.addEventListener("click", () => {
  const section = document.getElementById("catalogo");
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
});

// =============================
// WHATSAPP
// =============================

function buildWhatsAppMessage() {
  const { items, total } = getCartSummary();
  if (items === 0) {
    return "Hola, quiero información sobre el catálogo de Taller Arcano 3D.";
  }

  let msg = "Hola, quiero hacer un pedido en *Taller Arcano 3D*:%0A%0A";
  Object.values(cart).forEach(({ product, qty }) => {
    msg += `• ${product.name} (${product.size || ""}) x ${qty} - ${formatPrice(
      product.price * qty
    )}%0A`;
  });
  msg += `%0ATotal aproximado: *${formatPrice(total)}* MXN%0A`;
  msg += "%0AUbicación: _______%0AForma de pago (efectivo/transferencia): _______%0A";
  msg += "%0A¿Tienes disponibilidad para entrega/envío?";

  return msg;
}

whatsappBtn.addEventListener("click", () => {
  const msg = buildWhatsAppMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  window.open(url, "_blank");
});

// Botón de WhatsApp del header
const headerWhatsappLink = document.getElementById("headerWhatsappLink");
if (headerWhatsappLink) {
  const simpleMsg = "Hola, me interesa el catálogo de Taller Arcano 3D.";
  headerWhatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(simpleMsg)}`;
}

// =============================
// INIT
// =============================

loadProducts();
