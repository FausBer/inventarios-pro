import { create } from "zustand";
import { supabase } from "../supabase/supabase.config";
export const useAuthStore = create(() => ({
  signInWithEmail: async (p) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: p.correo,
      password: p.pass,
    });
    if (error) return null;
    return data.user;
  },
  solicitarRestablecimiento: async ({ correo, redirectTo }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo,
    });
    if (error) throw error;
  },
  actualizarContrasena: async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data.user;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Ocurrió un error durante el cierre de sesión: ${error.message}`);
    }
  },
}));
