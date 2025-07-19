import styled from "styled-components";
import { LinksArray, SecondarylinksArray, ToggleTema } from "../../index";
import { NavLink } from "react-router-dom";
import { v } from "../../styles/variables";
import { useState } from "react";
export function MenuHambur() {
  const [click, setClick] = useState(false);
  return (
    <Container>
      <NavBar>
        <section>
          <HamburgerMenu onClick={() => setClick(!click)}>
            <label
              className={click ? "toggle active" : "toggle"}
              for="checkbox"
            >
              <div class="bars" id="bar1"></div>
              <div class="bars" id="bar2"></div>
              <div class="bars" id="bar3"></div>
            </label>
          </HamburgerMenu>
        </section>
        <Menu $click={click.toString()}>
          {LinksArray.map(({ icon, label, to }) => (
            <div
              onClick={() => setClick(!click)}
              className="LinkContainer"
              key={label}
            >
              <NavLink to={to} className="Links">
                <div className="Linkicon">{icon}</div>
                <span>{label}</span>
              </NavLink>
            </div>
          ))}
          <Divider />
          {SecondarylinksArray.map(({ icon, label, to }) => (
            <div
              className="LinkContainer"
              key={label}
              onClick={() => setClick(!click)}
            >
              <NavLink to={to} className="Links">
                <div className="Linkicon">{icon}</div>
                <span>{label}</span>
              </NavLink>
            </div>
          ))}
          <ToggleTema />
          <Divider />
        </Menu>
      </NavBar>
    </Container>
  );
}

const Container = styled.div`
  background-color: ${({ theme }) => theme.body};
`;

const NavBar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100vh;
`;

const HamburgerMenu = styled.span`
  position: fixed;
  top: 2rem;
  z-index: 100;
  #checkbox {
    display: none;
  }

  .toggle {
    position: relative;
    width: 40px;
    height: 40px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition-duration: 0.5s;
    &.active {
      transition-duration: 0.5s;
      transform: rotate(180deg);
      .bars {
        position: absolute;
        transition-duration: 0.5s;
      }
      #bar2 {
        transform: scaleX(0);
        transition-duration: 0.5s;
      }
      #bar1 {
        width: 100%;
        transform: rotate(45deg);
        transition-duration: 0.5s;
      }
      #bar3 {
        width: 100%;
        transform: rotate(-45deg);
        transition-duration: 0.5s;
      }
    }
  }

  .bars {
    width: 100%;
    height: 4px;
    background-color: rgb(176, 92, 255);
    border-radius: 4px;
  }

  #bar2 {
    transition-duration: 0.8s;
  }

  #bar1,
  #bar3 {
    width: 70%;
  }
`;

const Menu = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  list-style: none;
  z-index: 10;
  @media;
`;
const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${(props) => props.theme.bg4};
  margin: ${() => v.lgSpacing} 0;
`;
