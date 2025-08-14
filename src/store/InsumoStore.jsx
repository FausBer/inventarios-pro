import { create } from "zustand";
import {
  BuscarInsumos,
  EditarInsumos,
  EliminarInsumos,
  InsertarInsumos,
  MostrarInsumos,
  MostrarProductosPorInsumo,
} from "../index";

export const useInsumoStore = create((set, get) => ({
  buscador: "",
  setBuscador: (p) => {
    set({ buscador: p });
  },
  dataInsumos: [],
  productosXInsumo: [],
  insumosItemSelect: [],
  parametros: {},
  mostrarInsumos: async (p) => {
    const response = await MostrarInsumos(p);
    set({ parametros: p });
    set({ dataInsumos: response });
    set({ insumosItemSelect: response[0] });
    return response;
  },
  selectInsumos: (p) => {
    set({ insumosItemSelect: p });
  },
  insertarInsumos: async (p) => {
    await InsertarInsumos(p);
    const { mostrarInsumos } = get();
    const { parametros } = get();
    set(mostrarInsumos(parametros));
  },
  eliminarInsumos: async (p) => {
    await EliminarInsumos(p);
    const { mostrarInsumos } = get();
    const { parametros } = get();
    set(mostrarInsumos(parametros));
  },
  editarInsumos: async (p) => {
    await EditarInsumos(p);
    const { mostrarInsumos } = get();
    const { parametros } = get();
    set(mostrarInsumos(parametros));
  },
  buscarInsumos: async (p) => {
    const response = await BuscarInsumos(p);
    set({ dataInsumos: response });
  },
  mostrarProductosPorInsumo: async (id_insumo) => {
    // Llamamos a tu función del CRUD que haga el fetch
    const response = await MostrarProductosPorInsumo(id_insumo);

    // Opcional: guardamos en el estado si querés mantenerlo disponible
    set({ productosXInsumo: response });

    return response;
  },
}));
