const STORAGE_KEY = "enze_added_products_v1";

const $ = (id) => document.getElementById(id);

let selectedImages = [];

function getProducts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function showMessage(message, success = true) {
  const box = $("message");
  box.textContent = message;
  box.className =
    "mt-5 rounded-2xl p-4 text-sm " +
    (success
      ? "bg-green-50 text-green-800 border border-green-200"
      : "bg-red-50 text-red-800 border border-red-200");
  box.classList.remove("hidden");
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose image files only."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");

        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };

      img.onerror = () => reject(new Error("Could not read the image."));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {
  const grid = $("imagePreviewGrid");

  if (!selectedImages.length) {
    grid.innerHTML = "";
    $("selectedFile").textContent = "No photos selected";
    return;
  }

  $("selectedFile").textContent =
    `${selectedImages.length} photo${selectedImages.length === 1 ? "" : "s"} selected`;

  grid.innerHTML = selectedImages.map((src, index) => `
    <div class="relative">
      <img src="${src}" class="preview w-full rounded-xl border" alt="Product photo ${index + 1}">
      <button type="button"
        data-remove-image="${index}"
        class="absolute top-1 right-1 bg-black/70 text-white rounded-full w-7 h-7 text-sm">
        ×
      </button>
      ${index === 0 ? '<span class="absolute bottom-1 left-1 bg-purple-700 text-white text-[10px] px-2 py-1 rounded-full">Main</span>' : ''}
    </div>
  `).join("");

  grid.querySelectorAll("[data-remove-image]").forEach(button => {
    button.addEventListener("click", () => {
      selectedImages.splice(Number(button.dataset.removeImage), 1);
      renderImagePreviews();
    });
  });
}

$("choosePhoto").addEventListener("click", () => {
  $("image").click();
});

$("image").addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []);

  if (!files.length) return;

  try {
    const newImages = [];

    for (const file of files) {
      newImages.push(await compressImage(file));
    }

    selectedImages = [...selectedImages, ...newImages];
    renderImagePreviews();

    // Allows the same photo to be selected again later.
    event.target.value = "";
  } catch (error) {
    showMessage(error.message || "Could not read the selected images.", false);
  }
});

$("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedImages.length) {
    showMessage("Please choose at least one product photo.", false);
    return;
  }

  try {
    const price = Number($("price").value);
    const originalPrice = Number($("originalPrice").value || price);

    const product = {
      id: "enze-" + Date.now(),
      name: $("name").value.trim(),
      category: $("category").value,
      price,
      originalPrice,
      rating: Number($("rating").value || 4.5),

      // First image remains compatible with the current store.
      image: selectedImages[0],

      // All selected images are also saved for future product galleries.
      images: selectedImages,

      description: $("description").value.trim(),
      stock: Number($("stock").value || 0),
      featured: $("featured").checked,
      deal: $("deal").checked,
      createdAt: new Date().toISOString()
    };

    if (!product.name || !product.category || price < 0) {
      showMessage("Please complete the required fields.", false);
      return;
    }

    const products = getProducts();
    products.unshift(product);

    try {
      saveProducts(products);
    } catch {
      showMessage(
        "Storage is full. Try fewer photos or smaller photos.",
        false
      );
      return;
    }

    $("productForm").reset();
    $("rating").value = "4.5";
    $("stock").value = "10";

    selectedImages = [];
    renderImagePreviews();

    renderProducts();
    showMessage(`✅ Product added with ${product.images.length} photo${product.images.length === 1 ? "" : "s"}!`);
  } catch (error) {
    showMessage(error.message || "Could not add product.", false);
  }
});

function renderProducts() {
  const list = $("productList");
  const products = getProducts();

  if (!products.length) {
    list.innerHTML = '<p class="text-sm text-gray-500">No products added yet.</p>';
    return;
  }

  list.innerHTML = products.map(product => {
    const count = Array.isArray(product.images)
      ? product.images.length
      : (product.image ? 1 : 0);

    return `
      <div class="flex gap-3 items-center border rounded-2xl p-3">
        <img src="${product.image}" class="w-16 h-16 rounded-xl object-cover" alt="">
        <div class="flex-1 min-w-0">
          <div class="font-bold text-sm truncate">${escapeHtml(product.name)}</div>
          <div class="text-xs text-gray-500">
            ${escapeHtml(product.category)} · ₹${product.price} · ${count} photo${count === 1 ? "" : "s"}
          </div>
        </div>
        <button data-delete="${product.id}"
          class="text-xs font-bold text-red-600 px-3 py-2 rounded-full bg-red-50">
          Delete
        </button>
      </div>
    `;
  }).join("");

  list.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      const remaining = getProducts().filter(
        product => String(product.id) !== String(id)
      );

      saveProducts(remaining);
      renderProducts();
      showMessage("Product deleted.");
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

$("clearAll").addEventListener("click", () => {
  if (!getProducts().length) return;

  if (!confirm("Delete all products?")) return;

  localStorage.removeItem(STORAGE_KEY);
  selectedImages = [];
  renderImagePreviews();
  renderProducts();
  showMessage("All products deleted.");
});

renderProducts();
