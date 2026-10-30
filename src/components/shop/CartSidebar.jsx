import { useState, useEffect } from "react";
import { IoClose, IoTrash, IoAdd, IoRemove } from "react-icons/io5";
import { useNotification } from "../NotificationProvider";
import EmptyState from "../EmptyState";

const CartSidebar = ({
  isOpen,
  onClose,
  cart = [],
  onUpdateCart,
  onRemoveItem,
}) => {
  const { showSuccess } = useNotification();
  const [localCart, setLocalCart] = useState(cart);

  useEffect(() => {
    setLocalCart(cart);
  }, [cart]);

  const calculateTotal = () => {
    return localCart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const updateQuantity = (id, change) => {
    const updated = localCart.map((item) => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setLocalCart(updated);
    if (onUpdateCart) onUpdateCart(updated);
  };

  const removeItem = (id) => {
    const updated = localCart.filter((item) => item.id !== id);
    setLocalCart(updated);
    if (onRemoveItem) onRemoveItem(id);
    showSuccess("Item removed from cart");
  };

  const handleCheckout = () => {
    showSuccess("Redirecting to checkout...");
    // Handle checkout logic
  };

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-primary-950/20 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-secondary-50 z-50 flex flex-col border-l border-primary-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-primary-200">
              <div>
                <h2 className="text-lg font-medium text-secondary-600">Cart</h2>
                <p className="text-xs text-primary-500 mt-1">
                  {localCart.length} {localCart.length === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-primary-400 hover:text-primary-950 transition-colors"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {localCart.length === 0 ? (
                <EmptyState
                  variant="cart"
                  compact
                  title="Your cart is empty"
                  description="Add some official gear to get started."
                  actionLabel="Browse shop"
                  actionTo="/shop"
                  className="h-full justify-center"
                />
              ) : (
                <div className="space-y-6">
                  {localCart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-6 border-b border-primary-200 last:border-0"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-secondary-600 mb-1 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-primary-700 mb-3">
                          ${item.price}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 border border-primary-200">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-primary-100 transition-colors"
                            >
                              <IoRemove className="text-sm text-primary-600" />
                            </button>
                            <span className="text-sm text-primary-950 w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:bg-primary-100 transition-colors"
                            >
                              <IoAdd className="text-sm text-primary-600" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto text-primary-400 hover:text-primary-950 transition-colors"
                          >
                            <IoTrash className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {localCart.length > 0 && (
              <div className="border-t border-primary-200 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-primary-600">Total</span>
                  <span className="text-lg font-medium text-primary-950">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-primary-950 text-secondary-50 text-sm font-medium hover:bg-primary-900 transition-colors"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default CartSidebar;
