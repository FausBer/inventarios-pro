import { create } from "zustand";
import {
  ActualizarConfiguracionEmpresa,
  ContarUsuariosXempresa,
  ListarUsuariosEncargadosEmpresa,
  MostrarEmpresa,
} from "../index";

export const useEmpresaStore = create((set) => ({
  contadorusuarios: 0,
  dataempresa: [],
  mostrarEmpresa: async (p) => {
    const response = await MostrarEmpresa(p);
    const empresa = response?.empresa ?? response ?? null;
    set({ dataempresa: empresa });
    return empresa;
  },
  listarUsuariosEncargados: async (p) => ListarUsuariosEncargadosEmpresa(p),
  guardarConfiguracionEmpresa: async (p) => {
    const respuesta = await ActualizarConfiguracionEmpresa(p);
    set((state) => ({
      dataempresa:
        state.dataempresa?.id === respuesta.id
          ? { ...state.dataempresa, ...respuesta }
          : state.dataempresa,
    }));
    return respuesta;
  },
  contarusuariosXempresa: async (p) => {
    const response = await ContarUsuariosXempresa(p);
    set({ contadorusuarios: response });
    return response;
  },
}));
