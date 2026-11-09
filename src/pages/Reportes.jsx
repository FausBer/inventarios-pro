import {
  BloqueoPagina,
  ReportesTemplate,
  useUsuariosStore,
} from "../index";

export function Reportes() {
  const { datapermisos } = useUsuariosStore();
  const statePermiso = datapermisos.some((objeto) =>
    ["Kardex", "Productos", "Marca de productos"].some((modulo) =>
      objeto.modulos?.nombre?.includes(modulo)
    )
  );
  if (statePermiso == false) {
    return <BloqueoPagina />;
  }

  return <ReportesTemplate />;
}
