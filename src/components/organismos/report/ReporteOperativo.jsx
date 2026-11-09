import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { supabase, useEmpresaStore } from "../../../index";

const ahora = new Date();
const anioActual = ahora.getFullYear();
const aniosDisponibles = Array.from({ length: 8 }, (_, index) => anioActual - index);

function obtenerRango(tipo, anio, mes, semestre) {
  const anioNumero = Number(anio);
  if (tipo === "mes") {
    const inicio = new Date(anioNumero, Number(mes) - 1, 1);
    const fin = new Date(anioNumero, Number(mes), 1);
    return { desde: fechaISO(inicio), hasta: fechaISO(fin) };
  }
  if (tipo === "semestre") {
    const mesInicio = semestre === "1" ? 0 : 6;
    return {
      desde: fechaISO(new Date(anioNumero, mesInicio, 1)),
      hasta: fechaISO(new Date(anioNumero, mesInicio + 6, 1)),
    };
  }
  return {
    desde: fechaISO(new Date(anioNumero, 0, 1)),
    hasta: fechaISO(new Date(anioNumero + 1, 0, 1)),
  };
}

function fechaISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function numero(valor) {
  return Number(valor || 0).toLocaleString("es-AR", { maximumFractionDigits: 3 });
}

function nombrePeriodo(tipo, anio, mes, semestre) {
  if (tipo === "mes") {
    return new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  }
  if (tipo === "semestre") return `${semestre}° semestre de ${anio}`;
  return `Año ${anio}`;
}

function descargarCSV(reporte, periodo) {
  if (!reporte) return;
  const filas = [
    ["REPORTE OPERATIVO", periodo],
    [],
    ["RESUMEN"],
    ["Equipos finales terminados", reporte.resumen.equipos_terminados],
    ["Órdenes finalizadas", reporte.resumen.ordenes_finalizadas],
    ["Órdenes creadas", reporte.resumen.ordenes_creadas],
    ["Componentes ingresados", reporte.resumen.componentes_entrantes],
    ["Componentes egresados", reporte.resumen.componentes_salientes],
    ["Consumo por ensamblaje", reporte.resumen.consumo_ensamblaje],
    [],
    ["PRODUCCIÓN POR EQUIPO FINAL"],
    ["Equipo final", "Unidades terminadas", "Órdenes"],
    ...reporte.produccion.map((item) => [item.equipo_final, item.unidades, item.ordenes]),
    [],
    ["CONSUMO DE COMPONENTES POR ENSAMBLAJE"],
    ["Componente", "Cantidad consumida", "Movimientos"],
    ...reporte.consumo.map((item) => [item.componente, item.cantidad, item.movimientos]),
    [],
    ["ENTRADAS Y SALIDAS DE COMPONENTES"],
    ["Componente", "Entradas", "Salidas", "Salidas por ensamblaje", "Mov. entrada", "Mov. salida"],
    ...reporte.movimientos.map((item) => [
      item.componente,
      item.entradas,
      item.salidas,
      item.consumo_ensamblaje,
      item.movimientos_entrada,
      item.movimientos_salida,
    ]),
  ];
  const contenido = filas
    .map((fila) => fila.map((celda) => `"${String(celda ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\r\n");
  const archivo = new Blob([`\uFEFF${contenido}`], { type: "text/csv;charset=utf-8" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = `reporte-operativo-${periodo.toLowerCase().replaceAll(" ", "-")}.csv`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

export default function ReporteOperativo() {
  const [tipo, setTipo] = useState("mes");
  const [anio, setAnio] = useState(String(anioActual));
  const [mes, setMes] = useState(String(ahora.getMonth() + 1));
  const [semestre, setSemestre] = useState(ahora.getMonth() < 6 ? "1" : "2");
  const { dataempresa } = useEmpresaStore();
  const rango = useMemo(
    () => obtenerRango(tipo, anio, mes, semestre),
    [tipo, anio, mes, semestre],
  );
  const periodo = nombrePeriodo(tipo, anio, mes, semestre);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reporte operativo", dataempresa?.id, rango.desde, rango.hasta],
    queryFn: async () => {
      const { data: resultado, error: rpcError } = await supabase.rpc(
        "reporte_operativo_periodo",
        {
          p_id_empresa: dataempresa.id,
          p_desde: rango.desde,
          p_hasta: rango.hasta,
        },
      );
      if (rpcError) throw rpcError;
      return resultado;
    },
    enabled: !!dataempresa?.id,
  });

  const resumen = data?.resumen;
  return (
    <Container>
      <div className="heading">
        <div>
          <span className="eyebrow">ANÁLISIS DE OPERACIONES</span>
          <h1>Producción y consumo</h1>
          <p>Revisá equipos terminados, consumo de componentes y movimientos del período.</p>
        </div>
        <button className="export" type="button" disabled={!data} onClick={() => descargarCSV(data, periodo)}>
          Descargar CSV
        </button>
      </div>

      <section className="filters" aria-label="Filtros del reporte">
        <label>
          Período
          <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
            <option value="mes">Mensual</option>
            <option value="semestre">Semestral</option>
            <option value="anio">Anual</option>
          </select>
        </label>
        <label>
          Año
          <select value={anio} onChange={(event) => setAnio(event.target.value)}>
            {aniosDisponibles.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
          </select>
        </label>
        {tipo === "mes" && (
          <label>
            Mes
            <select value={mes} onChange={(event) => setMes(event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => {
                const numeroMes = index + 1;
                const nombre = new Date(2024, index, 1).toLocaleDateString("es-AR", { month: "long" });
                return <option key={numeroMes} value={numeroMes}>{nombre}</option>;
              })}
            </select>
          </label>
        )}
        {tipo === "semestre" && (
          <label>
            Semestre
            <select value={semestre} onChange={(event) => setSemestre(event.target.value)}>
              <option value="1">Primer semestre (enero a junio)</option>
              <option value="2">Segundo semestre (julio a diciembre)</option>
            </select>
          </label>
        )}
        <div className="selected-period">
          <span>Mostrando</span>
          <strong>{periodo}</strong>
        </div>
      </section>

      {isLoading && <div className="message">Cargando el reporte…</div>}
      {error && (
        <div className="error" role="alert">
          <strong>No se pudo cargar el reporte.</strong>
          <span>{error.message}</span>
          {error.message?.includes("reporte_operativo_periodo") && (
            <small>Ejecutá la migración <code>20261109_reporte_operativo.sql</code> en el SQL Editor de Supabase.</small>
          )}
          <button type="button" onClick={() => refetch()}>Reintentar</button>
        </div>
      )}

      {data && resumen && (
        <>
          <section className="metrics" aria-label="Resumen del período">
            <Metric><span>Equipos terminados</span><strong>{numero(resumen.equipos_terminados)}</strong><small>{numero(resumen.ordenes_finalizadas)} órdenes finalizadas</small></Metric>
            <Metric><span>Consumo por ensamblaje</span><strong>{numero(resumen.consumo_ensamblaje)}</strong><small>unidades de componentes</small></Metric>
            <Metric><span>Entradas de componentes</span><strong>{numero(resumen.componentes_entrantes)}</strong><small>unidades ingresadas</small></Metric>
            <Metric><span>Salidas de componentes</span><strong>{numero(resumen.componentes_salientes)}</strong><small>incluye consumo de ensamblaje</small></Metric>
          </section>

          <section className="panel process">
            <div className="panel-heading">
              <div><h2>Estado del proceso</h2><p>Órdenes creadas durante el período y su estado actual.</p></div>
              <strong>{numero(resumen.ordenes_creadas)} órdenes</strong>
            </div>
            <div className="states">
              <State><span>Pendientes</span><strong>{numero(resumen.ordenes_pendientes)}</strong></State>
              <State><span>En proceso</span><strong>{numero(resumen.ordenes_en_proceso)}</strong></State>
              <State><span>Pausadas</span><strong>{numero(resumen.ordenes_pausadas)}</strong></State>
              <State><span>Faltan componentes</span><strong>{numero(resumen.ordenes_con_faltantes)}</strong></State>
            </div>
          </section>

          <section className="tables">
            <DataPanel title="Producción por equipo final" subtitle="Unidades que se terminaron dentro del período.">
              <table><thead><tr><th>Equipo final</th><th>Unidades</th><th>Órdenes</th></tr></thead>
                <tbody>{data.produccion.length ? data.produccion.map((row) => <tr key={row.equipo_final}><td>{row.equipo_final}</td><td>{numero(row.unidades)}</td><td>{numero(row.ordenes)}</td></tr>) : <EmptyRow cols={3} />}</tbody>
              </table>
            </DataPanel>
            <DataPanel title="Consumo de componentes" subtitle="Salidas de stock registradas al iniciar ensamblajes.">
              <table><thead><tr><th>Componente</th><th>Cantidad consumida</th><th>Movimientos</th></tr></thead>
                <tbody>{data.consumo.length ? data.consumo.map((row) => <tr key={row.componente}><td>{row.componente}</td><td>{numero(row.cantidad)}</td><td>{numero(row.movimientos)}</td></tr>) : <EmptyRow cols={3} />}</tbody>
              </table>
            </DataPanel>
            <DataPanel title="Entradas y salidas" subtitle="Movimientos de componentes registrados en el kardex.">
              <table><thead><tr><th>Componente</th><th>Entradas</th><th>Salidas</th><th>Por ensamblaje</th></tr></thead>
                <tbody>{data.movimientos.length ? data.movimientos.map((row) => <tr key={row.componente}><td>{row.componente}</td><td className="positive">+{numero(row.entradas)}</td><td className="negative">−{numero(row.salidas)}</td><td>{numero(row.consumo_ensamblaje)}</td></tr>) : <EmptyRow cols={4} />}</tbody>
              </table>
            </DataPanel>
          </section>
          <p className="footnote">Los movimientos se agrupan por fecha del kardex. La producción se agrupa por fecha de finalización; el estado de proceso refleja el estado actual de las órdenes creadas en el período.</p>
        </>
      )}
    </Container>
  );
}

function EmptyRow({ cols }) {
  return <tr><td className="empty" colSpan={cols}>No hay movimientos para este período.</td></tr>;
}

function DataPanel({ title, subtitle, children }) {
  return <section className="panel data-panel"><div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="table-scroll">{children}</div></section>;
}

const Container = styled.main`
  --report-border: ${({ theme }) => theme.bg4};
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  .heading, .panel-heading { display:flex; justify-content:space-between; align-items:center; gap:16px; }
  .heading h1 { margin:5px 0; font-size:clamp(1.5rem, 3vw, 2rem); }
  .heading p, .panel-heading p { margin:4px 0 0; opacity:.72; }
  .eyebrow { color:#e45c35; font-size:.72rem; letter-spacing:.12em; font-weight:800; }
  .export, .error button { border:0; border-radius:9px; padding:11px 16px; color:white; background:#df5e35; font-weight:700; cursor:pointer; }
  .export:disabled { opacity:.5; cursor:not-allowed; }
  .filters, .panel { border:1px solid var(--report-border); background:${({ theme }) => theme.bg}; border-radius:14px; }
  .filters { padding:14px; display:flex; align-items:end; gap:14px; flex-wrap:wrap; }
  label { display:grid; gap:6px; font-size:.82rem; font-weight:700; }
  select { min-width:135px; max-width:100%; border:1px solid var(--report-border); color:${({ theme }) => theme.text}; background:${({ theme }) => theme.bgtotal}; border-radius:8px; padding:10px; }
  .selected-period { margin-left:auto; display:grid; gap:3px; opacity:.75; font-size:.8rem; text-align:right; }
  .selected-period strong { color:${({ theme }) => theme.text}; font-size:.95rem; text-transform:capitalize; }
  .metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
  .message, .error { border-radius:12px; padding:16px; background:${({ theme }) => theme.bg}; }
  .error { display:grid; gap:8px; border:1px solid #e99; }
  .error button { justify-self:start; }
  .error small { opacity:.75; }
  .panel { padding:18px; }
  .process .panel-heading { margin-bottom:14px; }
  .states { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
  .tables { display:grid; gap:14px; }
  .table-scroll { overflow-x:auto; margin-top:14px; }
  table { width:100%; border-collapse:collapse; min-width:480px; text-align:left; }
  th,td { padding:11px 10px; border-bottom:1px solid var(--report-border); }
  th { opacity:.7; font-size:.78rem; white-space:nowrap; }
  td { font-size:.9rem; }
  .positive { color:#26955a; font-weight:700; }
  .negative { color:#ce4e4e; font-weight:700; }
  .empty { text-align:center; opacity:.65; padding:22px; }
  .footnote { font-size:.78rem; line-height:1.5; opacity:.68; margin:0 2px; }
  @media(max-width:900px) { .metrics { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media(max-width:580px) { .heading { align-items:flex-start; flex-direction:column; } .selected-period { margin-left:0; text-align:left; } .metrics,.states { grid-template-columns:repeat(2,minmax(0,1fr)); } }
`;

const Metric = styled.article`
  min-width:0; padding:17px; border-radius:13px; border:1px solid ${({ theme }) => theme.bg4}; background:${({ theme }) => theme.bg}; display:grid; gap:6px;
  span { font-size:.8rem; opacity:.72; }
  strong { font-size:clamp(1.4rem,3vw,2rem); }
  small { font-size:.75rem; opacity:.65; }
`;

const State = styled.div`
  padding:13px; display:flex; justify-content:space-between; align-items:center; gap:8px; background:${({ theme }) => theme.bgtotal}; border-radius:10px;
  span { font-size:.84rem; opacity:.76; }
  strong { font-size:1.25rem; }
`;
