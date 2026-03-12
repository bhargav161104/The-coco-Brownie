// Helper to get formatted price
const formatPrice = (price) => {
  return `₹${price}`;
};

// Fetch products from backend
const fetchProducts = async () => {
  try {
    const response = await fetch('/api/products');
    const data = await response.json();
    window.productData.products = data;
    return data;
  } catch (error) {
    console.error('Error fetching products from backend:', error);
    return [];
  }
};

// Expose to global window object
window.productData = {
  products: [],
  formatPrice,
  fetchProducts
};
