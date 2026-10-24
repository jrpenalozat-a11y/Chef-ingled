# Mi Turno François

App para que el personal de François marque **entrada, salida a colación, vuelta de colación y salida** desde su teléfono. La app guarda la ubicación **solo en el momento de marcar**.

> **Control interno.** Esta app no reemplaza el registro legal de asistencia. En Chile, un registro electrónico con validez legal debe estar certificado y autorizado por la Dirección del Trabajo (Res. Ex. N°38/2024). Mientras tanto, mantengan el libro de asistencia oficial.

## Link de la app

**https://script.google.com/macros/s/AKfycbwkAvyWIy-lGC9hASCvPRDroAQynFUaBdB8iMrMK7HGMZC5OYKoSzfJUWwTUNFAKZF82w/exec**

Ese link abre la app en el teléfono y también es la dirección de datos para la página de Operación François (`?accion=estado`, `?accion=trabajadores`, POST `reporte`).

## Cómo funciona

```
Teléfono del trabajador ──► App web (Vercel) ──► Google Apps Script ──► Google Sheet "Mi Turno François"
                                                                         ▲
                                         Página de Operación François ───┘  (más adelante)
```

- **La hora oficial es la del servidor**, no la del teléfono. Así nadie puede adelantar el reloj del celular.
- **La distancia al local se calcula en el servidor.** Si alguien marca a más del radio permitido (150 m por defecto), la marca queda como "Fuera de zona".
- **Cada trabajador tiene un PIN de 4 dígitos.** Tras 5 intentos fallidos, ese usuario queda bloqueado por 10 minutos.
- Si dos toques marcan el mismo tipo en menos de 2 minutos, se guarda una sola marca.
- **Sin conexión:** la marca se guarda en el teléfono y se envía cuando vuelve la señal. En la planilla queda con "Enviada sin conexión = Sí" y la hora que tenía el teléfono, para que la revisen.
- **Atrasos:** si la hoja `Turnos` tiene el horario del trabajador para ese día, la app calcula los minutos de atraso de la entrada, descontando la tolerancia.

Sin configurar, la app abre en **modo demostración**: muestra nombres de ejemplo (PIN `1234`, PIN de administración `123456`) y las marcas solo quedan en ese teléfono.

## Puesta en marcha (unos 20 minutos)

### 1. Crear la planilla y el servidor

1. En Google Drive, crea una planilla nueva llamada **Mi Turno François**.
2. Abre **Extensiones → Apps Script**.
3. Borra el contenido de `Código.gs` y pega el de [`apps-script/Code.gs`](apps-script/Code.gs).
4. En **Configuración del proyecto** (ícono de engranaje), activa "Mostrar el archivo de manifiesto appsscript.json". Luego reemplaza su contenido por el de [`apps-script/appsscript.json`](apps-script/appsscript.json). Esto fija la zona horaria de Santiago.
5. Arriba, elige la función `configurarHojas` y presiona **Ejecutar**. Acepta los permisos. Se crean las hojas `Trabajadores`, `Marcas`, `Turnos` y `Config`.

### 2. Llenar la planilla

**Config**: pon un `PIN_ADMIN` de al menos 6 dígitos. Es obligatorio.

**Trabajadores** (una fila por persona):

| Nombre | RUT | PIN | Activo | Cargo |
|---|---|---|---|---|
| Nombre Apellido | 12.345.678-9 | 4 dígitos | Sí | Caja |

Para dar de baja a alguien, pon `No` en Activo. No borres la fila, así se conservan sus marcas pasadas.

**Turnos** (opcional, para calcular atrasos), una fila por día de trabajo:

| Trabajador | Día | Entrada | Salida |
|---|---|---|---|
| Nombre Apellido | Lunes | 08:00 | 16:00 |

El nombre debe ser igual al de la hoja Trabajadores.

### 3. Publicar el servidor

1. En Apps Script: **Implementar → Nueva implementación → Aplicación web**.
2. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquiera**.
3. Copia la URL que termina en `/exec`. Solo si usas Vercel (paso 4), pégala en [`config.js`](config.js), en `apiUrl`.

Si después cambias `Code.gs`, usa **Implementar → Gestionar implementaciones → Editar → Nueva versión**. Así la URL no cambia.

### 4. Publicar la app

**Opción simple (recomendada): Google sirve la app.**

1. En Apps Script, junto a **Archivos**, toca **+ → HTML** y ponle de nombre `index`.
2. Borra su contenido y pega el de [`index.html`](index.html). Guarda.
3. **Implementar → Gestionar implementaciones →** lápiz **→ Versión: Nueva versión → Implementar.**
4. La URL que termina en `/exec` **es la app**: ábrela en el teléfono. No hace falta tocar `config.js`.

**Opción alternativa: Vercel.** Esta carpeta también funciona como sitio estático independiente:

1. En Vercel: **Add New → Project** e importa este repositorio.
2. En **Root Directory** elige `mi-turno-francois`.
3. Framework Preset: **Other**. Sin comando de build.
4. Publica. Te queda una dirección `https://…vercel.app`, y puedes ponerle un dominio propio si quieres.

La ubicación del teléfono solo funciona con `https`, que Vercel entrega por defecto.

### 5. Fijar la ubicación del local

1. Párate dentro de François con tu teléfono y abre la app.
2. Entra a **Administración** con el PIN de administración.
3. Toca **Usar mi ubicación actual** y ajusta el radio si hace falta.

### 6. Instalarla en los teléfonos del equipo

Abre el link y elige **Agregar a pantalla de inicio**: en Safari está en Compartir, y en Chrome en el menú ⋮. Queda como una app con el ícono de Mi Turno. Cada trabajador elige su nombre una sola vez.

**Antes de usarla, avisa al equipo por escrito** que la app registra la ubicación solo al marcar, y para qué se usa. Lo ideal es dejarlo en el reglamento interno.

## Administración

Se entra con el PIN de administración. Tiene cuatro pestañas:

- **Supervisión** (se abre primero y se actualiza sola cada minuto): quién está en el local, en colación, quién llegó tarde o no ha llegado según la hoja `Turnos`, marcas fuera del local y el detalle de cada marca del día.
- **Reporte de horas**: entrada, salida, horas trabajadas (descontando colación), atrasos y marcas fuera del local por rango de fechas, con descarga CSV para Excel.
- **Ubicación del local**: fija el punto de referencia y el radio permitido.
- **Turnonio**: el asistente con DeepSeek (ver abajo).

Todo queda además en la hoja `Marcas` de Google Sheets. Las marcas no se borran desde la app.

## Turnonio, el agente de DeepSeek

Turnonio responde preguntas sobre la asistencia (atrasos, horas, quién está en turno, marcas raras) usando los datos de hoy y de los últimos 31 días. Corre en el servidor de Apps Script: la clave de DeepSeek nunca llega a ningún navegador.

**A DeepSeek solo se le envían** nombres, cargos, horas, minutos de atraso y estados. **Nunca** RUT, PIN ni coordenadas. Como DeepSeek es un servicio externo, conviene mencionarlo en el aviso al personal.

Para activarlo:

1. Crea una clave en [platform.deepseek.com](https://platform.deepseek.com) (API keys) y carga saldo.
2. En Apps Script: **Configuración del proyecto** (engranaje) → **Propiedades de la secuencia de comandos** → **Agregar propiedad**: nombre `DEEPSEEK_API_KEY`, valor tu clave. Guarda.
3. Opcional: propiedad `DEEPSEEK_MODELO` para usar otro modelo (por defecto `deepseek-chat`).
4. Publica una nueva versión. La primera vez Google pedirá un permiso nuevo ("conectarse a un servicio externo"): **Avanzado → Ir a … → Permitir**.

## Integración con la página de Operación François

Mi Turno sigue siendo una app independiente. La página de operaciones se integra de dos formas:

**1. Pestaña "Mi Turno" con acceso a la app.** Un botón que abra la app en pestaña nueva:

```html
<a href="https://script.google.com/macros/s/AKfycbwkAvyWIy-lGC9hASCvPRDroAQynFUaBdB8iMrMK7HGMZC5OYKoSzfJUWwTUNFAKZF82w/exec" target="_blank" rel="noopener">Abrir Mi Turno</a>
```

**2. Datos y Turnonio desde la página (o desde el DeepSeek de la página).** Con una **clave de integración** que solo permite leer y preguntarle a Turnonio (no puede marcar ni cambiar la ubicación):

1. En Apps Script elige la función `generarClaveIntegracion` y presiona **Ejecutar**. La clave aparece en el **Registro de ejecución**.
2. Guárdala en el **servidor** de la página (variable de entorno o propiedad privada). **No** la pongas en el HTML o JavaScript público: cualquiera que abra la página podría verla.
3. Desde ese servidor, `POST` a la URL `/exec` con cuerpo JSON (`Content-Type: text/plain` evita problemas de CORS):

| Para qué | Cuerpo |
|---|---|
| Preguntarle a Turnonio | `{"accion":"turnonio","claveApi":"…","pregunta":"¿Quién llegó tarde esta semana?","historial":[{"rol":"user","texto":"…"},{"rol":"assistant","texto":"…"}]}` → `{"ok":true,"respuesta":"…"}` |
| Datos para otra IA o un tablero | `{"accion":"datos","claveApi":"…","desde":"2026-10-01","hasta":"2026-10-31"}` → `{"ok":true,"datos":{"hoy":[…],"dias":[…]}}` (sin RUT ni coordenadas) |
| Estado de hoy completo | `{"accion":"supervision","claveApi":"…"}` |
| Reporte por fechas | `{"accion":"reporte","claveApi":"…","desde":"…","hasta":"…"}` |
| Horario semanal (hoja Turnos) | `{"accion":"turnos","claveApi":"…"}` → `{"ok":true,"turnos":[{"trabajador":"…","dia":"Lunes","entrada":"08:00","salida":"16:00"}]}` |

Sin clave: `GET <url>?accion=estado` (nombre y ubicación del local) y `GET <url>?accion=trabajadores` (nombres activos).

Si la página es un Artifact de Claude, su seguridad bloquea llamadas a `script.google.com`: ahí la integración es el botón del punto 1, o leer la planilla con el conector de Google Drive.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app completa (pantallas de marcar, PIN y administración) |
| `config.js` | URL del servidor |
| `manifest.webmanifest`, `icon.svg`, `sw.js` | Para instalarla como app en el teléfono |
| `vercel.json` | Despliegue independiente en Vercel |
| `apps-script/Code.gs` | Servidor en Google Apps Script |
| `apps-script/appsscript.json` | Zona horaria y permisos del servidor |
