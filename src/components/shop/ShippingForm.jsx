import { useState } from "react";
import { motion } from "framer-motion";
import {
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoArrowForward,
} from "react-icons/io5";
import { useNotification } from "../NotificationProvider";

const inputClass =
  "w-full px-4 py-3 border border-secondary-200 rounded-lg focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20 focus:outline-none transition-all bg-white text-primary-950 placeholder:text-primary-400";
const labelClass = "block text-sm font-medium text-primary-800 mb-1.5";

const Field = ({ label, hint, required, children }) => (
  <div>
    <label className={labelClass}>
      {label}
      {!required && (
        <span className="ml-1 font-normal text-primary-400">(optional)</span>
      )}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-primary-500">{hint}</p>}
  </div>
);

const ShippingForm = ({ user, orderData, initialShipping, onContinue, onCancel }) => {
  const { showError } = useNotification();
  const [formData, setFormData] = useState({
    recipientName:
      initialShipping?.recipientName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      "",
    phone: initialShipping?.phone || user?.phone || "",
    email: orderData?.email || user?.email || "",
    street: initialShipping?.address?.street || "",
    apartment: initialShipping?.address?.apartment || "",
    city: initialShipping?.address?.city || "",
    state: initialShipping?.address?.state || "",
    zipCode: initialShipping?.address?.zipCode || "",
    country: initialShipping?.address?.country || "",
  });

  const orderTotal =
    (orderData?.subtotal || 0) - (orderData?.discount || 0) + (orderData?.tax || 0);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!formData.recipientName.trim()) {
      showError("Please enter your full name");
      return false;
    }
    if (!formData.phone.trim()) {
      showError("Please enter a phone number");
      return false;
    }
    if (!formData.email.trim()) {
      showError("Please enter an email address");
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      showError("Please enter a valid email address");
      return false;
    }
    if (!formData.street.trim()) {
      showError("Please enter a street address");
      return false;
    }
    if (!formData.city.trim()) {
      showError("Please enter a city");
      return false;
    }
    if (!formData.state.trim()) {
      showError("Please enter a state or province");
      return false;
    }
    if (!formData.zipCode.trim()) {
      showError("Please enter a ZIP or postal code");
      return false;
    }
    if (!formData.country.trim()) {
      showError("Please enter a country");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onContinue({
      ...orderData,
      email: formData.email.trim(),
      shipping: {
        cost: 0,
        method: "standard",
        recipientName: formData.recipientName.trim(),
        phone: formData.phone.trim(),
        address: {
          street: formData.street.trim(),
          apartment: formData.apartment.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
          country: formData.country.trim(),
        },
      },
      total: orderTotal,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-primary-600 -mt-1">
        Where should we send your order? All fields marked with * are required.
      </p>

      {/* Contact */}
      <section className="rounded-2xl border-2 border-secondary-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-1 border-b border-secondary-200">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
            <IoPersonOutline className="text-lg" />
          </span>
          <div>
            <h3 className="font-semibold text-primary-950">Contact</h3>
            <p className="text-xs text-primary-500">We'll use this for order updates</p>
          </div>
        </div>

        <Field label="Full name" required>
          <div className="relative">
            <IoPersonOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) => handleChange("recipientName", e.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
              className={`${inputClass} pl-10`}
              required
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone" required>
            <div className="relative">
              <IoCallOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
                autoComplete="tel"
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </Field>

          <Field label="Email" required>
            <div className="relative">
              <IoMailOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </Field>
        </div>
      </section>

      {/* Address */}
      <section className="rounded-2xl border-2 border-secondary-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-1 border-b border-secondary-200">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
            <IoLocationOutline className="text-lg" />
          </span>
          <div>
            <h3 className="font-semibold text-primary-950">Delivery address</h3>
            <p className="text-xs text-primary-500">Where your merch will be shipped</p>
          </div>
        </div>

        <Field label="Street address" required>
          <div className="relative">
            <IoHomeOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
            <input
              type="text"
              value={formData.street}
              onChange={(e) => handleChange("street", e.target.value)}
              placeholder="123 Main Street"
              autoComplete="address-line1"
              className={`${inputClass} pl-10`}
              required
            />
          </div>
        </Field>

        <Field label="Apartment, suite, unit">
          <input
            type="text"
            value={formData.apartment}
            onChange={(e) => handleChange("apartment", e.target.value)}
            placeholder="Apt 4B, Suite 200"
            autoComplete="address-line2"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="City" required>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="New York"
              autoComplete="address-level2"
              className={inputClass}
              required
            />
          </Field>

          <Field label="State / Province" required>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              placeholder="NY"
              autoComplete="address-level1"
              className={inputClass}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ZIP / Postal code" required>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => handleChange("zipCode", e.target.value)}
              placeholder="10001"
              autoComplete="postal-code"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Country" required>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              placeholder="United States"
              autoComplete="country-name"
              className={inputClass}
              required
            />
          </Field>
        </div>
      </section>

      {/* Order summary */}
      <div className="rounded-2xl border-2 border-secondary-200 bg-white p-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-primary-600">
            <span>Subtotal</span>
            <span>${(orderData?.subtotal || 0).toFixed(2)}</span>
          </div>
          {(orderData?.discount || 0) > 0 && (
            <div className="flex justify-between text-secondary-600">
              <span>Discount</span>
              <span>-${orderData.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-secondary-200">
            <span className="font-semibold text-primary-950">Order total</span>
            <span className="font-bold text-secondary-600 text-lg">
              ${orderTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
        <motion.button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3.5 border-2 border-secondary-200 text-primary-600 font-medium rounded-xl hover:bg-secondary-100 hover:border-secondary-400 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-accent-500 to-accent-400 text-primary-950 font-bold rounded-xl hover:shadow-md transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue to payment
          <IoArrowForward />
        </motion.button>
      </div>
    </form>
  );
};

export default ShippingForm;
