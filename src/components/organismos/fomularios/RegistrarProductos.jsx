import { useEffect, useState } from "react";
import styled from "styled-components";
import { v } from "../../../styles/variables";
import { Device } from "../../../styles/breackpoints";
import {
  InputText,
  Btnsave,
  ConvertirCapitalize,
  useProductosStore,
  ContainerSelector,
  Selector,
  useMarcaStore,
  Btnfiltro,
  RegistrarMarca,
  ListaGenerica,
  useCategoriasStore,
  RegistrarCategorias,
} from "../../../index";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { supabase } from "../../../supabase/supabase.config";
import Swal from "sweetalert2";
export function RegistrarProductos({ onClose, dataSelect, accion }) {
  const { insertarproductos, editarproductos } = useProductosStore();
  const { dataempresa } = useEmpresaStore();
  const { marcaItemSelect, datamarca, selectMarca } = useMarcaStore();
  const { categoriasItemSelect, datacategorias, selectcategorias } =
    useCategoriasStore();
  const [stateMarca, setStateMarca] = useState(false);
  const [stateCategoria, setStateCategoria] = useState(false);
  const [openRegistroMarca, SetopenRegistroMarca] = useState(false);
  const [openRegistroCategoria, SetopenRegistroCategoria] = useState(false);
  const [subaccion, setAccion] = useState("");
  const [insumos, setInsumos] = useState([]);
  const [insumoFinalId, setInsumoFinalId] = useState("");
  const [cantidadComponente, setCantidadComponente] = useState("1");
  const [guardando, setGuardando] = useState(false);
  const nuevoRegistroMarca = () => {
    SetopenRegistroMarca(!openRegistroMarca);
    setAccion("Nuevo");
  };
  const nuevoRegistroCategoria = () => {
    SetopenRegistroCategoria(!openRegistroCategoria);
    setAccion("Nuevo");
  };
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  useEffect(() => {
    if (!dataempresa?.id) return;
    let activo = true;
    async function cargarInsumos() {
      const { data, error } = await supabase
        .from("insumo")
        .select("id, nombre")
        .eq("id_empresa", dataempresa.id)
        .order("nombre");
      if (!activo) return;
      if (error) {
        Swal.fire("Error", `No se pudieron cargar los equipos finales: ${error.message}`, "error");
        return;
      }
      setInsumos(data ?? []);
    }
    cargarInsumos();
    return () => { activo = false; };
  }, [dataempresa?.id]);

  useEffect(() => {
    if (accion !== "Editar" || !dataSelect?.id) return;
    let activo = true;
    async function cargarAsignacion() {
      const { data, error } = await supabase
        .from("productos_insumo")
        .select("id_insumo, cantidad")
        .eq("id_producto", dataSelect.id)
        .order("id");
      if (!activo) return;
      if (error) {
        Swal.fire("Error", `No se pudo cargar la asignación: ${error.message}`, "error");
        return;
      }
      if (data?.length) {
        setInsumoFinalId(String(data[0].id_insumo));
        setCantidadComponente(String(data[0].cantidad));
      }
    }
    cargarAsignacion();
    return () => { activo = false; };
  }, [accion, dataSelect?.id]);

  async function guardarAsignacion(idProducto) {
    const asignacion = {
      id_producto: idProducto,
      id_insumo: Number(insumoFinalId),
      cantidad: Number(cantidadComponente),
    };
    const { data: asignaciones, error: buscarError } = await supabase
      .from("productos_insumo")
      .select("id, id_insumo")
      .eq("id_producto", idProducto);
    if (buscarError) throw buscarError;

    const asignacionExistente = asignaciones?.find(
      (item) => Number(item.id_insumo) === asignacion.id_insumo,
    );
    const resultado = asignacionExistente
      ? await supabase.from("productos_insumo").update({ cantidad: asignacion.cantidad }).eq("id", asignacionExistente.id)
      : asignaciones?.length === 1
      ? await supabase.from("productos_insumo").update({
          id_insumo: asignacion.id_insumo,
          cantidad: asignacion.cantidad,
        }).eq("id", asignaciones[0].id)
      : await supabase.from("productos_insumo").insert(asignacion);
    if (resultado.error) throw resultado.error;
  }

  async function insertar(data) {
    if (!insumoFinalId || !Number.isFinite(Number(cantidadComponente)) || Number(cantidadComponente) <= 0) {
      Swal.fire("Asignación requerida", "Seleccioná el equipo final e indicá una cantidad mayor a cero.", "warning");
      return;
    }
    setGuardando(true);
    try {
      if (accion === "Editar") {
        const p = {
        id: dataSelect.id,
        descripcion: ConvertirCapitalize(data.descripcion),
        idmarca: marcaItemSelect.id,
        stock: parseFloat(data.stock),
        stock_minimo: parseFloat(data.codigointerno),
        codigobarras: parseFloat(data.codigobarras),
        codigointerno: data.codigointerno,
        precioventa: parseFloat(data.precioventa),
        preciocompra: parseFloat(data.preciocompra),
        id_categoria: categoriasItemSelect.id,
        id_empresa: dataempresa.id,
      };
      await editarproductos(p);
      await guardarAsignacion(dataSelect.id);
      } else {
        const p = {
        _descripcion: ConvertirCapitalize(data.descripcion),
        _idmarca: marcaItemSelect.id,
        _stock: parseFloat(data.stock),
        _stock_minimo: parseFloat(data.codigointerno),
        _codigobarras: parseFloat(data.codigobarras),
        _codigointerno: data.codigointerno,
        _precioventa: parseFloat(data.precioventa),
        _preciocompra: parseFloat(data.preciocompra),
        _id_categoria: categoriasItemSelect.id,
        _id_empresa: dataempresa.id,
      };
      const resultado = await insertarproductos(p);
      const fila = Array.isArray(resultado) ? resultado[0] : resultado;
      let idProducto = typeof fila === "number" ? fila : fila?.id;
      if (!idProducto) {
        const { data: encontrado, error } = await supabase
          .from("productos")
          .select("id")
          .eq("id_empresa", dataempresa.id)
          .eq("codigointerno", data.codigointerno)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        idProducto = encontrado?.id;
      }
      if (!idProducto) {
        throw new Error("El componente se creó, pero no se pudo obtener su ID para asignarlo al equipo final.");
      }
      await guardarAsignacion(idProducto);
      }
      onClose();
    } catch (error) {
      Swal.fire("No se pudo guardar la asignación", error.message || "Ocurrió un error inesperado.", "error");
    } finally {
      setGuardando(false);
    }
  }
  useEffect(() => {
    if (accion === "Editar") {
      selectMarca({ id: dataSelect.idmarca, descripcion: dataSelect.marca });
      selectcategorias({
        id: dataSelect.id_categoria,
        descripcion: dataSelect.categoria,
      });
    }
  }, [accion, dataSelect, selectMarca, selectcategorias]);
  return (
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <section>
            <h1>
              {accion == "Editar"
                ? "Editar componente"
                : "Registrar nuevo componente"}
            </h1>
          </section>

          <section>
            <span onClick={onClose}>x</span>
          </section>
        </div>

        <form className="formulario" onSubmit={handleSubmit(insertar)}>
          <section className="seccion1">
            <article>
              <InputText icono={<v.icononombre />}>
                <input
                  className="form__field"
                  defaultValue={dataSelect.descripcion}
                  type="text"
                  placeholder=""
                  {...register("descripcion", {
                    required: true,
                  })}
                />
                <label className="form__label">Nombre del componente</label>
                {errors.nombre?.type === "required" && <p>Campo requerido</p>}
              </InputText>
            </article>
            <ContainerSelector>
              <label>Proveedor: </label>
              <Selector
                funcion={() => setStateMarca(!stateMarca)}
                state={stateMarca}
                color="#fc6027"
                texto1="🍿"
                texto2={marcaItemSelect?.descripcion}
              />
              {stateMarca && (
                <ListaGenerica
                  setState={() => setStateMarca(!stateMarca)}
                  bottom="-260px"
                  scroll="scroll"
                  data={datamarca}
                  funcion={selectMarca}
                />
              )}
              <Btnfiltro
                bgcolor="#f6f3f3"
                funcion={nuevoRegistroMarca}
                textcolor="#353535"
                icono={<v.agregar />}
              />
            </ContainerSelector>
            <article>
              <InputText icono={<v.iconostock />}>
                <input
                  className="form__field"
                  type="number"
                  step="0.01"
                  placeholder=""
                  defaultValue={dataSelect.stock}
                  {...register("stock", {
                    required: true,
                  })}
                />
                <label className="form__label">Stock del componente</label>
                {errors.stock?.type === "required" && <p>Campo requerido</p>}
              </InputText>
            </article>
            <article>
              <InputText icono={<v.iconostockminimo />}>
                <input
                  step="0.01"
                  className="form__field"
                  defaultValue={dataSelect.stock_minimo}
                  type="number"
                  placeholder=""
                  {...register("stockminimo", {
                    required: true,
                  })}
                />
                <label className="form__label">Stock minimo</label>

                {errors.stockminimo?.type === "required" && (
                  <p>Campo requerido</p>
                )}
              </InputText>
            </article>
            <ContainerSelector>
              <label>Categoria: </label>
              <Selector
                funcion={() => setStateCategoria(!stateCategoria)}
                state={stateCategoria}
                color="#fc6027"
                texto1="🍿"
                texto2={categoriasItemSelect?.descripcion}
              />
              <Btnfiltro
                bgcolor="#f6f3f3"
                funcion={nuevoRegistroCategoria}
                textcolor="#353535"
                icono={<v.agregar />}
              />
              {stateCategoria && (
                <ListaGenerica
                  setState={() => setStateCategoria(!stateCategoria)}
                  bottom="-260px"
                  scroll="scroll"
                  data={datacategorias}
                  funcion={selectcategorias}
                />
              )}
            </ContainerSelector>
          </section>
          <section className="seccion2">
            <article>
              <InputText icono={<v.iconocodigobarras />}>
                <input
                  className="form__field"
                  defaultValue={dataSelect.codigobarras}
                  type="number"
                  placeholder=""
                  {...register("codigobarras", {
                    required: true,
                  })}
                />
                <label className="form__label">codigo de barras</label>
                {errors.codigobarras?.type === "required" && (
                  <p>Campo requerido</p>
                )}
              </InputText>
            </article>
            <article>
              <InputText icono={<v.iconocodigointerno />}>
                <input
                  className="form__field"
                  defaultValue={dataSelect.codigointerno}
                  type="text"
                  placeholder=""
                  {...register("codigointerno", {
                    required: true,
                  })}
                />
                <label className="form__label">Codigo interno</label>

                {errors.codigointerno?.type === "required" && (
                  <p>Campo requerido</p>
                )}
              </InputText>
            </article>
            <article>
              <InputText icono={<v.iconoprecioventa />}>
                <input
                  step="0.01"
                  className="form__field"
                  defaultValue={dataSelect.precioventa}
                  type="number"
                  placeholder=""
                  {...register("precioventa", {
                    required: true,
                  })}
                />
                <label className="form__label">Precio de venta</label>

                {errors.precioventa?.type === "required" && (
                  <p>Campo requerido</p>
                )}
              </InputText>
            </article>
            <article>
              <InputText icono={<v.iconopreciocompra />}>
                <input
                  step="0.01"
                  className="form__field"
                  defaultValue={dataSelect.preciocompra}
                  type="number"
                  placeholder=""
                  {...register("preciocompra", {
                    required: true,
                  })}
                />
                <label className="form__label">Precio de compra</label>

                {errors.preciocompra?.type === "required" && (
                  <p>Campo requerido</p>
                )}
              </InputText>
            </article>
            <article className="asignacionInsumo">
              <label htmlFor="insumo-final">Equipo final al que pertenece este componente</label>
              <select
                id="insumo-final"
                value={insumoFinalId}
                onChange={(event) => setInsumoFinalId(event.target.value)}
                required
              >
                <option value="">Seleccionar equipo final</option>
                {insumos.map((insumo) => (
                  <option key={insumo.id} value={insumo.id}>{insumo.nombre}</option>
                ))}
              </select>
              {insumos.length === 0 && <small>No hay equipos finales registrados para esta empresa.</small>}
              <label htmlFor="cantidad-componente">Cantidad de este componente por equipo</label>
              <input
                id="cantidad-componente"
                type="number"
                min="0.001"
                step="0.001"
                value={cantidadComponente}
                onChange={(event) => setCantidadComponente(event.target.value)}
                required
              />
            </article>
          </section>
          <div className="btnguardarContent">
            <Btnsave
              icono={<v.iconoguardar />}
              titulo={guardando ? "Guardando…" : "Guardar"}
              bgcolor="#ef552b"
            />
          </div>
        </form>
        {openRegistroMarca && (
          <RegistrarMarca
            accion={subaccion}
            onClose={() => SetopenRegistroMarca(!openRegistroMarca)}
            dataSelect={dataSelect}
          />
        )}
        {openRegistroCategoria && (
          <RegistrarCategorias
            accion={subaccion}
            onClose={() => SetopenRegistroCategoria(!openRegistroCategoria)}
            dataSelect={dataSelect}
          />
        )}
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
    width: 100%;
    max-width: 90%;
    border-radius: 20px;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 36px 20px 36px;
    z-index: 100;
    height: 90vh;
    overflow-y: auto;
    overflow-x: hidden;
    &::-webkit-scrollbar {
      width: 6px;
      border-radius: 10px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #484848;
      border-radius: 10px;
    }

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
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
      @media ${Device.tablet} {
        grid-template-columns: repeat(2, 1fr);
      }
      section {
        gap: 20px;
        display: flex;
        flex-direction: column;
      }
      .asignacionInsumo {
        display: flex;
        flex-direction: column;
        gap: 9px;
        label { font-weight: 600; }
        select, input {
          min-height: 42px;
          padding: 8px 10px;
          border: 1px solid #9b9b9b;
          border-radius: 7px;
          background: ${({ theme }) => theme.bgtotal};
          color: ${({ theme }) => theme.text};
        }
      }
      .btnguardarContent {
        display: flex;
        justify-content: end;
        grid-column: 1;
        @media ${Device.tablet} {
          grid-column: 2;
        }
      }
    }
  }
`;

const ContentTitle = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 20px;
  svg {
    font-size: 25px;
  }
  input {
    border: none;
    outline: none;
    background: transparent;
    padding: 2px;
    width: 40px;
    font-size: 28px;
  }
`;
const ContainerEmojiPicker = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;
