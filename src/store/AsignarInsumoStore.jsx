// store/useStore.js
import { create } from "zustand";
import { supabase } from "../supabase/supabase.config";

export const useStore = create((set, get) => ({
  productos: [],
  insumos: [],

  fetchProductos: async () => {
    const { data, error } = await supabase.from("producto").select("*");
    if (!error) set({ productos: data });
  },

  fetchInsumos: async () => {
    const { data, error } = await supabase.from("insumo").select("*");
    if (!error) set({ insumos: data });
  },

  asignarProductoAInsumo: async (productoId, insumoId) => {
    const { error } = await supabase
      .from("producto_insumo")
      .insert([{ producto_id: productoId, insumo_id: insumoId }]);

    if (error) throw error;
  },
}));
