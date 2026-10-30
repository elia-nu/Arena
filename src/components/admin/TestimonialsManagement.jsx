import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  IoAdd,
  IoPencil,
  IoTrash,
  IoEye,
  IoEyeOff,
  IoStar,
  IoImage,
  IoClose,
  IoCheckmark,
  IoCloudUpload,
} from "react-icons/io5";
import { testimonialAPI, mediaAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import Pagination from "./Pagination";

const TestimonialsManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    quote: "",
    rating: 5,
    avatar: "",
    status: "published",
    displayOrder: 0,
  });

  useEffect(() => {
    fetchTestimonials();
  }, [filter]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? { status: filter } : {};
      const data = await testimonialAPI.getAllAdmin(params);
      setTestimonials(data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      showError("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTestimonial) {
        await testimonialAPI.update(editingTestimonial._id, formData);
        showSuccess("Testimonial updated successfully");
      } else {
        await testimonialAPI.create(formData);
        showSuccess("Testimonial created successfully");
      }
      setShowModal(false);
      resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error("Error saving testimonial:", error);
      showError(error.message || "Failed to save testimonial");
    }
  };

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      quote: testimonial.quote,
      rating: testimonial.rating,
      avatar: testimonial.avatar || "",
      status: testimonial.status,
      displayOrder: testimonial.displayOrder || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) {
      return;
    }
    try {
      await testimonialAPI.delete(id);
      showSuccess("Testimonial deleted successfully");
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showError("Failed to delete testimonial");
    }
  };

  const handleToggleStatus = async (testimonial) => {
    const newStatus =
      testimonial.status === "published" ? "draft" : "published";
    try {
      await testimonialAPI.update(testimonial._id, { status: newStatus });
      showSuccess(
        `Testimonial ${newStatus === "published" ? "published" : "drafted"}`
      );
      fetchTestimonials();
    } catch (error) {
      console.error("Error updating status:", error);
      showError("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      quote: "",
      rating: 5,
      avatar: "",
      status: "published",
      displayOrder: 0,
    });
    setEditingTestimonial(null);
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      showError("Please select an image first");
      return;
    }

    try {
      setUploading(true);
      const result = await mediaAPI.uploadImage(selectedFile);
      
      if (result.url) {
        setFormData({ ...formData, avatar: result.url });
        showSuccess("Image uploaded successfully");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showError(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, avatar: "" });
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Paginate testimonials
  const totalItems = testimonials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTestimonials = testimonials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 tracking-tight">
            Testimonials
          </h1>
          <p className="text-primary-500 text-sm mt-0.5">Manage what families say on the homepage</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-tertiary-600 text-white font-semibold rounded-xl hover:bg-tertiary-700 transition-colors shadow-sm"
        >
          <IoAdd className="w-5 h-5" /> Add Testimonial
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-primary-700">Filter:</span>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 border border-primary-200 rounded-xl bg-white text-primary-800 focus:ring-2 focus:ring-tertiary-500 focus:border-transparent transition-shadow"
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Testimonials List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-2 border-tertiary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-primary-600 text-sm font-medium">Loading testimonials...</p>
        </div>
      ) : paginatedTestimonials.length === 0 ? (
        <div className="text-center py-16 px-4 bg-primary-50 rounded-2xl border border-primary-200">
          <p className="text-primary-600 font-medium mb-1">No testimonials found</p>
          <p className="text-sm text-primary-500">Add one using the button above.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedTestimonials.map((testimonial) => (
            <motion.div
              key={testimonial._id}
              className="bg-white border border-primary-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 flex flex-col"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Top row: status + order */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${
                    testimonial.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : testimonial.status === "draft"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-primary-100 text-primary-600"
                  }`}
                >
                  {testimonial.status}
                </span>
                <span className="text-xs text-primary-400 font-medium">
                  Order {testimonial.displayOrder}
                </span>
              </div>

              {/* Rating */}
              <div className="flex gap-0.5 mb-3" aria-hidden>
                {[1, 2, 3, 4, 5].map((i) => (
                  <IoStar
                    key={i}
                    className={`w-4 h-4 ${
                      i <= testimonial.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-primary-200"
                    }`}
                  />
                ))}
              </div>

              {/* Quote Preview */}
              <p className="text-primary-700 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                {testimonial.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                {testimonial.avatar ? (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-primary-100"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-semibold text-sm">
                    {testimonial.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-primary-900 truncate text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-primary-500 truncate">{testimonial.role}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-primary-100">
                <button
                  onClick={() => handleEdit(testimonial)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-100 text-primary-800 rounded-xl hover:bg-primary-200 transition-colors text-sm font-medium"
                >
                  <IoPencil className="w-4 h-4 shrink-0" /> Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(testimonial)}
                  className="p-2.5 rounded-xl bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                  title={testimonial.status === "published" ? "Unpublish" : "Publish"}
                  aria-label={testimonial.status === "published" ? "Unpublish" : "Publish"}
                >
                  {testimonial.status === "published" ? <IoEyeOff className="w-4 h-4" /> : <IoEye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(testimonial._id)}
                  className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  title="Delete"
                  aria-label="Delete testimonial"
                >
                  <IoTrash className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
            ))}
          </div>
          
          {/* Pagination */}
          {testimonials.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
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
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-primary-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="sticky top-0 bg-white border-b border-primary-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-primary-900">
                {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-primary-500 hover:bg-primary-100 hover:text-primary-700 transition-colors"
                aria-label="Close"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:ring-2 focus:ring-tertiary-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:ring-2 focus:ring-tertiary-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">
                  Quote *
                </label>
                <textarea
                  value={formData.quote}
                  onChange={(e) =>
                    setFormData({ ...formData, quote: e.target.value })
                  }
                  required
                  rows={4}
                  maxLength={500}
                  placeholder="What did they say about your events?"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:ring-2 focus:ring-tertiary-500 focus:border-transparent transition-shadow resize-none"
                />
                <p className="text-xs text-primary-500 mt-1.5">
                  {formData.quote.length}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">
                    Rating *
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rating: parseInt(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:ring-2 focus:ring-tertiary-500 focus:border-transparent transition-shadow"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Star{rating > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:ring-2 focus:ring-tertiary-500 focus:border-transparent transition-shadow"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:ring-2 focus:ring-tertiary-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Avatar Image
                </label>
                
                {(formData.avatar || previewUrl) && (
                  <div className="flex items-center gap-4 mb-4 p-4 bg-primary-50 rounded-xl border border-primary-200">
                    <img
                      src={previewUrl || formData.avatar}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-primary-200 shrink-0"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/80?text=Error";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-800">
                        {selectedFile ? "Selected file (upload to save)" : "Current avatar"}
                      </p>
                      <p className="text-xs text-primary-500 mt-0.5 truncate">
                        {selectedFile ? selectedFile.name : formData.avatar}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="flex items-center gap-2 px-4 py-2.5 bg-primary-100 text-primary-700 rounded-xl hover:bg-primary-200 transition-colors cursor-pointer text-sm font-medium"
                    >
                      <IoImage className="w-4 h-4" />
                      Choose Image
                    </label>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={handleUploadImage}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-tertiary-600 text-white rounded-xl hover:bg-tertiary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <IoCloudUpload className="w-4 h-4" />
                            Upload
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-primary-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white text-xs text-primary-400 font-medium">OR</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-primary-600 mb-1">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      value={formData.avatar}
                      onChange={(e) =>
                        setFormData({ ...formData, avatar: e.target.value })
                      }
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:ring-2 focus:ring-tertiary-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <p className="text-xs text-primary-500 mt-2">
                  Max 5MB. Leave empty to use initial letter as avatar.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 border border-primary-200 text-primary-700 rounded-xl hover:bg-primary-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-tertiary-600 text-white rounded-xl hover:bg-tertiary-700 transition-colors font-semibold shadow-sm"
                >
                  <IoCheckmark className="w-4 h-4" />{" "}
                  {editingTestimonial ? "Update" : "Create"}
                </button>
              </div>
            </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsManagement;

