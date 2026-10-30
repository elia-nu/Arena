import { createContext, useContext, useState, useEffect, useRef } from "react";

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        return [];
      }
    }
    return [];
  });

  const [coupon, setCoupon] = useState(() => {
    const savedCoupon = localStorage.getItem("cartCoupon");
    if (savedCoupon) {
      try {
        return JSON.parse(savedCoupon);
      } catch (error) {
        console.error("Error loading coupon from localStorage:", error);
        return null;
      }
    }
    return null;
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (coupon) {
      localStorage.setItem("cartCoupon", JSON.stringify(coupon));
    } else {
      localStorage.removeItem("cartCoupon");
    }
  }, [coupon]);

  const getProductId = (product) => product?.id || product?._id;

  const getStockLimit = (product) => {
    const stock = Number(product?.stock);
    if (Number.isFinite(stock) && stock >= 0) {
      return Math.min(99, Math.floor(stock));
    }
    return 99;
  };

  const addToCart = (product, quantity = 1) => {
    const amount = Math.max(1, Number(quantity) || 1);
    const maxQty = getStockLimit(product);
    if (maxQty <= 0) return;

    setCart((prevCart) => {
      const productId = getProductId(product);
      const existingItem = prevCart.find(
        (item) => item.id === productId || item._id === productId
      );
      if (existingItem) {
        const nextQty = Math.min(maxQty, existingItem.quantity + amount);
        return prevCart.map((item) =>
          item.id === productId || item._id === productId
            ? { ...item, quantity: nextQty, stock: product.stock ?? item.stock }
            : item
        );
      }
      return [
        ...prevCart,
        { ...product, quantity: Math.min(maxQty, amount) },
      ];
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id !== id && item._id !== id) return item;
        const maxQty = getStockLimit(item);
        return { ...item, quantity: Math.min(maxQty, quantity) };
      })
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter(
        (item) => item.id !== id && item._id !== id
      );
      return newCart;
    });
  };

  useEffect(() => {
    if (cart.length === 0 && coupon) {
      setCoupon(null);
    }
  }, [cart, coupon]);

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemQuantity = (id) => {
    const item = cart.find((item) => item.id === id || item._id === id);
    return item?.quantity || 0;
  };

  const isInCart = (id) => getItemQuantity(id) > 0;

  const applyCoupon = (couponData) => {
    setCoupon(couponData);
  };

  const value = {
    cart,
    coupon,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal,
    getItemQuantity,
    isInCart,
    applyCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
