import { useQuery } from "@tanstack/react-query";
import { HomeTemplate, useEmpresaStore } from "../index";
export function Home() {
  const { contarusuariosXempresa, dataempresa } = useEmpresaStore();
  const idEmpresa = dataempresa?.id;
  useQuery({
    queryKey: ["contar usuarios por empresa", idEmpresa],
    queryFn: () => contarusuariosXempresa({ id_empresa: idEmpresa }),
    enabled: idEmpresa != null,
  });
  return <HomeTemplate />;
}
