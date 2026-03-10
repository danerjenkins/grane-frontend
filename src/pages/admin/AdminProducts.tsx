import { useEffect, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import {
  listProducts,
  createProduct,
  updateProduct,
  removeProduct,
} from '../../api/admin/productsAdmin';
import type { Product } from '../../api/admin/types';

interface ProductFormData {
  name: string;
  price: string;
  cost_to_make: string;
  image_url: string;
  description: string;
  available: boolean;
}

type ModalMode = 'create' | 'edit' | null;

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    cost_to_make: '',
    image_url: '',
    description: '',
    available: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) {
          setDeleteConfirm(null);
        } else if (modalMode) {
          setModalMode(null);
          setEditingProduct(null);
          setFormError(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modalMode, deleteConfirm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await listProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingProduct(null);
    setFormError(null);
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      price: '',
      cost_to_make: '',
      image_url: '',
      description: '',
      available: true,
    });
    setEditingProduct(null);
    setModalMode('create');
    setFormError(null);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      cost_to_make: product.cost_to_make?.toString() || '',
      image_url: product.image_url || '',
      description: product.description || '',
      available: product.available,
    });
    setEditingProduct(product);
    setModalMode('edit');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('Price must be greater than 0');
      }

      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        cost_to_make: formData.cost_to_make ? parseFloat(formData.cost_to_make) : null,
        image_url: formData.image_url.trim() || null,
        description: formData.description.trim() || null,
        available: formData.available,
      };

      if (modalMode === 'create') {
        await createProduct(payload);
        setSuccessMessage('Product created successfully!');
      } else if (modalMode === 'edit' && editingProduct) {
        await updateProduct(editingProduct.id, payload);
        setSuccessMessage('Product updated successfully!');
      }

      await loadProducts();
      closeModal();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    setDeleteConfirm(product.id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await removeProduct(deleteConfirm);
      setSuccessMessage('Product deleted successfully!');
      await loadProducts();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <main className="bg-muted px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="banner banner-success mb-6">
            {successMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-4xl font-bold text">Products</h1>
          <button
            onClick={openCreateModal}
            className="btn-primary-lg"
          >
            + New Product
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base"
          />
        </div>

        {/* Table */}
        <div className="table-shell">
          {loading ? (
            <div className="p-8 text-center text-secondary">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-secondary">
              {searchQuery
                ? 'No products match your search.'
                : 'No products yet. Create one to get started!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="table-head-cell">
                      Image
                    </th>
                    <th className="table-head-cell">
                      Name
                    </th>
                    <th className="table-head-cell">
                      Price
                    </th>
                    <th className="table-head-cell">
                      Cost
                    </th>
                    <th className="table-head-cell text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="placeholder-tile">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-secondary mt-1 line-clamp-2">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-secondary">
                        {product.cost_to_make !== null
                          ? `$${product.cost_to_make.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="btn-muted inline-flex items-center gap-1"
                            title="Edit product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="btn-danger-soft inline-flex items-center gap-1"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalMode && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-2xl font-bold text">
                {modalMode === 'create' ? 'Create New Product' : 'Edit Product'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                  <div className="banner banner-error mb-4">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-secondary mb-1">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-base"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-semibold text-secondary mb-1"
                  >
                    Price <span className="text-danger">*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-base"
                    required
                  />
                </div>

                {/* Cost to Make */}
                <div>
                  <label
                    htmlFor="cost_to_make"
                    className="block text-sm font-semibold text-secondary mb-1"
                  >
                    Cost to Make
                  </label>
                  <input
                    id="cost_to_make"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_to_make}
                    onChange={(e) => setFormData({ ...formData, cost_to_make: e.target.value })}
                    className="input-base"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label
                    htmlFor="image_url"
                    className="block text-sm font-semibold text-secondary mb-1"
                  >
                    Image URL
                  </label>
                  <input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="input-base"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold text-secondary mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="input-base"
                  />
                </div>

                {/* Available Checkbox */}
                <div className="flex items-center">
                  <input
                    id="available"
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="input-check"
                  />
                  <label htmlFor="available" className="ml-2 text-sm font-medium text-secondary">
                    Available for purchase
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formLoading}
                  className="btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm(null);
          }}
        >
          <div className="modal-panel max-w-md w-full p-6">
            <h3 className="text-xl font-bold text mb-4">Confirm Delete</h3>
            <p className="text-secondary mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
