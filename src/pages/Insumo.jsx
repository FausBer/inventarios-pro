import { useQuery } from "@tanstack/react-query";
import {
  BloqueoPagina,
  InsumoTemplate,
  SpinnerLoader,
  useEmpresaStore,
  useInsumoStore,
  useUsuariosStore,
} from "../index";

export function Insumo() {
  const { datapermisos } = useUsuariosStore();
  const statePermiso = datapermisos.some((objeto) =>
    objeto.modulos.nombre.includes("Insumo")
  );

  const { mostrarInsumos, dataInsumos, buscarInsumos, buscador } =
    useInsumoStore();
  const { dataempresa } = useEmpresaStore();

  const { isLoading, error } = useQuery({
    queryKey: ["mostrar insumos", { id_empresa: dataempresa?.id }],
    queryFn: () => mostrarInsumos({ id_empresa: dataempresa?.id }),
    enabled: dataempresa?.id != null,
  });

  const { data: buscardata } = useQuery({
    queryKey: [
      "buscar insumos",
      { id_empresa: dataempresa?.id, nombre: buscador },
    ],
    queryFn: () =>
      buscarInsumos({ id_empresa: dataempresa?.id, nombre: buscador }),
    enabled: dataempresa?.id != null,
  });

  if (!statePermiso) return <BloqueoPagina />;
  if (isLoading) return <SpinnerLoader />;
  if (error) return <span>Error...</span>;

  return <InsumoTemplate data={dataInsumos} />;
}
