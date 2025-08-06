import { useQuery } from "@tanstack/react-query";
import {
  BloqueoPagina,
  KardexTemplate,
  SpinnerLoader,
  useEmpresaStore,
  useKardexStore,
  useProductosStore,
  useUsuariosStore,
} from "../index";

export function Kardex() {
  const { buscarproductos, buscador: buscadorproductos } = useProductosStore();
  const { datapermisos } = useUsuariosStore();
  const statePermiso = datapermisos.some((objeto) =>
    objeto.modulos.nombre.includes("Kardex")
  );

  const { mostrarkardex, datakardex, buscarkardex, buscador } =
    useKardexStore();
  const { dataempresa } = useEmpresaStore();
  const { isLoading, error } = useQuery({
    queryKey: ["mostrar kardex", { _id_empresa: dataempresa?.id }],
    queryFn: () => mostrarkardex({ _id_empresa: dataempresa?.id }),
    enabled: dataempresa?.id != null,
  });
  const { data: buscarkardexlista } = useQuery({
    queryKey: [
      "buscar kardex",
      { _id_empresa: dataempresa.id, buscador: buscador },
    ],
    queryFn: () =>
      buscarkardex({
        _id_empresa: dataempresa.id,
        buscador: buscador,
      }),
    enabled: dataempresa.id != null,
  });
  //buscar para lista de productos
  const { data: buscardata } = useQuery({
    queryKey: [
      "buscar productos",
      { id_empresa: dataempresa.id, descripcion: buscadorproductos },
    ],
    queryFn: () =>
      buscarproductos({
        _id_empresa: dataempresa.id,
        buscador: buscadorproductos,
      }),
    enabled: dataempresa.id != null,
  });
  if (statePermiso == false) {
    return <BloqueoPagina />;
  }
  if (isLoading) {
    return <SpinnerLoader />;
  }
  if (error) {
    return <span>Error...</span>;
  }

  return <KardexTemplate data={datakardex} />;
}
