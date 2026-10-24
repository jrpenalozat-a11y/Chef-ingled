# Mi Turno François

App para que el personal de François marque **entrada, salida a colación, vuelta de colación y salida** desde su teléfono. La app guarda la ubicación **solo en el momento de marcar**.

> **Control interno.** Esta app no reemplaza el registro legal de asistencia. En Chile, un registro electrónico con validez legal debe estar certificado y autorizado por la Dirección del Trabajo (Res. Ex. N°38/2024). Mientras tanto, mantengan el libro de asistencia oficial.

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
2. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier usuario**.
3. Copia la URL que termina en `/exec`.
4. Pégala en [`config.js`](config.js), en `apiUrl`.

Si después cambias `Code.gs`, usa **Implementar → Gestionar implementaciones → Editar → Nueva versión**. Así la URL no cambia.

### 4. Publicar la app

Esta carpeta es un sitio estático independiente:

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

En la app, el panel de **Administración** muestra para hoy, ayer, esta semana, este mes o un rango a elección:

- Entrada, salida y horas trabajadas (descontando la colación).
- Minutos de atraso según la hoja `Turnos`.
- Marcas hechas fuera del local.
- Días con entrada pero sin salida.
- Un botón para descargar la planilla en CSV, que abre en Excel.

Todo queda además en la hoja `Marcas` de Google Sheets. Las marcas no se borran desde la app.

## Conexión con la página de Operación François

La app es independiente, pero sus datos están listos para que la página de operaciones los lea más adelante, por la misma URL del servidor:

| Para qué | Cómo |
|---|---|
| Estado del local | `GET <apiUrl>?accion=estado` |
| Lista de personal activo | `GET <apiUrl>?accion=trabajadores` |
| Resumen de asistencia | `POST <apiUrl>` con `{"accion":"reporte","pinAdmin":"…","desde":"2026-10-01","hasta":"2026-10-31"}` |

El reporte devuelve, por trabajador y día: `entrada`, `salida`, `minutosTrabajados`, `colacion`, `atraso`, `fueraDeZona` y el detalle de cada marca.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app completa (pantallas de marcar, PIN y administración) |
| `config.js` | URL del servidor |
| `manifest.webmanifest`, `icon.svg`, `sw.js` | Para instalarla como app en el teléfono |
| `vercel.json` | Despliegue independiente en Vercel |
| `apps-script/Code.gs` | Servidor en Google Apps Script |
| `apps-script/appsscript.json` | Zona horaria y permisos del servidor |
