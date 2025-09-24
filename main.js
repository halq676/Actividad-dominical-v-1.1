// main.js — Ventas agrupadas por cliente con detalle editable que actualiza inventario
// IDs requeridos: inv-pechugas, inv-alas, inv-piernas, inv-pospiernas, inv-rabadillas, inv-apostador, inv-sopas, totalPresas, totalGallinas, gallinasInput, ventasMultiples, clienteInput, ventasTabla, searchInput, resultadoBusqueda, totalGeneral, totalFiado, totalPendiente

const PRECIOS = {
  Pechugas: 3500,
  Alas: 1200,
  Piernas: 1800,
  Pospiernas: 1800,
  Rabadillas: 1000,
  Apostador: 1000,
  Sopas: 500
};

// ---------------------
// Estado global
// ---------------------
let inventario = {
  Pechugas: 0, Alas: 0, Piernas: 0, Pospiernas: 0, Rabadillas: 0, Apostador: 0, Sopas: 0
};
let ventas = [];    // ventas: { idVenta, cliente, fecha, estado, pagoCon, devuelto, presas: [{tipo, cantidad, valorUnitario}] }
let lineasVenta = []; // formulario temporal

// ---------------------
// LocalStorage
// ---------------------
function guardarInventario(){
  try { localStorage.setItem('inventario', JSON.stringify(inventario)); }
  catch(e){ console.error('Error guardando inventario', e); }
}
function cargarInventario(){
  try {
    const r = localStorage.getItem('inventario');
    if(r){
      const p = JSON.parse(r);
      inventario = Object.assign(inventario, p);
    }
  } catch(e){ console.error('Error cargando inventario', e); }
}
function guardarVentas(){
  try { localStorage.setItem('ventas', JSON.stringify(ventas)); }
  catch(e){ console.error('Error guardando ventas', e); }
}
function cargarVentas(){
  try {
    const r = localStorage.getItem('ventas');
    ventas = r ? JSON.parse(r) : [];
  } catch(e){
    console.error('Error cargando ventas', e);
    ventas = [];
  }
}

function generarId(){
  return Date.now().toString() + Math.floor(Math.random()*1000000).toString();
}

// ---------------------
// Utilidades
// ---------------------
function calcularTotalVentaObj(v){
  return v.presas.reduce((s,p) => s + (Number(p.valorUnitario||0) * Number(p.cantidad||0)), 0);
}
function detalleResumen(v){
  return v.presas.map(p => `${p.tipo} x${p.cantidad}`).join(', ');
}
function escapeHtml(s){
  if(typeof s !== 'string') return s;
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ---------------------
// Inventario DOM
// ---------------------
function actualizarInventarioDOM(){
  const set = (id, val) => {
    const el = document.getElementById(id);
    if(el) el.innerText = Number(val||0);
  };
  set('inv-pechugas', inventario.Pechugas);
  set('inv-alas', inventario.Alas);
  set('inv-piernas', inventario.Piernas);
  set('inv-pospiernas', inventario.Pospiernas);
  set('inv-rabadillas', inventario.Rabadillas);
  set('inv-apostador', inventario.Apostador);
  set('inv-sopas', inventario.Sopas);

  const totalPresas =
    (Number(inventario.Pechugas)||0) + (Number(inventario.Alas)||0) + (Number(inventario.Piernas)||0) +
    (Number(inventario.Pospiernas)||0) + (Number(inventario.Rabadillas)||0) + (Number(inventario.Apostador)||0);
  const tp = document.getElementById('totalPresas');
  if(tp) tp.innerText = totalPresas;
  const tg = document.getElementById('totalGallinas');
  if(tg) tg.innerText = Math.floor(totalPresas / 10);
}

// ---------------------
// Inventario: agregar gallinas / reiniciar
// ---------------------
window.agregarGallinas = function(){
  const cant = parseInt(document.getElementById('gallinasInput')?.value,10) || 0;
  if(cant <= 0) return alert('Ingrese una cantidad válida de gallinas');
  inventario.Pechugas += cant * 2;
  inventario.Alas += cant * 2;
  inventario.Piernas += cant * 2;
  inventario.Pospiernas += cant * 2;
  inventario.Rabadillas += cant * 1;
  inventario.Apostador += cant * 1;
  inventario.Sopas += cant * 3;
  guardarInventario();
  actualizarInventarioDOM();
  document.getElementById('gallinasInput').value = '';
};

window.reiniciarInventario = function(){
  if(!confirm('¿Seguro que quieres reiniciar todo?')) return;
  inventario = { Pechugas:0, Alas:0, Piernas:0, Pospiernas:0, Rabadillas:0, Apostador:0, Sopas:0 };
  ventas = [];
  lineasVenta = [];
  guardarInventario();
  guardarVentas();
  actualizarInventarioDOM();
  renderLineasVenta();
  renderVentasTabla();
};

// ---------------------
// Líneas de venta (formulario)
// ---------------------
window.agregarLineaVenta = function(){
  lineasVenta.push({ tipo: 'Pechugas', cantidad: 1, precio: 0 });
  renderLineasVenta();
};
window.eliminarLineaVenta = function(idx){
  lineasVenta.splice(idx,1);
  renderLineasVenta();
};
function renderLineasVenta() {
  const cont = document.getElementById('ventasMultiples');
  if (!cont) return;
  cont.innerHTML = '';

  lineasVenta.forEach((lv, idx) => {
    const subtotal = (Number(lv.precio) || 0) * (Number(lv.cantidad) || 0);

    const opciones = Object.keys(PRECIOS).map(t =>
      `<option value="${t}" ${lv.tipo === t ? 'selected' : ''}>${t}</option>`
    ).join('');

    const div = document.createElement('div');
    div.className = 'lineaVenta';

    const selectTipo = document.createElement('select');
    selectTipo.className = 'tipo-linea';
    selectTipo.innerHTML = opciones;

    const inputCant = document.createElement('input');
    inputCant.className = 'cant-linea';
    inputCant.type = 'number';
    inputCant.min = '1';
    inputCant.value = lv.cantidad;

    const inputPrecio = document.createElement('input');
    inputPrecio.className = 'precio-linea';
    inputPrecio.type = 'number';
    inputPrecio.min = '0';
    inputPrecio.value = lv.precio;
    inputPrecio.style.width = '90px';

    const subtotalSpan = document.createElement('span');
    subtotalSpan.style.width = '110px';
    subtotalSpan.style.display = 'inline-block';
    subtotalSpan.innerText = `Total: $${subtotal}`;

    const btnQuitar = document.createElement('button');
    btnQuitar.className = 'btn btn-danger-soft btn-sm btn-quitar';
    btnQuitar.textContent = 'Eliminar';

    div.appendChild(selectTipo);
    div.appendChild(inputCant);
    div.appendChild(inputPrecio);
    div.appendChild(subtotalSpan);
    div.appendChild(btnQuitar);
    cont.appendChild(div);

    selectTipo.addEventListener('change', e => {
      lineasVenta[idx].tipo = e.target.value;
      renderLineasVenta();
    });

    inputCant.addEventListener('input', e => {
      lineasVenta[idx].cantidad = parseInt(e.target.value, 10) || 1;
      const cant = Number(lineasVenta[idx].cantidad) || 0;
      const precio = Number(lineasVenta[idx].precio) || 0;
      subtotalSpan.innerText = `Total: $${(precio * cant).toLocaleString()}`;
    });

    inputPrecio.addEventListener('input', e => {
      lineasVenta[idx].precio = parseInt(e.target.value, 10) || 0;
      const cant = Number(lineasVenta[idx].cantidad) || 0;
      const precio = Number(lineasVenta[idx].precio) || 0;
      subtotalSpan.innerText = `Total: $${(precio * cant).toLocaleString()}`;
    });

    btnQuitar.addEventListener('click', () => eliminarLineaVenta(idx));
  });

}

// ---------------------
// Crear venta
// ---------------------
window.venderPresas = function(){
  const cliente = (document.getElementById('clienteInput')?.value || '').trim();
  if(!cliente) return alert('Ingrese el nombre del cliente');
  if(!lineasVenta.length) return alert('Agregue al menos una presa');

  // validar inventario
  for(const lv of lineasVenta){
    const available = Number(inventario[lv.tipo] || 0);
    if(available < lv.cantidad){
      const ok = confirm(`No hay suficiente inventario de ${lv.tipo} (tienes ${available}). ¿Vender de todas formas?`);
      if(!ok) return;
    }
  }
  for(const lv of lineasVenta){
    inventario[lv.tipo] = (Number(inventario[lv.tipo]||0) - Number(lv.cantidad||0));
  }

  const venta = {
    idVenta: generarId(),
    cliente,
    fecha: new Date().toLocaleString(),
    estado: 'Pendiente',
    pagoCon: 0,
    devuelto: 0,
    presas: lineasVenta.map(lv => ({
      tipo: lv.tipo,
      cantidad: Number(lv.cantidad)||1,
      valorUnitario: Number(lv.precio)||0
    }))
  };

  ventas.push(venta);
  guardarInventario();
  guardarVentas();
  lineasVenta = [];
  renderLineasVenta();
  document.getElementById('clienteInput').value = '';
  actualizarInventarioDOM();
  renderVentasTabla();
};

// ---------------------
// Actualizar estado
// ---------------------
window.actualizarEstadoVenta = function(idVenta, nuevoEstado){
  const v = ventas.find(v => v.idVenta === idVenta);
  if(!v) return;
  v.estado = nuevoEstado;
  if(nuevoEstado !== 'Pagado'){
    v.pagoCon = 0;
    v.devuelto = 0;
  }
  guardarVentas();
  // Se llama a renderVentasTabla para que se reconstruya el input si el estado cambia a 'Pagado'
  renderVentasTabla(document.getElementById('searchInput')?.value || '');
};

// ---------------------
// Actualizar pago con
// ---------------------
window.actualizarPagoVenta = function(idVenta, valor){
  const v = ventas.find(v => v.idVenta === idVenta);
  if(!v) return;

  const pago = parseInt(valor,10) || 0;
  v.pagoCon = pago;

  const total = calcularTotalVentaObj(v);
  v.devuelto = (v.pagoCon > total) ? (v.pagoCon - total) : 0;

  guardarVentas();

  // Actualización específica del DOM
  const devCell = document.getElementById(`devuelto-cell-${idVenta}`);
  if (devCell) {
    devCell.innerText = v.devuelto ? ('$' + v.devuelto.toLocaleString()) : '';
  }
};

// ---------------------
// Función para agregar una fila con color según estado
// ---------------------
function agregarFilaVenta(venta){
  const tabla = document.getElementById('ventasTabla');
  const tr = document.createElement('tr');

  // Clase CSS dependiendo del estado
  let claseEstado = '';
  if (venta.estado === 'Pagado') {
    claseEstado = 'estado-pagado';
  } else if (venta.estado === 'Fiado') {
    claseEstado = 'estado-fiado';
  } else { // Pendiente u otros casos
    claseEstado = 'estado-pendiente';
  }

  // Crear la fila y asignar clase en la celda del estado
  tr.innerHTML = `
    <td>${escapeHtml(venta.cliente)}</td>
    <td id="resumen-cell-${venta.idVenta}">${escapeHtml(detalleResumen(venta))}</td>
    <td id="total-cell-${venta.idVenta}">$${calcularTotalVentaObj(venta).toLocaleString()}</td>
    <td id="pago-cell-${venta.idVenta}">
      ${venta.estado === 'Pagado'
        ? `<input id="pago-input-${venta.idVenta}" type="number" min="0" value="${venta.pagoCon||''}" style="width:120px">`
        : (venta.pagoCon ? `$${venta.pagoCon.toLocaleString()}` : '')
      }
    </td>
    <td id="devuelto-cell-${venta.idVenta}">
      ${venta.estado === 'Pagado' && venta.pagoCon > calcularTotalVentaObj(venta)
        ? '$' + (venta.pagoCon - calcularTotalVentaObj(venta)).toLocaleString()
        : ''
      }
    </td>
    <td id="estado-cell-${venta.idVenta}" class="${claseEstado}">
      <select id="estado-select-${venta.idVenta}" style="font-weight:bold;">
        <option value="Pendiente" ${venta.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
        <option value="Fiado" ${venta.estado === 'Fiado' ? 'selected' : ''}>Fiado</option>
        <option value="Pagado" ${venta.estado === 'Pagado' ? 'selected' : ''}>Pagado</option>
      </select>
    </td>
    <td>
      <button class="btn btn-sm btn-info btn-ver" type="button">Ver detalle</button>
      <button class="btn btn-sm btn-danger btn-eliminar" type="button">Eliminar</button>
    </td>
  `;

  tabla.appendChild(tr);

  // Listeners después de agregar fila
  const estadoSelect = document.getElementById(`estado-select-${venta.idVenta}`);
  if(estadoSelect){
    estadoSelect.addEventListener('change', (e) => {
      actualizarEstadoVenta(venta.idVenta, e.target.value);
    });
  }

  const pagoInput = document.getElementById(`pago-input-${venta.idVenta}`);
  if(pagoInput){
    pagoInput.addEventListener('input', (e) => {
      const nuevo = Number(e.target.value) || 0;
      if(nuevo !== venta.pagoCon){
        actualizarPagoVenta(venta.idVenta, nuevo);
      }
    });
  }

  const btnVer = tr.querySelector('.btn-ver');
  if(btnVer){
    btnVer.addEventListener('click', () => toggleDetalle(venta.idVenta));
  }
  const btnEliminar = tr.querySelector('.btn-eliminar');
  if(btnEliminar){
    btnEliminar.addEventListener('click', () => eliminarVenta(venta.idVenta));
  }
}

// ---------------------
// Render tabla principal
// ---------------------
window.renderVentasTabla = function(filtro = ''){
  const tablaBody = document.getElementById('ventasTabla');
  if(!tablaBody) return;
  tablaBody.innerHTML = '';

  let totalGeneral = 0, totalFiado = 0, totalPendiente = 0;

  const lista = filtro
    ? ventas.filter(v => v.cliente.toLowerCase().includes(filtro.toLowerCase()))
    : ventas;

  lista.forEach(v => {
    const totalVenta = calcularTotalVentaObj(v);

    if(v.estado === 'Pagado') totalGeneral += totalVenta;
    else if(v.estado === 'Fiado') totalFiado += totalVenta;
    else if(v.estado === 'Pendiente') totalPendiente += totalVenta;

    // Agregar la fila con color
    agregarFilaVenta(v);

    // Agregar fila de detalle oculta
    const trDetalle = document.createElement('tr');
    trDetalle.id = `detalle-${v.idVenta}`;
    trDetalle.style.display = 'none';

    const detallesHtml = v.presas.map((p, idx) => {
      return `
        <div class="d-flex gap-2 align-items-center mb-2" id="detalle-item-${v.idVenta}-${idx}">
          <select id="tipo-${v.idVenta}-${idx}" class="form-select" style="width:200px;">
            ${Object.keys(PRECIOS).map(t => `<option value="${t}" ${p.tipo===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <input id="cant-${v.idVenta}-${idx}" type="number" min="1" value="${p.cantidad}" style="width:100px;">
          <input id="precio-${v.idVenta}-${idx}" type="number" min="0" value="${p.valorUnitario}" style="width:120px;">
          <span id="subtotal-${v.idVenta}-${idx}" style="min-width:120px;">Subtotal: $${(Number(p.valorUnitario)||0) * (Number(p.cantidad)||0)}</span>
          <button id="quitar-${v.idVenta}-${idx}" class="btn btn-sm btn-outline-danger">Quitar</button>
        </div>
      `;
    }).join('');

    const tdDetalle = document.createElement('td');
    tdDetalle.colSpan = 7;
    tdDetalle.innerHTML = `<div id="detalle-contenedor-${v.idVenta}">${detallesHtml}<div class="mt-2"><button id="agregar-${v.idVenta}" class="btn btn-sm btn-secondary">+ Agregar presa</button></div></div>`;

    trDetalle.appendChild(tdDetalle);
    tablaBody.appendChild(trDetalle);

    // listeners de detalle
    v.presas.forEach((p, idx) => {
      const tipoEl = document.getElementById(`tipo-${v.idVenta}-${idx}`);
      if(tipoEl){
        tipoEl.addEventListener('change', (e) => {
          actualizarDetallePresa(v.idVenta, idx, 'tipo', e.target.value);
        });
      }
      const cantEl = document.getElementById(`cant-${v.idVenta}-${idx}`);
      if(cantEl){
        cantEl.addEventListener('input', (e) => {
          actualizarDetallePresa(v.idVenta, idx, 'cantidad', Number(e.target.value) || 0);
        });
      }
      const precioEl = document.getElementById(`precio-${v.idVenta}-${idx}`);
      if(precioEl){
        precioEl.addEventListener('input', (e) => {
          actualizarDetallePresa(v.idVenta, idx, 'precio', Number(e.target.value) || 0);
        });
      }
      const quitarBtn = document.getElementById(`quitar-${v.idVenta}-${idx}`);
      if(quitarBtn){
        quitarBtn.addEventListener('click', () => {
          eliminarPresaDeVenta(v.idVenta, idx);
        });
      }
    });

    const btnAgregar = document.getElementById(`agregar-${v.idVenta}`);
    if(btnAgregar){
      btnAgregar.addEventListener('click', () => agregarPresaAVenta(v.idVenta));
    }

  }); // fin forEach lista

  // actualizar totales en DOM
  const elGen = document.getElementById('totalGeneral');
  if(elGen) elGen.innerText = totalGeneral.toLocaleString();
  const elFiado = document.getElementById('totalFiado');
  if(elFiado) elFiado.innerText = totalFiado.toLocaleString();
  const elPend = document.getElementById('totalPendiente');
  if(elPend) elPend.innerText = totalPendiente.toLocaleString();
};

// ---------------------
// Toggle detalle
// ---------------------
window.toggleDetalle = function(idVenta){
  const fila = document.getElementById(`detalle-${idVenta}`);
  if(!fila) return;
  fila.style.display = (fila.style.display === 'none') ? '' : 'none';
};

// ---------------------
// Actualizar presa detalle (CORREGIDA)
// ---------------------
function actualizarDetallePresa(idVenta, idx, campo, valor){
  const v = ventas.find(v => v.idVenta === idVenta);
  if(!v) return;
  const p = v.presas[idx];
  if(!p) return;

  const oldTipo = p.tipo;
  const oldCant = Number(p.cantidad || 0);
  const oldPrecio = Number(p.valorUnitario || 0);
  
  // Lógica de validación y actualización del inventario
  if(campo === 'tipo'){
    const nuevoTipo = String(valor);
    if(nuevoTipo === oldTipo) return;
    inventario[oldTipo] = (Number(inventario[oldTipo]||0) + oldCant);
    const avail = Number(inventario[nuevoTipo]||0);
    if(avail < oldCant){
      const ok = confirm(`No hay suficiente inventario de ${nuevoTipo} (tienes ${avail}). ¿Cambiar igualmente? (permitirá stock negativo)`);
      if(!ok){
        inventario[oldTipo] = (Number(inventario[oldTipo]||0) - oldCant);
        return;
      }
    }
    inventario[nuevoTipo] = (Number(inventario[nuevoTipo]||0) - oldCant);
    p.tipo = nuevoTipo;
  }
  else if(campo === 'cantidad'){
    const nuevoCant = Number(valor) || 0;
    if(nuevoCant < 1) return;
    const delta = nuevoCant - oldCant;
    if(delta === 0) return;
    if(delta > 0){
      const avail = Number(inventario[p.tipo]||0);
      if(avail < delta){
        const ok = confirm(`No hay suficiente inventario de ${p.tipo} (tienes ${avail}). ¿Reservar igualmente? (permitirá stock negativo)`);
        if(!ok) return;
      }
      inventario[p.tipo] = (Number(inventario[p.tipo]||0) - delta);
    } else {
      inventario[p.tipo] = (Number(inventario[p.tipo]||0) + Math.abs(delta));
    }
    p.cantidad = nuevoCant;
  }
  else if(campo === 'precio'){
    const nuevoPrecio = Number(valor) || 0;
    if(nuevoPrecio === oldPrecio) return;
    p.valorUnitario = nuevoPrecio;
  }

  // Actualización del DOM específica sin re-renderizar toda la tabla
  const subtotalEl = document.getElementById(`subtotal-${idVenta}-${idx}`);
  if (subtotalEl) {
    const subtotal = (Number(p.valorUnitario) || 0) * (Number(p.cantidad) || 0);
    subtotalEl.innerText = `Subtotal: $${subtotal.toLocaleString()}`;
  }

  const resumenCell = document.getElementById(`resumen-cell-${idVenta}`);
  if(resumenCell) {
    resumenCell.innerText = detalleResumen(v);
  }

  const totalCell = document.getElementById(`total-cell-${idVenta}`);
  if(totalCell) {
    totalCell.innerText = `$${calcularTotalVentaObj(v).toLocaleString()}`;
  }
  
  guardarInventario();
  guardarVentas();
  actualizarInventarioDOM();
}

// ---------------------
// Agregar / eliminar presa dentro de venta (CORREGIDAS)
// ---------------------
window.agregarPresaAVenta = function(idVenta){
  const v = ventas.find(v => v.idVenta === idVenta);
  if(!v) return;
  const tipoDefault = 'Pechugas';
  const avail = Number(inventario[tipoDefault]||0);
  if(avail < 1){
    const ok = confirm(`No hay stock de ${tipoDefault} (tienes ${avail}). ¿Agregar igualmente? (permitirá stock negativo)`);
    if(!ok) return;
  }
  inventario[tipoDefault] = (Number(inventario[tipoDefault]||0) - 1);
  v.presas.push({ tipo: tipoDefault, cantidad: 1, valorUnitario: 0 });
  guardarInventario();
  guardarVentas();

  // Actualización del DOM de forma selectiva
  const detalleContenedor = document.getElementById(`detalle-contenedor-${idVenta}`);
  if (detalleContenedor) {
      const idx = v.presas.length - 1;
      const nuevaPresa = v.presas[idx];
      const div = document.createElement('div');
      div.className = 'd-flex gap-2 align-items-center mb-2';
      div.id = `detalle-item-${idVenta}-${idx}`;
      div.innerHTML = `
        <select id="tipo-${idVenta}-${idx}" class="form-select" style="width:200px;">
          ${Object.keys(PRECIOS).map(t => `<option value="${t}" ${nuevaPresa.tipo===t?'selected':''}>${t}</option>`).join('')}
        </select>
        <input id="cant-${idVenta}-${idx}" type="number" min="1" value="${nuevaPresa.cantidad}" style="width:100px;">
        <input id="precio-${idVenta}-${idx}" type="number" min="0" value="${nuevaPresa.valorUnitario}" style="width:120px;">
        <span id="subtotal-${idVenta}-${idx}" style="min-width:120px;">Subtotal: $${(Number(nuevaPresa.valorUnitario)||0) * (Number(nuevaPresa.cantidad)||0)}</span>
        <button id="quitar-${idVenta}-${idx}" class="btn btn-sm btn-outline-danger">Quitar</button>
      `;

      // Insertar el nuevo elemento antes del botón "+ Agregar presa"
      const btnAgregar = document.getElementById(`agregar-${idVenta}`);
      btnAgregar.parentNode.insertBefore(div, btnAgregar);

      // Agregar listeners al nuevo elemento
      document.getElementById(`tipo-${idVenta}-${idx}`).addEventListener('change', (e) => actualizarDetallePresa(idVenta, idx, 'tipo', e.target.value));
      document.getElementById(`cant-${idVenta}-${idx}`).addEventListener('input', (e) => actualizarDetallePresa(idVenta, idx, 'cantidad', Number(e.target.value) || 0));
      document.getElementById(`precio-${idVenta}-${idx}`).addEventListener('input', (e) => actualizarDetallePresa(idVenta, idx, 'precio', Number(e.target.value) || 0));
      document.getElementById(`quitar-${idVenta}-${idx}`).addEventListener('click', () => eliminarPresaDeVenta(idVenta, idx));
  }
  
  const resumenCell = document.getElementById(`resumen-cell-${idVenta}`);
  if(resumenCell) {
    resumenCell.innerText = detalleResumen(v);
  }
  const totalCell = document.getElementById(`total-cell-${idVenta}`);
  if(totalCell) {
    totalCell.innerText = `$${calcularTotalVentaObj(v).toLocaleString()}`;
  }

  actualizarInventarioDOM();
};

function eliminarPresaDeVenta(idVenta, idx){
  const v = ventas.find(v => v.idVenta === idVenta);
  if(!v) return;
  const p = v.presas[idx];
  if(!p) return;
  inventario[p.tipo] = (Number(inventario[p.tipo]||0) + Number(p.cantidad||0));
  v.presas.splice(idx,1);

  // Actualización del DOM sin re-renderizar toda la tabla
  const itemEl = document.getElementById(`detalle-item-${idVenta}-${idx}`);
  if (itemEl) {
      itemEl.remove();
  }

  // Si la venta se queda sin presas, se elimina la fila principal
  if(v.presas.length === 0){
    ventas = ventas.filter(x => x.idVenta !== idVenta);
    const filaVenta = document.getElementById(`total-cell-${idVenta}`).closest('tr');
    if (filaVenta) filaVenta.remove();
    const filaDetalle = document.getElementById(`detalle-${idVenta}`);
    if (filaDetalle) filaDetalle.remove();
  } else {
    // Si quedan presas, actualiza el resumen y el total
    const resumenCell = document.getElementById(`resumen-cell-${idVenta}`);
    if(resumenCell) {
      resumenCell.innerText = detalleResumen(v);
    }
    const totalCell = document.getElementById(`total-cell-${idVenta}`);
    if(totalCell) {
      totalCell.innerText = `$${calcularTotalVentaObj(v).toLocaleString()}`;
    }
  }

  guardarInventario();
  guardarVentas();
  actualizarInventarioDOM();
}

// ---------------------
// Eliminar venta
// ---------------------
window.eliminarVenta = function(idVenta){
  if(!confirm('¿Eliminar esta venta?')) return;
  const v = ventas.find(v => v.idVenta === idVenta);
  if(!v) return;
  v.presas.forEach(p => {
    inventario[p.tipo] = (Number(inventario[p.tipo]||0) + Number(p.cantidad||0));
  });
  ventas = ventas.filter(x => x.idVenta !== idVenta);

  // Eliminación del DOM
  const filaPrincipal = document.getElementById(`total-cell-${idVenta}`).closest('tr');
  if(filaPrincipal) filaPrincipal.remove();
  const filaDetalle = document.getElementById(`detalle-${idVenta}`);
  if(filaDetalle) filaDetalle.remove();
  
  guardarInventario();
  guardarVentas();
  renderVentasTabla(document.getElementById('searchInput')?.value || ''); // Se puede re-renderizar para actualizar totales
  actualizarInventarioDOM();
};

// ---------------------
// Buscar ventas
// ---------------------
window.buscarVentas = function(){
  const q = (document.getElementById('searchInput')?.value || '').trim();
  document.getElementById('resultadoBusqueda').innerText = '';
  if(!q) {
    renderVentasTabla();
    return;
  }
  renderVentasTabla(q);
  const filtradas = ventas.filter(v => v.cliente.toLowerCase().includes(q.toLowerCase()));
  document.getElementById('resultadoBusqueda').innerText = filtradas.length
    ? `Resultados para "${q}":`
    : 'No se encontraron resultados.';
};

// ---------------------
// Exportar Excel
// ---------------------
window.exportarExcel = function(){
  if(!ventas.length) return alert('No hay ventas registradas.');
  const data = ventas.map(v => {
    const total = calcularTotalVentaObj(v);
    return {
      Cliente: v.cliente,
      Total: total,
      Fecha: v.fecha,
      Estado: v.estado,
      "Pagó con": v.pagoCon || '',
      Devuelto: v.devuelto || '',
      Detalle: v.presas.map(p => `${p.tipo} (${p.cantidad} x ${p.valorUnitario})`).join('; ')
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  XLSX.writeFile(wb, 'ventas.xlsx');
};

// ---------------------
// Inicialización
// ---------------------
document.addEventListener('DOMContentLoaded', () => {
  cargarInventario();
  cargarVentas();
  ventas = ventas || [];
  lineasVenta = lineasVenta || [];
  actualizarInventarioDOM();
  renderLineasVenta();
  renderVentasTabla();
});