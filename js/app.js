/* ============================================================
   Lógica del módulo de Refacciones · Solicitud de Pedido
   Depende de: config.js, proveedores.js, refacciones.js, pedidos.js
   ============================================================ */
"use strict";

const { MOS_MAX, AGENCIA_ACTUAL } = window.CONFIG;

let sel = null;        // refacción seleccionada { ref, invActual, otras }
let lineas = [];       // renglones del pedido en construcción
let detActual = null;  // N° de pedido abierto en el modal de detalle
let editandoNum = null;// N° de pedido en edición (null = pedido nuevo)

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const up = s => (s || "").trim().toUpperCase();
function mosColor(v){ return v > MOS_MAX ? "var(--danger)" : (v >= 1.2 ? "var(--warn)" : "var(--ok)"); }
function hoy(){ return new Date().toISOString().slice(0,10); }

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  $("agenciaLbl").textContent = AGENCIA_ACTUAL;

  // Autocompletado de proveedores por NOMBRE (datalist)
  $("dlProveedores").innerHTML = PROVEEDORES
    .map(p => `<option value="${p.nombre}">${p.clave}</option>`).join("");

  // Categorías para el filtro del catálogo de refacciones
  const cats = [...new Set(REFACCIONES.map(r => r.categoria))].sort();
  $("refCat").innerHTML = '<option value="">Todas las categorías</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join("");

  renderTable(PEDIDOS);
  renderKPIs();
});

/* ============================================================
   NAVEGACIÓN / PESTAÑAS
   ============================================================ */
function showModule(el){
  document.querySelectorAll(".nav a").forEach(a => a.classList.remove("active"));
  el.classList.add("active");
  switchTab("consulta");
}
function switchTab(tab){
  $("tabConsulta").classList.toggle("active", tab === "consulta");
  $("tabNueva").classList.toggle("active", tab === "nueva");
  if (tab === "nueva") openNueva();
}

/* ============================================================
   CONSULTA PEDIDOS (tabla + KPIs)
   ============================================================ */
/* Agrupa los renglones por N° Pedido → un objeto por pedido con sus líneas */
function agruparPedidos(rows){
  const mapa = new Map();
  rows.forEach(r => {
    if (!mapa.has(r.num)) mapa.set(r.num, { num:r.num, fecha:r.fecha, clave:r.clave, prov:r.prov, quien:r.quien, suc:r.suc, lineas:[] });
    mapa.get(r.num).lineas.push(r);
  });
  return [...mapa.values()];
}

/* Vista maestro: un renglón por pedido (clic → detalle) */
function renderTable(rows){
  const grupos = agruparPedidos(rows);
  $("pedidosBody").innerHTML = grupos.map(g => {
    const ests = [...new Set(g.lineas.map(l => l.est))];
    const estCell = ests.length === 1
      ? `<span class="pill ${ests[0]}">${ESTADOS_PEDIDO[ests[0]]}</span>`
      : `<span class="pill">Varios</span>`;
    const alerta = g.lineas.some(l => l.mos > MOS_MAX)
      ? ' <span title="Contiene refacciones con MOS > 1.5">⚠</span>' : '';
    return `<tr onclick="abrirDetalle('${g.num}')">
      <td class="mono">${g.num}</td><td>${g.fecha}</td><td>${g.clave}</td><td>${g.prov}</td>
      <td>${g.quien}</td><td>${g.suc}</td>
      <td style="text-align:center;font-weight:600">${g.lineas.length}${alerta}</td>
      <td>${estCell}</td>
    </tr>`;
  }).join("");
}

/* Vista detalle: refacciones de un pedido (igual que la consulta anterior) */
function abrirDetalle(num){
  const lineas = PEDIDOS.filter(p => p.num === num);
  if (!lineas.length) return;
  detActual = num;
  const g = lineas[0];
  $("detTitulo").textContent = num;
  $("detInfo").innerHTML =
    `<div><span>Fecha</span><b>${g.fecha}</b></div>` +
    `<div><span>Clave Prov.</span><b>${g.clave}</b></div>` +
    `<div><span>Proveedor</span><b>${g.prov}</b></div>` +
    `<div><span>Quién Solicitó</span><b>${g.quien}</b></div>` +
    `<div><span>Sucursal / Agencia</span><b>${g.suc}</b></div>`;
  $("detBody").innerHTML = lineas.map(l => {
    const pct = Math.min(l.mos / (MOS_MAX * 1.5) * 100, 100);
    const col = mosColor(l.mos);
    const over = l.mos > MOS_MAX ? ' title="Supera el MOS máximo (1.5)"' : '';
    return `<tr>
      <td class="mono">${l.cod}</td><td>${l.desc}</td><td>${l.um}</td>
      <td style="text-align:right;font-weight:600">${l.cant}</td>
      <td><div class="mos-cell"${over}>
            <div class="mos-track"><div class="mos-fill" style="width:${pct}%;background:${col}"></div></div>
            <span class="mos-val" style="color:${col}">${l.mos.toFixed(2)}${l.mos > MOS_MAX ? ' ⚠' : ''}</span>
          </div></td>
      <td><span class="pill ${l.est}">${ESTADOS_PEDIDO[l.est]}</span></td>
    </tr>`;
  }).join("");
  $("ovDetalle").classList.add("open");
}

function renderKPIs(){
  const grupos = agruparPedidos(PEDIDOS);
  $("kpiTot").textContent = grupos.length;
  $("kpiPen").textContent = grupos.filter(g => g.lineas.some(l => l.est === "pen")).length;
  $("kpiRec").textContent = grupos.filter(g => g.lineas.every(l => l.est === "rec")).length;
  $("kpiMos").textContent = grupos.filter(g => g.lineas.some(l => l.mos > MOS_MAX)).length;
}

function filterTable(){
  const q = $("tblSearch").value.toLowerCase();
  if (!q){ renderTable(PEDIDOS); return; }
  const nums = new Set(PEDIDOS.filter(p =>
    [p.num, p.cod, p.prov, p.desc, p.quien, p.suc].join(" ").toLowerCase().includes(q))
    .map(p => p.num));
  renderTable(PEDIDOS.filter(p => nums.has(p.num)));
}

/* ============================================================
   MODAL NUEVA SOLICITUD
   ============================================================ */
function openNueva(){
  editandoNum = null;
  $("nuevaTitulo").textContent = "Nueva Solicitud de Pedido";
  $("nuevaSub").textContent = "Agregue una o varias refacciones al pedido";
  $("btnSave").textContent = "✓ Registrar Pedido";
  $("ovNueva").classList.add("open");
  resetForm();
}

/* Reabre un pedido existente en el mismo modal, en modo edición */
function abrirEdicion(num){
  const orig = PEDIDOS.filter(p => p.num === num);
  if (!orig.length) return;
  const g = orig[0];
  cerrar("ovDetalle");
  editandoNum = num;
  $("nuevaTitulo").textContent = "Editar Pedido " + num;
  $("nuevaSub").textContent = "Modifique el proveedor o las refacciones del pedido";
  $("btnSave").textContent = "✓ Guardar cambios";

  resetForm();
  editandoNum = num;               // resetForm no lo toca, pero por claridad
  $("proveedor").value = g.prov;
  $("claveProv").value = g.clave;
  lineas = orig.map(l => ({ cod:l.cod, desc:l.desc, um:l.um, cant:l.cant, mos:l.mos }));
  renderLines();

  $("ovNueva").classList.add("open");
  $("tabConsulta").classList.remove("active");
  $("tabNueva").classList.add("active");
}

function closeModal(){
  $("ovNueva").classList.remove("open");
  editandoNum = null;
  $("tabConsulta").classList.add("active");
  $("tabNueva").classList.remove("active");
}
$("ovNueva").addEventListener("click", e => { if (e.target.id === "ovNueva") closeModal(); });

function resetForm(){
  ["claveProv","proveedor","codigo","descripcion","cantidad","unidad"].forEach(id => $(id).value = "");
  lineas = [];
  clearRefaccion();
  renderLines();
}

/* ---------- Proveedor (autocompletado por nombre + catálogo) ---------- */
function onProveedorInput(){
  const val = $("proveedor").value.trim().toLowerCase();
  const p = PROVEEDORES.find(x => x.nombre.toLowerCase() === val);
  $("claveProv").value = p ? p.clave : "";
}

function abrirCatProveedores(){ $("ovProv").classList.add("open"); $("provSearch").value = ""; renderCatProv(); }
function renderCatProv(){
  const q = $("provSearch").value.toLowerCase();
  const rows = PROVEEDORES.filter(p =>
    [p.clave, p.nombre, p.rfc].join(" ").toLowerCase().includes(q));
  $("provCatBody").innerHTML = rows.length ? rows.map(p =>
    `<tr onclick="seleccionarProv('${p.clave}')">
      <td class="mono">${p.clave}</td><td>${p.nombre}</td>
      <td>${p.rfc}</td><td class="muted">${p.contacto}</td></tr>`).join("")
    : `<tr><td colspan="4" class="empty-lines">Sin resultados.</td></tr>`;
}
function seleccionarProv(clave){
  const p = PROVEEDORES.find(x => x.clave === clave);
  $("claveProv").value = p.clave;
  $("proveedor").value = p.nombre;
  cerrar("ovProv");
}

/* ---------- Refacción (código + catálogo con filtros) ---------- */
function onCodigoInput(){
  const cod = up($("codigo").value);
  const ref = REFACCIONES.find(r => r.codigo.toUpperCase() === cod);
  if (ref) evaluarRefaccion(ref);
  else clearRefaccion();
}

function abrirCatRefacciones(){ $("ovRef").classList.add("open"); $("refSearch").value = ""; $("refCat").value = ""; renderCatRef(); }
function renderCatRef(){
  const q = $("refSearch").value.toLowerCase();
  const cat = $("refCat").value;
  const rows = REFACCIONES.filter(r =>
    (!cat || r.categoria === cat) &&
    [r.codigo, r.descripcion, r.marca].join(" ").toLowerCase().includes(q));
  $("refCatBody").innerHTML = rows.length ? rows.map(r => {
    const inv = r.inventario.find(i => i.agencia === AGENCIA_ACTUAL);
    const est = inv ? ESTADOS_INV[inv.estado] : { etiqueta: "No disponible", clase: "" };
    return `<tr onclick="seleccionarRef('${r.codigo}')">
      <td class="mono">${r.codigo}</td><td>${r.descripcion}</td>
      <td><span class="badge">${r.categoria}</span></td><td>${r.marca}</td>
      <td>${r.unidad}</td><td><span class="pill ${est.clase}">${est.etiqueta}</span></td></tr>`;
  }).join("") : `<tr><td colspan="6" class="empty-lines">Sin resultados.</td></tr>`;
}
function seleccionarRef(codigo){
  const ref = REFACCIONES.find(r => r.codigo === codigo);
  $("codigo").value = ref.codigo;
  evaluarRefaccion(ref);
  cerrar("ovRef");
}

/* ---------- Evaluación / validaciones de la refacción ---------- */
function clearRefaccion(){
  sel = null;
  $("descripcion").value = "";
  $("unidad").value = "";
  ["alOk","alLento","alObs"].forEach(id => $(id).classList.remove("show"));
  onCantidad();
}
function showAlert(id, txtId, html){ $(txtId).innerHTML = html; $(id).classList.add("show"); }

function evaluarRefaccion(ref){
  const invActual = ref.inventario.find(i => i.agencia === AGENCIA_ACTUAL);
  const otras = ref.inventario.filter(i => i.agencia !== AGENCIA_ACTUAL);
  sel = { ref, invActual, otras };

  // Unidad depende de la refacción
  $("descripcion").value = ref.descripcion;
  $("unidad").value = ref.unidad;

  ["alOk","alLento","alObs"].forEach(id => $(id).classList.remove("show"));

  // VALIDACIÓN: obsoleto / lento en OTRAS agencias (avisar al gerente)
  const obsoletos = otras.filter(i => i.estado === "OBSOLETO");
  const lentos    = otras.filter(i => i.estado === "LENTO");

  if (obsoletos.length){
    showAlert("alObs","alObsTxt",
      `<b>Pieza obsoleta</b>` +
      `Disponible en otras sucursales:` +
      `<ul>${obsoletos.map(i => `<li>${i.agencia}: ${i.existencia} existencia(s)</li>`).join("")}</ul>`);
  }
  if (lentos.length){
    showAlert("alLento","alLentoTxt",
      `<b>Pieza de movimiento lento</b>` +
      `Disponible en otras sucursales:` +
      `<ul>${lentos.map(i => `<li>${i.agencia}: ${i.existencia} existencia(s)</li>`).join("")}</ul>`);
  }
  if (!obsoletos.length && !lentos.length){
    showAlert("alOk","alOkTxt",
      `<b>Sin alertas en otras agencias</b>` +
      `No hay inventario obsoleto ni lento de esta refacción en otras agencias. Puede continuar.`);
  }

  onCantidad();
}

/* ---------- MOS (visual + validación máx 1.5) ---------- */
function calcMOS(cant){
  if (!sel || !sel.invActual || !sel.invActual.demandaMensual) return null;
  return (sel.invActual.existencia + cant) / sel.invActual.demandaMensual;
}
function onCantidad(){
  const cant = parseFloat($("cantidad").value);
  const fill = $("mosFill"), cur = $("mosCur"), note = $("mosNote"), btn = $("btnAdd");

  if (!sel || isNaN(cant) || cant <= 0){
    cur.textContent = "—"; cur.style.color = "var(--text-soft)"; fill.style.width = "0";
    note.textContent = sel ? "Ingrese una cantidad para calcular el MOS." : "Seleccione una refacción y una cantidad.";
    note.style.color = "var(--text-soft)"; btn.disabled = true;
    return;
  }

  const mos = calcMOS(cant);
  if (mos === null){
    cur.textContent = "N/D"; cur.style.color = "var(--text-soft)"; fill.style.width = "0";
    note.textContent = "Sin datos de demanda en la agencia actual; no se puede calcular MOS.";
    note.style.color = "var(--text-soft)"; btn.disabled = false;
    return;
  }

  const pct = Math.min(mos / (MOS_MAX * 1.5) * 100, 100);
  const over = mos > MOS_MAX;
  const col = mosColor(mos);
  cur.textContent = mos.toFixed(2); cur.style.color = col;
  fill.style.width = pct + "%"; fill.style.background = col;

  if (over){
    note.innerHTML = `⛔ <b>MOS ${mos.toFixed(2)} supera el máximo (1.5).</b> Reduzca la cantidad.`;
    note.style.color = "var(--danger)"; btn.disabled = true;
  } else {
    note.innerHTML = `✅ MOS ${mos.toFixed(2)} dentro del límite (≤ 1.5).`;
    note.style.color = "var(--ok)"; btn.disabled = false;
  }
}

/* ============================================================
   RENGLONES DEL PEDIDO (varias refacciones)
   ============================================================ */
function agregarRenglon(){
  if (!sel){ alert("Seleccione una refacción válida."); return; }
  const cant = parseFloat($("cantidad").value);
  if (isNaN(cant) || cant <= 0){ alert("Ingrese una cantidad válida."); return; }
  const mos = calcMOS(cant);
  if (mos !== null && mos > MOS_MAX){ alert(`No se puede agregar: MOS ${mos.toFixed(2)} supera el máximo de 1.5.`); return; }
  if (lineas.some(l => l.cod === sel.ref.codigo)){ alert("Esa refacción ya está en el pedido."); return; }

  lineas.push({ cod: sel.ref.codigo, desc: sel.ref.descripcion, um: sel.ref.unidad, cant, mos });
  renderLines();

  // limpiar sub-formulario de refacción para agregar otra
  $("codigo").value = ""; $("cantidad").value = "";
  clearRefaccion();
}

function quitarRenglon(i){ lineas.splice(i, 1); renderLines(); }

function renderLines(){
  $("lineCount").textContent = lineas.length;
  if (!lineas.length){
    $("linesBody").innerHTML = `<tr><td colspan="7" class="empty-lines">Aún no hay refacciones en el pedido.</td></tr>`;
    $("btnSave").disabled = true;
    return;
  }
  $("linesBody").innerHTML = lineas.map((l, i) => {
    const col = l.mos == null ? "var(--text-soft)" : mosColor(l.mos);
    const mosTxt = l.mos == null ? "N/D" : l.mos.toFixed(2);
    return `<tr>
      <td>${i + 1}</td><td class="mono">${l.cod}</td><td>${l.desc}</td><td>${l.um}</td>
      <td style="font-weight:600">${l.cant}</td>
      <td><span style="color:${col};font-weight:700">${mosTxt}</span></td>
      <td><button class="btn btn-danger btn-sm" onclick="quitarRenglon(${i})">✕ Quitar</button></td>
    </tr>`;
  }).join("");
  $("btnSave").disabled = false;
}

/* ============================================================
   GUARDAR PEDIDO
   ============================================================ */
function nextPedidoNum(){
  const nums = PEDIDOS.map(p => parseInt(p.num.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 124) + 1;
  return "PED-" + String(next).padStart(5, "0");
}

function guardarPedido(){
  const clave  = up($("claveProv").value);
  const nombre = $("proveedor").value.trim().toLowerCase();
  const prov = PROVEEDORES.find(p =>
    (clave && p.clave.toUpperCase() === clave) || p.nombre.toLowerCase() === nombre);
  if (!prov){ alert("Seleccione un proveedor válido."); return; }
  if (!lineas.length){ alert("Agregue al menos una refacción al pedido."); return; }

  // --- Modo edición: se conservan N° de pedido, fecha, solicitante, sucursal y estatus ---
  if (editandoNum){
    const orig = PEDIDOS.filter(p => p.num === editandoNum);
    const base = { num: editandoNum, fecha: orig[0].fecha, quien: orig[0].quien, suc: orig[0].suc, est: orig[0].est };
    for (let i = PEDIDOS.length - 1; i >= 0; i--){
      if (PEDIDOS[i].num === editandoNum) PEDIDOS.splice(i, 1);
    }
    lineas.forEach(l => {
      PEDIDOS.unshift({
        ...base, clave: prov.clave, prov: prov.nombre,
        cod: l.cod, desc: l.desc, um: l.um, cant: l.cant,
        mos: l.mos == null ? 0 : l.mos
      });
    });
    renderTable(PEDIDOS);
    renderKPIs();
    alert(`✓ Pedido ${editandoNum} actualizado (${lineas.length} refacción(es)).`);
    closeModal();
    return;
  }

  // --- Modo alta: pedido nuevo ---
  const num = nextPedidoNum();
  const fecha = hoy();
  lineas.forEach(l => {
    PEDIDOS.unshift({
      num, fecha, clave: prov.clave, prov: prov.nombre,
      quien: "Usuario Compras", suc: AGENCIA_ACTUAL,
      cod: l.cod, desc: l.desc, um: l.um, cant: l.cant,
      mos: l.mos == null ? 0 : l.mos, est: "pen"
    });
  });

  renderTable(PEDIDOS);
  renderKPIs();
  alert(`✓ Pedido ${num} registrado con ${lineas.length} refacción(es).`);
  closeModal();
}

/* ---------- utilidades de cierre de modales secundarios ---------- */
function cerrar(id){ $(id).classList.remove("open"); }
["ovProv","ovRef","ovDetalle"].forEach(id => {
  document.addEventListener("DOMContentLoaded", () => {
    $(id).addEventListener("click", e => { if (e.target.id === id) cerrar(id); });
  });
});
