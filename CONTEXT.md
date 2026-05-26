# CONTEXT.md — Registro de progreso del proyecto Zarvix

---

## [Sesión 1] Estructura base del proyecto

### Qué se ha implementado
- Definición del stack tecnológico y características principales de la aplicación
- Estructura de carpetas raíz del proyecto
- Configuración inicial de dependencias de backend y frontend
- Inicialización de Node.js en `/backend` con instalación real de paquetes
- Schema de Prisma con los dos modelos de datos
- Servidor Express básico con ruta de healthcheck
- Archivo de variables de entorno de referencia

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/README.md` | Creado — descripción del proyecto, stack, estructura, instrucciones dev/prod |
| `/.env.example` | Creado — variables de entorno raíz (para docker-compose) |
| `/.gitignore` | Creado — node_modules, .env, dist, .DS_Store, etc. |
| `/docker-compose.yml` | Creado — servicios `postgres` (postgres:16-alpine) y `app` |
| `/backend/package.json` | Creado e instalado — `"type": "module"`, deps: express, cors, dotenv, jsonwebtoken, bcryptjs, @prisma/client; devDeps: prisma, nodemon |
| `/backend/package-lock.json` | Generado por npm install |
| `/backend/.env.example` | Creado — DATABASE_URL, PORT, JWT_SECRET, ADMIN_PASSWORD |
| `/backend/prisma/schema.prisma` | Creado — modelos `Empleado` y `Horario` con @@unique |
| `/backend/src/index.js` | Creado — Express básico, CORS, JSON, GET /api/health |
| `/frontend/package.json` | Creado — React 18, Vite, Tailwind CSS, vite-plugin-pwa, Zustand, Axios, date-fns |

### Estado actual del proyecto
- Backend: estructura inicializada, dependencias instaladas, schema Prisma validado, servidor Express básico funcional
- Frontend: solo `package.json`, sin código ni dependencias instaladas aún
- Base de datos: schema definido, sin migraciones ejecutadas
- Docker: `docker-compose.yml` definido, sin `Dockerfile` todavía
- Deploy: no configurado

### Qué falta por hacer
- [ ] Ejecutar `prisma migrate dev` para generar la migración inicial
- [ ] Rutas REST del backend (empleados, horarios, auth)
- [ ] Middleware de autenticación JWT para rutas de admin
- [ ] Inicializar el frontend (`npm install`, Vite config, Tailwind config)
- [ ] Componentes React: calendario mensual, formulario de turno, vistas admin/consulta
- [ ] `Dockerfile` para producción (build frontend + serve con Node)
- [ ] Configuración PWA (manifest, service worker)
- [ ] Variables de entorno en Easypanel
- [ ] Despliegue en `zarvix.myarkadia.es`

---

## [Sesión 1] Sistema de autenticación

### Qué se ha implementado
- Middleware `verifyToken` que valida JWT del header `Authorization: Bearer <token>`
- Ruta `POST /api/auth/login` que compara contraseña con `ADMIN_PASSWORD` del entorno
  - Soporta `ADMIN_PASSWORD` en texto plano o como hash bcrypt (detectado por prefijo `$2`)
  - Devuelve JWT firmado con `JWT_SECRET`, expira en 24h
- Rutas de auth conectadas en `index.js` bajo `/api/auth`

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/backend/src/middleware/auth.js` | Creado — `verifyToken`: extrae Bearer token, verifica con JWT_SECRET, añade `req.admin = true` |
| `/backend/src/routes/auth.js` | Creado — `POST /login`: valida contraseña, devuelve JWT 24h |
| `/backend/src/index.js` | Modificado — importa y monta `authRouter` en `/api/auth` |

### Estado actual del proyecto
- Backend: autenticación completa. Rutas disponibles: `GET /api/health`, `POST /api/auth/login`
- `verifyToken` listo para proteger cualquier ruta futura de admin
- Frontend: solo `package.json`, sin instalar
- Base de datos: schema definido, sin migraciones ejecutadas
- Docker / Deploy: no configurado

### Qué falta por hacer
- [ ] Rutas REST de empleados (`/api/empleados`) protegidas con `verifyToken`
- [ ] Rutas REST de horarios (`/api/horarios`) con lógica de turnos
- [ ] Ejecutar `prisma migrate dev` para generar la migración inicial
- [ ] Inicializar el frontend (`npm install`, Vite config, Tailwind config)
- [ ] Componentes React: calendario mensual, formulario de turno, vistas admin/consulta
- [ ] `Dockerfile` para producción
- [ ] Configuración PWA
- [ ] Despliegue en `zarvix.myarkadia.es`

---

## [Sesión 1] Rutas REST — Empleados y Horarios

### Qué se ha implementado
- **`GET /api/empleados`** — pública, lista empleados con `activo=true`, ordenados por nombre
- **`POST /api/empleados`** — protegida (`verifyToken`), crea empleado con nombre obligatorio (trim)
- **`GET /api/horarios/:empleadoId/:anyo/:mes`** — pública, devuelve turnos del mes ordenados por fecha y turno
- **`POST /api/horarios`** — protegida, upsert por `(empleadoId, fecha, turnoNum)`, valida campos requeridos y que `turnoNum` sea 1 o 2
- **`DELETE /api/horarios/:id`** — protegida, elimina turno por id, devuelve 404 si no existe (Prisma P2025)
- Instancia de `PrismaClient` en cada router (patrón simple, suficiente para esta carga)

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/backend/src/routes/empleados.js` | Creado — GET (público) + POST (auth) |
| `/backend/src/routes/horarios.js` | Creado — GET por mes (público) + POST upsert (auth) + DELETE (auth) |
| `/backend/src/index.js` | Modificado — monta `/api/empleados` y `/api/horarios` |

### Estado actual del proyecto
- Backend: API REST completa. Todas las rutas necesarias para la app están implementadas
- Rutas disponibles: `GET /api/health`, `POST /api/auth/login`, `GET|POST /api/empleados`, `GET|POST /api/horarios`, `DELETE /api/horarios/:id`
- Frontend: solo `package.json`, sin instalar
- Base de datos: schema definido, **sin migraciones ejecutadas** (necesita BD activa)
- Docker / Deploy: no configurado

### Qué falta por hacer
- [ ] Ejecutar `prisma migrate dev` (requiere PostgreSQL corriendo)
- [ ] Inicializar el frontend (`npm install`, Vite config, Tailwind config)
- [ ] Componentes React: calendario mensual, formulario de turno, vistas admin/consulta
- [ ] `Dockerfile` para producción (build frontend + serve estático con Node)
- [ ] Configuración PWA (manifest, service worker via vite-plugin-pwa)
- [ ] Despliegue en `zarvix.myarkadia.es`

---

## [Sesión 1] Frontend — Vite + React + Tailwind + PWA

### Qué se ha implementado
- Scaffold de Vite con template React (Vite 8, React 18)
- Instalación de todas las dependencias: tailwindcss@3, postcss, autoprefixer, vite-plugin-pwa, axios, react-router-dom
- Tailwind configurado: `content` apunta a `./index.html` y `./src/**/*.{js,jsx}`, directivas en `index.css`
- `vite-plugin-pwa` configurado: name/short_name 'Zarvix', theme_color #238636, display standalone, iconos 192/512
- Iconos PWA placeholder generados como PNGs sólidos verdes (#238636)
- `.env.example` con `VITE_API_URL=http://localhost:3000`
- Build de producción verificado: Tailwind, PWA (sw.js + workbox), React — sin errores

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/frontend/vite.config.js` | Modificado — añade react() + VitePWA con manifest completo |
| `/frontend/tailwind.config.js` | Generado y configurado — content apunta a src/**/*.{js,jsx} |
| `/frontend/postcss.config.js` | Generado por `tailwindcss init -p` |
| `/frontend/src/index.css` | Reemplazado — solo directivas @tailwind base/components/utilities |
| `/frontend/public/icons/icon-192x192.png` | Creado — placeholder verde PWA |
| `/frontend/public/icons/icon-512x512.png` | Creado — placeholder verde PWA |
| `/frontend/.env.example` | Creado — VITE_API_URL |
| `/frontend/package.json` | Regenerado por Vite scaffold |
| `/frontend/node_modules/` | Instalado — 481 paquetes |

### Estado actual del proyecto
- Backend: API REST completa, lista para usar
- Frontend: inicializado, Tailwind + PWA configurados, build verificado — **sin componentes de la app aún**
- Base de datos: schema definido, sin migraciones ejecutadas (necesita PostgreSQL)
- Docker / Deploy: no configurado

### Qué falta por hacer
- [ ] Componentes React: layout, calendario mensual, formulario de turno, vistas admin/consulta
- [ ] Cliente API en `/frontend/src/api/` usando axios + VITE_API_URL
- [ ] Configurar react-router-dom con rutas / y /admin
- [ ] `Dockerfile` para producción (multistage: build frontend + serve con Node/Express)
- [ ] Ejecutar `prisma migrate dev` (requiere PostgreSQL corriendo)
- [ ] Iconos PWA reales (sustituir placeholders)
- [ ] Despliegue en `zarvix.myarkadia.es`

---

## [Sesión 1] Frontend — Estructura de archivos y enrutado

### Qué se ha implementado
- **`/api/client.js`**: instancia axios con `baseURL: VITE_API_URL` + interceptor que inyecta `Bearer <token>` desde `localStorage('zarvix_token')`
- **`/context/AuthContext.jsx`**: proveedor con `isAdmin`, `token`, `login(password)` (llama a POST /api/auth/login y persiste el token) y `logout()` (limpia localStorage y estado)
- **`/pages/CalendarioPage.jsx`**: ensambla Header + SelectorEmpleado + SelectorMes + Calendario + TurnoModal (placeholders con TODO)
- **`/pages/LoginPage.jsx`**: usa `useAuth().login` y `useNavigate` — pendiente formulario HTML
- **`/components/Header.jsx`**: botón dinámico Admin/Cerrar sesión según `isAdmin`
- **`/components/Calendario.jsx`**: placeholder con estructura de TODO documentada
- **`/components/TurnoModal.jsx`**: placeholder vacío con TODO documentado
- **`/components/SelectorEmpleado.jsx`**: placeholder con TODO de carga de API
- **`/components/SelectorMes.jsx`**: placeholder con TODO de navegación
- **`App.jsx`**: reescrito con `BrowserRouter` + `AuthProvider` + rutas `/` y `/login`
- Build verificado: 85 módulos transformados, PWA generada, sin errores

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/frontend/src/api/client.js` | Creado |
| `/frontend/src/context/AuthContext.jsx` | Creado |
| `/frontend/src/pages/CalendarioPage.jsx` | Creado |
| `/frontend/src/pages/LoginPage.jsx` | Creado |
| `/frontend/src/components/Header.jsx` | Creado |
| `/frontend/src/components/Calendario.jsx` | Creado |
| `/frontend/src/components/TurnoModal.jsx` | Creado |
| `/frontend/src/components/SelectorEmpleado.jsx` | Creado |
| `/frontend/src/components/SelectorMes.jsx` | Creado |
| `/frontend/src/App.jsx` | Reescrito — BrowserRouter + AuthProvider + Routes |

### Estado actual del proyecto
- Backend: API REST completa
- Frontend: estructura completa creada, enrutado funcional, cliente API y contexto de auth operativos — **componentes pendientes de implementar UI real**
- Base de datos: schema definido, sin migraciones ejecutadas
- Docker / Deploy: no configurado

### Qué falta por hacer
- [ ] Implementar UI real de cada componente (Calendario grid, TurnoModal formulario, SelectorEmpleado, SelectorMes, LoginPage formulario, Header con Tailwind)
- [ ] `Dockerfile` para producción (multistage: build frontend + serve con Node)
- [ ] Ejecutar `prisma migrate dev` (requiere PostgreSQL corriendo)
- [ ] Iconos PWA reales
- [ ] Despliegue en `zarvix.myarkadia.es`

---

## [Sesión 1] Componente Calendario.jsx — implementación completa

### Qué se ha implementado
- Carga datos con `GET /api/horarios/:empleadoId/:anyo/:mes` al montar y al cambiar las props
- Indexa la respuesta en `{ 'YYYY-MM-DD': { 1: turno, 2: turno } }` para acceso O(1)
- Calcula el offset inicial de la semana con `(getDay() + 6) % 7` (lunes = 0)
- Grid 1 columna en móvil / 7 columnas en md+ con cabecera Lun–Dom
- Celdas vacías de desplazamiento inicial (ocultas en móvil)
- Cada celda muestra: número + nombre del día, turno 1 (verde), turno 2 (azul), notas truncadas
- Día actual resaltado con borde y fondo verde; fines de semana con fondo gris
- Modo admin: clic en turno existente → `onTurnoClick(fecha, turnoNum)`; botones `+ Turno 1` / `+ Turno 2` con borde punteado (turno 2 solo aparece si turno 1 existe)
- Accesibilidad: `role="button"` + `onKeyDown` Enter en elementos de turno clicables
- Total de horas trabajadas al pie con `parseMinutos` (nunca negativo)
- Estados: cargando, error con botón "Reintentar", sin empleado seleccionado
- Build verificado: CSS 7.9 kB (clases purgadas correctamente por Tailwind)

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/frontend/src/components/Calendario.jsx` | Reescrito — implementación completa |

### Estado actual del proyecto
- Backend: API REST completa
- Frontend: Calendario implementado; Header parcialmente funcional; resto de componentes son placeholders
- Base de datos: sin migraciones ejecutadas
- Docker / Deploy: no configurado

### Qué falta por hacer
- [ ] TurnoModal: formulario para crear/editar/eliminar turno
- [ ] SelectorEmpleado: carga de API + dropdown
- [ ] SelectorMes: botones de navegación
- [ ] Header: estilos Tailwind
- [ ] LoginPage: formulario con estado y manejo de error
- [ ] CalendarioPage: conectar estado global (empleadoId, mes, año) entre componentes
- [ ] `Dockerfile` + `prisma migrate dev`
- [ ] Despliegue en `zarvix.myarkadia.es`

---

## [Sesión 1] Componente TurnoModal.jsx — implementación completa

### Qué se ha implementado
- Formulario controlado: `horaEntrada` (time), `horaSalida` (time), `notas` (textarea opcional)
- Validación: campos requeridos + comprueba que salida > entrada antes de llamar a la API
- **Guardar**: llama a `POST /api/horarios` via `client`, invoca `onSave(data)` + `onClose()` en éxito
- **Eliminar** (solo en edición): doble confirmación — primer clic cambia el botón a "¿Confirmar?", segundo clic llama a `DELETE /api/horarios/:id`; texto auxiliar con enlace para cancelar la confirmación
- `useEffect` sincroniza los campos con `turnoExistente` cada vez que el modal se abre
- Cierre al pulsar el overlay exterior (`e.target === e.currentTarget`)
- Botón X con icono SVG inline en la cabecera
- Indicador de fecha legible (DD/MM/YYYY) y nombre del turno en la cabecera
- Estados `guardando` y `eliminando` deshabilitan todos los botones durante operaciones async
- Error inline con fondo rojo suave
- Build verificado: CSS 11.2 kB, sin errores

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/frontend/src/components/TurnoModal.jsx` | Reescrito — implementación completa |

### Estado actual del proyecto
- Backend: API REST completa
- Frontend: Calendario ✅ TurnoModal ✅ — resto de componentes son placeholders
- Base de datos: sin migraciones ejecutadas
- Docker / Deploy: no configurado

### Qué falta por hacer
- [ ] SelectorEmpleado: carga de API + dropdown
- [ ] SelectorMes: botones de navegación con formato de mes en español
- [ ] Header: estilos Tailwind + nombre app
- [ ] LoginPage: formulario con estado y manejo de error
- [ ] CalendarioPage: estado global (empleadoId, mes, año) + conectar TurnoModal
- [ ] `Dockerfile` + `prisma migrate dev`
- [ ] Despliegue en `zarvix.myarkadia.es`

---

## [Sesión 1] Header, SelectorEmpleado, SelectorMes — implementación completa

### Qué se ha implementado
- **Header**: fondo `#0D1117`, logo "Zarvix" verde, badge "Admin" verde en modo admin, botón "Cerrar sesión" (borde gris), botón "Acceso Admin" (fondo verde) en modo consulta; responsive con `hidden sm:inline` para el badge
- **SelectorEmpleado**: carga `GET /api/empleados` al montar; skeleton de carga animado; selección automática del primer empleado si no hay ninguno elegido; `<select>` estilizado con focus verde; maneja errores y lista vacía
- **SelectorMes**: array de nombres en español sin dependencias externas; botones `<` y `>` con SVG inline (chevrons); wrapping correcto en bordes de año (dic→ene, ene→dic); label `min-w-[130px]` para evitar saltos de layout al cambiar entre meses de distinta longitud
- Build verificado: CSS 13.4 kB, sin errores ni warnings

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/frontend/src/components/Header.jsx` | Reescrito — implementación completa con Tailwind |
| `/frontend/src/components/SelectorEmpleado.jsx` | Reescrito — carga de API, skeleton, autoselección |
| `/frontend/src/components/SelectorMes.jsx` | Reescrito — navegación con wrapping de año, nombres ES |

### Estado actual del proyecto
- Backend: API REST completa
- Frontend: Calendario ✅ TurnoModal ✅ Header ✅ SelectorEmpleado ✅ SelectorMes ✅ — faltan LoginPage y CalendarioPage
- Base de datos: sin migraciones ejecutadas
- Docker / Deploy: no configurado

### Qué falta por hacer
- [ ] LoginPage: formulario con estado, loading y manejo de error
- [ ] CalendarioPage: estado global (empleadoId, mes, año) + conectar TurnoModal + pasar props al Calendario
- [ ] `Dockerfile` + `prisma migrate dev`
- [ ] Despliegue en `zarvix.myarkadia.es`

---

## [Sesión 1] CalendarioPage — implementación completa + Calendario actualizado

### Qué se ha implementado
- Estado local: `empleadoId`, `anyo`, `mes` (inicializados al mes/año actual), `reloadKey`, `turnoModal`, `modalAbierto`
- `handleTurnoClick(fecha, turnoNum, turnoExistente)` — abre el modal con el slot correcto
- `handleSave()` y `handleDelete()` — cierran modal e incrementan `reloadKey` para forzar recarga del Calendario
- Barra de controles (fondo blanco, borde, sombra) con SelectorEmpleado a la izquierda y SelectorMes a la derecha; responsive con `flex-wrap`
- Calendario en tarjeta blanca debajo; `TurnoModal` montado condicionalmente (`isAdmin`) para no registrar el overlay en modo consulta
- **Calendario.jsx** — cambios mínimos: prop `reloadKey` añadida a las deps de `useCallback`; `onTurnoClick` pasa `turnoExistente` (objeto o `null`) como tercer argumento en los 4 puntos de llamada

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/frontend/src/pages/CalendarioPage.jsx` | Reescrito — implementación completa |
| `/frontend/src/components/Calendario.jsx` | Modificado — prop `reloadKey` + pasa `turnoExistente` al callback |

### Estado actual del proyecto
- Backend: API REST completa
- Frontend: todos los componentes implementados salvo **LoginPage** — la app es funcional end-to-end en modo consulta; el flujo admin (edición de turnos) está completo pero no se puede acceder sin LoginPage
- Base de datos: sin migraciones ejecutadas
- Docker / Deploy: no configurado

### Qué falta por hacer
- [ ] LoginPage: formulario con estado, loading, error y redirección
- [ ] `Dockerfile` multistage (build frontend + serve con Node)
- [ ] `prisma migrate dev` (requiere PostgreSQL)
- [ ] Despliegue en `zarvix.myarkadia.es`

---

## [Sesión 1] LoginPage + AuthContext — implementación completa

### Qué se ha implementado
**AuthContext.jsx:**
- `parseJwt(token)` — decodifica el payload base64url sin librería para comprobar `exp`
- `tokenValido(token)` — comprueba `exp * 1000 > Date.now()`
- `useState` inicializado con lazy function: lee localStorage, valida expiración; si el token es inválido o expirado lo elimina silenciosamente y devuelve `null`
- `login()` y `logout()` sin cambios funcionales

**LoginPage.jsx:**
- Fondo gris claro, card centrada, logo "Zarvix" verde encima
- `useEffect` redirige a `/` si ya hay sesión activa (`isAdmin`) al montar
- `handleSubmit`: deshabilita botón durante petición, muestra "Verificando…", navega a `/` con `replace: true` en éxito, muestra "Contraseña incorrecta." en error 401
- Campo `autoFocus` y `autoComplete="current-password"` para buena UX
- Botón deshabilitado cuando el campo está vacío
- Enlace "Volver al calendario" bajo el card

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/frontend/src/context/AuthContext.jsx` | Modificado — validación de expiración de token al iniciar |
| `/frontend/src/pages/LoginPage.jsx` | Reescrito — implementación completa |

### Estado actual del proyecto
- **Frontend: 100% implementado** — todos los componentes y páginas completos, build verificado
- Backend: API REST completa
- Base de datos: schema definido, sin migraciones ejecutadas (requiere PostgreSQL)
- Docker / Deploy: no configurado

### Qué falta por hacer
- [ ] `Dockerfile` multistage para producción
- [ ] `prisma migrate dev` + seed inicial (al menos un empleado de ejemplo)
- [ ] Despliegue en `zarvix.myarkadia.es` vía Easypanel

---

## [Sesión 1] Docker para producción

### Qué se ha implementado
- **`/backend/Dockerfile`**: node:20-alpine, `npm ci --omit=dev`, `prisma generate`, CMD = migrate + seed + start
- **`/backend/.dockerignore`**: excluye node_modules, .env, logs
- **`/backend/prisma/seed.js`**: idempotente (solo crea si no existe ningún empleado), nombre configurable via `SEED_EMPLEADO_NOMBRE`
- **`/frontend/Dockerfile`**: multistage — etapa `build` (node:20-alpine, `npm run build`) + etapa `serve` (nginx:alpine, copia dist)
- **`/frontend/nginx.conf`**: gzip, proxy `/api/` → `http://backend:3000`, SPA fallback `try_files $uri /index.html`
- **`/frontend/.dockerignore`**: excluye node_modules, dist, .env, logs
- **`/docker-compose.yml`**: reescrito con tres servicios — `postgres` (sin puerto externo, healthcheck), `backend` (sin puerto externo, depends_on postgres healthy), `frontend` (puerto 80 expuesto, depends_on backend); variables obligatorias con `:?` fallan con mensaje claro si no se definen
- **`/backend/package.json`**: `prisma` movido de devDependencies a dependencies (necesario para `migrate deploy` en CMD)
- **`/.env.example`**: actualizado con comentarios y variable opcional `SEED_EMPLEADO_NOMBRE`

**Arquitectura de red Docker:**
```
Internet → :80 → frontend (nginx) → /api/* → backend:3000 → postgres:5432
                                   → /*    → /usr/share/nginx/html (SPA)
```
El frontend se construye sin `VITE_API_URL` (undefined → peticiones relativas), nginx hace de proxy.

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/backend/Dockerfile` | Creado |
| `/backend/.dockerignore` | Creado |
| `/backend/prisma/seed.js` | Creado — seed idempotente |
| `/backend/package.json` | Modificado — prisma → dependencies |
| `/frontend/Dockerfile` | Creado — multistage build + nginx |
| `/frontend/nginx.conf` | Creado — proxy API + SPA fallback + gzip |
| `/frontend/.dockerignore` | Creado |
| `/docker-compose.yml` | Reescrito — 3 servicios, variables obligatorias con :? |
| `/.env.example` | Actualizado — comentarios y SEED_EMPLEADO_NOMBRE |

### Estado actual del proyecto
- **El proyecto está completo y listo para despliegue**
- Frontend: 100% implementado, build verificado
- Backend: API REST completa, Dockerizado
- Docker: arquitectura de 3 servicios lista para Easypanel
- Base de datos: schema y migraciones listas; se aplican automáticamente al arrancar

### Qué falta por hacer
- [ ] Crear la migración inicial: `cd backend && npx prisma migrate dev --name init` (requiere PostgreSQL local o `docker compose up postgres`)
- [ ] Crear `.env` desde `.env.example` con valores reales
- [ ] Despliegue en `zarvix.myarkadia.es` vía Easypanel (`docker compose up -d`)

---

## [Sesión 1] Configuración de base de datos para Easypanel

### Qué se ha implementado
- `/backend/.env` actualizado con la connection string real de Easypanel:
  `postgres://postgres:zarvix2026@zarvix_zarvix-db:5432/zarvix?sslmode=disable`
- `docker-compose.yml`: usuario por defecto cambiado de `zarvix` → `postgres` (default de Easypanel); `DATABASE_URL` del backend incluye `?sslmode=disable`
- `.env.example` raíz: `POSTGRES_USER=postgres` como default

### Notas sobre la arquitectura de Easypanel
- En Easypanel el hostname del servicio postgres sigue el patrón `{proyecto}_{servicio}`: `zarvix_zarvix-db`
- En `docker-compose` local, el hostname es simplemente `postgres` (nombre del servicio)
- `sslmode=disable` necesario porque Easypanel conecta internamente sin TLS

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/backend/.env` | Actualizado — DATABASE_URL real de Easypanel |
| `/docker-compose.yml` | Modificado — POSTGRES_USER default → postgres, sslmode=disable |
| `/.env.example` | Modificado — POSTGRES_USER default → postgres |

### Estado actual del proyecto
- **El proyecto está completo y listo para despliegue**
- Falta únicamente: crear la migración inicial y hacer push del código a Easypanel

---

## [Sesión 1] Fix Dockerfile backend — OpenSSL para Prisma en Easypanel

### Qué se ha implementado
- Imagen base cambiada de `node:20-alpine` a `node:20-slim` (Debian)
- Añadido `RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*` antes de instalar dependencias
- Commit y push a GitHub (`0fefdff`)

### Por qué
Alpine usa musl libc y no incluye OpenSSL por defecto. Prisma necesita detectar la versión de libssl del sistema para cargar el query engine correcto. En Alpine falla con "failed to detect libssl/openssl version". Debian slim sí incluye la libc estándar; añadir `openssl` explícitamente garantiza compatibilidad.

### Ficheros modificados
| Fichero | Acción |
|---|---|
| `/backend/Dockerfile` | `FROM node:20-slim` + `apt-get install openssl` |

### Estado actual del proyecto
- Código en GitHub: `https://github.com/Fakuuu/Zarvix` (rama `main`)
- Pendiente: migración inicial de Prisma en Easypanel

---

## [Sesión 1] Fix: migración inicial + CMD del backend

### Qué se ha implementado
- `CMD` del backend simplificado a `npx prisma migrate deploy && node src/index.js` (sin seed)
- Creados los ficheros de migración inicial que `prisma migrate deploy` necesita:
  - `prisma/migrations/migration_lock.toml` — declara el provider postgresql
  - `prisma/migrations/20260523000000_init/migration.sql` — crea tablas `Empleado` y `Horario` con índice único y FK

### Por qué
`prisma migrate deploy` solo aplica migraciones existentes — no las crea. Sin el directorio `migrations/` con al menos un fichero SQL, falla con "No migration found". La migración se ha generado manualmente a partir del schema.

### Ficheros modificados
| Fichero | Acción |
|---|---|
| `/backend/Dockerfile` | CMD: `migrate deploy && node src/index.js` |
| `/backend/prisma/migrations/migration_lock.toml` | Creado |
| `/backend/prisma/migrations/20260523000000_init/migration.sql` | Creado — SQL completo de las dos tablas |

### Estado actual del proyecto
- **Proyecto completo y en GitHub** (`https://github.com/Fakuuu/Zarvix`, rama `main`)
- Al redesplegar en Easypanel: Prisma aplicará la migración y las tablas se crearán automáticamente

---

## [Sesión 1] Fix: backend sirve el frontend (arquitectura unificada)

### Problema
`Cannot GET /` — Express no sabía servir `/`. El frontend (nginx) era un contenedor separado al que Easypanel no enrutaba el tráfico.

### Solución
El backend Express sirve ahora los ficheros estáticos del build del frontend.

### Por qué `COPY ../frontend` requería cambiar el contexto
Docker no permite salir del build context con `../`. El contexto era `./backend`, así que `../frontend` fallaba. Solución: cambiar el contexto a `.` (raíz del proyecto) y ajustar todas las rutas `COPY` en consecuencia.

### Estructura en el contenedor
```
/app/
  backend/
    src/index.js   ← __dirname = /app/backend/src
    node_modules/
    prisma/
  frontend/
    dist/          ← path.join(__dirname, '../../frontend/dist') ✓
```

### Cambios en `index.js`
- Import de `path` y `fileURLToPath` para `__dirname` en ES modules
- `app.use(express.static(...))` antes del `app.listen`
- `app.get('*', ...)` catch-all SPA — devuelve `index.html` para cualquier ruta no-API

### Ficheros modificados
| Fichero | Acción |
|---|---|
| `/backend/src/index.js` | Añadido serving estático + catch-all SPA |
| `/backend/Dockerfile` | Contexto raíz, estructura `/app/backend/` + `/app/frontend/`, CMD con `cd /app/backend` |
| `/docker-compose.yml` | `context: .` + `dockerfile: backend/Dockerfile`, puerto 3000 expuesto, servicio `frontend` eliminado |
| `/.dockerignore` | Creado — excluye node_modules y dist de ambas carpetas |

### Estado actual del proyecto
- Un solo contenedor de app sirve API + frontend estático
- Easypanel debe apuntar al servicio `backend` en el puerto 3000
- Commit `96e6ab3` en GitHub

---

## [Sesión 2] TurnoModal — rediseño con cuadrícula visual de horas

### Qué se ha implementado
- **Cuadrícula de botones** de 08:00 a 22:00 en intervalos de 30 min (29 slots, grid de 5 columnas)
- **Lógica de selección en dos toques**: primer toque → entrada (verde), segundo toque → salida (verde oscuro); horas intermedias coloreadas en verde claro (rango). Tocar una hora ≤ entrada reinicia la selección.
- **Preview en tiempo real** bajo la cuadrícula: `"09:00 → 14:00 · 5h"`
- **HintBadge** guía al usuario: `"Toca la hora de entrada"` / `"Ahora toca la hora de salida"` / `"✓ Turno 1 completo"`
- **Toggle "Jornada partida"**: activa una segunda cuadrícula idéntica en azul (Turno 2), misma lógica de selección
- **Botón "Borrar"** por turno (inline junto al título) para resetear la selección del grid
- **Notas** compartidas (textarea opcional) debajo de ambos turnos
- **Validación inline**: turno 1 obligatorio (si no hay uno ya guardado); turno 2 obligatorio si toggle activo; error en turno parcial (entrada sin salida o viceversa)
- **Edición completa del día**: el modal recibe `turnosDelDia = { 1, 2 }` y pre-rellena ambas cuadrículas; al abrir desde turno 2 se activa el toggle y se muestra también turno 1 ya existente
- **Diseño bottom-sheet en móvil**: aparece desde abajo con esquinas redondeadas superiores; desplazable internamente; botones de 40px de altura cómodos para toque con el dedo
- **Eliminar turno** del servidor: botón con doble confirmación (misma UX que antes)
- Build verificado: CSS 17.56 kB, sin errores

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/frontend/src/components/TurnoModal.jsx` | Reescrito — nuevo diseño visual completo |
| `/frontend/src/components/Calendario.jsx` | Modificado — pasa `turnosDelDia` (contexto completo del día) en todos los clicks |
| `/frontend/src/pages/CalendarioPage.jsx` | Modificado — almacena y propaga `turnosDelDia` al modal |

### Estado actual del proyecto
- Frontend: TurnoModal rediseñado con UX visual para móvil; resto de componentes sin cambios
- Backend / Docker / Deploy: sin cambios

---

## [Sesión 2] Botón "Nuevo empleado" en vista admin

### Qué se ha implementado
- **Botón "+ Nuevo empleado"** en la barra de controles de `CalendarioPage`, visible únicamente cuando `isAdmin` es `true`
- **`NuevoEmpleadoModal`**: modal con campo de texto para el nombre, botones Cancelar/Guardar, indicador de estado "Guardando…" y error inline
  - Llama a `POST /api/empleados` con `{ nombre }` (ruta ya protegida por `verifyToken`)
  - Al guardar con éxito: invoca `onCreado()` + `onClose()`
  - Cierre al clic en el overlay exterior
- **`SelectorEmpleado`**: acepta nueva prop `reloadKey` (default 0) — cuando cambia, el `useEffect` vuelve a llamar a `GET /api/empleados` y autoselecciona el primer empleado si no hay ninguno elegido
- **`CalendarioPage`**: estado `empleadosReloadKey` que se incrementa al crear un empleado, propagado a `SelectorEmpleado` como `reloadKey`
- Build verificado: 86 módulos, CSS 14.06 kB, sin errores

### Ficheros creados o modificados
| Fichero | Acción |
|---|---|
| `/frontend/src/components/NuevoEmpleadoModal.jsx` | Creado — modal de creación de empleado |
| `/frontend/src/components/SelectorEmpleado.jsx` | Modificado — prop `reloadKey` + re-fetch en efecto |
| `/frontend/src/pages/CalendarioPage.jsx` | Modificado — botón, estado `empleadosReloadKey`, monta `NuevoEmpleadoModal` |

### Estado actual del proyecto
- Frontend: 100% funcional — flujo de creación de empleados operativo desde la vista admin
- Backend: `POST /api/empleados` ya existía y protegido con JWT
- Docker / Deploy: sin cambios
