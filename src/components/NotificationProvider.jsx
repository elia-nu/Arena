import { createContext, useContext, useState, useCallback } from 'react';
import NotificationToast from './NotificationToast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      autoClose: true,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message, options = {}) => {
      return showNotification({ ...options, type: 'success', message });
    },
    [showNotification]
  );

  const showError = useCallback(
    (message, options = {}) => {
      return showNotification({ ...options, type: 'error', message });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message, options = {}) => {
      return showNotification({ ...options, type: 'info', message });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      return showNotification({ ...options, type: 'warning', message });
    },
    [showNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeNotification,
      }}
    >
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

