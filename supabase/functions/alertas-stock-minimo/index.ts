import { createClient } from "npm:@supabase/supabase-js@2";

function escaparHtml(valor: unknown) {
  const entidades: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(valor ?? "").replace(/[&<>"']/g, (caracter) => entidades[caracter] ?? caracter);
}

function obtenerClaveAdmin() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return keys.default;
  } catch {
    return undefined;
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }

  const cronSecret = Deno.env.get("ALERTA_STOCK_CRON_SECRET");
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = obtenerClaveAdmin();
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM");
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !emailFrom) {
    return Response.json({ error: "Falta configurar uno o más secretos del servicio" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: empresas, error: errorEmpresas } = await supabase
    .from("empresa")
    .select("id,nombre,correo_alerta_stock,id_usuario_alerta_stock,usuarios!empresa_id_usuario_alerta_stock_fkey(nombres,correo)")
    .not("id_usuario_alerta_stock", "is", null);

  if (errorEmpresas) {
    console.error("No se pudieron cargar empresas con encargado", errorEmpresas);
    return Response.json({ error: "No se pudieron cargar los destinatarios" }, { status: 500 });
  }

  const enviados: { empresa: string; cantidad: number }[] = [];
  const errores: { empresa: string; error: string }[] = [];

  for (const empresa of empresas ?? []) {
    const encargado = Array.isArray(empresa.usuarios) ? empresa.usuarios[0] : empresa.usuarios;
    const correoDestino = empresa.correo_alerta_stock || encargado?.correo;
    if (!correoDestino) continue;

    const { data: componentes, error: errorComponentes } = await supabase
      .from("productos")
      .select("descripcion,stock,stock_minimo")
      .eq("id_empresa", empresa.id)
      .not("stock_minimo", "is", null)
      .order("descripcion");

    if (errorComponentes) {
      console.error(`Error al consultar stock de empresa ${empresa.id}`, errorComponentes);
      errores.push({ empresa: empresa.nombre, error: errorComponentes.message });
      continue;
    }

    const bajos = (componentes ?? []).filter((componente) =>
      Number(componente.stock ?? 0) <= Number(componente.stock_minimo),
    );
    if (bajos.length === 0) continue;

    const filas = bajos.map((componente) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escaparHtml(componente.descripcion)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">${escaparHtml(componente.stock ?? 0)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">${escaparHtml(componente.stock_minimo)}</td>
      </tr>`).join("");

    const html = `
      <div style="font-family:Arial,sans-serif;color:#202124;max-width:680px;margin:auto">
        <h2>Alerta de stock mínimo</h2>
        <p>Hola ${escaparHtml(encargado.nombres)}, estos componentes de <strong>${escaparHtml(empresa.nombre)}</strong> están en el mínimo o por debajo:</p>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f3f4f6;text-align:left">
            <th style="padding:10px">Componente</th>
            <th style="padding:10px;text-align:right">Stock actual</th>
            <th style="padding:10px;text-align:right">Stock mínimo</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
        <p style="margin-top:20px;color:#6b7280">Este resumen se envía una vez al día mientras haya componentes que requieran reposición.</p>
      </div>`;

    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [correoDestino],
        subject: `Stock mínimo: ${bajos.length} componente${bajos.length === 1 ? "" : "s"} · ${empresa.nombre}`,
        html,
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error(`Resend rechazó el correo para empresa ${empresa.id}`, detalle);
      errores.push({ empresa: empresa.nombre, error: `Error del proveedor de correo (${respuesta.status})` });
      continue;
    }
    enviados.push({ empresa: empresa.nombre, cantidad: bajos.length });
  }

  return Response.json({ ok: errores.length === 0, enviados, errores });
});
