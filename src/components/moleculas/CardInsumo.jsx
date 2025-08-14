import styled from "styled-components";
import fondocuadros from "../../assets/fondocuadros.svg";
import inventarioslogo from "../../assets/inventarioslogo.png";
import { Link } from "react-router-dom";

export function CardInsumo({ data }) {
  return (
    <Container>
      <div id="cards">
        {data?.map((item) => (
          <Link
            key={item.id}
            to={`/insumo-detalle/${item.id}`}
            className="card"
          >
            <div className="card-content">
              <div className="card-image">
                {/* Podrías poner un ícono genérico o imagen si tu tabla la tiene */}
                <img src={inventarioslogo} alt={item.nombre} />
              </div>
              <div className="card-info-wrapper">
                <div className="card-info">
                  <div className="card-info-title">
                    <h3>{item.nombre}</h3>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}

const Container = styled.div`
  --bg-color: rgb(20, 20, 20);
  --card-color: rgb(23, 23, 23);
  background-image: url(${fondocuadros});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat, repeat;
  align-items: center;
  background-color: ${({ theme }) => theme.bgtotal};
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;

  &::-webkit-scrollbar {
    width: 6px;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #484848;
    border-radius: 10px;
  }

  #cards {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    max-width: 1200px;
    width: 100%;
    justify-content: center;
  }

  .card {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    position: relative;
    width: 300px;
    flex: 1 1 300px; /* para que se encojan si hace falta */
    height: 260px;
    transition: 0.3s;
    border: 0.5px solid transparent;

    &:hover {
      border: 1px solid ${({ theme }) => theme.bg5};
      .card-image img {
        filter: grayscale(0);
      }
    }
  }

  .card-content {
    background-color: ${({ theme }) => theme.bgcards};
    border-radius: inherit;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 10px;
    position: absolute;
    inset: 1px;
    z-index: 2;
  }

  .card-image {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 140px;

    img {
      transition: 0.3s;
      height: 70%;
      filter: grayscale(100%);
    }
  }

  .card-info-wrapper {
    display: flex;
    flex-grow: 1;
    justify-content: flex-start;
    align-items: center;
    padding: 0 20px;
  }

  h1,
  h2,
  h3,
  h4,
  span,
  i {
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-family: "Rubik", sans-serif;
    font-weight: 600;
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 1000px) {
    .card {
      width: calc(50% - 12px);
      height: 240px;
    }
  }

  @media (max-width: 600px) {
    .card {
      width: calc(100% - 12px);
      height: 200px;
    }
    .card-image {
      height: 80px;
    }
  }
`;
