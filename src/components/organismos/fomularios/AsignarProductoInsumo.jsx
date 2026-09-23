import { useEffect, useState } from "react";
import { useStore } from "../../../store/AsignarInsumoStore";

export default function AsignarProductoInsumo() {
  const {
    productos,
    insumos,
    fetchProductos,
    fetchInsumos,
    asignarProductoAInsumo,
  } = useStore();

  const [productoId, setProductoId] = useState("");
  const [insumoId, setInsumoId] = useState("");

  useEffect(() => {
    fetchProductos();
    fetchInsumos();
  }, [fetchProductos, fetchInsumos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await asignarProductoAInsumo(productoId, insumoId);
      setProductoId("");
      setInsumoId("");
      alert("✅ Relación creada entre producto e insumo");
    } catch (err) {
      console.error(err);
      alert("❌ Error al asignar producto a insumo");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded-xl">
      <h2 className="text-xl font-bold mb-2">Asignar producto a insumo</h2>

      {/* Selección de insumo */}
      <select
        value={insumoId}
        onChange={(e) => setInsumoId(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      >
        <option value="">Selecciona un insumo</option>
        {insumos.map((i) => (
          <option key={i.id} value={i.id}>
            {i.nombre}
          </option>
        ))}
      </select>

      {/* Selección de producto */}
      <select
        value={productoId}
        onChange={(e) => setProductoId(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      >
        <option value="">Selecciona un producto</option>
        {productos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Asignar
      </button>
    </form>
  );
}
