import styled from "styled-components";
import {
  Btnfiltro,
  Buscador,
  ContentFiltro,
  Header,
  RegistrarInsumo,
  CardInsumo,
  Title,
  useInsumoStore,
  v,
} from "../../index";
import { useState } from "react";

export function InsumoTemplate({ data }) {
  const [state, setState] = useState(false);
  const [dataSelect, setdataSelect] = useState([]);
  const [accion, setAccion] = useState("");
  const [openRegistro, SetopenRegistro] = useState(false);

  const nuevoRegistro = () => {
    SetopenRegistro(!openRegistro);
    setAccion("Nuevo");
    setdataSelect([]);
  };

  const { setBuscador } = useInsumoStore();

  return (
    <Container>
      <header className="header">
        <Header
          stateConfig={{ state: state, setState: () => setState(!state) }}
        />
      </header>

      <section className="area1">
        <ContentFiltro>
          <Title>Equipos finales</Title>
        </ContentFiltro>
      </section>

      <section className="main">
        <CardInsumo data={data} />
      </section>
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  height: 100vh;
  width: 100%;
  background-color: ${(props) => props.theme.bgtotal};
  color: ${({ theme }) => theme.text};
  display: grid;
  padding: 15px;
  grid-template:
    "header" 100px
    "area1" 100px
    "main" auto;
  .header {
    grid-area: header;
    /* background-color: rgba(103, 93, 241, 0.14); */
    display: flex;
    align-items: center;
  }
  .area1 {
    grid-area: area1;
    /* background-color: rgba(229, 67, 26, 0.14); */
    display: flex;
    align-items: center;
    justify-content: end;
  }

  .main {
    grid-area: main;
    /* background-color: rgba(179, 46, 241, 0.14); */
  }
  
  @media (max-width: 1000px) {
    body {
      align-items: flex-start;
      overflow: auto;
    }
`;
