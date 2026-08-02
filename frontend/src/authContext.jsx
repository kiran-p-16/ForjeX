import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      setCurrentUser(userId);
    } else {
      setCurrentUser(null);
    }

    setAuthLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUser, authLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
