/**
 * Genera los íconos PNG de la PWA sin depender de nada externo.
 *
 * Dibuja una cruz redondeada clara sobre el azul de tinta de la app. Es lo que
 * se ve en la pantalla de inicio del teléfono, así que tiene que reconocerse a
 * tamaño pequeño y de noche: forma simple, mucho contraste, sin texto.
 *
 *   node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TINTA = [22, 32, 46] // #16202E
const PAPEL = [255, 255, 255]
const FONDO_CLARO = [238, 241, 245] // #EEF1F5

/** PNG de 8 bits RGB a partir de un buffer de píxeles. */
function png(ancho, alto, pixeles) {
  const crc32 = (buf) => {
    let c = ~0
    for (const byte of buf) {
      c ^= byte
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
    return ~c >>> 0
  }
  const trozo = (tipo, datos) => {
    const largo = Buffer.alloc(4)
    largo.writeUInt32BE(datos.length)
    const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(cuerpo))
    return Buffer.concat([largo, cuerpo, crc])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0)
  ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8 // profundidad
  ihdr[9] = 2 // color RGB
  const filas = Buffer.alloc((ancho * 3 + 1) * alto)
  for (let y = 0; y < alto; y++) {
    filas[y * (ancho * 3 + 1)] = 0 // filtro "none"
    pixeles.copy(filas, y * (ancho * 3 + 1) + 1, y * ancho * 3, (y + 1) * ancho * 3)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(filas, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ])
}

/** Cobertura suavizada de un rectángulo redondeado. */
function dentroRedondeado(x, y, x0, y0, x1, y1, radio) {
  const cx = Math.min(Math.max(x, x0 + radio), x1 - radio)
  const cy = Math.min(Math.max(y, y0 + radio), y1 - radio)
  const d = Math.hypot(x - cx, y - cy)
  return Math.min(Math.max(radio + 0.5 - d, 0), 1)
}

function dibujar(lado, { relleno, fondo, margen }) {
  const px = Buffer.alloc(lado * lado * 3)
  const m = lado * margen
  const brazo = lado * 0.105 // grosor de cada brazo (mitad)
  const largo = lado * 0.3 // alcance de la cruz desde el centro
  const c = lado / 2
  const radio = lado * 0.22

  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const px5 = x + 0.5
      const py5 = y + 0.5

      // Fondo: rectángulo redondeado en tinta (en el maskable ocupa todo).
      const base = dentroRedondeado(px5, py5, m, m, lado - m, lado - m, radio)

      // Cruz clara centrada.
      const vertical = dentroRedondeado(px5, py5, c - brazo, c - largo, c + brazo, c + largo, brazo * 0.55)
      const horizontal = dentroRedondeado(px5, py5, c - largo, c - brazo, c + largo, c + brazo, brazo * 0.55)
      const cruz = Math.min(1, Math.max(vertical, horizontal)) * base

      const i = (y * lado + x) * 3
      for (let canal = 0; canal < 3; canal++) {
        const conFondo = fondo[canal] * (1 - base) + relleno[canal] * base
        px[i + canal] = Math.round(conFondo * (1 - cruz) + PAPEL[canal] * cruz)
      }
    }
  }
  return png(lado, lado, px)
}

const publico = join(process.cwd(), 'public')
const archivos = [
  // Favicon de la pestaña. Next lo toma de src/app/icon.png.
  [join('..', 'src', 'app', 'icon.png'), dibujar(64, { relleno: TINTA, fondo: FONDO_CLARO, margen: 0 })],
  ['icono-192.png', dibujar(192, { relleno: TINTA, fondo: FONDO_CLARO, margen: 0.06 })],
  ['icono-512.png', dibujar(512, { relleno: TINTA, fondo: FONDO_CLARO, margen: 0.06 })],
  // Maskable: sin margen, el sistema recorta lo que le sobra.
  ['icono-maskable-512.png', dibujar(512, { relleno: TINTA, fondo: TINTA, margen: 0 })],
  // Ícono de iOS. En src/app Next emite el <link> por su cuenta.
  [join('..', 'src', 'app', 'apple-icon.png'), dibujar(180, { relleno: TINTA, fondo: FONDO_CLARO, margen: 0 })],
]

for (const [nombre, datos] of archivos) {
  const destino = join(publico, nombre)
  writeFileSync(destino, datos)
  console.log(`${destino.replace(process.cwd() + '/', '')} — ${(datos.length / 1024).toFixed(1)} kB`)
}
