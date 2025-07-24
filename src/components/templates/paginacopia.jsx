import styled from "styled-components";
import { Header } from "../../index";
import { useState } from "react";
export function pagina() {
  const [state, setState] = useState(false);
  return (
    <Container>
      <header className="header">
        <Header
          stateConfig={{ state: state, setState: () => setState(!state) }}
        />
      </header>
      <section className="area1"></section>
      <section className="area2"></section>
      <section className="main"></section>
    </Container>
  );
}
const Container = styled.div`
  height: 100vh;
  width: 100%;
  background-color: ${({ theme }) => theme.bgtotal};
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
    background-color: rgba(103, 80, 255, 0.1);
    display: flex;
    align-items: center;
  }
  .area1 {
    grid-area: area1;
    background-color: rgba(103, 80, 255, 0.2);
    display: flex;
    align-items: center;
  }
  .area2 {
    grid-area: area2;
    background-color: rgba(103, 80, 255, 0.3);
    display: flex;
    align-items: center;
  }
  .main {
    grid-area: main;
    background-color: rgba(103, 80, 255, 0.4);
    display: flex;
    align-items: center;
  }
`;
