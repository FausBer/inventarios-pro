import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import styled from "styled-components";
import { Paginacion, v, useDolarStore } from "../../../index";
import { useState } from "react";

export function TablaInsumoDetalle({ productos, tienePermisoCostos = false }) {
  const [pagina, setPagina] = useState(1);
  const totalInsumoARS = productos?.reduce(
    (acc, prod) => acc + Number(prod.total_producto),
    0
  );

  const { cotizacion } = useDolarStore.getState();
  const totalInsumoUSD =
    cotizacion && cotizacion !== 0
      ? (totalInsumoARS / cotizacion).toFixed(2)
      : "-";

  const columns = [
    {
      accessorKey: "descripcion",
      header: "Componente / insumo",
    },
    {
      accessorKey: "cantidad",
      header: "Cantidad usada",
    },
    {
      accessorKey: "stock",
      header: "Stock",
    },
    {
      accessorKey: "stock_minimo",
      header: "Stock mínimo",
    },
    ...(tienePermisoCostos
      ? [
          {
            accessorKey: "precio_unitario",
            header: "Precio Unitario",
            enableSorting: false,
            cell: (info) => (
              <td data-title="Precio Unitario" className="ContentCell">
                <span>${Number(info.getValue()).toLocaleString("es-AR")}</span>
              </td>
            ),
          },
          {
            accessorKey: "total_producto",
            header: "Total",
            cell: (info) => (
              <span>${Number(info.getValue()).toLocaleString("es-AR")}</span>
            ),
          },
          {
            header: "Precio Unitario USD",
            enableSorting: false,
            accessorFn: (row) => {
              const { cotizacion } = useDolarStore.getState();
              if (!cotizacion || cotizacion === 0) return "-";
              return (row.precio_unitario / cotizacion).toFixed(2);
            },
            cell: (info) => (
              <td data-title="Precio Unitario USD" className="ContentCell">
                <span>
                  {info.getValue() !== "-"
                    ? `$${info.getValue()}`
                    : "Cargando..."}
                </span>
              </td>
            ),
          },
          {
            header: "Precio Total USD",
            enableSorting: false,
            accessorFn: (row) => {
              const { cotizacion } = useDolarStore.getState();
              if (!cotizacion || cotizacion === 0) return "-";
              return (row.total_producto / cotizacion).toFixed(2);
            },
            cell: (info) => (
              <td data-title="Precio Total USD" className="ContentCell">
                <span>
                  {info.getValue() !== "-"
                    ? `$${info.getValue()}`
                    : "Cargando..."}
                </span>
              </td>
            ),
          },
        ]
      : []),
  ];

  const table = useReactTable({
    data: productos || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Container>
      {tienePermisoCostos && (
        <div style={{ marginTop: "1rem", fontWeight: "bold" }}>
          Costo total de componentes: ${totalInsumoARS.toLocaleString("es-AR")} ARS
          <br />
          Costo total de componentes:{" "}
          {totalInsumoUSD !== "-" ? `$${totalInsumoUSD}` : "Cargando..."} USD
        </div>
      )}
      <table className="responsive-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>{header.column.columnDef.header}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Paginacion
        table={table}
        irinicio={() => table.setPageIndex(0)}
        pagina={table.getState().pagination.pageIndex + 1}
        setPagina={setPagina}
        maximo={table.getPageCount()}
      />
    </Container>
  );
}

const Container = styled.div`
  position: relative;

  margin: 5% 3%;
  @media (min-width: ${v.bpbart}) {
    margin: 2%;
  }
  @media (min-width: ${v.bphomer}) {
    margin: 2em auto;
    /* max-width: ${v.bphomer}; */
  }
  .responsive-table {
    width: 100%;
    margin-bottom: 1.5em;
    border-spacing: 0;
    @media (min-width: ${v.bpbart}) {
      font-size: 0.9em;
    }
    @media (min-width: ${v.bpmarge}) {
      font-size: 1em;
    }
    thead {
      position: absolute;

      padding: 0;
      border: 0;
      height: 1px;
      width: 1px;
      overflow: hidden;
      @media (min-width: ${v.bpbart}) {
        position: relative;
        height: auto;
        width: auto;
        overflow: auto;
      }
      th {
        border-bottom: 2px solid rgba(115, 115, 115, 0.32);
        font-weight: normal;
        text-align: center;
        color: ${({ theme }) => theme.text};
        &:first-of-type {
          text-align: center;
        }
      }
    }
    tbody,
    tr,
    th,
    td {
      display: block;
      padding: 0;
      text-align: left;
      white-space: normal;
    }
    tr {
      @media (min-width: ${v.bpbart}) {
        display: table-row;
      }
    }

    th,
    td {
      padding: 0.5em;
      vertical-align: middle;
      @media (min-width: ${v.bplisa}) {
        padding: 0.75em 0.5em;
      }
      @media (min-width: ${v.bpbart}) {
        display: table-cell;
        padding: 0.5em;
      }
      @media (min-width: ${v.bpmarge}) {
        padding: 0.75em 0.5em;
      }
      @media (min-width: ${v.bphomer}) {
        padding: 0.75em;
      }
    }
    tbody {
      @media (min-width: ${v.bpbart}) {
        display: table-row-group;
      }
      tr {
        margin-bottom: 1em;
        @media (min-width: ${v.bpbart}) {
          display: table-row;
          border-width: 1px;
        }
        &:last-of-type {
          margin-bottom: 0;
        }
        &:nth-of-type(even) {
          @media (min-width: ${v.bpbart}) {
            background-color: rgba(78, 78, 78, 0.12);
          }
        }
      }
      th[scope="row"] {
        @media (min-width: ${v.bplisa}) {
          border-bottom: 1px solid rgba(161, 161, 161, 0.32);
        }
        @media (min-width: ${v.bpbart}) {
          background-color: transparent;
          text-align: center;
          color: ${({ theme }) => theme.text};
        }
      }
      .ContentCell {
        text-align: right;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 50px;

        border-bottom: 1px solid rgba(161, 161, 161, 0.32);
        @media (min-width: ${v.bpbart}) {
          justify-content: center;
          border-bottom: none;
        }
      }
      td {
        text-align: right;
        @media (min-width: ${v.bpbart}) {
          border-bottom: 1px solid rgba(161, 161, 161, 0.32);
          text-align: center;
        }
      }
      td[data-title]:before {
        content: attr(data-title);
        float: left;
        font-size: 0.8em;
        @media (min-width: ${v.bplisa}) {
          font-size: 0.9em;
        }
        @media (min-width: ${v.bpbart}) {
          content: none;
        }
      }
    }
  }
`;
