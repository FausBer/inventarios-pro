import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { Header, useEmpresaStore, useUsuariosStore } from "../index";

export function EmpresaConfig() {
  const { dataempresa, listarUsuariosEncargados, guardarConfiguracionEmpresa } =
    useEmpresaStore();
  const { datapermisos = [] } = useUsuariosStore();
  const [nombre, setNombre] = useState("");
  const [usuarioEncargado, setUsuarioEncargado] = useState("");
  const [correoAlerta, setCorreoAlerta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);
  const tienePermiso = datapermisos.some((permiso) =>
    permiso.modulos?.nombre?.includes("Tu empresa"),
  );

  const {
    data: usuarios = [],
    isLoading,
    error: errorUsuarios,
  } = useQuery({
    queryKey: ["usuarios encargados alertas stock", dataempresa?.id],
    queryFn: () => listarUsuariosEncargados({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id && tienePermiso,
  });

  useEffect(() => {
    setNombre(dataempresa?.nombre ?? "");
    setUsuarioEncargado(
      dataempresa?.id_usuario_alerta_stock
        ? String(dataempresa.id_usuario_alerta_stock)
        : "",
    );
    setCorreoAlerta(dataempresa?.correo_alerta_stock ?? "");
  }, [dataempresa?.id, dataempresa?.nombre, dataempresa?.id_usuario_alerta_stock, dataempresa?.correo_alerta_stock]);

  async function guardar(event) {
    event.preventDefault();
    setCargando(true);
    setErrorGuardar("");
    setGuardado(false);
    try {
      await guardarConfiguracionEmpresa({
        id_empresa: dataempresa.id,
        nombre,
        id_usuario_alerta_stock: usuarioEncargado || null,
        correo_alerta_stock: correoAlerta.trim() || null,
      });
      setGuardado(true);
    } catch (error) {
      setErrorGuardar(error.message || "No se pudo guardar la configuración.");
    } finally {
      setCargando(false);
    }
  }

  if (!tienePermiso) {
    return <Notice>No tenés permiso para editar la configuración de esta empresa.</Notice>;
  }

  return (
    <Container>
      <header>
        <Header stateConfig={{ state: sidebarAbierta, setState: () => setSidebarAbierta(!sidebarAbierta) }} />
      </header>
      <main>
        <div className="heading">
          <span className="eyebrow">CONFIGURACIÓN</span>
          <h1>Tu empresa</h1>
          <p>Actualizá el nombre y elegí quién recibe los avisos de stock mínimo.</p>
        </div>

        <form onSubmit={guardar}>
          <section className="field">
            <label htmlFor="nombre-empresa">Nombre de la empresa</label>
            <input
              id="nombre-empresa"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={120}
              required
            />
            <small>Este nombre se muestra en el sistema para los usuarios de la empresa.</small>
          </section>

          <section className="field">
            <label htmlFor="usuario-encargado">Encargado de avisos de stock mínimo</label>
            {isLoading ? (
              <p>Cargando usuarios…</p>
            ) : errorUsuarios ? (
              <p className="error">{errorUsuarios.message}</p>
            ) : (
              <select
                id="usuario-encargado"
                value={usuarioEncargado}
                onChange={(event) => setUsuarioEncargado(event.target.value)}
              >
                <option value="">Sin encargado asignado</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombres} · {usuario.correo}
                  </option>
                ))}
              </select>
            )}
            <small>Solo aparecen usuarios activos de esta empresa que tienen un correo registrado.</small>
          </section>

          <section className="field">
            <label htmlFor="correo-alerta">Correo real para recibir los avisos</label>
            <input
              id="correo-alerta"
              type="email"
              autoComplete="email"
              value={correoAlerta}
              onChange={(event) => setCorreoAlerta(event.target.value)}
              placeholder="encargado@empresa.com"
              disabled={!usuarioEncargado}
              required={Boolean(usuarioEncargado)}
            />
            <small>Este correo recibe las alertas aunque el correo de acceso del usuario sea ficticio. No cambia sus datos de inicio de sesión.</small>
          </section>

          {errorGuardar && <p className="error" role="alert">{errorGuardar}</p>}
          {guardado && <p className="success" role="status">Configuración guardada.</p>}
          <button type="submit" disabled={cargando || isLoading || !!errorUsuarios}>
            {cargando ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </main>
    </Container>
  );
}

const Notice = styled.p`
  padding: 2rem;
  color: ${({ theme }) => theme.text};
`;

const Container = styled.div`
  min-height:100vh;
  width:100%;
  padding:15px;
  color:${({ theme }) => theme.text};
  background:${({ theme }) => theme.bgtotal};
  header { height:90px; display:flex; align-items:center; }
  main { max-width:850px; margin:20px auto; padding:clamp(18px,4vw,36px); background:${({ theme }) => theme.bg}; border:1px solid ${({ theme }) => theme.bg4}; border-radius:16px; }
  .heading { margin-bottom:28px; }
  .eyebrow { font-size:.75rem; color:#e45c35; letter-spacing:.12em; font-weight:800; }
  h1 { margin:6px 0; }
  .heading p, small { opacity:.7; }
  form { display:grid; gap:24px; }
  .field { display:grid; gap:8px; }
  label { font-weight:700; }
  input, select { width:100%; border:1px solid ${({ theme }) => theme.bg4}; border-radius:9px; padding:12px; color:${({ theme }) => theme.text}; background:${({ theme }) => theme.bgtotal}; }
  small { font-size:.82rem; }
  button { justify-self:start; border:0; border-radius:9px; background:#df5e35; color:white; font-weight:700; padding:12px 18px; cursor:pointer; }
  button:disabled { opacity:.6; cursor:wait; }
  .error { color:#bd3434; }
  .success { color:#24894d; }
`;
