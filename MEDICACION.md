# Control de medicación

App para registrar las dosis que se le dan en casa a un paciente en cuidados paliativos.
Trece dosis al día repartidas en nueve horarios, incluidas dos de madrugada.

Se instala en el teléfono como una app más, se abre con un toque y funciona sin señal.
**No calcula, no sugiere ni ajusta dosis: solo registra lo que se administró.**

> Este proyecto vive en la rama `claude/medication-control-app-4ukhtj`. La rama `main`
> del repositorio contiene otra app (Chef's English); son cosas distintas.

## Dónde se guardan los datos

En el propio teléfono (`localStorage`), y en ningún otro sitio. No hay base de datos,
no hay servidor, no hay cuenta, no sale nada a internet. Eso tiene dos consecuencias
que conviene tener claras:

- Cada teléfono lleva su propio registro. Si se abre en otro, empieza vacío.
- Si cambias de teléfono o borras los datos del navegador, se pierde el historial.
  Por eso el historial tiene un botón para **guardar una copia de seguridad** y otro
  para **restaurarla**. Vale la pena hacerlo de vez en cuando.

## Poner la app en marcha

```bash
npm install
npm run dev          # http://localhost:3000/f/anis-quince-salvia-8114
```

El código de acceso está en `config/app.ts`.

### Publicada en GitHub Pages

La rama se publica sola en GitHub Pages cada vez que se le hace push, con el workflow
`.github/workflows/publicar-medicacion.yml`. La app queda en:

**https://jrpenalozat-a11y.github.io/Chef-ingled/f/anis-quince-salvia-8114/**

Para cambiar el código de acceso, edita `CODIGO_POR_DEFECTO` en `config/app.ts` y haz
push: la app pasa a la dirección nueva y la anterior deja de existir. Ten en cuenta que
el repositorio es público, así que ese código se puede leer en el código fuente; lo que
protege de verdad es que **los datos nunca salen del teléfono**, así que quien abra la
dirección solo ve la app vacía.

Un detalle de GitHub Pages: `robots.txt` acaba en `/Chef-ingled/robots.txt`, que no es
donde lo buscan los buscadores. Lo que mantiene la app fuera de los índices es la
etiqueta `noindex` que lleva cada página en su `<head>`.

### Desplegar en Vercel (alternativa)

1. Importa el repositorio en Vercel y elige la rama `claude/medication-control-app-4ukhtj`.
2. En **Settings → Environment Variables**, añade `CODIGO_FAMILIA` con un código largo y
   difícil de adivinar. Acepta varios separados por coma. Ahí el código queda fuera del
   repositorio, que es la ventaja sobre GitHub Pages.
3. Despliega. La app queda en `https://<tu-proyecto>.vercel.app/f/<tu-codigo>`.

No hace falta configurar nada más: ni base de datos, ni servicios externos.

### Instalarla en el teléfono

Abre ese enlace en Chrome (Android) o Safari (iPhone) y elige *Añadir a la pantalla de
inicio*. A partir de ahí abre a pantalla completa, con su propio ícono y sin barra de
direcciones, y funciona aunque no haya señal.

## Cambiar la pauta

Toda la pauta está en **`config/pauta.ts`**. No hay dosis escritas dentro de los
componentes. Para cambiarla, edita ese archivo y vuelve a desplegar.

Lo importante al editarla: **no borres ni modifiques una línea que ya se usó.** Ponle
`vigenteHasta` con el último día en que rigió y añade una línea nueva, con un `id` nuevo
y `vigenteDesde` el día siguiente. Así el historial antiguo sigue siendo legible. El
propio archivo lleva un ejemplo comentado.

En **`config/app.ts`** están el resto de los ajustes: el código de acceso por defecto,
los nombres de los cuidadores, los 45 minutos de margen antes de marcar una dosis como
atrasada y el texto del pie de página.

## Cómo se lee la pantalla

El estado de cada dosis se entiende por color y forma antes que por texto:

| | |
|---|---|
| Gris, casilla vacía | pendiente, aún no toca |
| Ámbar, etiqueta `AHORA` | es la dosis que toca en este momento |
| Rojo, `sin marcar` | pasaron más de 45 minutos de la hora y sigue sin marcarse |
| Verde, tachado | dada, con la hora real y quién la dio |

Arriba, fija, están la fecha, la barra de progreso del día y una sola línea con lo más
urgente. Las flechas mueven el día; tocando la fecha se vuelve a hoy.

Cada dosis admite una nota corta ("vomitó", "se dio 20 min tarde"). El historial permite
exportar a CSV, imprimir o guardar en PDF, y hacer la copia de seguridad.

## La hora

Todo corre en hora local de Chile (`America/Santiago`) y el día va de 00:00 a 23:59.
Las comparaciones son siempre de reloj de pared contra reloj de pared, así que los
cambios de horario de verano no descuadran las cuentas.

Hay un caso al que se le presta atención expresa: **el día en que Chile adelanta el
reloj, las 00:00 no existen** (se pasa de las 23:59 a la 01:00). Sin tratarlo, las dos
dosis de medianoche aparecerían en rojo desde el primer segundo del día sin que nadie
hubiera podido darlas. `minutosProgramados()` en `src/lib/fecha.ts` detecta esa hora
inexistente y empieza a contar el margen desde la primera hora que sí existió.

## Privacidad

Son datos de salud de una persona real:

- Las páginas van marcadas `noindex, nofollow, noarchive` y `robots.txt` bloquea todo.
- La app vive en `/f/<codigo>`; cualquier otro código devuelve 404.
- El código no protege ninguna base de datos (no hay), pero mantiene el enlace fuera de
  buscadores y de miradas casuales. Que sea largo.

## Cómo está hecho

Next.js (App Router) + TypeScript + Tailwind, todo prerenderizado como páginas estáticas.
El service worker (`public/sw.js`) guarda la app entera en la primera visita, así que
abre sin señal desde el primer día.

```
config/pauta.ts          la pauta — lo único que se toca al cambiar las dosis
config/app.ts            código de acceso, cuidadores, margen de atraso
src/lib/tipos.ts         Pauta y Registro
src/lib/fecha.ts         hora de Santiago y cambios de horario
src/lib/estado.ts        pendiente / próxima / atrasada / dada
src/lib/cliente/         almacenamiento en el teléfono y hooks de React
src/components/          interfaz
public/sw.js             modo offline
scripts/gen-icons.mjs    genera los íconos (npm run iconos)
.github/workflows/       publicación automática en GitHub Pages
```

`npm run build` construye para un servidor normal; `npm run build:pages` genera el sitio
estático que se sube a Pages.

## Qué no está hecho

- **Sincronización entre dos teléfonos.** Se descartó a propósito: la app es de un solo
  dispositivo. Volver a activarla implicaría una base de datos y un API.
- **Notificaciones push** a la hora de cada dosis.
- **Vista de turnos de cuidado.**
