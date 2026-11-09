import { Navigate, Routes, Route } from "react-router-dom";
import {
  Configuracion,
  ErrorMolecula,
  Home,
  Login,
  Marca,
  ProtectedRoute,
  SpinnerLoader,
  UserAuth,
  useEmpresaStore,
  useUsuariosStore,
  Categorias,
  Productos,
  Insumo,
  InsumoConfig,
  Usuarios,
  Reportes,
  InsumoDetalle,
  StockActualTodos,
  StockActualPorProductos,
  ReporteOperativo,
  Ensamblaje,
  EmpresaConfig,
} from "../index";
import { useQuery } from "@tanstack/react-query";
import { Kardex } from "../pages/Kardex";

export function MyRoutes() {
  const { user, authReady } = UserAuth();
  const { mostrarUsuarios, mostrarpermisos } = useUsuariosStore();
  const { mostrarEmpresa } = useEmpresaStore();
  const {
    data: datausuarios,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["mostrar usuarios", user?.id],
    queryFn: mostrarUsuarios,
    enabled: !!user?.id,
  });
  const {
    data: empresaActiva,
    isLoading: cargandoEmpresa,
    error: errorEmpresa,
  } = useQuery({
    queryKey: ["mostrar empresa", user?.id, datausuarios?.id],
    queryFn: () => mostrarEmpresa({ idusaurio: datausuarios.id }),
    enabled: !!user?.id && !!datausuarios?.id,
  });
  const { isLoading: cargandoPermisos, error: errorPermisos } = useQuery({
    queryKey: ["mostrar permisos", user?.id, datausuarios?.id],
    queryFn: () => mostrarpermisos({ id_usuario: datausuarios.id }),
    enabled: !!user?.id && !!datausuarios?.id,
  });

  // Supabase restores the persisted session asynchronously. Don't redirect to
  // login or mount protected pages until that first auth result has arrived.
  if (!authReady) return <SpinnerLoader />;

  if (user && (isLoading || cargandoEmpresa || cargandoPermisos)) {
    return <SpinnerLoader />;
  }
  if (user && (error || errorEmpresa || errorPermisos)) {
    return <ErrorMolecula mensaje={(error || errorEmpresa || errorPermisos).message} />;
  }
  if (user && datausuarios && !empresaActiva) {
    return (
      <ErrorMolecula mensaje="Este usuario todavía no tiene una empresa asociada. Verificá el alta de la empresa y la asignación del usuario." />
    );
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute user={user} redirectTo="/login" />}>
        <Route path="/" element={<Home />} />
        <Route path="/configurar" element={<Configuracion />} />
        <Route path="/configurar/marca" element={<Marca />} />

        <Route path="/configurar/categorias" element={<Categorias />} />
        <Route path="/configurar/productos" element={<Productos />} />
        <Route path="/configurar/personal" element={<Usuarios />} />
        <Route path="/configurar/empresa" element={<EmpresaConfig />} />
        <Route path="/configurar/insumoConfig" element={<InsumoConfig />} />
        <Route path="/insumo-detalle/:id" element={<InsumoDetalle />} />
        <Route path="/ensamblaje" element={<Ensamblaje />} />
        <Route path="/kardex" element={<Kardex />}></Route>
        <Route path="/reportes" element={<Reportes />}>
          <Route index element={<ReporteOperativo />} />
          <Route path="stock-actual-todos" element={<StockActualTodos />} />
          <Route
            path="stock-actual-por-producto"
            element={<StockActualPorProductos />}
          />
        </Route>

        <Route path="/insumo" element={<Insumo />} />
      </Route>
      <Route path="*" element={<Navigate replace to={user ? "/" : "/login"} />} />
    </Routes>
  );
}
