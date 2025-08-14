import { supabase } from "../index";
import Swal from "sweetalert2";

export async function InsertarInsumos(p) {
  const { error } = await supabase.rpc("insertarinsumo", p);
  if (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
      footer: '<a href="">Agregue un nuevo nombre</a>',
    });
  }
}

export async function MostrarInsumos(p) {
  const { data } = await supabase
    .from("insumo")
    .select()
    .eq("id_empresa", p.id_empresa)
    .order("id", { ascending: true });
  return data;
}

export async function EliminarInsumos(p) {
  const { error } = await supabase.from("insumo").delete().eq("id", p.id);
  if (error) {
    alert("Error al eliminar", error.message);
  }
}

export async function EditarInsumos(p) {
  const { error } = await supabase.from("insumo").update(p).eq("id", p.id);
  if (error) {
    alert("Error al editar insumo", error.message);
  }
}

export async function BuscarInsumos(p) {
  const { data } = await supabase
    .from("insumo")
    .select()
    .eq("id_empresa", p.id_empresa)
    .ilike("nombre", "%" + p.nombre + "%");
  return data;
}

export async function MostrarProductosPorInsumo(p) {
  const { data, error } = await supabase.rpc("mostrar_productos_por_insumo", {
    _id_insumo: id_insumo,
  });
  if (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
      footer: '<a href="">Agregue un nuevo nombre</a>',
    });
  }
  return data;
}
