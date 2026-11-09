import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Header, Title, useEmpresaStore, useUsuariosStore, supabase } from "../../index";

const estadoTexto = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  pausado: "Pausado",
  falta_insumos: "Faltan componentes",
  finalizado: "Finalizado",
};

export function EnsamblajeTemplate() {
  const [compacto, setCompacto] = useState(false);
  const [equipos, setEquipos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [equipoId, setEquipoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const { dataempresa } = useEmpresaStore();
  const { idusuario, datapermisos = [] } = useUsuariosStore();
  const puedeOperar = datapermisos.some((permiso) =>
    permiso.modulos?.nombre?.includes("Productos"),
  );

  const cargarDatos = useCallback(async () => {
    if (!dataempresa?.id) return;
    setCargandoDatos(true);
    const consultas = [
      supabase.from("avisos_ensamblaje").select("*")
        .eq("id_usuario_destino", idusuario)
        .order("creado_en", { ascending: false }),
    ];
    if (puedeOperar) {
      consultas.push(
        supabase.from("insumo").select("id, nombre, stock")
          .eq("id_empresa", dataempresa.id).order("nombre"),
        supabase.from("ensamblajes").select("*")
          .eq("id_empresa", dataempresa.id)
          .order("actualizado_en", { ascending: false }).limit(50),
      );
    }
    const resultados = await Promise.all(consultas);
    const resultadoAvisos = resultados[0];
    let errorCarga = resultadoAvisos.error?.message || "";
    if (!resultadoAvisos.error) setAvisos(resultadoAvisos.data ?? []);
    if (puedeOperar) {
      const resultadoEquipos = resultados[1];
      const resultadoOrdenes = resultados[2];
      if (resultadoEquipos.error || resultadoOrdenes.error) {
        errorCarga = resultadoEquipos.error?.message || resultadoOrdenes.error?.message;
      } else {
        setEquipos(resultadoEquipos.data ?? []);
        setOrdenes(resultadoOrdenes.data ?? []);
      }
    }
    setError(errorCarga);
    setCargandoDatos(false);
  }, [dataempresa?.id, idusuario, puedeOperar]);

  useEffect(() => {
    cargarDatos();
    if (!dataempresa?.id) return undefined;
    const timer = window.setInterval(cargarDatos, 30000);
    return () => window.clearInterval(timer);
  }, [cargarDatos, dataempresa?.id]);

  const equipoPorId = useMemo(
    () => new Map(equipos.map((equipo) => [String(equipo.id), equipo])),
    [equipos],
  );

  async function crearOrden(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    if (!equipoId || !Number.isInteger(Number(cantidad)) || Number(cantidad) < 1) {
      setError("Elegí un equipo y una cantidad entera mayor a cero.");
      return;
    }
    await ejecutarAccion(async () => {
      const { error: rpcError } = await supabase.rpc("crear_orden_ensamblaje", {
        p_insumo_final_id: Number(equipoId),
        p_cantidad: Number(cantidad),
        p_id_empresa: dataempresa.id,
      });
      if (rpcError) throw rpcError;
      setMensaje("Orden creada. Iníciala cuando esté todo listo para ensamblar.");
      setCantidad(1);
      await cargarDatos();
    });
  }

  async function ejecutarAccion(accion) {
    setCargando(true);
    setError("");
    try {
      await accion();
    } catch (err) {
      setError(err.message || "No se pudo completar la operación.");
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(rpc, ordenId) {
    await ejecutarAccion(async () => {
      const { data, error: rpcError } = await supabase.rpc(rpc, {
        p_ensamblaje_id: ordenId,
      });
      if (rpcError) throw rpcError;
      if (data?.mensaje) setMensaje(data.mensaje);
      else setMensaje(`Orden #${ordenId}: ${estadoTexto[data?.estado] || "actualizada"}.`);
      await cargarDatos();
    });
  }

  async function marcarAvisoLeido(avisoId) {
    await ejecutarAccion(async () => {
      const { error: rpcError } = await supabase.rpc("marcar_aviso_ensamblaje_leido", {
        p_aviso_id: avisoId,
      });
      if (rpcError) throw rpcError;
      await cargarDatos();
    });
  }

  return (
    <Container>
      <header>
        <Header stateConfig={{ state: compacto, setState: () => setCompacto(!compacto) }} />
      </header>

      <main>
        <div className="title-row">
          <div>
            <Title>Seguimiento de ensamblajes</Title>
            <p>Creá órdenes y seguí cada equipo desde el inicio hasta su finalización.</p>
          </div>
          <span className="company">{dataempresa?.nombre || "Mi empresa"}</span>
        </div>

        {avisos.length > 0 && (
          <section className="notices" aria-labelledby="notices-title">
            <div className="section-heading">
              <div>
                <h2 id="notices-title">Avisos para jefatura</h2>
                <p>Se actualizan automáticamente cada 30 segundos.</p>
              </div>
              <span className="badge">{avisos.filter((aviso) => !aviso.leida).length} sin leer</span>
            </div>
            {avisos.map((aviso) => (
              <article className={`notice ${aviso.leida ? "read" : "unread"}`} key={aviso.id}>
                <div>
                  <strong>{aviso.leida ? "Aviso leído" : "Requiere atención"}</strong>
                  <p>{aviso.mensaje}</p>
                  <small>{new Date(aviso.creado_en).toLocaleString()}</small>
                </div>
                {!aviso.leida && (
                  <button className="quiet" disabled={cargando} onClick={() => marcarAvisoLeido(aviso.id)}>
                    Marcar leído
                  </button>
                )}
              </article>
            ))}
          </section>
        )}

        {puedeOperar ? (
          <>
            <section className="create-card">
              <h2>Nueva orden</h2>
              <p>Al iniciar, se descuentan los componentes. Al finalizar, aumenta el stock del equipo terminado.</p>
              <form onSubmit={crearOrden}>
                <label htmlFor="equipo-final">Equipo final</label>
                <select id="equipo-final" value={equipoId} onChange={(event) => setEquipoId(event.target.value)} required>
                  <option value="">Seleccionar equipo</option>
                  {equipos.map((equipo) => (
                    <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                  ))}
                </select>
                {equipoPorId.get(equipoId) && (
                  <small>Stock terminado actual: {equipoPorId.get(equipoId).stock}</small>
                )}
                <label htmlFor="cantidad-orden">Cantidad a ensamblar</label>
                <input id="cantidad-orden" type="number" min="1" step="1" value={cantidad}
                  onChange={(event) => setCantidad(event.target.value)} required />
                <button type="submit" disabled={cargando || !equipoId}>
                  {cargando ? "Guardando…" : "Crear orden"}
                </button>
              </form>
            </section>

            <section className="orders">
              <div className="section-heading">
                <div><h2>Órdenes de la empresa</h2><p>Las órdenes pendientes todavía no consumen stock.</p></div>
                <button className="quiet" onClick={cargarDatos} disabled={cargandoDatos}>Actualizar</button>
              </div>
              {cargandoDatos ? <p>Cargando órdenes…</p> : ordenes.length === 0 ? (
                <div className="empty">Todavía no hay órdenes de ensamblaje.</div>
              ) : (
                <div className="order-list">
                  {ordenes.map((orden) => {
                    const equipo = equipoPorId.get(String(orden.id_insumo_final));
                    return (
                      <article className="order" key={orden.id}>
                        <div className="order-top">
                          <div>
                            <strong>Orden #{orden.id} · {equipo?.nombre || `Equipo ${orden.id_insumo_final}`}</strong>
                            <p>{orden.cantidad} unidad{orden.cantidad === 1 ? "" : "es"} · Actualizada {new Date(orden.actualizado_en).toLocaleString()}</p>
                          </div>
                          <span className={`status ${orden.estado}`}>{estadoTexto[orden.estado] || orden.estado}</span>
                        </div>
                        {orden.detalle_estado && <p className="order-detail">{orden.detalle_estado}</p>}
                        <div className="actions">
                          {(orden.estado === "pendiente" || orden.estado === "falta_insumos") && (
                            <button disabled={cargando} onClick={() => cambiarEstado("iniciar_ensamblaje", orden.id)}>
                              {orden.estado === "falta_insumos" ? "Reintentar inicio" : "Iniciar ensamblaje"}
                            </button>
                          )}
                          {orden.estado === "en_proceso" && (
                            <>
                              <button className="quiet" disabled={cargando} onClick={() => cambiarEstado("pausar_ensamblaje", orden.id)}>Pausar</button>
                              <button disabled={cargando} onClick={() => cambiarEstado("finalizar_ensamblaje", orden.id)}>Finalizar equipo</button>
                            </>
                          )}
                          {orden.estado === "pausado" && (
                            <>
                              <button className="quiet" disabled={cargando} onClick={() => cambiarEstado("iniciar_ensamblaje", orden.id)}>Reanudar</button>
                              <button disabled={cargando} onClick={() => cambiarEstado("finalizar_ensamblaje", orden.id)}>Finalizar equipo</button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="empty">Tu usuario necesita el permiso <strong>Productos</strong> para operar ensamblajes. Los avisos dirigidos a tu usuario aparecen arriba.</section>
        )}

        {mensaje && <p role="status" className="feedback success">{mensaje}</p>}
        {error && <p role="alert" className="feedback error">{error}</p>}
      </main>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  padding: 15px;
  background: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  header { height: 100px; display: flex; align-items: center; }
  main { max-width: 1100px; margin: 18px auto; display: grid; gap: 20px; }
  .title-row, .section-heading, .order-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .title-row > div > p, .section-heading p, .create-card > p { margin: 8px 0 0; opacity: .75; }
  .company, .badge, .status { border-radius: 999px; padding: 7px 12px; background: ${({ theme }) => theme.bgtgderecha}; white-space: nowrap; }
  .create-card, .orders, .notices { background: ${({ theme }) => theme.bg}; border-radius: 14px; padding: 22px; box-shadow: 0 3px 14px #00000012; }
  h2 { margin: 0; font-size: 1.2rem; }
  form { display: grid; grid-template-columns: minmax(180px, 2fr) minmax(130px, 1fr) auto; align-items: end; gap: 12px; margin-top: 20px; }
  form label { grid-row: 1; font-weight: 600; }
  form label:first-of-type { grid-column: 1; }
  form label:nth-of-type(2) { grid-column: 2; }
  form select, form input { grid-row: 2; }
  form select { grid-column: 1; }
  form input { grid-column: 2; }
  form small { grid-column: 1; grid-row: 3; }
  form button { grid-column: 3; grid-row: 2; }
  select, input { min-height: 44px; padding: 8px 12px; border: 1px solid #aaa; border-radius: 8px; background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text}; }
  button { min-height: 40px; padding: 9px 14px; border: 0; border-radius: 8px; background: #ef552b; color: white; font-weight: 700; cursor: pointer; }
  button.quiet { background: ${({ theme }) => theme.bgtgderecha}; color: ${({ theme }) => theme.text}; }
  button:disabled { opacity: .6; cursor: wait; }
  .orders { display: grid; gap: 18px; }
  .order-list { display: grid; gap: 12px; }
  .order, .notice { border: 1px solid ${({ theme }) => theme.bg4}; border-radius: 10px; padding: 16px; }
  .order-top p, .notice p { margin: 6px 0; opacity: .8; }
  .status.pendiente { background: #e5e7eb; color: #374151; }
  .status.en_proceso { background: #dbeafe; color: #1d4ed8; }
  .status.pausado, .status.falta_insumos { background: #fef3c7; color: #92400e; }
  .status.finalizado { background: #dcfce7; color: #166534; }
  .order-detail { margin: 12px 0; color: #a16207; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
  .notices { border-left: 5px solid #ef552b; }
  .notices .section-heading { margin-bottom: 14px; }
  .notice { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 10px; }
  .notice.unread { background: ${({ theme }) => theme.bgtgderecha}; }
  .notice small { opacity: .65; }
  .empty { padding: 24px; border: 1px dashed #999; border-radius: 10px; text-align: center; opacity: .8; }
  .feedback { margin: 0; padding: 12px 16px; border-radius: 8px; }
  .success { color: #16833b; background: #16833b15; }
  .error { color: #bd2929; background: #bd292915; }
  @media (max-width: 700px) {
    form { grid-template-columns: 1fr; }
    form label, form select, form input, form small, form button { grid-column: 1 !important; grid-row: auto !important; }
    .title-row, .order-top, .notice { flex-direction: column; }
  }
`;
