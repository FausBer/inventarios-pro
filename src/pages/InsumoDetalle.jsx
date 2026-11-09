import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "../index";
import {
  InsumoDetalleTemplate,
  SpinnerLoader,
  useUsuariosStore,
  useInsumoStore,
  useEmpresaStore,
  BloqueoPagina,
} from "../index";
import Swal from "sweetalert2";

export function InsumoDetalle() {
  const { id } = useParams(); // id del insumo seleccionado
  const { datapermisos } = useUsuariosStore();

  const tienePermisoCostos = datapermisos?.some((objeto) =>
    objeto.modulos.nombre.includes("precios")
  );

  const { mostrarInsumos, dataInsumos } = useInsumoStore();
  const { dataempresa } = useEmpresaStore();

  // Consulta para traer los insumos
  const { isLoading: loadingInsumos, error: errorInsumos } = useQuery({
    queryKey: ["mostrar insumos", { id_empresa: dataempresa?.id }],
    queryFn: () => mostrarInsumos({ id_empresa: dataempresa?.id }),
    enabled: !!dataempresa?.id,
  });

  // Encontrar el insumo seleccionado
  const insumoSeleccionado = dataInsumos?.find((i) => i.id === Number(id));

  // Consulta para traer productos por insumo
  const {
    data: productos,
    isLoading: loadingProductos,
    error: errorProductos,
  } = useQuery({
    queryKey: ["productos por insumo", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "mostrar_productos_por_insumo",
        { _id_insumo: Number(id) }
      );
      if (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.message,
        });
        return [];
      }
      return data;
    },
    enabled: !!insumoSeleccionado,
  });

  if (loadingInsumos || loadingProductos) return <SpinnerLoader />;
  if (errorInsumos || errorProductos) return <span>Error...</span>;
  if (!insumoSeleccionado) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Equipo final no encontrado</h2>
        <p>El equipo final con ID {id} no existe o no pertenece a esta empresa.</p>
      </div>
    );
  }

  return (
    <InsumoDetalleTemplate
      data={dataInsumos}
      nombreInsumo={insumoSeleccionado.nombre}
      tienePermisoCostos={tienePermisoCostos}
      productos={productos || []}
    />
  );
}
