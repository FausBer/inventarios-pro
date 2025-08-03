import styled from "styled-components";
import { useEffect } from "react";
import { useDolarStore } from "../../index"; // Ajustá la ruta según tu estructura

export function BoxCotizacionDolar({ bgcolor = "#e8f4f8" }) {
  const { cotizacion, cargarCotizacion } = useDolarStore();

  useEffect(() => {
    cargarCotizacion();
    const interval = setInterval(cargarCotizacion, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cargarCotizacion]);

  return (
    <CotizacionBox $bgcolor={bgcolor}>
      <span className="icon">💵</span>
      <div className="cotizacion-texto">
        <h4>Dólar oficial</h4>
        <p>{cotizacion ? `$${cotizacion}` : "Cargando..."}</p>
      </div>
    </CotizacionBox>
  );
}
const CotizacionBox = styled.div`
  background-color: rgba(255, 88, 58, 0.86);
  border-radius: 12px;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin-left: 1rem;
  border: 1px solid ${(props) => props.theme.bg4};
  min-width: 160px;

  .icon {
    font-size: 1.5rem;
    color: ${(props) => props.theme.text};
  }

  .cotizacion-texto {
    display: flex;
    flex-direction: column;

    h4 {
      margin: 0;
      font-size: 0.9rem;
      color: ${(props) => props.theme.text};
      font-weight: 600;
    }

    p {
      margin: 0.2rem 0 0;
      font-size: 1.3rem;
      font-weight: bold;
      color: ${(props) => props.theme.text};
    }
  }

  /* Media queries para responsividad */

  @media (max-width: 600px) {
    min-width: 120px;
    padding: 0.8rem 1rem;
    gap: 0.6rem;

    .icon {
      font-size: 1.3rem;
    }

    .cotizacion-texto {
      h4 {
        font-size: 0.85rem;
      }

      p {
        font-size: 1.1rem;
      }
    }
  }

  @media (max-width: 400px) {
    flex-direction: column;
    min-width: auto;
    padding: 0.6rem 0.8rem;
    gap: 0.4rem;
    margin-left: 0;

    .icon {
      font-size: 1.6rem;
    }

    .cotizacion-texto {
      align-items: center;
      text-align: center;

      h4 {
        font-size: 0.85rem;
      }

      p {
        font-size: 1.2rem;
      }
    }
  }
`;
