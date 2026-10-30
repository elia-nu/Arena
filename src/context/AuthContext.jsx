import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const data = await authAPI.getCurrentUser();
          setUser(data.user);
          setToken(storedToken);
          
          // Check if user is suspended and redirect
          if (data.user?.isSuspended) {
            // Don't clear token, but user will see suspension notice
            // The SuspensionNotice component will handle logout if needed
          }
        } catch (error) {
          // Token is invalid or user is suspended, clear it
          if (error.status === 403 && error.data?.suspensionReason) {
            // User is suspended, keep token but set user with suspension info
            setUser({
              ...error.data,
              isSuspended: true,
              suspensionReason: error.data.suspensionReason,
            });
          } else {
            // Token is invalid, clear it
            localStorage.removeItem("token");
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const data = await authAPI.login(identifier, password);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, data };
    } catch (error) {
      // Handle suspension error
      if (error.status === 403 && error.data?.suspensionReason) {
        // User is suspended, set user with suspension info
        const suspendedUser = {
          email: identifier?.includes?.("@") ? identifier : undefined,
          phone: identifier?.includes?.("@") ? undefined : identifier,
          isSuspended: true,
          suspensionReason: error.data.suspensionReason,
        };
        setUser(suspendedUser);
        return { 
          success: false, 
          error: error.message || "Your account has been suspended",
          suspended: true,
          suspensionReason: error.data.suspensionReason
        };
      }
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser((prevUser) => ({ ...prevUser, ...userData }));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
    isTeamLeader: user?.role === "team_leader",
    isPlayer: user?.role === "player",
    isSuspended: user?.isSuspended || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
