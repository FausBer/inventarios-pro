import { useQuery } from "@tanstack/react-query";
import {
  BloqueoPagina,
  InsumoConfigTemplate,
  SpinnerLoader,
  useEmpresaStore,
  useInsumoStore,
  useUsuariosStore,
} from "../index";

export function InsumoConfig() {
  const { datapermisos } = useUsuariosStore();
  const statePermiso = datapermisos.some((objeto) =>
    objeto.modulos.nombre.includes("Configuracion Insumo")
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

  return <InsumoConfigTemplate data={dataInsumos} />;
}
