import { useEffect, useState } from "react";
import { useStore } from "../../../store/AsignarInsumoStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";

export default function AsignarProductoInsumo() {
  const {
    productos,
    insumos,
    fetchProductos,
    fetchInsumos,
    asignarProductoAInsumo,
  } = useStore();
  const { dataempresa } = useEmpresaStore();

  const [productoId, setProductoId] = useState("");
  const [insumoId, setInsumoId] = useState("");
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    setProductoId("");
    setInsumoId("");
    if (!dataempresa?.id) return;
    fetchProductos(dataempresa.id);
    fetchInsumos(dataempresa.id);
  }, [dataempresa?.id, fetchProductos, fetchInsumos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await asignarProductoAInsumo(productoId, insumoId, Number(cantidad), dataempresa?.id);
      setProductoId("");
      setInsumoId("");
      setCantidad(1);
      alert("✅ Componente asignado al equipo final");
    } catch (err) {
      console.error(err);
      alert("❌ Error al asignar producto a insumo");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded-xl">
      <h2 className="text-xl font-bold mb-2">Asignar componente a equipo final</h2>

      {/* Selección del equipo final */}
      <select
        value={insumoId}
        onChange={(e) => setInsumoId(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      >
        <option value="">Seleccioná un equipo final</option>
        {insumos.map((i) => (
          <option key={i.id} value={i.id}>
            {i.nombre}
          </option>
        ))}
      </select>

      {/* Selección del componente */}
      <select
        value={productoId}
        onChange={(e) => setProductoId(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      >
        <option value="">Seleccioná un componente</option>
        {productos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.descripcion}
          </option>
        ))}
      </select>

      <label htmlFor="cantidad-componente">Cantidad del componente por equipo</label>
      <input
        id="cantidad-componente"
        type="number"
        min="0.001"
        step="0.001"
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        required
      />

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Asignar
      </button>
    </form>
  );
}
