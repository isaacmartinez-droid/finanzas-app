# Autenticación y propiedad

La aplicación usa el SDK v4 de Auth0 para Next.js como proveedor de identidad. Auth0 conserva la sesión en cookies cifradas y `HttpOnly`; la aplicación no recibe ni almacena contraseñas.

## Configuración

Crear una **Regular Web Application** en Auth0 y guardar sus valores sólo en `.env.local` o en el gestor de secretos del despliegue:

```dotenv
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_SECRET=<64 caracteres hexadecimales>
APP_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

Registrar en Auth0, para desarrollo local:

```text
Allowed Callback URLs: http://localhost:3000/auth/callback
Allowed Logout URLs:   http://localhost:3000
Allowed Web Origins:   http://localhost:3000
```

Para cada entorno desplegado, usar su URL HTTPS exacta en esos tres campos. `AUTH0_SECRET` cifra las cookies de sesión y debe ser un valor aleatorio de 32 bytes, codificado como 64 caracteres hexadecimales; cambiarlo invalida las sesiones existentes.

En Windows sin OpenSSL, la guía de [desarrollo y pruebas](development-and-testing.md#auth0-local) incluye un comando PowerShell para generar el secreto.

## Límites de seguridad

- [`src/proxy.ts`](../src/proxy.ts) monta las rutas `/auth/*`, renueva sesiones y exige sesión para las páginas. Las APIs no se redirigen: cada handler debe autorizar explícitamente.
- En producción, si falta cualquier variable de Auth0, el proxy devuelve `503`; no existe un modo anónimo de reserva.
- En desarrollo sin credenciales, el proxy permite la demo mock. Esto no habilita API protegida: `GET /api/me` responde `503` hasta configurar Auth0.
- [`src/lib/current-user.ts`](../src/lib/current-user.ts) exige sesión, `sub`, correo y `email_verified === true`, y luego resuelve al usuario interno.
- El identificador de propiedad para repositorios financieros es `users.id`, obtenido desde el `sub` inmutable de Auth0. Nunca aceptar `userId` enviado por el cliente.
- Si un correo verificado ya pertenece a otra identidad local, la solicitud se rechaza con `409`; no se vinculan cuentas por correo de forma automática.

## Usuario local y migración

`users.auth0_subject` es único y obligatorio. La migración [`0001_petite_chameleon.sql`](../drizzle/0001_petite_chameleon.sql) etiqueta usuarios anteriores como `legacy:<uuid>` antes de activar la restricción. Esos registros no se enlazan automáticamente a un `sub` de Auth0: cualquier importación o vinculación futura debe ser un caso de uso autenticado y auditado.

`GET /api/me`, `GET/POST /api/accounts`, `PATCH /api/accounts/[accountId]` y `POST /api/ledger-transactions` resuelven o crean el propietario local usando una identidad de Auth0 verificada. Los futuros endpoints financieros deben usar `getCurrentUser()` y pasar solamente su `id` al repositorio.

## Sesión en la interfaz

El layout resuelve la sesión en servidor y pasa únicamente `displayName`, correo e iniciales a los componentes cliente. El encabezado y el menú de cuenta muestran ese perfil; en el menú existe el enlace **Cerrar sesión**, que navega a `/auth/logout`. En modo demo sin Auth0, se conserva explícitamente el perfil mock y no se muestra la opción de cierre de sesión.
