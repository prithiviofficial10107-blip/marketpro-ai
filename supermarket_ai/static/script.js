let products = [];
let billingItems = [];
let meta = { categories: [], suppliers: [] };
let chartInstances = [];

function clearChartInstances() {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances = [];
}

function showBillingMessage(message, type = 'info') {
  const messageBox = document.getElementById('billingMessage');
  messageBox.className = `alert alert-${type}`;
  messageBox.textContent = message;
}

async function loadMeta() {
  const response = await fetch('/api/meta');
  meta = await response.json();
  populateSelects();
}

function populateSelects() {
  const categorySelect = document.getElementById('productCategory');
  const supplierSelect = document.getElementById('productSupplier');
  const billingProduct = document.getElementById('billingProduct');

  categorySelect.innerHTML = meta.categories.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  supplierSelect.innerHTML = meta.suppliers.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');

  billingProduct.innerHTML = products.map((product) => `<option value="${product.id}">${product.name} - ${product.price}</option>`).join('');
}

async function loadDashboard() {
  const response = await fetch('/api/dashboard');
  const data = await response.json();
  document.getElementById('totalProducts').textContent = data.total_products;
  document.getElementById('totalCategories').textContent = data.total_categories;
  document.getElementById('totalStock').textContent = data.total_stock;
  document.getElementById('lowStockProducts').textContent = data.low_stock_products;
  document.getElementById('todaysSales').textContent = data.todays_sales;
  document.getElementById('totalRevenue').textContent = data.total_revenue;
}

async function loadProducts(search = '') {
  const response = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
  products = await response.json();
  renderProducts();
  populateSelects();
}

function renderProducts() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = products.map((product) => `
    <tr>
      <td>${product.name}</td>
      <td>${product.category_name || '-'}</td>
      <td>${product.price}</td>
      <td>${product.stock_quantity}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${product.id})">Edit</button>
        <button class="btn btn-sm btn-outline-danger me-1" onclick="deleteProduct(${product.id})">Delete</button>
        <button class="btn btn-sm btn-outline-success me-1" onclick="changeStock(${product.id}, 'increase')">+ Stock</button>
        <button class="btn btn-sm btn-outline-warning" onclick="changeStock(${product.id}, 'decrease')">- Stock</button>
      </td>
    </tr>
  `).join('');
}

function editProduct(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category_id || '';
  document.getElementById('productSupplier').value = product.supplier_id || '';
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productBarcode').value = product.barcode || '';
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productStock').value = product.stock_quantity || 0;
}

async function deleteProduct(productId) {
  const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
  const data = await response.json();
  if (data.success) {
    await loadProducts();
    await loadDashboard();
  }
}

async function changeStock(productId, action) {
  const quantity = Number(prompt('Enter quantity', '1'));
  if (!quantity) return;
  const response = await fetch('/api/stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, action, quantity })
  });
  const data = await response.json();
  if (data.success) {
    await loadProducts();
    await loadDashboard();
  }
}

async function handleProductSubmit(event) {
  event.preventDefault();
  const productId = document.getElementById('productId').value;
  const payload = {
    name: document.getElementById('productName').value,
    category_id: Number(document.getElementById('productCategory').value),
    supplier_id: Number(document.getElementById('productSupplier').value),
    price: Number(document.getElementById('productPrice').value),
    stock_quantity: Number(document.getElementById('productStock').value || 0),
    barcode: document.getElementById('productBarcode').value,
    description: document.getElementById('productDescription').value,
  };

  const url = productId ? `/api/products/${productId}` : '/api/products';
  const method = productId ? 'PUT' : 'POST';
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (data.success) {
    document.getElementById('productForm').reset();
    await loadProducts();
    await loadDashboard();
  }
}

function addBillingItem() {
  const productId = Number(document.getElementById('billingProduct').value);
  const quantity = Number(document.getElementById('billingQuantity').value || 1);
  const product = products.find((item) => item.id === productId);
  if (!product) {
    showBillingMessage('Please select a valid product.', 'warning');
    return;
  }
  if (quantity <= 0) {
    showBillingMessage('Quantity must be at least 1.', 'warning');
    return;
  }
  const existingItem = billingItems.find((item) => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    billingItems.push({ productId, name: product.name, quantity, price: Number(product.price) });
  }
  renderBillingItems();
  showBillingMessage('Item added to bill.', 'success');
}

function renderBillingItems() {
  const list = document.getElementById('billItems');
  const totalLabel = document.getElementById('billTotal');
  const totalValue = billingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalLabel.textContent = totalValue.toFixed(2);
  list.innerHTML = billingItems.map((item) => `
    <li class="list-group-item d-flex justify-content-between">
      <span>${item.name} x ${item.quantity}</span>
      <span>${(item.price * item.quantity).toFixed(2)}</span>
    </li>
  `).join('');
}

async function generateBill() {
  if (!billingItems.length) {
    showBillingMessage('Add at least one item to generate a bill.', 'warning');
    return;
  }
  const response = await fetch('/api/billing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: 1, employee_id: 1, items: billingItems.map((item) => ({ product_id: item.productId, quantity: item.quantity })) })
  });
  const result = await response.json();
  if (result.success) {
    showBillingMessage(`Bill generated successfully. Sale ID: ${result.sale_id} | Total: ${result.total_amount}`, 'success');
    billingItems = [];
    renderBillingItems();
    await loadProducts();
    await loadDashboard();
  } else {
    showBillingMessage(result.message || 'Billing failed.', 'danger');
  }
}

async function askAI() {
  const question = document.getElementById('aiQuestion').value.trim();
  if (!question) {
    document.getElementById('aiAnswer').textContent = 'Please enter a question for the AI assistant.';
    return;
  }
  const response = await fetch(`/api/ai?question=${encodeURIComponent(question)}`);
  const result = await response.json();
  document.getElementById('aiAnswer').textContent = result.answer;
}

async function loadCharts() {
  const response = await fetch('/api/charts');
  const data = await response.json();
  clearChartInstances();
  const stockCtx = document.getElementById('stockChart');
  const salesCtx = document.getElementById('salesChart');
  const topProductsCtx = document.getElementById('topProductsChart');

  chartInstances.push(new Chart(stockCtx, {
    type: 'bar',
    data: {
      labels: data.stock_by_category.map((item) => item.category),
      datasets: [{ label: 'Stock', data: data.stock_by_category.map((item) => item.stock), backgroundColor: '#2563eb' }]
    },
    options: { responsive: true }
  }));

  chartInstances.push(new Chart(salesCtx, {
    type: 'line',
    data: {
      labels: data.monthly_sales.map((item) => item.month),
      datasets: [{ label: 'Revenue', data: data.monthly_sales.map((item) => item.revenue), borderColor: '#22c55e', fill: false }]
    },
    options: { responsive: true }
  }));

  chartInstances.push(new Chart(topProductsCtx, {
    type: 'doughnut',
    data: {
      labels: data.top_products.map((item) => item.product),
      datasets: [{ data: data.top_products.map((item) => item.total_units), backgroundColor: ['#2563eb', '#60a5fa', '#22c55e', '#f59e0b', '#ef4444'] }]
    },
    options: { responsive: true }
  }));
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const button = document.getElementById('themeToggle');
  button.textContent = document.body.classList.contains('dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
}

document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
document.getElementById('productSearch').addEventListener('input', (event) => loadProducts(event.target.value));
document.getElementById('addBillingItem').addEventListener('click', addBillingItem);
document.getElementById('generateBill').addEventListener('click', generateBill);
document.getElementById('askAI').addEventListener('click', askAI);

window.addEventListener('DOMContentLoaded', async () => {
  await loadMeta();
  await loadDashboard();
  await loadProducts();
  await loadCharts();
});
