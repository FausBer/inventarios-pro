import styled from "styled-components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v } from "../../../styles/variables";
import { useAuthStore } from "../../../store/AuthStore";
export function SidebarCard() {
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState("");

  async function cerrarSesion() {
    if (cerrando) return;
    setCerrando(true);
    setError("");
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo cerrar la sesión.");
    } finally {
      setCerrando(false);
    }
  }

  return (
    <Container>
      <span className="icon">{<v.iconoayuda />}</span>
      <div className="cardContent">
        <div className="circle1"></div>
        <div className="circle2"></div>
        <h3>Cerrar sesión</h3>
        <div className="contentBtn">
          <button type="button" onClick={cerrarSesion} disabled={cerrando}>
            {cerrando ? "Cerrando…" : "Cerrar sesión"}
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      </div>
    </Container>
  );
}
const Container = styled.div`
  width: 100%;
  padding: 1rem;
  text-align: center;
  position: relative;


  .icon {
    position: absolute;
    font-size: 3rem;
    border-radius: 50%;
    top: -8px;
    right: 50%;
    transform: translate(50%);
    z-index: 100;
  }
  .cardContent {
    position: relative;
    padding: 1rem;
    background: ${(props) => props.theme.bg5};
    border-radius: 10px;
    overflow: hidden;

    .circle1,
    .circle2 {
      position: absolute;
      background: ${(props) => props.theme.whiteBg};
      border-radius: 50%;
      opacity: 0.7;
    }
    .circle1 {
      height: 100px;
      width: 100px;
      top: -50px;
      left: -50px;
    }
    .circle2 {
      height: 130px;
      width: 130px;
      bottom: -80px;
      right: -70px;
    }
    h3 {
      font-size: 1.1rem;
      margin-top: 1rem;
      padding: 1rem 0;
      font-weight: 800;
      color: #000;
    }
    .contentBtn {
      position:relative;
      margin-left:-8px;
      button {
        border: 0;
        border-radius: 7px;
        padding: 10px 14px;
        background: #f8f2fd;
        color: #222;
        font-weight: 700;
        cursor: pointer;
      }
      button:disabled { opacity: .65; cursor: wait; }
      p { color: #7d1717; font-size: .8rem; overflow-wrap: anywhere; }
    }
  }
`;
