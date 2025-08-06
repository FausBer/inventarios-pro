import styled from "styled-components";
import {
  Btnsave,
  Buscador,
  ContentFiltro,
  Header,
  RegistrarKardex,
  RegistrarMarca,
  Tabs,
  Title,
  useKardexStore,
  v,
} from "../../index";
import { useState } from "react";
import { use } from "react";
export function KardexTemplate({ data }) {
  const [state, setState] = useState(false);
  const [dataSelect, setdataSelect] = useState([]);
  const [accion, setAccion] = useState("");
  const [openRegistro, SetopenRegistro] = useState(false);
  const [tipo, setTipo] = useState("");
  const nuevaentrada = () => {
    SetopenRegistro(true);
    setTipo("entrada");
  };
  const nuevasalida = () => {
    SetopenRegistro(true);
    setTipo("salida");
  };
  const { setBuscador } = useKardexStore();
  return (
    <Container>
      {openRegistro && (
        <RegistrarKardex
          tipo={tipo}
          dataSelect={dataSelect}
          accion={accion}
          onClose={() => SetopenRegistro(!openRegistro)}
        />
      )}

      <header className="header">
        <Header
          stateConfig={{ state: state, setState: () => setState(!state) }}
        />
      </header>
      <section className="area1">
        <ContentFiltro>
          <Title>Kardex</Title>
          <Btnsave
            bgcolor="#52de65"
            titulo="+entradas"
            funcion={nuevaentrada}
          />
          <Btnsave bgcolor="#fb6661" titulo="-salidas" funcion={nuevasalida} />
        </ContentFiltro>
      </section>
      <section className="area2">
        <Buscador setBuscador={setBuscador} />
      </section>
      <section className="main">
        <Tabs data={data} />
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
