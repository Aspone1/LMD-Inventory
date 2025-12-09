const API_BASE_URL = '/api';

let allProducts = [];
let currentFilter = { search: '', category: '' };

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCategories();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    searchInput.addEventListener('input', debounce(() => {
        currentFilter.search = searchInput.value;
        loadProducts();
    }, 300));

    categoryFilter.addEventListener('change', () => {
        currentFilter.category = categoryFilter.value;
        loadProducts();
    });
}

// Load all products
async function loadProducts() {
    try {
        const params = new URLSearchParams();
        if (currentFilter.search) params.append('search', currentFilter.search);
        if (currentFilter.category) params.append('category', currentFilter.category);

        const response = await fetch(`${API_BASE_URL}/products?${params}`);
        allProducts = await response.json();
        
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products');
    }
}

// Load categories for filter
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const categories = await response.json();
        
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Also populate datalists
        updateCategoryDatalist('categoryList', categories);
        updateCategoryDatalist('editCategoryList', categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function updateCategoryDatalist(id, categories) {
    const datalist = document.getElementById(id);
    datalist.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        datalist.appendChild(option);
    });
}

// Display products in table
function displayProducts(products) {
    const loadingState = document.getElementById('loadingState');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    const tbody = document.getElementById('productsTableBody');

    loadingState.classList.add('hidden');

    if (products.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tableContainer.classList.remove('hidden');
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><span class="badge badge-sku">${escapeHtml(product.sku)}</span></td>
            <td><strong>${escapeHtml(product.name)}</strong></td>
            <td>${escapeHtml(product.description || '-')}</td>
            <td>${product.category ? `<span class="badge ${getBadgeClass(product.category)}">${escapeHtml(product.category)}</span>` : '-'}</td>
            <td><span class="price">$${product.price.toFixed(2)}</span></td>
            <td>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="changeQuantity(${product.id}, -1)">-</button>
                    <span class="quantity-value ${getStockClass(product.quantity)}">${product.quantity}</span>
                    <button class="quantity-btn" onclick="changeQuantity(${product.id}, 1)">+</button>
                </div>
            </td>
            <td>
                <div class="actions">
                    <button class="btn btn-primary btn-sm" onclick="openEditModal(${product.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Get badge class based on category
function getBadgeClass(category) {
    if (category.includes('Hardware')) return 'badge-hardware';
    if (category.includes('License')) return 'badge-license';
    return 'badge-sku';
}

// Get stock level class for styling
function getStockClass(quantity) {
    if (quantity === 0) return 'stock-low';
    if (quantity < 20) return 'stock-medium';
    return 'stock-high';
}

// Change product quantity
async function changeQuantity(productId, delta) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const newQuantity = Math.max(0, product.quantity + delta);
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQuantity })
        });

        if (response.ok) {
            await loadProducts();
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to update quantity');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showError('Failed to update quantity');
    }
}

// Modal functions
function openAddModal() {
    document.getElementById('addProductModal').classList.add('active');
}

function closeAddModal() {
    document.getElementById('addProductModal').classList.remove('active');
    document.getElementById('addProductForm').reset();
    document.getElementById('addProductError').classList.add('hidden');
}

function openEditModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductSKU').value = product.sku;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductQuantity').value = product.quantity;

    document.getElementById('editProductModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editProductModal').classList.remove('active');
    document.getElementById('editProductForm').reset();
    document.getElementById('editProductError').classList.add('hidden');
}

// Add new product
async function addProduct() {
    const name = document.getElementById('productName').value;
    const sku = document.getElementById('productSKU').value;
    const description = document.getElementById('productDescription').value;
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);

    const errorDiv = document.getElementById('addProductError');
    errorDiv.classList.add('hidden');

    if (!name || !sku || isNaN(price) || isNaN(quantity)) {
        errorDiv.textContent = 'Please fill in all required fields';
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, sku, description, category, price, quantity })
        });

        if (response.ok) {
            closeAddModal();
            await loadProducts();
            await loadCategories();
            showSuccess('Product added successfully');
        } else {
            const error = await response.json();
            errorDiv.textContent = error.error || 'Failed to add product';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        errorDiv.textContent = 'Failed to add product';
        errorDiv.classList.remove('hidden');
    }
}

// Update product
async function updateProduct() {
    const id = parseInt(document.getElementById('editProductId').value);
    const name = document.getElementById('editProductName').value;
    const sku = document.getElementById('editProductSKU').value;
    const description = document.getElementById('editProductDescription').value;
    const category = document.getElementById('editProductCategory').value;
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const quantity = parseInt(document.getElementById('editProductQuantity').value);

    const errorDiv = document.getElementById('editProductError');
    errorDiv.classList.add('hidden');

    if (!name || !sku || isNaN(price) || isNaN(quantity)) {
        errorDiv.textContent = 'Please fill in all required fields';
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, sku, description, category, price, quantity })
        });

        if (response.ok) {
            closeEditModal();
            await loadProducts();
            await loadCategories();
            showSuccess('Product updated successfully');
        } else {
            const error = await response.json();
            errorDiv.textContent = error.error || 'Failed to update product';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        errorDiv.textContent = 'Failed to update product';
        errorDiv.classList.remove('hidden');
    }
}

// Delete product
async function deleteProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadProducts();
            await loadCategories();
            showSuccess('Product deleted successfully');
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Failed to delete product');
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showSuccess(message) {
    alert('✓ ' + message);
}

function showError(message) {
    alert('✗ Error: ' + message);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('addProductModal');
    const editModal = document.getElementById('editProductModal');
    
    if (event.target === addModal) {
        closeAddModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
}
