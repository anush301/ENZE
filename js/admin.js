const STORAGE_KEY = "enze_added_products_v1";

const $ = (id) => document.getElementById(id);

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
      reject(new Error("Please choose an image."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxSize = 900;
        const scale = Math.min(
          1,
          maxSize / Math.max(img.width, img.height)
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(
          canvas.toDataURL("image/jpeg", 0.78)
        );
      };

      img.onerror = () => {
        reject(new Error("Could not read the image."));
      };

      img.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("Could not read the file."));
    };

    reader.readAsDataURL(file);
  });
}


/* Gallery / Files button */

$("choosePhoto").addEventListener("click", () => {
  $("image").click();
});


/* Photo selected */

$("image").addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  $("selectedFile").textContent =
    "Selected: " + file.name;

  try {
    const image = await compressImage(file);

    $("imagePreview").src = image;
    $("imagePreviewWrap").classList.remove("hidden");

  } catch (error) {
    showMessage(error.message, false);
  }
});


/* Add Product */

$("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = $("image").files[0];

  if (!file) {
    showMessage(
      "Please choose a product photo.",
      false
    );
    return;
  }

  try {

    const image = await compressImage(file);

    const price =
      Number($("price").value);

    const originalPrice =
      Number(
        $("originalPrice").value || price
      );

    const product = {

      id: "enze-" + Date.now(),

      name:
        $("name").value.trim(),

      category:
        $("category").value,

      price: price,

      originalPrice:
        originalPrice,

      rating:
        Number(
          $("rating").value || 4.5
        ),

      image: image,

      description:
        $("description").value.trim(),

      stock:
        Number(
          $("stock").value || 0
        ),

      featured:
        $("featured").checked,

      deal:
        $("deal").checked,

      createdAt:
        new Date().toISOString()
    };


    if (
      !product.name ||
      !product.category ||
      price < 0
    ) {
      showMessage(
        "Please complete the required fields.",
        false
      );
      return;
    }


    const products = getProducts();

    products.unshift(product);

    try {

      saveProducts(products);

    } catch {

      showMessage(
        "Storage is full. Try a smaller image.",
        false
      );

      return;
    }


    $("productForm").reset();

    $("rating").value = "4.5";

    $("stock").value = "10";

    $("imagePreviewWrap")
      .classList.add("hidden");

    $("imagePreview")
      .removeAttribute("src");

    $("selectedFile").textContent =
      "No photo selected";


    renderProducts();

    showMessage(
      "✅ Product added successfully!"
    );

  } catch (error) {

    showMessage(
      error.message ||
      "Could not add product.",
      false
    );
  }
});


/* Show products */

function renderProducts() {

  const list =
    $("productList");

  const products =
    getProducts();


  if (!products.length) {

    list.innerHTML =
      '<p class="text-sm text-gray-500">' +
      "No products added yet." +
      "</p>";

    return;
  }


  list.innerHTML =
    products.map(product => `

      <div class="flex gap-3 items-center border rounded-2xl p-3">

        <img
          src="${product.image}"
          class="w-16 h-16 rounded-xl object-cover"
          alt=""
        >

        <div class="flex-1 min-w-0">

          <div class="font-bold text-sm truncate">
            ${product.name}
          </div>

          <div class="text-xs text-gray-500">
            ${product.category}
            · ₹${product.price}
          </div>

        </div>

        <button
          data-delete="${product.id}"
          class="text-xs font-bold text-red-600
                 px-3 py-2 rounded-full bg-red-50">
          Delete
        </button>

      </div>

    `).join("");


  list
    .querySelectorAll("[data-delete]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.delete;

          const remaining =
            getProducts().filter(
              product =>
                String(product.id) !==
                String(id)
            );

          saveProducts(remaining);

          renderProducts();

          showMessage(
            "Product deleted."
          );
        }
      );

    });
}


/* Delete all */

$("clearAll").addEventListener(
  "click",
  () => {

    if (!getProducts().length)
      return;

    if (
      !confirm(
        "Delete all products?"
      )
    )
      return;

    localStorage.removeItem(
      STORAGE_KEY
    );

    renderProducts();

    showMessage(
      "All products deleted."
    );
  }
);


renderProducts();
