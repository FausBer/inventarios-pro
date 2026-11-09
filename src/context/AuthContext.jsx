import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../index";
const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const queryClient = useQueryClient();
  const userIdActual = useRef(null);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const nuevoId = session?.user?.id ?? null;
      if (nuevoId !== userIdActual.current) {
        // Query keys and cached results must never survive an account switch.
        queryClient.clear();
        userIdActual.current = nuevoId;
      }
      setUser(session?.user ?? null);
      if (event === "INITIAL_SESSION") setAuthReady(true);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [queryClient]);
  return (
    <AuthContext.Provider value={{ user, authReady }}>{children}</AuthContext.Provider>
  );
};
export const UserAuth = () => {
  return useContext(AuthContext);
};
