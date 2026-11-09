import Swal from "sweetalert2";
import { ObtenerIdAuthSupabase, supabase } from "../index";

export const MostrarEmpresa = async (p) => {
  let { error, data } = await supabase
    .from("asignarempresa")
    .select(`empresa(id,nombre,simbolomoneda,id_usuario_alerta_stock,correo_alerta_stock)`)
    .eq("id_usuario", p.idusaurio)
    .maybeSingle();

  // Keep the inventory pages usable if the optional alert-recipient migration
  // has not been applied yet (or PostgREST has not refreshed its schema cache).
  if (
    error &&
    (error.code === "42703" ||
      error.code === "PGRST204" ||
      error.message?.includes("id_usuario_alerta_stock") ||
      error.message?.includes("correo_alerta_stock"))
  ) {
    const fallback = await supabase
      .from("asignarempresa")
      .select("empresa(id,nombre,simbolomoneda)")
      .eq("id_usuario", p.idusaurio)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;
  if (data?.empresa) return data;

  // New company admins are created as empresa.iduseradmin; older onboarding
  // does not necessarily create an asignarempresa row for the admin.
  const empresaPropia = await supabase
    .from("empresa")
    .select("id,nombre,simbolomoneda,id_usuario_alerta_stock,correo_alerta_stock")
    .eq("iduseradmin", p.idusaurio)
    .maybeSingle();
  if (
    empresaPropia.error &&
    (empresaPropia.error.code === "42703" || empresaPropia.error.code === "PGRST204")
  ) {
    const fallback = await supabase
      .from("empresa")
      .select("id,nombre,simbolomoneda")
      .eq("iduseradmin", p.idusaurio)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }
  if (empresaPropia.error) throw empresaPropia.error;
  return empresaPropia.data;
};
export const ContarUsuariosXempresa = async (p) => {
  const { data, error } = await supabase.rpc("contar_usuarios_por_empresa", {
    _id_empresa: p.id_empresa,
  });
  if (error) throw error;
  return data;
};

export async function ListarUsuariosEncargadosEmpresa(p) {
  const { data, error } = await supabase.rpc("listar_usuarios_encargados_empresa", {
    p_id_empresa: p.id_empresa,
  });
  if (error) throw error;
  return data ?? [];
}

export async function ActualizarConfiguracionEmpresa(p) {
  const { data, error } = await supabase.rpc("actualizar_configuracion_empresa", {
    p_id_empresa: p.id_empresa,
    p_nombre: p.nombre,
    p_id_usuario_alerta_stock: p.id_usuario_alerta_stock || null,
    p_correo_alerta_stock: p.correo_alerta_stock || null,
  });
  if (error) throw error;
  return data;
}
