(function () {
  const STORAGE_KEY = "enze_added_products_v1";

  function loadAddedProducts() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
    } catch {
      return [];
    }
  }

  function sync() {
    const added = loadAddedProducts();

    if (
      !added.length ||
      typeof products === "undefined"
    ) {
      return;
    }

    const existingIds =
      new Set(
        products.map(p => String(p.id))
      );

    added.reverse().forEach(product => {

      if (
        !existingIds.has(
          String(product.id)
        )
      ) {
        products.push(product);
      }

    });

    if (
      typeof handleSearch === "function"
    ) {
      handleSearch();

    } else if (
      typeof renderProducts === "function"
    ) {
      renderProducts(products);
    }
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      sync
    );
  } else {
    sync();
  }

})();
