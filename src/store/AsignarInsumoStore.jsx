// store/useStore.js
import { create } from "zustand";
import { supabase } from "../supabase/supabase.config";

export const useStore = create((set, get) => ({
  productos: [],
  insumos: [],

  fetchProductos: async (idEmpresa) => {
    if (!idEmpresa) {
      set({ productos: [] });
      return;
    }
    set({ productos: [] });
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("id_empresa", idEmpresa);
    if (error) throw error;
    set({ productos: data ?? [] });
  },

  fetchInsumos: async (idEmpresa) => {
    if (!idEmpresa) {
      set({ insumos: [] });
      return;
    }
    set({ insumos: [] });
    const { data, error } = await supabase
      .from("insumo")
      .select("*")
      .eq("id_empresa", idEmpresa);
    if (error) throw error;
    set({ insumos: data ?? [] });
  },

  asignarProductoAInsumo: async (productoId, insumoId, cantidad, idEmpresa) => {
    if (!idEmpresa) throw new Error("No se pudo identificar la empresa activa.");
    const [producto, equipoFinal] = await Promise.all([
      supabase.from("productos").select("id").eq("id", productoId).eq("id_empresa", idEmpresa).maybeSingle(),
      supabase.from("insumo").select("id").eq("id", insumoId).eq("id_empresa", idEmpresa).maybeSingle(),
    ]);
    if (producto.error) throw producto.error;
    if (equipoFinal.error) throw equipoFinal.error;
    if (!producto.data || !equipoFinal.data) {
      throw new Error("El componente y el equipo final deben pertenecer a la empresa activa.");
    }
    const { error } = await supabase
      .from("productos_insumo")
      .insert([{ id_producto: productoId, id_insumo: insumoId, cantidad }]);

    if (error) throw error;
  },
}));
