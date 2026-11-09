import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { supabase } from "../supabase/supabase.config";

export function RestablecerContrasena() {
  const [sesionLista, setSesionLista] = useState(false);
  const [tieneSesion, setTieneSesion] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let activo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (activo) {
        setTieneSesion(Boolean(data.session));
        setSesionLista(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (activo) setTieneSesion(Boolean(session));
    });
    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function guardar(event) {
    event.preventDefault();
    setError("");
    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (contrasena !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    const { error: errorActualizar } = await supabase.auth.updateUser({ password: contrasena });
    setCargando(false);
    if (errorActualizar) {
      setError(errorActualizar.message);
      return;
    }
    await supabase.auth.signOut();
    setGuardado(true);
  }

  return (
    <Container>
      <section className="card">
        <h1>Crear contraseña nueva</h1>
        {!sesionLista ? (
          <p>Verificando el enlace…</p>
        ) : guardado ? (
          <>
            <p className="success">La contraseña se actualizó. Ya podés iniciar sesión.</p>
            <Link className="link-button" to="/login">Volver al inicio de sesión</Link>
          </>
        ) : !tieneSesion ? (
          <>
            <p>El enlace venció o ya fue utilizado. Solicitá uno nuevo desde el inicio de sesión.</p>
            <Link className="link-button" to="/login">Volver al inicio de sesión</Link>
          </>
        ) : (
          <form onSubmit={guardar}>
            <label htmlFor="nueva-contrasena">Nueva contraseña</label>
            <input
              id="nueva-contrasena"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
            />
            <label htmlFor="confirmar-contrasena">Repetí la contraseña</label>
            <input
              id="confirmar-contrasena"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
            />
            {error && <p className="error" role="alert">{error}</p>}
            <button type="submit" disabled={cargando}>
              {cargando ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </section>
    </Container>
  );
}

const Container = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #262626;
  .card { width: min(100%, 460px); padding: 32px; border-radius: 14px; background: #fff; color: #262626; }
  h1 { margin-top: 0; }
  form { display: grid; gap: 12px; }
  input { padding: 12px; border: 1px solid #bbb; border-radius: 8px; font: inherit; }
  button, .link-button { display: inline-block; width: fit-content; margin-top: 8px; padding: 12px 16px; border: 0; border-radius: 8px; background: #fc6b32; color: #fff; font: inherit; text-decoration: none; cursor: pointer; }
  button:disabled { opacity: .6; cursor: wait; }
  .error { color: #bd3434; }
  .success { color: #24894d; }
`;
