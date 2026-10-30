import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { shopAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import Pagination from "./Pagination";
import {
  IoAdd,
  IoTrash,
  IoCreate,
  IoSearch,
  IoCheckmarkCircle,
  IoCloseCircle,
} from "react-icons/io5";

const CouponsManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({ status: "all" });
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minPurchase: "",
    maxDiscount: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
    userLimit: "",
    applicableCategories: [],
    status: "active",
  });

  useEffect(() => {
    fetchCoupons();
  }, [filter, searchQuery, currentPage, itemsPerPage]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (filter.status !== "all") params.status = filter.status;
      if (searchQuery) params.search = searchQuery;

      const response = await shopAPI.getAdminCoupons(params);
      let filteredCoupons = response.coupons || [];

      // Apply search filter on client side if search query exists and API doesn't support it
      if (searchQuery && !params.search) {
        filteredCoupons = filteredCoupons.filter(
          (coupon) =>
            coupon.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coupon.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setCoupons(filteredCoupons);
      setTotalItems(response.total || filteredCoupons.length);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      showError("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const couponData = {
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: parseFloat(formData.discountValue),
        minPurchase: formData.minPurchase
          ? parseFloat(formData.minPurchase)
          : 0,
        maxDiscount: formData.maxDiscount
          ? parseFloat(formData.maxDiscount)
          : undefined,
        usageLimit: formData.usageLimit
          ? parseInt(formData.usageLimit)
          : undefined,
        userLimit: formData.userLimit
          ? parseInt(formData.userLimit)
          : undefined,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
      };

      if (editingCoupon) {
        await shopAPI.updateCoupon(editingCoupon._id, couponData);
        showSuccess("Coupon updated successfully");
      } else {
        await shopAPI.createCoupon(couponData);
        showSuccess("Coupon created successfully");
      }

      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      setCurrentPage(1);
      fetchCoupons();
    } catch (error) {
      console.error("Error saving coupon:", error);
      showError(error.message || "Failed to save coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      await shopAPI.deleteCoupon(id);
      showSuccess("Coupon deleted successfully");
      setCurrentPage(1);
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      showError("Failed to delete coupon");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minPurchase: "",
      maxDiscount: "",
      validFrom: "",
      validUntil: "",
      usageLimit: "",
      userLimit: "",
      applicableCategories: [],
      status: "active",
    });
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      name: coupon.name || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || "",
      minPurchase: coupon.minPurchase || "",
      maxDiscount: coupon.maxDiscount || "",
      validFrom: coupon.validFrom
        ? new Date(coupon.validFrom).toISOString().slice(0, 16)
        : "",
      validUntil: coupon.validUntil
        ? new Date(coupon.validUntil).toISOString().slice(0, 16)
        : "",
      usageLimit: coupon.usageLimit || "",
      userLimit: coupon.userLimit || "",
      applicableCategories: coupon.applicableCategories || [],
      status: coupon.status || "active",
    });
    setShowModal(true);
  };

  const isCouponActive = (coupon) => {
    const now = new Date();
    return (
      coupon.status === "active" &&
      new Date(coupon.validFrom) <= now &&
      new Date(coupon.validUntil) >= now
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-secondary-600 mb-2">
            Coupons Management
          </h2>
          <p className="text-primary-700">
            Create and manage discount coupons and promotional codes
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setShowModal(true);
          }}
          className="px-6 py-3 bg-secondary-500 text-white text-sm font-medium hover:bg-secondary-600 transition-colors inline-flex items-center gap-2"
        >
          <IoAdd className="text-lg" />
          Add Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
            />
          </div>
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
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-950 rounded-full animate-spin" />
          </div>
        ) : coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-100 border-b border-primary-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Valid Period
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
                {coupons.map((coupon) => (
                  <tr
                    key={coupon._id}
                    className="border-b border-primary-200 hover:bg-primary-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-mono font-medium text-primary-950">
                        {coupon.code}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-primary-950">
                        {coupon.name}
                      </p>
                      {coupon.description && (
                        <p className="text-xs text-primary-600 line-clamp-1">
                          {coupon.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-primary-950">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : `$${coupon.discountValue}`}
                        </p>
                        {coupon.minPurchase > 0 && (
                          <p className="text-xs text-primary-600">
                            Min: ${coupon.minPurchase}
                          </p>
                        )}
                        {coupon.maxDiscount && (
                          <p className="text-xs text-primary-600">
                            Max: ${coupon.maxDiscount}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-primary-700">
                          {coupon.usageCount || 0} / {coupon.usageLimit || "∞"}
                        </p>
                        {coupon.userLimit && (
                          <p className="text-xs text-primary-600">
                            {coupon.userLimit} per user
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-primary-700">
                          {new Date(coupon.validFrom).toLocaleDateString()}
                        </p>
                        <p className="text-primary-600">to</p>
                        <p className="text-primary-700">
                          {new Date(coupon.validUntil).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isCouponActive(coupon) ? (
                          <IoCheckmarkCircle className="text-green-500" />
                        ) : (
                          <IoCloseCircle className="text-red-500" />
                        )}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            isCouponActive(coupon)
                              ? "bg-green-100 text-green-700"
                              : coupon.status === "inactive"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isCouponActive(coupon) ? "Active" : coupon.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="p-2 text-primary-600 hover:text-primary-950 transition-colors"
                          title="Edit"
                        >
                          <IoCreate className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
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
            <p className="text-primary-600">No coupons found</p>
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

      {/* Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-primary-950/50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white border-2 border-primary-200 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-secondary-600">
                {editingCoupon ? "Edit Coupon" : "Add Coupon"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCoupon(null);
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
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent font-mono"
                    placeholder="SAVE20"
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
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Name *
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Discount Type *
                  </label>
                  <select
                    required
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Minimum Purchase
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) =>
                      setFormData({ ...formData, minPurchase: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Max Discount (for %)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Valid From *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Valid Until *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: e.target.value })
                    }
                    placeholder="Unlimited if empty"
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    value={formData.userLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, userLimit: e.target.value })
                    }
                    placeholder="Unlimited if empty"
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-primary-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCoupon(null);
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
                  {editingCoupon ? "Update" : "Create"} Coupon
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CouponsManagement;
