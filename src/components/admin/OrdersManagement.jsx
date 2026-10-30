import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { shopAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import Pagination from "./Pagination";
import {
  IoSearch,
  IoCheckmarkCircle,
  IoTime,
  IoCar,
  IoCloseCircle,
  IoCreate,
  IoEye,
} from "react-icons/io5";

const OrdersManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({
    status: "all",
    paymentStatus: "all",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "",
    trackingNumber: "",
    notes: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [filter, searchQuery, currentPage, itemsPerPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (filter.status !== "all") params.status = filter.status;
      if (filter.paymentStatus !== "all")
        params.paymentStatus = filter.paymentStatus;
      if (searchQuery) params.search = searchQuery;

      const response = await shopAPI.getAdminOrders(params);
      let filteredOrders = response.orders || [];
      
      // Apply search filter on client side if search query exists and API doesn't support it
      if (searchQuery && !params.search) {
        filteredOrders = filteredOrders.filter((order) =>
          order.orderNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      }
      
      setOrders(filteredOrders);
      setTotalItems(response.total || filteredOrders.length);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    try {
      const updates = {};
      if (updateData.status) updates.status = updateData.status;
      if (updateData.trackingNumber)
        updates.trackingNumber = updateData.trackingNumber;
      if (updateData.notes !== undefined) updates.notes = updateData.notes;

      await shopAPI.updateAdminOrder(selectedOrder._id, updates);
      showSuccess("Order updated successfully");
      setShowModal(false);
      setSelectedOrder(null);
      setUpdateData({ status: "", trackingNumber: "", notes: "" });
      setCurrentPage(1);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      showError("Failed to update order");
    }
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setUpdateData({
      status: order.status,
      trackingNumber: order.trackingNumber || "",
      notes: order.notes || "",
    });
    setShowModal(true);
  };

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <IoCheckmarkCircle className="text-green-500" />;
      case "shipped":
        return <IoCar className="text-blue-500" />;
      case "queued":
        return <IoTime className="text-purple-500" />;
      case "cancelled":
        return <IoCloseCircle className="text-red-500" />;
      default:
        return <IoTime className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "queued":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-secondary-600 mb-2">
          Orders Management
        </h2>
        <p className="text-primary-700">
          View and manage customer orders, track shipments, and update order
          status
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              placeholder="Search by order number..."
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
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filter.paymentStatus}
            onChange={(e) => {
              setFilter({ ...filter, paymentStatus: e.target.value });
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
          >
            <option value="all">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-950 rounded-full animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-100 border-b border-primary-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Order Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-950">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-primary-200 hover:bg-primary-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-primary-950">
                          {order.orderNumber}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {order.user ? (
                          <div>
                            <p className="text-sm font-medium text-primary-950">
                              {order.user.firstName} {order.user.lastName}
                            </p>
                            <p className="text-xs text-primary-600">
                              {order.user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-primary-600">
                            Guest
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-primary-700">
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-primary-950">
                          ${order.total.toFixed(2)}
                        </p>
                        {order.discount > 0 && (
                          <p className="text-xs text-tertiary-500">
                            -${order.discount.toFixed(2)} discount
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            order.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : order.paymentStatus === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-primary-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-primary-500">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetailsModal(order)}
                            className="p-2 text-primary-600 hover:text-primary-950 transition-colors"
                            title="View Order Details"
                          >
                            <IoEye className="text-lg" />
                          </button>
                          <button
                            onClick={() => openEditModal(order)}
                            className="p-2 text-primary-600 hover:text-primary-950 transition-colors"
                            title="Edit Order"
                          >
                            <IoCreate className="text-lg" />
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
            <p className="text-primary-600">No orders found</p>
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

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-primary-950/50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white border-2 border-primary-200 rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-secondary-600">
                Order Details #{selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="text-primary-400 hover:text-primary-950"
              >
                <IoCloseCircle className="text-2xl" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-xs uppercase tracking-wide text-primary-500 mb-1">
                    Customer
                  </p>
                  <p className="font-medium text-primary-950">
                    {selectedOrder.user
                      ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}`
                      : "Guest"}
                  </p>
                  {selectedOrder.user?.email && (
                    <p className="text-sm text-primary-600">{selectedOrder.user.email}</p>
                  )}
                </div>
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-xs uppercase tracking-wide text-primary-500 mb-1">
                    Placed On
                  </p>
                  <p className="font-medium text-primary-950">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-primary-600">
                    {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-xs uppercase tracking-wide text-primary-500 mb-1">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedOrder.status)}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-xs uppercase tracking-wide text-primary-500 mb-1">
                    Payment Status
                  </p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      selectedOrder.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : selectedOrder.paymentStatus === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-primary-950 mb-4">
                  Order Items
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 p-3 bg-primary-50 border border-primary-200 rounded-xl"
                    >
                      <img
                        src={item.image || "/placeholder-product.jpg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover border border-primary-200"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-primary-950">{item.name}</p>
                        <p className="text-sm text-primary-600">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-primary-950">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.shipping?.address?.street && (
                <div className="border-t border-primary-200 pt-6">
                  <h4 className="text-lg font-medium text-primary-950 mb-4">
                    Delivery Address
                  </h4>
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-950 space-y-1">
                    {selectedOrder.shipping.recipientName && (
                      <p className="font-semibold">
                        {selectedOrder.shipping.recipientName}
                      </p>
                    )}
                    {selectedOrder.shipping.phone && (
                      <p className="text-primary-600">
                        {selectedOrder.shipping.phone}
                      </p>
                    )}
                    <p>
                      {selectedOrder.shipping.address.street}
                      {selectedOrder.shipping.address.apartment
                        ? `, ${selectedOrder.shipping.address.apartment}`
                        : ""}
                    </p>
                    <p>
                      {selectedOrder.shipping.address.city},{" "}
                      {selectedOrder.shipping.address.state}{" "}
                      {selectedOrder.shipping.address.zipCode}
                    </p>
                    <p>{selectedOrder.shipping.address.country}</p>
                  </div>
                </div>
              )}

              <div className="border-t border-primary-200 pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-600">Subtotal:</span>
                    <span className="font-medium text-primary-950">
                      ${selectedOrder.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-tertiary-500">
                      <span>Discount:</span>
                      <span>-${selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-primary-600">Shipping:</span>
                    <span className="font-medium text-primary-950">
                      ${selectedOrder.shipping?.cost?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-600">Tax:</span>
                    <span className="font-medium text-primary-950">
                      ${selectedOrder.tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-primary-200">
                    <span className="text-lg font-medium text-primary-950">
                      Total:
                    </span>
                    <span className="text-lg font-medium text-primary-950">
                      ${selectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-primary-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-6 py-2 border border-primary-300 text-primary-700 hover:border-primary-950 hover:text-primary-950 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    openEditModal(selectedOrder);
                  }}
                  className="px-6 py-2 bg-secondary-500 text-white font-medium hover:bg-secondary-600 transition-colors"
                >
                  Edit Order
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-primary-950/50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white border-2 border-primary-200 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-secondary-600">
                Update Order #{selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedOrder(null);
                }}
                className="text-primary-400 hover:text-primary-950"
              >
                <IoCloseCircle className="text-2xl" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Items */}
              <div>
                <h4 className="text-lg font-medium text-primary-950 mb-4">
                  Order Items
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 p-3 bg-primary-50 border border-primary-200"
                    >
                      <img
                        src={item.image || "/placeholder-product.jpg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover border border-primary-200"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-primary-950">
                          {item.name}
                        </p>
                        <p className="text-sm text-primary-600">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-primary-950">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Update Form */}
              <div className="space-y-4 border-t border-primary-200 pt-6">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Order Status
                  </label>
                  <select
                    value={updateData.status}
                    onChange={(e) =>
                      setUpdateData({ ...updateData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="queued">Queued</option>
                    <option value="processing">Processing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={updateData.trackingNumber}
                    onChange={(e) =>
                      setUpdateData({
                        ...updateData,
                        trackingNumber: e.target.value,
                      })
                    }
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={updateData.notes}
                    onChange={(e) =>
                      setUpdateData({ ...updateData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Internal notes..."
                    className="w-full px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-primary-200 pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-600">Subtotal:</span>
                    <span className="font-medium text-primary-950">
                      ${selectedOrder.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-tertiary-500">
                      <span>Discount:</span>
                      <span>-${selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-primary-600">Shipping:</span>
                    <span className="font-medium text-primary-950">
                      ${selectedOrder.shipping?.cost?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-600">Tax:</span>
                    <span className="font-medium text-primary-950">
                      ${selectedOrder.tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-primary-200">
                    <span className="text-lg font-medium text-primary-950">
                      Total:
                    </span>
                    <span className="text-lg font-medium text-primary-950">
                      ${selectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-primary-200">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-6 py-2 border border-primary-300 text-primary-700 hover:border-primary-950 hover:text-primary-950 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  className="px-6 py-2 bg-secondary-500 text-white font-medium hover:bg-secondary-600 transition-colors"
                >
                  Update Order
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;

