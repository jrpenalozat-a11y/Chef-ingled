/**
 * Mi Turno François — servidor (Google Apps Script)
 *
 * Guarda las marcas de asistencia en la planilla de Google a la que está
 * vinculado este script. La hora oficial de cada marca es la del servidor,
 * no la del teléfono, y la distancia al local se calcula aquí.
 *
 * Control interno: no reemplaza el registro legal de asistencia
 * (Res. Ex. N°38/2024, Dirección del Trabajo).
 */

var HOJAS = {
  trabajadores: 'Trabajadores',
  marcas: 'Marcas',
  turnos: 'Turnos',
  config: 'Config'
};

var ENCABEZADOS = {
  Trabajadores: ['Nombre', 'RUT', 'PIN', 'Activo', 'Cargo'],
  Marcas: ['Fecha', 'Hora', 'Trabajador', 'RUT', 'Tipo', 'Latitud', 'Longitud',
    'Precisión (m)', 'Distancia al local (m)', 'Dentro de zona', 'Atraso (min)',
    'Hora del teléfono', 'Enviada sin conexión', 'Dispositivo', 'ID'],
  Turnos: ['Trabajador', 'Día', 'Entrada', 'Salida'],
  Config: ['Clave', 'Valor', 'Descripción']
};

var CONFIG_INICIAL = [
  ['LATITUD_LOCAL', '', 'Latitud de François. Se puede fijar desde Administración en la app.'],
  ['LONGITUD_LOCAL', '', 'Longitud de François.'],
  ['RADIO_METROS', 150, 'Distancia máxima al local para que la marca quede "dentro de zona".'],
  ['TOLERANCIA_MIN', 5, 'Minutos de gracia antes de contar atraso.'],
  ['PIN_ADMIN', '', 'PIN de administración (mínimo 6 dígitos). Obligatorio.'],
  ['NOMBRE_LOCAL', 'François La Florida', 'Nombre que muestra la app.']
];

var TIPOS = ['Entrada', 'Salida a colación', 'Vuelta de colación', 'Salida'];
var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
var ZONA = 'America/Santiago';

/* ------------------------------------------------------------------ */
/* Instalación                                                         */
/* ------------------------------------------------------------------ */

/** Ejecutar una vez desde el editor: crea las hojas con sus encabezados. */
function configurarHojas() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(ENCABEZADOS).forEach(function (nombre) {
    var hoja = libro.getSheetByName(nombre) || libro.insertSheet(nombre);
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(ENCABEZADOS[nombre]);
      hoja.getRange(1, 1, 1, ENCABEZADOS[nombre].length).setFontWeight('bold');
      hoja.setFrozenRows(1);
    }
  });
  var config = libro.getSheetByName(HOJAS.config);
  if (config.getLastRow() === 1) {
    config.getRange(2, 1, CONFIG_INICIAL.length, 3).setValues(CONFIG_INICIAL);
  }
  // PIN y horas como texto, para no perder ceros a la izquierda.
  libro.getSheetByName(HOJAS.trabajadores).getRange('C:C').setNumberFormat('@');
  libro.getSheetByName(HOJAS.turnos).getRange('C:D').setNumberFormat('@');
}

/* ------------------------------------------------------------------ */
/* Entradas HTTP                                                       */
/* ------------------------------------------------------------------ */

/**
 * Sin parámetros, la URL /exec muestra la app (archivo HTML "index" de este
 * proyecto). Con ?accion=... responde datos en JSON, para otras páginas.
 */
function doGet(e) {
  var accion = e && e.parameter && e.parameter.accion;
  if (!accion) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Mi Turno François')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
  }
  return responder(llamar({ accion: accion }));
}

function doPost(e) {
  var datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return responder({ ok: false, error: 'Solicitud inválida.' });
  }
  return responder(llamar(datos));
}

/** Punto de entrada único: lo usan doGet/doPost y la app vía google.script.run. */
function llamar(datos) {
  try {
    switch (datos && datos.accion) {
      case 'trabajadores': return { ok: true, trabajadores: listarTrabajadores() };
      case 'estado': return { ok: true, local: datosLocal(), hora: ahoraTexto() };
      case 'marcar': return marcar(datos);
      case 'misMarcas': return misMarcas(datos);
      case 'reporte': return reporte(datos);
      case 'supervision': return supervision(datos);
      case 'datos': return datosIntegracion(datos);
      case 'turnos': return horarioSemanal(datos);
      case 'turnonio': return turnonio(datos);
      case 'fijarLocal': return fijarLocal(datos);
      default: return { ok: false, error: 'Acción desconocida.' };
    }
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ */
/* Acciones                                                            */
/* ------------------------------------------------------------------ */

function marcar(d) {
  var t = validarTrabajador(d.rut, d.pin);
  if (TIPOS.indexOf(d.tipo) < 0) throw new Error('Tipo de marca inválido.');

  var cfg = leerConfig();
  var ahora = new Date();
  var lat = numeroONulo(d.lat);
  var lng = numeroONulo(d.lng);
  var distancia = null;
  if (lat !== null && lng !== null && cfg.LATITUD_LOCAL !== '' && cfg.LONGITUD_LOCAL !== '') {
    distancia = Math.round(distanciaMetros(lat, lng, Number(cfg.LATITUD_LOCAL), Number(cfg.LONGITUD_LOCAL)));
  }
  var dentro = distancia === null ? 'Sin dato' : (distancia <= Number(cfg.RADIO_METROS || 150) ? 'Sí' : 'No');
  var atraso = d.tipo === 'Entrada' ? calcularAtraso(t.nombre, ahora, Number(cfg.TOLERANCIA_MIN || 0)) : '';

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var hoja = hoja_(HOJAS.marcas);
    // Evita marcas duplicadas por doble toque (mismo tipo en menos de 2 minutos).
    var ultima = ultimaMarca(hoja, t.rut);
    if (ultima && ultima.tipo === d.tipo && (ahora - ultima.fecha) < 2 * 60 * 1000) {
      return { ok: true, duplicada: true, hora: fmt(ultima.fecha, 'HH:mm'), tipo: d.tipo, nombre: t.nombre,
        distancia: distancia, dentroZona: dentro, atraso: atraso };
    }
    hoja.appendRow([
      fmt(ahora, 'yyyy-MM-dd'), fmt(ahora, 'HH:mm:ss'), t.nombre, t.rut, d.tipo,
      lat === null ? '' : lat, lng === null ? '' : lng,
      d.precision ? Math.round(Number(d.precision)) : '',
      distancia === null ? '' : distancia, dentro, atraso,
      String(d.horaTelefono || ''), d.sinConexion ? 'Sí' : 'No',
      String(d.dispositivo || '').slice(0, 120), Utilities.getUuid()
    ]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, hora: fmt(ahora, 'HH:mm'), tipo: d.tipo, nombre: t.nombre,
    distancia: distancia, dentroZona: dentro, atraso: atraso };
}

function misMarcas(d) {
  var t = validarTrabajador(d.rut, d.pin);
  var filas = leerMarcas().filter(function (m) { return m.rut === t.rut; });
  return { ok: true, nombre: t.nombre, marcas: filas.slice(-12).reverse() };
}

/**
 * Resumen por trabajador y día entre dos fechas (yyyy-MM-dd).
 * Esta es la acción que leerá la página de Operación François.
 */
function reporte(d) {
  validarAcceso(d);
  var desde = String(d.desde || fmt(new Date(), 'yyyy-MM-dd'));
  return construirReporte(desde, String(d.hasta || desde));
}

function construirReporte(desde, hasta) {
  var marcas = leerMarcas().filter(function (m) { return m.fecha >= desde && m.fecha <= hasta; });

  var dias = {};
  marcas.forEach(function (m) {
    var k = m.fecha + '|' + m.rut;
    if (!dias[k]) dias[k] = { fecha: m.fecha, nombre: m.nombre, rut: m.rut, marcas: [], fueraDeZona: 0 };
    dias[k].marcas.push(m);
    if (m.dentroZona === 'No') dias[k].fueraDeZona++;
  });

  var filas = Object.keys(dias).sort().map(function (k) {
    var r = dias[k];
    var entrada = buscar(r.marcas, 'Entrada', true);
    var salida = buscar(r.marcas, 'Salida', false);
    var colIni = buscar(r.marcas, 'Salida a colación', true);
    var colFin = buscar(r.marcas, 'Vuelta de colación', false);
    var minutos = null;
    if (entrada && salida) {
      minutos = minutosEntre(entrada.hora, salida.hora);
      if (colIni && colFin) minutos -= minutosEntre(colIni.hora, colFin.hora);
    }
    return {
      fecha: r.fecha, nombre: r.nombre, rut: r.rut,
      entrada: entrada ? entrada.hora.slice(0, 5) : '',
      salida: salida ? salida.hora.slice(0, 5) : '',
      colacion: colIni && colFin ? minutosEntre(colIni.hora, colFin.hora) : null,
      minutosTrabajados: minutos,
      atraso: entrada && entrada.atraso !== '' ? Number(entrada.atraso) : null,
      fueraDeZona: r.fueraDeZona,
      marcas: r.marcas.map(function (m) { return { hora: m.hora.slice(0, 5), tipo: m.tipo, dentroZona: m.dentroZona, distancia: m.distancia }; })
    };
  });
  return { ok: true, desde: desde, hasta: hasta, filas: filas, local: datosLocal() };
}

/**
 * Estado de hoy por trabajador activo: dónde está según su última marca,
 * su turno del día, atraso y marcas fuera del local, más el detalle de
 * todas las marcas del día para revisarlas una por una.
 */
function supervision(d) {
  validarAcceso(d);
  return construirSupervision();
}

function construirSupervision() {
  var ahora = new Date();
  var hoy = fmt(ahora, 'yyyy-MM-dd');
  var horaAhora = fmt(ahora, 'HH:mm');
  var dia = DIAS[Number(fmt(ahora, 'u')) % 7];
  var tolerancia = Number(leerConfig().TOLERANCIA_MIN || 0);

  var turnos = {};
  filas_(HOJAS.turnos).forEach(function (f) {
    if (normalizar(f[1]) === normalizar(dia) && /^\d{1,2}:\d{2}/.test(f[2])) {
      turnos[f[0].trim().toLowerCase()] = { entrada: f[2].slice(0, 5), salida: f[3].slice(0, 5) };
    }
  });

  var detalle = filas_(HOJAS.marcas).filter(function (f) { return f[0] === hoy; }).map(function (f) {
    return { hora: f[1].slice(0, 5), nombre: f[2], rut: f[3], tipo: f[4],
      distancia: f[8] === '' ? null : Number(f[8]), precision: f[7] === '' ? null : Number(f[7]),
      dentroZona: f[9], atraso: f[10] === '' ? null : Number(f[10]), sinConexion: f[12] === 'Sí' };
  });

  var ESTADO = { 'Entrada': 'En turno', 'Salida a colación': 'En colación', 'Vuelta de colación': 'En turno', 'Salida': 'Terminó' };
  var personas = listarTrabajadores().map(function (t) {
    var propias = detalle.filter(function (m) { return m.rut === t.rut; });
    var turno = turnos[t.nombre.toLowerCase()] || null;
    var ultima = propias.length ? propias[propias.length - 1] : null;
    var entrada = propias.filter(function (m) { return m.tipo === 'Entrada'; })[0] || null;
    var estado;
    if (ultima) estado = ESTADO[ultima.tipo];
    else if (!turno) estado = 'Libre hoy';
    else if (minutosEntre(turno.entrada, horaAhora) > tolerancia) estado = 'No ha llegado';
    else estado = 'Por llegar';
    return {
      nombre: t.nombre, cargo: t.cargo, estado: estado, turno: turno,
      entrada: entrada ? entrada.hora : '', atraso: entrada ? entrada.atraso : null,
      ultima: ultima, fueraDeZona: propias.filter(function (m) { return m.dentroZona === 'No'; }).length,
      sinConexion: propias.filter(function (m) { return m.sinConexion; }).length
    };
  });

  return { ok: true, fecha: hoy, hora: horaAhora, dia: dia, personas: personas,
    detalle: detalle.reverse(), local: datosLocal() };
}

function fijarLocal(d) {
  validarAdmin(d.pinAdmin);
  var lat = numeroONulo(d.lat), lng = numeroONulo(d.lng);
  if (lat === null || lng === null) throw new Error('Ubicación inválida.');
  escribirConfig('LATITUD_LOCAL', lat);
  escribirConfig('LONGITUD_LOCAL', lng);
  if (d.radio) escribirConfig('RADIO_METROS', Math.max(30, Math.round(Number(d.radio))));
  return { ok: true, local: datosLocal() };
}

/* ------------------------------------------------------------------ */
/* Validación                                                          */
/* ------------------------------------------------------------------ */

function validarTrabajador(rut, pin) {
  var clave = 'intentos_' + limpiarRut(rut);
  frenarIntentos(clave);
  var t = leerTrabajadores().filter(function (x) { return x.rut === limpiarRut(rut) && x.activo; })[0];
  if (!t || String(t.pin) !== String(pin || '')) {
    sumarIntento(clave);
    throw new Error('Nombre o PIN incorrecto.');
  }
  CacheService.getScriptCache().remove(clave);
  return t;
}

/**
 * Lectura de datos: con el PIN de administración (la app) o con la clave de
 * integración (la página de operaciones). Escribir sigue pidiendo el PIN.
 */
function validarAcceso(d) {
  if (d && d.claveApi) {
    var clave = 'intentos_api';
    frenarIntentos(clave);
    var real = PropertiesService.getScriptProperties().getProperty('CLAVE_INTEGRACION') || '';
    if (real.length < 20 || String(d.claveApi) !== real) {
      sumarIntento(clave);
      throw new Error('Clave de integración incorrecta.');
    }
    CacheService.getScriptCache().remove(clave);
    return;
  }
  validarAdmin(d && d.pinAdmin);
}

function validarAdmin(pin) {
  var clave = 'intentos_admin';
  frenarIntentos(clave);
  var real = String(leerConfig().PIN_ADMIN || '');
  if (real.length < 6) throw new Error('Falta configurar PIN_ADMIN (mínimo 6 dígitos) en la hoja Config.');
  if (String(pin || '') !== real) {
    sumarIntento(clave);
    throw new Error('PIN de administración incorrecto.');
  }
  CacheService.getScriptCache().remove(clave);
}

// Tras 5 intentos fallidos se bloquea ese usuario por 10 minutos.
function frenarIntentos(clave) {
  var n = Number(CacheService.getScriptCache().get(clave) || 0);
  if (n >= 5) throw new Error('Demasiados intentos. Espera 10 minutos.');
}

function sumarIntento(clave) {
  var cache = CacheService.getScriptCache();
  cache.put(clave, String(Number(cache.get(clave) || 0) + 1), 600);
}

/* ------------------------------------------------------------------ */
/* Lectura de hojas                                                    */
/* ------------------------------------------------------------------ */

function hoja_(nombre) {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!h) throw new Error('Falta la hoja "' + nombre + '". Ejecuta configurarHojas().');
  return h;
}

function filas_(nombre) {
  var h = hoja_(nombre);
  if (h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, h.getLastColumn()).getDisplayValues();
}

function leerTrabajadores() {
  return filas_(HOJAS.trabajadores).filter(function (f) { return f[0] && f[1]; }).map(function (f) {
    return { nombre: f[0].trim(), rut: limpiarRut(f[1]), pin: f[2].trim(),
      activo: /^(s[ií]|si|x|1|true|verdadero)$/i.test(f[3].trim()), cargo: f[4] };
  });
}

function listarTrabajadores() {
  return leerTrabajadores().filter(function (t) { return t.activo; })
    .map(function (t) { return { nombre: t.nombre, rut: t.rut, cargo: t.cargo }; })
    .sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
}

function leerMarcas() {
  return filas_(HOJAS.marcas).map(function (f) {
    return { fecha: f[0], hora: f[1], nombre: f[2], rut: f[3], tipo: f[4],
      distancia: f[8] === '' ? null : Number(f[8]), dentroZona: f[9], atraso: f[10] };
  });
}

function ultimaMarca(hoja, rut) {
  var n = hoja.getLastRow();
  if (n < 2) return null;
  var desde = Math.max(2, n - 200);
  var f = hoja.getRange(desde, 1, n - desde + 1, 5).getDisplayValues();
  for (var i = f.length - 1; i >= 0; i--) {
    if (f[i][3] === rut) {
      return { tipo: f[i][4], fecha: Utilities.parseDate(f[i][0] + ' ' + f[i][1], ZONA, 'yyyy-MM-dd HH:mm:ss') };
    }
  }
  return null;
}

function leerConfig() {
  var cfg = {};
  filas_(HOJAS.config).forEach(function (f) { cfg[f[0].trim()] = f[1].trim(); });
  return cfg;
}

function escribirConfig(clave, valor) {
  var h = hoja_(HOJAS.config);
  var claves = h.getRange(2, 1, Math.max(1, h.getLastRow() - 1), 1).getValues();
  for (var i = 0; i < claves.length; i++) {
    if (claves[i][0] === clave) { h.getRange(i + 2, 2).setValue(valor); return; }
  }
  h.appendRow([clave, valor, '']);
}

function datosLocal() {
  var c = leerConfig();
  return {
    nombre: c.NOMBRE_LOCAL || 'François',
    lat: c.LATITUD_LOCAL === '' ? null : Number(c.LATITUD_LOCAL),
    lng: c.LONGITUD_LOCAL === '' ? null : Number(c.LONGITUD_LOCAL),
    radio: Number(c.RADIO_METROS || 150)
  };
}

/* ------------------------------------------------------------------ */
/* Cálculos                                                            */
/* ------------------------------------------------------------------ */

function calcularAtraso(nombre, ahora, tolerancia) {
  var dia = DIAS[Number(fmt(ahora, 'u')) % 7];
  var turno = filas_(HOJAS.turnos).filter(function (f) {
    return f[0].trim().toLowerCase() === nombre.toLowerCase() && normalizar(f[1]) === normalizar(dia);
  })[0];
  if (!turno || !/^\d{1,2}:\d{2}/.test(turno[2])) return '';
  var minutos = minutosEntre(turno[2], fmt(ahora, 'HH:mm'));
  return minutos > tolerancia ? minutos : 0;
}

function distanciaMetros(lat1, lng1, lat2, lng2) {
  var R = 6371000, rad = Math.PI / 180;
  var dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function minutosEntre(h1, h2) {
  var a = h1.split(':'), b = h2.split(':');
  return (Number(b[0]) * 60 + Number(b[1])) - (Number(a[0]) * 60 + Number(a[1]));
}

function buscar(marcas, tipo, primera) {
  var f = marcas.filter(function (m) { return m.tipo === tipo; });
  return f.length ? (primera ? f[0] : f[f.length - 1]) : null;
}

function limpiarRut(rut) {
  return String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
}

function normalizar(s) {
  return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function numeroONulo(v) {
  var n = Number(v);
  return v === null || v === undefined || v === '' || isNaN(n) ? null : n;
}

function fmt(fecha, patron) {
  return Utilities.formatDate(fecha, ZONA, patron);
}

function ahoraTexto() {
  return fmt(new Date(), 'yyyy-MM-dd HH:mm:ss');
}

/* ------------------------------------------------------------------ */
/* Integración con la página de operaciones y Turnonio (DeepSeek)      */
/* ------------------------------------------------------------------ */

/**
 * Ejecutar una vez desde el editor: crea la clave de integración que usa la
 * página de operaciones y la muestra en el Registro de ejecución.
 */
function generarClaveIntegracion() {
  var clave = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
  PropertiesService.getScriptProperties().setProperty('CLAVE_INTEGRACION', clave);
  Logger.log('Clave de integración (guárdala en el servidor de la página, no en su código público): ' + clave);
}

/**
 * Datos de asistencia listos para otra página o para una IA: sin RUT ni
 * coordenadas. Por defecto, hoy y los últimos 31 días.
 */
function datosIntegracion(d) {
  validarAcceso(d);
  return { ok: true, datos: datosParaIA(d.desde, d.hasta) };
}

/** Horario semanal de la hoja Turnos (solo lectura, sin RUT). */
function horarioSemanal(d) {
  validarAcceso(d);
  var turnos = filas_(HOJAS.turnos).filter(function (f) {
    return f[0].trim() && /^\d{1,2}:\d{2}/.test(f[2]) && !/^ejemplo/i.test(f[0].trim());
  }).map(function (f) {
    return { trabajador: f[0].trim(), dia: f[1].trim(), entrada: f[2].slice(0, 5), salida: f[3].slice(0, 5) };
  });
  return { ok: true, turnos: turnos };
}

function datosParaIA(desde, hasta) {
  var hoy = new Date();
  hasta = String(hasta || fmt(hoy, 'yyyy-MM-dd'));
  desde = String(desde || fmt(new Date(hoy.getTime() - 31 * 864e5), 'yyyy-MM-dd'));
  var sup = construirSupervision();
  var rep = construirReporte(desde, hasta);
  return {
    local: sup.local.nombre,
    ahora: sup.fecha + ' ' + sup.hora + ' (' + sup.dia + ')',
    hoy: sup.personas.map(function (p) {
      return { nombre: p.nombre, cargo: p.cargo, estado: p.estado,
        turno: p.turno ? p.turno.entrada + '-' + p.turno.salida : '', entrada: p.entrada,
        atrasoMin: p.atraso, ultimaMarca: p.ultima ? p.ultima.tipo + ' ' + p.ultima.hora : '',
        marcasFueraDelLocal: p.fueraDeZona, enviadasSinConexion: p.sinConexion };
    }),
    desde: desde, hasta: hasta,
    dias: rep.filas.map(function (f) {
      return { fecha: f.fecha, nombre: f.nombre, entrada: f.entrada, salida: f.salida,
        colacionMin: f.colacion, minutosTrabajados: f.minutosTrabajados, atrasoMin: f.atraso,
        marcasFueraDelLocal: f.fueraDeZona };
    })
  };
}

var TURNONIO = 'Eres Turnonio, el asistente de asistencia de François (cafetería, pastelería y panadería en La Florida, Santiago de Chile). ' +
  'Respondes en español de Chile, breve, claro y ordenado, usando SOLO los datos de Mi Turno François que vienen en el mensaje. ' +
  'Puedes calcular horas trabajadas, totales y promedios, rankings de atrasos, días sin salida, marcas fuera del local o enviadas sin conexión, ' +
  'y comparar con los turnos. Da fechas (dd/mm) y horas concretas. Si un dato no está, dilo; no inventes personas, marcas ni horarios. ' +
  'Cuando ayude, termina con 1 a 3 acciones concretas para el encargado. ' +
  'Mi Turno es un control interno y no reemplaza el registro legal de asistencia; en temas legales sugiere consultar a un abogado o a la Dirección del Trabajo.';

function turnonio(d) {
  validarAcceso(d);
  var pregunta = String(d.pregunta || '').trim().slice(0, 1500);
  if (!pregunta) throw new Error('Escribe una pregunta para Turnonio.');
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('DEEPSEEK_API_KEY');
  if (!key) throw new Error('Falta la clave de DeepSeek: agrégala en Configuración del proyecto → Propiedades de la secuencia de comandos (DEEPSEEK_API_KEY).');

  var mensajes = [{ role: 'system', content: TURNONIO },
    { role: 'user', content: 'Datos de Mi Turno François (JSON):\n' + JSON.stringify(datosParaIA(d.desde, d.hasta)) }];
  (Array.isArray(d.historial) ? d.historial.slice(-6) : []).forEach(function (m) {
    if (m && (m.rol === 'user' || m.rol === 'assistant') && m.texto) mensajes.push({ role: m.rol, content: String(m.texto).slice(0, 2000) });
  });
  mensajes.push({ role: 'user', content: pregunta });

  var r = UrlFetchApp.fetch('https://api.deepseek.com/chat/completions', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + key },
    payload: JSON.stringify({ model: props.getProperty('DEEPSEEK_MODELO') || 'deepseek-chat',
      messages: mensajes, temperature: 0.3, max_tokens: 1200 })
  });
  var codigo = r.getResponseCode();
  if (codigo === 401) throw new Error('DeepSeek rechazó la clave. Revisa DEEPSEEK_API_KEY.');
  if (codigo === 402) throw new Error('La cuenta de DeepSeek no tiene saldo.');
  if (codigo === 429) throw new Error('DeepSeek está saturado. Intenta en un minuto.');
  if (codigo >= 300) throw new Error('DeepSeek respondió con error ' + codigo + '.');
  var j = JSON.parse(r.getContentText());
  var texto = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (!texto) throw new Error('DeepSeek no devolvió respuesta.');
  return { ok: true, respuesta: texto };
}
