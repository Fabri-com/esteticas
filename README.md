# Estética Web (Next.js + Supabase)

Aplicación web completa para estética con sitio público, reservas sin login y panel admin.

## Stack
- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- Supabase (Postgres + Auth + RLS)
- Zod para validaciones

## Estructura
- /app: páginas públicas y admin
- /app/api: endpoints (Route Handlers)
- /lib: utilidades (supabase, phone, whatsapp)
- /supabase/migrations: SQL de tablas, RLS y funciones

## Requisitos
- Node.js 18+
- Una cuenta y proyecto en Supabase

## Variables de entorno
Crea un archivo `.env.local` a partir de `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=... // URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=... // anon key
SUPABASE_SERVICE_ROLE_KEY=... // opcional (solo server si lo necesitas)
BUSINESS_WHATSAPP_PHONE=549XXXXXXXXX // guardar solo números, con 54 al inicio
ADMIN_EMAIL=tu-admin@dominio.com // email del admin (opcional pero recomendado)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Instalación
```
npm install
```

## Migraciones SQL (en Supabase)
1. Abre Supabase Studio > SQL editor.
2. Copia el contenido de `supabase/migrations/001_init.sql` y ejecútalo.
   - Crea tablas: services, customers, appointments, availability_rules, blocked_times
   - Activa RLS + políticas
   - Funciones: `check_no_overlap` y `cleanup_expired_pending`

## Datos iniciales (opcional)
- Inserta algunos servicios para probar en la tabla `services`.
- Configura reglas de disponibilidad y bloqueos desde el panel admin después.

## Ejecutar en local
```
npm run dev
```
Abre http://localhost:3000

Rutas principales:
- `/` home
- `/services` catálogo público
- `/booking` reservas sin login (crea `appointments` en estado `pending_whatsapp` y redirige a WhatsApp)
- `/academy` info + CTA WhatsApp
- `/admin/login` login por magic link (Supabase Auth)
- `/admin` agenda del día (cambia estado) + botón "Limpiar pendientes" (expira `pending_whatsapp`)
- `/admin/services` CRUD de servicios

Nota: El acceso admin se restringe por email usando `ADMIN_EMAIL` (además de estar autenticado). Las políticas RLS permiten acceso completo a `authenticated`; el filtro real de admin se hace en UI/acciones.

## Flujo de reservas
- Selecciona servicio y fecha/hora
- Completa datos (nombre, teléfono, email opcional, notas)
- Al enviar, se crea `appointment` con `status = pending_whatsapp` y `expires_at = now() + 10m`
- Se abre WhatsApp al número del negocio con mensaje prellenado
- No se confirma automáticamente: el admin debe mover el estado a `confirmed`

Prevención de doble reserva:
- Trigger `trg_no_overlap` evita solapamientos con citas `confirmed` o `pending_whatsapp` no expiradas.

Expiración de pendientes:
- Botón "Limpiar pendientes" en `/admin` llama a `cleanup_expired_pending()` para marcar como `cancelled` las vencidas.

## Deploy en Vercel
1. Sube el repo a GitHub.
2. En Vercel, importa el proyecto.
3. Configura las variables de entorno como en `.env.local`.
4. Deploy. Asegúrate de definir `NEXT_PUBLIC_SITE_URL` con tu dominio de producción.

## Notas
- Teléfonos se normalizan a formato Argentina guardando solo números y prefijo `54`.
- Buffer inicial de 10 min en creación de turnos; se hará configurable en `/admin/settings` en una iteración posterior.
- La lectura pública de `services` está limitada a `is_active = true` por RLS.

## Próximos pasos sugeridos
- Vista de calendario por día/semana en `/admin`
- Configuración de horarios y buffer en `/admin/settings`
- Slots de disponibilidad generados dinámicamente con `availability_rules` y `blocked_times`
