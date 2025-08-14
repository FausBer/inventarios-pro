import { useState } from "react";
import styled from "styled-components";
import {
  Header,
  Buscador,
  TablaInsumoDetalle,
  RegistrarInsumo,
  Title,
  ContentFiltro,
  TablaInsumo,
  useInsumoStore,
  v,
} from "../../index";

export function InsumoDetalleTemplate({
  data,
  nombreInsumo,
  tienePermisoCostos = false,
  productos = [],
}) {
  const [state, setState] = useState(false);
  const [dataSelect, setdataSelect] = useState([]);
  const [accion, setAccion] = useState("");
  const [openRegistro, SetopenRegistro] = useState(false);

  const nuevoRegistro = () => {
    SetopenRegistro(!openRegistro);
    setAccion("Nuevo");
    setdataSelect([]);
  };

  return (
    <Container>
      <header className="header">
        <Header
          stateConfig={{ state: state, setState: () => setState(!state) }}
        />
      </header>

      <section className="area1">
        <ContentFiltro>
          <Title>{nombreInsumo}</Title>
        </ContentFiltro>
      </section>

      <section className="area2">
        <Buscador setBuscador={() => {}} />
      </section>

      {/* Tabla de insumo detalle */}
      <section className="main">
        <TablaInsumoDetalle
          data={data}
          productos={productos}
          tienePermisoCostos={tienePermisoCostos}
        />
      </section>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: ${(props) => props.theme.bgtotal};
  color: ${({ theme }) => theme.text};
  display: grid;
  padding: 15px;
  grid-template:
    "header" 100px
    "area1" 100px
    "area2" 100px
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
  }
  .area2 {
    grid-area: area2;
    /* background-color: rgba(77, 237, 106, 0.14); */
    display: flex;
    align-items: center;
    justify-content: end;
  }
  .main {
    grid-area: main;
    /* background-color: rgba(179, 46, 241, 0.14); */
  }
`;
