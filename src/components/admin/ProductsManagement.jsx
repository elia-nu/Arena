import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { shopAPI, mediaAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import Pagination from "./Pagination";

const PRODUCT_IMAGE_BASE = "https://api.leskickit.com";

const resolveProductImageUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return `${PRODUCT_IMAGE_BASE}${url}`;
  return url;
};
import {
  IoAdd,
  IoTrash,
  IoCreate,
  IoSearch,
  IoGrid,
  IoList,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoStar,
  IoStarOutline,
  IoImage,
  IoCloudUpload,
  IoLink,
} from "react-icons/io5";

const ProductsManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({ category: "all", status: "all" });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "apparel",
    price: "",
    originalPrice: "",
    stock: "",
    sku: "",
    status: "active",
    featured: false,
    images: [],
    tags: [],
    promotion: {
      active: false,
      discountType: "percentage",
      discountValue: "",
      startDate: "",
      endDate: "",
    },
  });
  const [imageInputMode, setImageInputMode] = useState("upload"); // "upload" or "url"
  const [imagePreviews, setImagePreviews] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [filter, searchQuery, currentPage, itemsPerPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        status: filter.status === "all" ? undefined : filter.status,
        page: currentPage,
        limit: itemsPerPage,
      };
      if (filter.category !== "all") params.category = filter.category;
      if (searchQuery) params.search = searchQuery;

      const response = await shopAPI.getProducts(params);
      setProducts(response.products || []);
      setTotalItems(response.total || response.products?.length || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
      showError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : undefined,
        stock: parseInt(formData.stock),
        promotion: formData.promotion.active
          ? {
              ...formData.promotion,
              discountValue: parseFloat(formData.promotion.discountValue),
              startDate: formData.promotion.startDate
                ? new Date(formData.promotion.startDate)
                : undefined,
              endDate: formData.promotion.endDate
                ? new Date(formData.promotion.endDate)
                : undefined,
            }
          : undefined,
      };

      if (editingProduct) {
        await shopAPI.updateProduct(editingProduct._id, productData);
        showSuccess("Product updated successfully");
      } else {
        await shopAPI.createProduct(productData);
        showSuccess("Product created successfully");
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      setCurrentPage(1);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      showError(error.message || "Failed to save product");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await shopAPI.deleteProduct(id);
      showSuccess("Product deleted successfully");
      setCurrentPage(1);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      showError("Failed to delete product");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      showError("Please select products");
      return;
    }

    try {
      const updates = {};
      if (action === "activate") updates.status = "active";
      if (action === "deactivate") updates.status = "inactive";
      if (action === "feature") updates.featured = true;
      if (action === "unfeature") updates.featured = false;

      await shopAPI.bulkUpdateProducts(
        selectedProducts.map((p) => p._id),
        updates
      );
      showSuccess("Products updated successfully");
      setSelectedProducts([]);
      setCurrentPage(1);
      fetchProducts();
    } catch (error) {
      console.error("Error updating products:", error);
      showError("Failed to update products");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "apparel",
      price: "",
      originalPrice: "",
      stock: "",
      sku: "",
      status: "active",
      featured: false,
      images: [],
      tags: [],
      promotion: {
        active: false,
        discountType: "percentage",
        discountValue: "",
        startDate: "",
        endDate: "",
      },
    });
    setImagePreviews([]);
    setImageInputMode("upload");
    setUrlInput("");
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const images = product.images || [];
    setFormData({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "apparel",
      price: product.price || "",
      originalPrice: product.originalPrice || "",
      stock: product.stock || "",
      sku: product.sku || "",
      status: product.status || "active",
      featured: product.featured || false,
      images: images,
      tags: product.tags || [],
      promotion: product.promotion || {
        active: false,
        discountType: "percentage",
        discountValue: "",
        startDate: "",
        endDate: "",
      },
    });
    // Set previews for existing images
    setImagePreviews(
      images.map((url) => ({
        url: resolveProductImageUrl(url) || url,
        isUploaded: url.startsWith("/uploads/"),
      })),
    );
    setImageInputMode(
      images.length > 0 && images.some((url) => !url.startsWith("/uploads/"))
        ? "url"
        : "upload",
    );
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = [];
    const newImages = [];

    try {
      setUploadingImages(true);

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          showError(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          showError(`${file.name} is too large. Maximum size is 5MB`);
          continue;
        }

        const result = await mediaAPI.uploadImage(file);
        if (!result?.url) {
          throw new Error(`Upload succeeded but no URL was returned for ${file.name}`);
        }

        const displayUrl = resolveProductImageUrl(result.url) || result.url;
        newPreviews.push({ url: displayUrl, isUploaded: true });
        newImages.push(result.url);
      }

      if (newImages.length > 0) {
        setImagePreviews([...imagePreviews, ...newPreviews]);
        setFormData({
          ...formData,
          images: [...formData.images, ...newImages],
        });
        showSuccess(`${newImages.length} image(s) uploaded to server`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showError(error.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleImageUrlAdd = (url) => {
    if (!url || !url.trim()) return;
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://") && !trimmedUrl.startsWith("data:")) {
      showError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    
    const newImages = [...formData.images, trimmedUrl];
    const newPreviews = [...imagePreviews, { url: trimmedUrl, isUploaded: false }];
    
    setFormData({ ...formData, images: newImages });
    setImagePreviews(newPreviews);
    setUrlInput("");
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
    setImagePreviews(newPreviews);
  };

  const toggleSelect = (product) => {
    setSelectedProducts((prev) =>
      prev.find((p) => p._id === product._id)
        ? prev.filter((p) => p._id !== product._id)
        : [...prev, product]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-secondary-600 mb-2">
        Products Management
      </h2>
      <p className="text-primary-700">
            Manage your product catalog, pricing, and inventory
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="px-6 py-3 bg-secondary-500 text-white text-sm font-medium hover:bg-secondary-600 transition-colors inline-flex items-center gap-2"
        >
          <IoAdd className="text-lg" />
          Add Product
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
            />
          </div>
          <select
            value={filter.category}
            onChange={(e) => {
              setFilter({ ...filter, category: e.target.value });
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
          >
            <option value="all">All Categories</option>
            <option value="apparel">Apparel</option>
            <option value="accessories">Accessories</option>
            <option value="equipment">Equipment</option>
          </select>
          <select
            value={filter.status}
            onChange={(e) => {
              setFilter({ ...filter, status: e.target.value });
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2 pt-4 border-t border-primary-200">
            <span className="text-sm text-primary-600">
              {selectedProducts.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("activate")}
                className="px-3 py-1 text-xs bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="px-3 py-1 text-xs bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction("feature")}
                className="px-3 py-1 text-xs bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
              >
                Feature
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                className="px-3 py-1 text-xs border border-primary-300 text-primary-700 hover:border-primary-950 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-950 rounded-full animate-spin" />
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-100 border-b border-primary-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.length === products.length &&
                        products.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...products]);
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b border-primary-200 hover:bg-primary-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.some(
                          (p) => p._id === product._id
                        )}
                        onChange={() => toggleSelect(product)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            resolveProductImageUrl(product.images?.[0]) ||
                            "/placeholder-product.jpg"
                          }
                          alt={product.name}
                          className="w-12 h-12 object-cover border border-primary-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-primary-950">
                              {product.name}
                            </p>
                            {product.featured && (
                              <IoStar className="text-tertiary-500" />
                            )}
                          </div>
                          <p className="text-xs text-primary-600">
                            SKU: {product.sku || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-primary-700 capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-primary-950">
                          ${(product.finalPrice || product.price).toFixed(2)}
                        </p>
                        {product.originalPrice &&
                          product.originalPrice > product.price && (
                            <p className="text-xs text-primary-400 line-through">
                              ${product.originalPrice.toFixed(2)}
                            </p>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          product.stock < 10
                            ? "text-red-600"
                            : product.stock < 50
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          product.status === "active"
                            ? "bg-green-100 text-green-700"
                            : product.status === "inactive"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-primary-600 hover:text-primary-950 transition-colors"
                          title="Edit"
                        >
                          <IoCreate className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <IoTrash className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-primary-600">No products found</p>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage)}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-primary-950/50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white border-2 border-primary-200 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-secondary-600">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="text-primary-400 hover:text-primary-950"
              >
                <IoCloseCircle className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  >
                    <option value="apparel">Apparel</option>
                    <option value="accessories">Accessories</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Original Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, originalPrice: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="featured"
                    className="text-sm font-medium text-primary-700"
                  >
                    Featured Product
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                />
              </div>

              {/* Images Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-primary-700">
                    Product Images
                  </label>
                  <div className="flex items-center gap-2 border border-secondary-200 bg-secondary-50 p-1 rounded">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("upload")}
                      className={`px-3 py-1 text-xs transition-colors flex items-center gap-1 ${
                        imageInputMode === "upload"
                          ? "bg-secondary-200 text-primary-950"
                          : "text-primary-600 hover:text-primary-950"
                      }`}
                    >
                      <IoCloudUpload className="text-sm" />
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("url")}
                      className={`px-3 py-1 text-xs transition-colors flex items-center gap-1 ${
                        imageInputMode === "url"
                          ? "bg-secondary-200 text-primary-950"
                          : "text-primary-600 hover:text-primary-950"
                      }`}
                    >
                      <IoLink className="text-sm" />
                      URL
                    </button>
                  </div>
                </div>

                {imageInputMode === "upload" ? (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center hover:border-secondary-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={uploadingImages}
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <IoImage className="text-4xl text-secondary-500" />
                        <span className="text-sm text-primary-700">
                          {uploadingImages
                            ? "Uploading to server..."
                            : "Click to upload images or drag and drop"}
                        </span>
                        <span className="text-xs text-primary-500">
                          PNG, JPG, GIF up to 5MB each
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-2 border border-primary-300 focus:border-secondary-500 outline-none bg-transparent"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleImageUrlAdd(urlInput);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleImageUrlAdd(urlInput)}
                        className="px-4 py-2 bg-secondary-500 text-white text-sm hover:bg-secondary-600 transition-colors"
                      >
                        Add URL
                      </button>
                    </div>
                    <p className="text-xs text-primary-500">
                      Enter image URL and press Enter or click Add URL
                    </p>
                  </div>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-primary-600 mb-2">
                      {imagePreviews.length} image{imagePreviews.length !== 1 ? "s" : ""} added
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="relative group border border-secondary-200 rounded-lg overflow-hidden bg-primary-50"
                        >
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              e.target.src = "/placeholder-product.jpg";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove image"
                          >
                            <IoCloseCircle className="text-lg" />
                          </button>
                          {preview.isUploaded && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-secondary-500 text-primary-950 text-xs rounded">
                              On server
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Promotion Section */}
              <div className="border-t border-primary-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="promotion"
                    checked={formData.promotion.active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        promotion: {
                          ...formData.promotion,
                          active: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="promotion"
                    className="text-sm font-medium text-primary-700"
                  >
                    Enable Promotion
                  </label>
                </div>

                {formData.promotion.active && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-2">
                        Discount Type
                      </label>
                      <select
                        value={formData.promotion.discountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            promotion: {
                              ...formData.promotion,
                              discountType: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-2">
                        Discount Value
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.promotion.discountValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            promotion: {
                              ...formData.promotion,
                              discountValue: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.promotion.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            promotion: {
                              ...formData.promotion,
                              startDate: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.promotion.endDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            promotion: {
                              ...formData.promotion,
                              endDate: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-primary-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-primary-300 text-primary-700 hover:border-primary-950 hover:text-primary-950 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-secondary-500 text-white font-medium hover:bg-secondary-600 transition-colors"
                >
                  {editingProduct ? "Update" : "Create"} Product
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;
