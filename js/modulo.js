/* ============================================================
   modulo.js — Prototipo NAVEGABLE del Módulo Refacciones.
   ------------------------------------------------------------
   Objetivo: que el Gerente de Posventa pueda ENTRAR a cada
   pantalla del módulo (como si estuviera dentro de ADCCore) y
   reaccionar: "esto sí, esto no, aquí falta".

   Todo son DATOS DE EJEMPLO. Nada se guarda ni se conecta a la
   base real todavía. Cuando el negocio valide qué quiere, se
   construye la lógica real contra el DWH (solo lectura).
   ============================================================ */

/* ---------- 1. Menú del módulo (grupos y pantallas) ---------- */
const NAV = [
  { group: "Operación", items: [
    { id: "solicitud",  icon: "📦", title: "Solicitud de Pedido" },
    { id: "traslados",  icon: "🔁", title: "Traslados entre Sucursales" },
    { id: "recepcion",  icon: "📥", title: "Recepción y Backorder" },
  ]},
  { group: "Análisis", items: [
    { id: "tablero",    icon: "📊", title: "Tablero de Inventario" },
    { id: "margenes",   icon: "💰", title: "Márgenes y Rentabilidad" },
    { id: "alertas",    icon: "🚨", title: "Alertas y Auditoría" },
    { id: "reportes",   icon: "📈", title: "Reportes" },
  ]},
  { group: "Catálogos", items: [
    { id: "refacciones",icon: "🔧", title: "Catálogo de Refacciones" },
    { id: "proveedores",icon: "🏢", title: "Proveedores" },
    { id: "almacenes",  icon: "🏬", title: "Almacenes / Agencias" },
  ]},
  { group: "Administración", items: [
    { id: "usuarios",   icon: "👥", title: "Usuarios y Roles" },
    { id: "parametros", icon: "⚙️", title: "Parámetros" },
  ]},
];

/* ---------- 2. Helpers ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const money = n => (n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const num   = n => (n || 0).toLocaleString("es-MX");
const esc   = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

/* clasificación de movimiento -> clase de píldora (usa las clases reales del DWH) */
const CLASE_PILL = { NUEVO:"info", "RÁPIDO":"ok", RAPIDO:"ok", MEDIO:"neu", LENTO:"warn", OBSOLETO:"dgr", OK:"ok" };
const pillClase = c => `<span class="pill ${CLASE_PILL[c] || "neu"}">${esc(c || "—")}</span>`;

/* inventario de una refacción en la agencia actual */
const invActual = r => (r.inventario || []).find(i => i.agencia === CONFIG.AGENCIA_ACTUAL);

/* ---------- 3. Datos de ejemplo para pantallas nuevas ---------- */
const SUCURSALES = [
  { nombre: "Matriz Guadalajara",   ciudad: "Guadalajara, Jal.", refs: 2100, valor: 8450000 },
  { nombre: "Sucursal Zapopan",     ciudad: "Zapopan, Jal.",     refs: 1740, valor: 6120000 },
  { nombre: "Sucursal Tlaquepaque", ciudad: "Tlaquepaque, Jal.", refs: 1360, valor: 4380000 },
  { nombre: "Sucursal Norte",       ciudad: "Guadalajara, Jal.", refs: 1180, valor: 3910000 },
];

/* Distribución REAL observada en el DWH (fact.Refacciones_InventarioAlmacen).
   La mostramos como ejemplo de las categorías que sí usa la empresa. */
const DIST_MOVIMIENTO = [
  { clase: "NUEVO",    filas: 11607, color: "#2472b3" },
  { clase: "RÁPIDO",   filas: 3048,  color: "#1f9d55" },
  { clase: "MEDIO",    filas: 15766, color: "#8aa0b2" },
  { clase: "LENTO",    filas: 11826, color: "#c9820a" },
  { clase: "OBSOLETO", filas: 14786, color: "#c0392b" },
  { clase: "Sin clasificar", filas: 3711, color: "#cdd6de" },
];

const TRASLADOS = [
  { folio:"TR-0001", fecha:"2026-07-09", cod:"RF-3001", desc:"Aceite sintético 5W-30", cant:20, origen:"Sucursal Tlaquepaque", destino:"Matriz Guadalajara", est:"pen" },
  { folio:"TR-0002", fecha:"2026-07-08", cod:"RF-1003", desc:"Disco de freno ventilado 280mm", cant:6, origen:"Sucursal Norte", destino:"Matriz Guadalajara", est:"apr" },
  { folio:"TR-0003", fecha:"2026-07-05", cod:"RF-2001", desc:"Filtro de aceite premium", cant:8, origen:"Sucursal Zapopan", destino:"Sucursal Tlaquepaque", est:"rec" },
];

const BACKORDER = [
  { pedido:"PED-00127", cod:"RF-3001", desc:"Aceite sintético 5W-30", pedida:60, surtida:40, pend:20, prov:"Distribuidora Motriz MG", dias:9 },
  { pedido:"PED-00129", cod:"RF-6001", desc:"Banda de distribución (kit)", pedida:15, surtida:0, pend:15, prov:"Autopartes del Norte", dias:9 },
  { pedido:"PED-00131", cod:"RF-4001", desc:"Bujía de iridio", pedida:48, surtida:36, pend:12, prov:"Eléctrica Automotriz Guadalajara", dias:4 },
];

const USUARIOS = [
  { nombre:"J. Ramírez", rol:"Solicitante",  agencia:"Matriz Guadalajara",   permisos:"Registra pedidos" },
  { nombre:"L. Torres",  rol:"Aprobador",    agencia:"Sucursal Zapopan",     permisos:"Aprueba / rechaza pedidos" },
  { nombre:"A. Gómez",   rol:"Almacén",      agencia:"Sucursal Tlaquepaque", permisos:"Recibe y registra entradas" },
  { nombre:"M. Ruiz",    rol:"Gerente Posventa", agencia:"Todas",            permisos:"Ve todo · configura parámetros" },
];

/* márgenes de ejemplo (precio venta y costo inventados para ilustrar) */
const MARGENES = [
  { cod:"RF-1001", desc:"Balata delantera cerámica", costo:520, venta:980 },
  { cod:"RF-2001", desc:"Filtro de aceite premium",  costo:95,  venta:210 },
  { cod:"RF-3001", desc:"Aceite sintético 5W-30",    costo:145, venta:189 },
  { cod:"RF-4001", desc:"Bujía de iridio",           costo:88,  venta:260 },
  { cod:"RF-5002", desc:"Amortiguador trasero",      costo:640, venta:1180 },
];

/* ---------- 4. Router ---------- */
function renderNav() {
  const nav = $("#nav");
  nav.innerHTML = NAV.map(g => `
    <div class="group-title">${esc(g.group)}</div>
    ${g.items.map(it => `<a data-id="${it.id}"><span class="ic">${it.icon}</span> ${esc(it.title)}</a>`).join("")}
  `).join("");
  nav.addEventListener("click", e => {
    const a = e.target.closest("a[data-id]");
    if (a) navigate(a.dataset.id);
  });
}

function navigate(id) {
  const item = NAV.flatMap(g => g.items).find(i => i.id === id);
  if (!item) return;
  document.querySelectorAll("#nav a").forEach(a => a.classList.toggle("active", a.dataset.id === id));
  $("#crumbs").innerHTML = `Módulo Refacciones · <b>${esc(item.title)}</b>`;
  $("#pageTitle").textContent = item.title;
  $("#view").innerHTML = (SCREENS[id] || SCREENS._todo)(item);
  if (INIT[id]) INIT[id]();
  window.scrollTo(0, 0);
}

const bannerDemo = txt => `<div class="demo-banner"><span class="ai">ℹ️</span><div>${txt}</div></div>`;

/* ---------- 5. Pantallas ---------- */
const SCREENS = {};
const INIT = {};

/* ===== 5.1 Solicitud de Pedido (pantalla funcional) ===== */
SCREENS.solicitud = () => {
  const P = window.PEDIDOS;
  const porPedido = agrupaPedidos(P);
  const tot = porPedido.length;
  const pen = porPedido.filter(p => p.renglones.some(r => r.est === "pen")).length;
  const rec = porPedido.filter(p => p.renglones.every(r => r.est === "rec")).length;
  const mos = porPedido.filter(p => p.renglones.some(r => r.mos > CONFIG.MOS_MAX)).length;
  return `
  ${bannerDemo("Pantalla de ejemplo. La <b>Nueva Solicitud</b> valida el MOS igual que la maqueta original; los datos no se guardan.")}
  <div class="kpis">
    <div class="kpi"><div class="label">Pedidos totales</div><div class="value">${tot}</div></div>
    <div class="kpi"><div class="label">Pendientes</div><div class="value warn">${pen}</div></div>
    <div class="kpi"><div class="label">Recibidos</div><div class="value ok">${rec}</div></div>
    <div class="kpi"><div class="label">Con alerta de MOS</div><div class="value danger">${mos}</div></div>
  </div>
  <div class="panel">
    <div class="panel-head">
      <div><h3>Consulta de Pedidos</h3><div class="sub">Solicitudes de compra registradas</div></div>
      <div class="toolbar">
        <div class="search"><span>🔎</span><input id="qPed" placeholder="Buscar pedido, código, proveedor…"></div>
        <button class="btn btn-primary" onclick="abrirNuevaSolicitud()">＋ Nueva Solicitud</button>
      </div>
    </div>
    <div class="table-wrap">
      <table id="tPed">
        <thead><tr>
          <th>N° Pedido</th><th>Fecha</th><th>Proveedor</th><th>Solicitó</th>
          <th>Sucursal</th><th>Refacciones</th><th>MOS máx.</th><th>Estatus</th>
        </tr></thead>
        <tbody id="bPed"></tbody>
      </table>
    </div>
  </div>`;
};
INIT.solicitud = () => {
  pintaPedidos("");
  const q = $("#qPed");
  if (q) q.addEventListener("input", () => pintaPedidos(q.value));
};

function agrupaPedidos(rows) {
  const map = {};
  rows.forEach(r => {
    (map[r.num] = map[r.num] || { num:r.num, fecha:r.fecha, prov:r.prov, quien:r.quien, suc:r.suc, renglones:[] }).renglones.push(r);
  });
  return Object.values(map);
}
function estatusPedido(p) {
  const s = new Set(p.renglones.map(r => r.est));
  if (s.size > 1) return { k:"varios", t:"Varios" };
  const k = [...s][0];
  return { k, t: window.ESTADOS_PEDIDO[k] || k };
}
function pintaPedidos(filtro) {
  const f = (filtro || "").toLowerCase();
  const rows = agrupaPedidos(window.PEDIDOS).filter(p =>
    !f || `${p.num} ${p.prov} ${p.quien} ${p.renglones.map(r=>r.cod+" "+r.desc).join(" ")}`.toLowerCase().includes(f)
  );
  $("#bPed").innerHTML = rows.map(p => {
    const est = estatusPedido(p);
    const mosMax = Math.max(...p.renglones.map(r => r.mos || 0));
    const pillCls = est.k === "varios" ? "neu" : est.k;
    return `<tr>
      <td class="mono">${esc(p.num)}</td>
      <td>${esc(p.fecha)}</td>
      <td>${esc(p.prov)}</td>
      <td>${esc(p.quien)}</td>
      <td>${esc(p.suc)}</td>
      <td>${p.renglones.length} <span class="muted">pza(s)</span></td>
      <td><b style="color:${mosMax>CONFIG.MOS_MAX?'var(--danger)':'var(--text)'}">${mosMax.toFixed(2)}</b></td>
      <td><span class="pill ${pillCls}">${esc(est.t)}</span></td>
    </tr>`;
  }).join("") || `<tr><td colspan="8" class="empty-lines">Sin resultados.</td></tr>`;
}

/* ---- Nueva Solicitud (modal con validación de MOS) ---- */
let LINEAS = [];
function abrirNuevaSolicitud() {
  LINEAS = [];
  const opsProv = window.PROVEEDORES.map(p => `<option value="${esc(p.clave)}">${esc(p.nombre)}</option>`).join("");
  const opsRef  = window.REFACCIONES.map(r => `<option value="${esc(r.codigo)}">${esc(r.codigo)} — ${esc(r.descripcion)}</option>`).join("");
  $("#modalRoot").innerHTML = `
  <div class="overlay open" id="ovNueva">
    <div class="modal wide">
      <div class="modal-head">
        <div><h3>Nueva Solicitud de Pedido</h3><p>Agencia: ${esc(CONFIG.AGENCIA_ACTUAL)} · agregue una o varias refacciones</p></div>
        <button class="x" onclick="cerrarModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="section-title">1 · Proveedor</div>
        <div class="card-block">
          <div class="field"><label>Proveedor <span class="req">*</span></label>
            <select id="mProv"><option value="">Seleccione…</option>${opsProv}</select></div>
        </div>
        <div class="section-title">2 · Agregar refacción</div>
        <div class="card-block">
          <div class="form-grid">
            <div class="field full"><label>Refacción <span class="req">*</span></label>
              <select id="mRef" onchange="onRefSel()"><option value="">Seleccione…</option>${opsRef}</select>
              <div class="alert" id="mAlert"></div>
            </div>
            <div class="field"><label>Cantidad <span class="req">*</span></label>
              <input type="number" id="mCant" min="0" step="1" placeholder="0" oninput="onCalcMos()"></div>
            <div class="field" style="justify-content:flex-end">
              <button class="btn btn-primary" onclick="agregarLinea()">＋ Agregar al pedido</button></div>
            <div class="mos-box">
              <div class="top"><div><div class="t">Índice MOS</div><div class="hint">Máximo permitido: <b>${CONFIG.MOS_MAX.toFixed(2)}</b></div></div>
                <div class="cur" id="mMosCur" style="color:var(--text-soft)">—</div></div>
              <div class="meter"><div class="fill" id="mMosFill"></div><div class="limit"></div></div>
              <div class="mos-note" id="mMosNote" style="color:var(--text-soft)">Seleccione refacción y cantidad.</div>
            </div>
          </div>
        </div>
        <div class="section-title">3 · Refacciones del pedido (<span id="mCount">0</span>)</div>
        <div class="card-block" style="padding:0;overflow:hidden">
          <div class="table-wrap"><table class="lines-table">
            <thead><tr><th>#</th><th>Código</th><th>Descripción</th><th>Cant.</th><th>MOS</th><th></th></tr></thead>
            <tbody id="mLines"><tr><td colspan="6" class="empty-lines">Aún no hay refacciones.</td></tr></tbody>
          </table></div>
        </div>
      </div>
      <div class="modal-foot">
        <div class="note">Las refacciones con MOS &gt; ${CONFIG.MOS_MAX.toFixed(2)} no pueden agregarse.</div>
        <div class="actions">
          <button class="btn btn-ghost" onclick="cerrarModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="guardarDemo()">✓ Registrar Pedido</button>
        </div>
      </div>
    </div>
  </div>`;
}
function cerrarModal() { $("#modalRoot").innerHTML = ""; }

function calcMos(ref, cant) {
  const inv = invActual(ref);
  if (!inv || !inv.demandaMensual) return null;
  return (inv.existencia + (cant || 0)) / inv.demandaMensual;
}
function onRefSel() {
  const ref = window.REFACCIONES.find(r => r.codigo === $("#mRef").value);
  const box = $("#mAlert");
  if (!ref) { box.className = "alert"; onCalcMos(); return; }
  // alertas: ¿existe como OBSOLETO / LENTO en OTRAS agencias?
  const otras = (ref.inventario || []).filter(i => i.agencia !== CONFIG.AGENCIA_ACTUAL);
  const obs = otras.filter(i => i.estado === "OBSOLETO");
  const len = otras.filter(i => i.estado === "LENTO");
  if (obs.length || len.length) {
    const li = [...obs, ...len].map(i => `<li>${esc(i.agencia)}: <b>${i.existencia}</b> pza (${i.estado})</li>`).join("");
    box.className = "alert warn show";
    box.innerHTML = `<span class="ai">💡</span><div><b>Existe ociosa en otras agencias</b>Considere un traslado antes de comprar:<ul>${li}</ul></div>`;
  } else {
    box.className = "alert ok show";
    box.innerHTML = `<span class="ai">✅</span><div>Sin existencia obsoleta o lenta en otras agencias.</div>`;
  }
  onCalcMos();
}
function onCalcMos() {
  const ref = window.REFACCIONES.find(r => r.codigo === $("#mRef").value);
  const cant = parseInt($("#mCant").value, 10) || 0;
  const cur = $("#mMosCur"), fill = $("#mMosFill"), note = $("#mMosNote");
  if (!ref || !cant) { cur.textContent = "—"; cur.style.color = "var(--text-soft)"; fill.style.width = "0"; note.textContent = "Seleccione refacción y cantidad."; note.style.color = "var(--text-soft)"; return; }
  const mos = calcMos(ref, cant);
  if (mos == null) { cur.textContent = "N/D"; cur.style.color = "var(--text-soft)"; fill.style.width = "0"; note.textContent = "Sin demanda mensual: se permite agregar sin métrica."; note.style.color = "var(--text-soft)"; return; }
  const pct = Math.min(mos / 2.25 * 100, 100);
  const col = mos > 1.5 ? "var(--danger)" : mos > 1.2 ? "var(--warn)" : "var(--ok)";
  cur.textContent = mos.toFixed(2); cur.style.color = col;
  fill.style.width = pct + "%"; fill.style.background = col;
  note.textContent = mos > 1.5 ? "⛔ Supera el MOS máximo: reduzca la cantidad." : "✅ Dentro del límite.";
  note.style.color = col;
}
function agregarLinea() {
  const ref = window.REFACCIONES.find(r => r.codigo === $("#mRef").value);
  const cant = parseInt($("#mCant").value, 10) || 0;
  if (!ref) return alert("Seleccione una refacción.");
  if (cant <= 0) return alert("La cantidad debe ser mayor a 0.");
  const mos = calcMos(ref, cant);
  if (mos != null && mos > CONFIG.MOS_MAX) return alert(`El MOS resultante (${mos.toFixed(2)}) supera el máximo de ${CONFIG.MOS_MAX}.`);
  if (LINEAS.some(l => l.codigo === ref.codigo)) return alert("Esa refacción ya está en el pedido.");
  LINEAS.push({ codigo: ref.codigo, descripcion: ref.descripcion, cant, mos });
  $("#mRef").value = ""; $("#mCant").value = ""; $("#mAlert").className = "alert"; onCalcMos();
  pintaLineas();
}
function pintaLineas() {
  $("#mCount").textContent = LINEAS.length;
  $("#mLines").innerHTML = LINEAS.length ? LINEAS.map((l, i) => `
    <tr><td>${i+1}</td><td class="mono">${esc(l.codigo)}</td><td>${esc(l.descripcion)}</td><td>${l.cant}</td>
    <td>${l.mos == null ? "N/D" : l.mos.toFixed(2)}</td>
    <td><button class="btn btn-danger btn-sm" onclick="quitarLinea(${i})">Quitar</button></td></tr>`).join("")
    : `<tr><td colspan="6" class="empty-lines">Aún no hay refacciones.</td></tr>`;
}
function quitarLinea(i) { LINEAS.splice(i, 1); pintaLineas(); }
function guardarDemo() {
  if (!$("#mProv").value) return alert("Seleccione un proveedor.");
  if (!LINEAS.length) return alert("Agregue al menos una refacción.");
  alert("✓ Pedido registrado (demo). En el prototipo no se guarda en la base.");
  cerrarModal();
}

/* ===== 5.2 Tablero de Inventario ===== */
SCREENS.tablero = () => {
  const totalFilas = DIST_MOVIMIENTO.reduce((a, d) => a + d.filas, 0);
  const barras = DIST_MOVIMIENTO.map(d => {
    const pct = (d.filas / totalFilas * 100);
    return `<div class="bar-row">
      <div class="lbl">${esc(d.clase)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${d.color}"></div></div>
      <div class="num"><b>${num(d.filas)}</b> · ${pct.toFixed(1)}%</div>
    </div>`;
  }).join("");
  const refsAgencia = window.REFACCIONES.map(r => ({ r, inv: invActual(r) })).filter(x => x.inv);
  const filasTabla = refsAgencia.map(({ r, inv }) => `
    <tr><td class="mono">${esc(r.codigo)}</td><td>${esc(r.descripcion)}</td><td>${esc(r.categoria)}</td>
    <td>${inv.existencia}</td><td>${inv.demandaMensual}</td><td>${pillClase(inv.estado)}</td></tr>`).join("");
  return `
  ${bannerDemo("Números de ejemplo. La <b>distribución por movimiento</b> refleja las categorías reales del DWH (GLOBAL): NUEVO, RÁPIDO, MEDIO, LENTO, OBSOLETO.")}
  <div class="kpis">
    <div class="kpi"><div class="label">Refacciones activas</div><div class="value">2,908</div></div>
    <div class="kpi"><div class="label">Sucursales</div><div class="value">9</div></div>
    <div class="kpi"><div class="label">Valor de inventario</div><div class="value small">${money(22860000)}</div></div>
    <div class="kpi"><div class="label">Obsoleto + Lento</div><div class="value danger">44%</div></div>
  </div>
  <div class="grid-2 wide-left">
    <div class="panel">
      <div class="panel-head"><div><h3>Distribución del inventario por movimiento</h3><div class="sub">Piezas según qué tanto rotan</div></div></div>
      <div style="padding:18px 20px"><div class="bars">${barras}</div></div>
    </div>
    <div>
      <div class="feature" style="margin-bottom:16px">
        <h4>Alertas del inventario</h4>
        <div class="mini-alert dgr"><div class="ic">💤</div><div><div class="t">Capital inmovilizado en obsoletos</div><div class="d">14,786 registros con clasificación OBSOLETO. Candidatos a traslado o remate.</div></div></div>
        <div class="mini-alert warn"><div class="ic">🐢</div><div><div class="t">Piezas de lento movimiento</div><div class="d">11,826 registros LENTO. Vigilar antes de recomprar.</div></div></div>
        <div class="mini-alert info"><div class="ic">💡</div><div><div class="t">Obsoleto que otras SÍ venden</div><div class="d">Cruce pendiente: reubicar piezas muertas hacia agencias con demanda.</div></div></div>
      </div>
    </div>
  </div>
  <div class="panel mt">
    <div class="panel-head"><div><h3>Refacciones en ${esc(CONFIG.AGENCIA_ACTUAL)}</h3><div class="sub">Muestra del catálogo con existencia y estado</div></div></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Código</th><th>Descripción</th><th>Categoría</th><th>Existencia</th><th>Demanda/mes</th><th>Estado</th></tr></thead>
      <tbody>${filasTabla}</tbody>
    </table></div>
  </div>`;
};

/* ===== 5.3 Traslados ===== */
SCREENS.traslados = () => `
  ${bannerDemo("Datos de ejemplo. Aquí se registrará y dará seguimiento a los movimientos de piezas entre sucursales.")}
  <div class="page-intro"><h3>¿Para qué sirve esta pantalla?</h3>
    <p>Cuando una pieza sobra en una sucursal (obsoleta/lenta) y falta en otra, en vez de comprarla nueva se <b>traslada</b>. Esto evita gastar de más y baja el inventario muerto.</p></div>
  <div class="panel">
    <div class="panel-head"><div><h3>Traslados registrados</h3><div class="sub">Movimientos entre sucursales</div></div>
      <button class="btn btn-primary" onclick="alert('Nuevo traslado (demo)')">＋ Nuevo traslado</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Folio</th><th>Fecha</th><th>Refacción</th><th>Cant.</th><th>Origen</th><th>Destino</th><th>Estatus</th></tr></thead>
      <tbody>${TRASLADOS.map(t => `<tr><td class="mono">${esc(t.folio)}</td><td>${esc(t.fecha)}</td>
        <td>${esc(t.cod)} <span class="muted">${esc(t.desc)}</span></td><td>${t.cant}</td>
        <td>${esc(t.origen)}</td><td>${esc(t.destino)}</td>
        <td><span class="pill ${t.est}">${esc(window.ESTADOS_PEDIDO[t.est]||t.est)}</span></td></tr>`).join("")}</tbody>
    </table></div>
  </div>
  ${featureList("Qué faltará definir con el negocio", [
    ["¿El traslado <b>descuenta</b> de una agencia y <b>suma</b> en otra automáticamente?", "must"],
    ["¿Quién <b>autoriza</b> el traslado: gerente origen, destino, o ambos?", "must"],
    ["Poder <b>iniciar un traslado directo</b> desde la alerta de obsoletos.", "nice"],
  ])}`;

/* ===== 5.4 Recepción y Backorder ===== */
SCREENS.recepcion = () => `
  ${bannerDemo("Datos de ejemplo. Aquí se controla lo que llega (recepción) y lo que quedó pendiente de surtir (backorder).")}
  <div class="page-intro"><h3>¿Para qué sirve esta pantalla?</h3>
    <p>Al llegar la mercancía se registra la <b>entrada</b> (puede ser parcial). Lo que el proveedor no surtió queda como <b>backorder</b>: pendiente de entrega y de seguimiento.</p></div>
  <div class="panel">
    <div class="panel-head"><div><h3>Backorder — ítems no surtidos</h3><div class="sub">Pendientes de entrega por el proveedor</div></div></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Pedido</th><th>Refacción</th><th>Pedida</th><th>Surtida</th><th>Pendiente</th><th>Proveedor</th><th>Días</th></tr></thead>
      <tbody>${BACKORDER.map(b => `<tr><td class="mono">${esc(b.pedido)}</td>
        <td>${esc(b.cod)} <span class="muted">${esc(b.desc)}</span></td><td>${b.pedida}</td><td>${b.surtida}</td>
        <td><b style="color:var(--danger)">${b.pend}</b></td><td>${esc(b.prov)}</td>
        <td>${b.dias > 7 ? `<span class="pill warn">${b.dias} d</span>` : b.dias + " d"}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>
  ${featureList("Qué faltará definir con el negocio", [
    ["¿El backorder se <b>administra aquí</b> o solo se consulta desde GLOBAL?", "must"],
    ["Recepción <b>parcial</b>: llegan algunas piezas y otras no.", "nice"],
    ["Cotejar lo pedido vs. lo recibido con <b>lector de código de barras</b>.", "nice"],
  ])}`;

/* ===== 5.5 Márgenes y Rentabilidad ===== */
SCREENS.margenes = () => {
  const filas = MARGENES.map(m => {
    const margen = (m.venta - m.costo) / m.venta * 100;
    const alerta = margen < 25;
    return `<tr><td class="mono">${esc(m.cod)}</td><td>${esc(m.desc)}</td>
      <td>${money(m.costo)}</td><td>${money(m.venta)}</td>
      <td><b style="color:${alerta?'var(--danger)':'var(--ok)'}">${margen.toFixed(0)}%</b></td>
      <td>${alerta ? '<span class="pill dgr">Margen bajo</span>' : '<span class="pill ok">OK</span>'}</td></tr>`;
  }).join("");
  return `
  ${bannerDemo("Precios de ejemplo. Los márgenes reales saldrán de cruzar <b>costo</b> (compras) contra <b>precio de venta</b>.")}
  <div class="page-intro"><h3>¿Para qué sirve esta pantalla?</h3>
    <p>Muestra cuánto se gana por pieza (margen = (venta − costo) / venta). Si el margen cae debajo de un umbral, salta una <b>alerta</b> para revisar precios.</p></div>
  <div class="panel">
    <div class="panel-head"><div><h3>Márgenes por refacción</h3><div class="sub">Alerta cuando el margen es menor a 25%</div></div></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Código</th><th>Descripción</th><th>Costo</th><th>Precio venta</th><th>Margen</th><th>Estatus</th></tr></thead>
      <tbody>${filas}</tbody>
    </table></div>
  </div>
  ${featureList("Dependencias / dudas", [
    ["Necesita <b>precio de venta</b> y <b>costo</b> reales (hoy no hay precio en el catálogo).", "must"],
    ["¿Qué <b>umbral de margen</b> dispara la alerta? (aquí usamos 25% de ejemplo).", "must"],
  ])}`;
};

/* ===== 5.6 Alertas y Auditoría ===== */
SCREENS.alertas = () => `
  ${bannerDemo("Datos de ejemplo. Centraliza las alertas del módulo y el rastro de auditoría de las compras.")}
  <div class="page-intro"><h3>¿Para qué sirve esta pantalla?</h3>
    <p>Junta en un solo lugar los avisos importantes (sobre-stock, obsoletos, márgenes bajos, compras sospechosas) y deja <b>trazado</b> quién hizo qué, para poder auditar el proceso de compras.</p></div>
  <div class="grid-2">
    <div class="feature"><h4>Alertas activas (ejemplo)</h4>
      <div class="mini-alert dgr"><div class="ic">⛔</div><div><div class="t">Pedido supera MOS máximo</div><div class="d">PED-00128 · Amortiguador trasero · MOS 1.80</div></div></div>
      <div class="mini-alert warn"><div class="ic">💰</div><div><div class="t">Margen por debajo del umbral</div><div class="d">RF-3001 Aceite 5W-30 · margen 23%</div></div></div>
      <div class="mini-alert info"><div class="ic">🕵️</div><div><div class="t">Compra de lento movimiento</div><div class="d">Se compró una pieza clasificada LENTO sin traslado disponible.</div></div></div>
    </div>
    <div class="feature"><h4>Bitácora de auditoría (ejemplo)</h4>
      <ul>
        <li><b>J. Ramírez</b> registró PED-00129 · 2026-07-05 09:14</li>
        <li><b>L. Torres</b> aprobó PED-00126 · 2026-07-04 17:02</li>
        <li><b>A. Gómez</b> recibió PED-00130 · 2026-07-06 11:40</li>
        <li><b>M. Ruiz</b> cambió parámetro MOS máx. a 1.50 · 2026-07-01</li>
      </ul>
    </div>
  </div>
  ${featureList("Qué faltará definir con el negocio", [
    ["¿Qué <b>eventos</b> se auditan y <b>quién</b> revisa las alertas?", "must"],
    ["¿Las alertas se <b>notifican</b> (correo/pantalla) o solo se consultan aquí?", "nice"],
  ])}`;

/* ===== 5.7 Reportes ===== */
SCREENS.reportes = () => {
  const cols = [["Ene",60],["Feb",78],["Mar",52],["Abr",90],["May",70],["Jun",84],["Jul",46]];
  const max = Math.max(...cols.map(c => c[1]));
  const chart = cols.map(([m, v]) => `<div class="col"><div class="bar" style="height:${v/max*100}%"></div><div class="cap">${m}</div></div>`).join("");
  const cards = [
    ["📦","Compras por periodo","Monto y cantidad comprada por mes, sucursal o proveedor."],
    ["🧊","Inventario obsoleto/lento","Capital inmovilizado y candidatos a traslado."],
    ["💰","Márgenes de refacciones","Rentabilidad por pieza y por categoría."],
    ["🔁","Traslados realizados","Movimientos entre sucursales y su impacto."],
    ["📥","Backorder / no surtido","Pendientes de entrega por proveedor."],
    ["🏢","Desempeño de proveedores","Tiempo de entrega y cumplimiento."],
  ].map(([i,t,d]) => `<div class="report-card" onclick="alert('Abrir reporte: ${t} (demo)')"><div class="ic">${i}</div><div class="t">${t}</div><div class="d">${d}</div></div>`).join("");
  return `
  ${bannerDemo("Reportes de ejemplo. Todos exportables a Excel/PDF cuando se conecten a datos reales.")}
  <div class="grid-2 wide-left">
    <div class="panel"><div class="panel-head"><div><h3>Compras por mes</h3><div class="sub">Ejemplo · miles de pesos</div></div>
      <button class="btn btn-ghost" onclick="alert('Exportar (demo)')">⬇ Exportar</button></div>
      <div style="padding:14px 18px"><div class="chart-fake">${chart}</div></div>
    </div>
    <div class="feature"><h4>Reportes disponibles</h4><div class="report-grid">${cards}</div></div>
  </div>`;
};

/* ===== 5.8 Catálogo de Refacciones ===== */
SCREENS.refacciones = () => `
  ${bannerDemo("Muestra del catálogo actual (sin precio todavía — es una de las decisiones clave con el negocio).")}
  <div class="panel">
    <div class="panel-head"><div><h3>Catálogo de Refacciones</h3><div class="sub">${window.REFACCIONES.length} piezas de ejemplo</div></div>
      <div class="toolbar"><div class="search"><span>🔎</span><input id="qRef" placeholder="Código, descripción o marca…"></div>
      <button class="btn btn-primary" onclick="alert('Alta de refacción (demo)')">＋ Nueva</button></div></div>
    <div class="table-wrap"><table id="tRef">
      <thead><tr><th>Código</th><th>Descripción</th><th>Categoría</th><th>Marca</th><th>U.M.</th><th>Estado (agencia)</th></tr></thead>
      <tbody id="bRef"></tbody>
    </table></div>
  </div>`;
INIT.refacciones = () => {
  const pinta = f => {
    const q = (f||"").toLowerCase();
    $("#bRef").innerHTML = window.REFACCIONES.filter(r => !q || `${r.codigo} ${r.descripcion} ${r.marca}`.toLowerCase().includes(q))
      .map(r => { const inv = invActual(r); return `<tr><td class="mono">${esc(r.codigo)}</td><td>${esc(r.descripcion)}</td>
        <td>${esc(r.categoria)}</td><td>${esc(r.marca)}</td><td><span class="badge">${esc(r.unidad)}</span></td>
        <td>${inv ? pillClase(inv.estado) : '<span class="muted">—</span>'}</td></tr>`; }).join("")
      || `<tr><td colspan="6" class="empty-lines">Sin resultados.</td></tr>`;
  };
  pinta("");
  const q = $("#qRef"); if (q) q.addEventListener("input", () => pinta(q.value));
};

/* ===== 5.9 Proveedores ===== */
SCREENS.proveedores = () => `
  ${bannerDemo("Catálogo de ejemplo. Se podrá dar de alta y editar desde aquí (hoy es fijo).")}
  <div class="panel">
    <div class="panel-head"><div><h3>Proveedores</h3><div class="sub">${window.PROVEEDORES.length} proveedores de ejemplo</div></div>
      <button class="btn btn-primary" onclick="alert('Alta de proveedor (demo)')">＋ Nuevo proveedor</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Clave</th><th>Nombre</th><th>RFC</th><th>Contacto</th><th>Teléfono</th></tr></thead>
      <tbody>${window.PROVEEDORES.map(p => `<tr><td class="mono">${esc(p.clave)}</td><td>${esc(p.nombre)}</td>
        <td>${esc(p.rfc)}</td><td>${esc(p.contacto)}</td><td>${esc(p.telefono)}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>
  ${featureList("Ideas para más adelante", [
    ["Relacionar qué <b>refacciones/categorías</b> maneja cada proveedor.", "nice"],
    ["<b>Tiempo de entrega</b> y condiciones de pago por proveedor.", "nice"],
  ])}`;

/* ===== 5.10 Almacenes / Agencias ===== */
SCREENS.almacenes = () => `
  ${bannerDemo("Datos de ejemplo. En la base real hay <b>9 sucursales</b>; aquí mostramos 4 de muestra.")}
  <div class="panel">
    <div class="panel-head"><div><h3>Almacenes / Agencias</h3><div class="sub">Inventario por sucursal</div></div></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Sucursal</th><th>Ciudad</th><th>Refacciones</th><th>Valor de inventario</th></tr></thead>
      <tbody>${SUCURSALES.map(s => `<tr><td><b>${esc(s.nombre)}</b>${s.nombre===CONFIG.AGENCIA_ACTUAL?' <span class="pill info">actual</span>':''}</td>
        <td>${esc(s.ciudad)}</td><td>${num(s.refs)}</td><td>${money(s.valor)}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>`;

/* ===== 5.11 Usuarios y Roles ===== */
SCREENS.usuarios = () => `
  ${bannerDemo("Datos de ejemplo. Los roles reales de permisos viven en la base <b>SEG</b> del ecosistema.")}
  <div class="page-intro"><h3>¿Para qué sirve esta pantalla?</h3>
    <p>Define <b>quién puede qué</b>: quién registra un pedido, quién lo aprueba y quién recibe la mercancía. Es la base del flujo de aprobación.</p></div>
  <div class="panel">
    <div class="panel-head"><div><h3>Usuarios del módulo</h3><div class="sub">Roles y alcance</div></div>
      <button class="btn btn-primary" onclick="alert('Nuevo usuario (demo)')">＋ Nuevo</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Rol</th><th>Agencia</th><th>Permisos</th></tr></thead>
      <tbody>${USUARIOS.map(u => `<tr><td><b>${esc(u.nombre)}</b></td><td><span class="pill info">${esc(u.rol)}</span></td>
        <td>${esc(u.agencia)}</td><td>${esc(u.permisos)}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>
  ${featureList("Qué faltará definir con el negocio", [
    ["¿El gerente ve <b>solo su agencia</b> o <b>todas</b>?", "must"],
    ["¿Los roles se administran aquí o se toman de <b>SEG</b> (seguridad de ADCCore)?", "must"],
  ])}`;

/* ===== 5.12 Parámetros ===== */
SCREENS.parametros = () => `
  ${bannerDemo("Datos de ejemplo. Aquí se ajustarán las reglas del módulo sin tocar código.")}
  <div class="page-intro"><h3>¿Para qué sirve esta pantalla?</h3>
    <p>Permite que el negocio <b>ajuste las reglas</b> (MOS máximo, topes, umbrales) sin depender de programación.</p></div>
  <div class="panel">
    <div class="panel-head"><div><h3>Parámetros del módulo</h3><div class="sub">Valores de ejemplo</div></div></div>
    <div style="padding:20px">
      <div class="form-grid">
        <div class="field"><label>MOS máximo permitido</label><input value="${CONFIG.MOS_MAX.toFixed(2)}" readonly></div>
        <div class="field"><label>Umbral de margen bajo (%)</label><input value="25" readonly></div>
        <div class="field"><label>Días para marcar backorder crítico</label><input value="7" readonly></div>
        <div class="field"><label>Moneda</label><input value="${esc(CONFIG.MONEDA)}" readonly></div>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="alert('Guardar parámetros (demo)')">Guardar cambios</button>
    </div>
  </div>
  ${featureList("Dudas para el negocio", [
    ["¿El MOS máximo debe ser <b>configurable por categoría o por refacción</b>?", "must"],
    ["¿Cómo se calcula la <b>demanda mensual</b>? (promedio de N meses, del ERP, manual)", "must"],
  ])}`;

/* pantalla genérica de respaldo */
SCREENS._todo = (item) => `
  <div class="page-intro"><h3>${esc(item.title)}</h3><p>Pantalla en construcción.</p></div>`;

/* helper: lista "qué falta definir" */
function featureList(titulo, items) {
  return `<div class="feature mt"><h4>${esc(titulo)}</h4><ul>${items.map(([txt, tag]) =>
    `<li><div>${txt}${tag === "must" ? '<span class="tag-must">imprescindible</span>' : tag === "nice" ? '<span class="tag-nice">deseable</span>' : ""}</div></li>`
  ).join("")}</ul></div>`;
}

/* ---------- 6. Arranque ---------- */
renderNav();
navigate("tablero");
