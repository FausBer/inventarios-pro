import { useEffect } from "react";
import styled from "styled-components";
import { v } from "../../../styles/variables";
import {
  InputText,
  Btnsave,
  useInsumoStore,
  ConvertirCapitalize,
} from "../../../index";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";

export function RegistrarInsumo({ onClose, dataSelect, accion }) {
  const { insertarInsumos, editarInsumos } = useInsumoStore();
  const { dataempresa } = useEmpresaStore();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  async function insertar(data) {
    const nombreCapitalizado = ConvertirCapitalize(data.nombre);

    if (accion === "Editar") {
      const p = {
        id: dataSelect.id,
        nombre: nombreCapitalizado,
      };
      await editarInsumos(p);
      onClose();
    } else {
      const p = {
        _nombre: nombreCapitalizado,
        _idempresa: dataempresa.id,
      };
      await insertarInsumos(p);
      onClose();
    }
  }

  useEffect(() => {
    if (accion === "Editar") {
      // Aquí podrías precargar datos si es necesario
    }
  }, []);

  return (
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <section>
            <h1>
              {accion === "Editar" ? "Editar insumo" : "Registrar nuevo insumo"}
            </h1>
          </section>

          <section>
            <span onClick={onClose}>x</span>
          </section>
        </div>

        <form className="formulario" onSubmit={handleSubmit(insertar)}>
          <section>
            <article>
              <InputText icono="u">
                <input
                  className="form__field"
                  defaultValue={dataSelect?.nombre}
                  type="text"
                  placeholder=""
                  {...register("nombre", { required: true })}
                />
                <label className="form__label">Nombre</label>
                {errors.nombre?.type === "required" && <p>Campo requerido</p>}
              </InputText>
            </article>

            <div className="btnguardarContent">
              <Btnsave
                icono={<v.iconoguardar />}
                titulo="Guardar"
                bgcolor="#ef552b"
              />
            </div>
          </section>
        </form>
      </div>
    </Container>
  );
}

const Container = styled.div`
  transition: 0.5s;
  top: 0;
  left: 0;
  position: fixed;
  background-color: rgba(10, 9, 9, 0.5);
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .sub-contenedor {
    width: 500px;
    max-width: 85%;
    border-radius: 20px;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 36px 20px 36px;
    z-index: 100;

    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h1 {
        font-size: 20px;
        font-weight: 500;
      }
      span {
        font-size: 20px;
        cursor: pointer;
      }
    }

    .formulario {
      section {
        gap: 20px;
        display: flex;
        flex-direction: column;
      }
    }
  }
`;
