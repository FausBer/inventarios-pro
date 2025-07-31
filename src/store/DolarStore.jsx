// src/store/useDolarStore.jsx
import { create } from "zustand";

export const useDolarStore = create((set) => ({
  cotizacion: null,
  cargarCotizacion: async () => {
    try {
      const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
      const data = await res.json();
      set({ cotizacion: data.venta });
    } catch (error) {
      console.error("Error al obtener la cotización del dólar:", error);
    }
  },
}));
