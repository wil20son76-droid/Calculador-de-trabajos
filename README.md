# Offert & Kalkyl — Presupuestos para reformas, construcción y pintura

Aplicación web para crear presupuestos y cotizaciones de trabajos de construcción, pintura y
reformas, pensada para una empresa de reformas en Suecia pero flexible para cualquier tipo de
trabajo, precio o material.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS 4**
- **PostgreSQL + Prisma ORM**
- **NextAuth (Auth.js) v5** — autenticación por email/contraseña
- **@react-pdf/renderer** — generación de PDF de la oferta
- **@dnd-kit** — reordenar trabajos por drag & drop

## Arquitectura

```
src/
  app/
    (app)/            Rutas protegidas: dashboard, clientes, presupuestos, precios,
                       materiales, plantillas, proyectos, configuración (con sidebar)
    api/               Route handlers (REST): customers, quotes, price-list, materials,
                       templates, company, auth
    login/             Página de login pública
  components/
    quotes/            Editor de presupuesto (el componente central de la app)
    customers/ materials/ price-list/ templates/ settings/  CRUD de cada sección
    layout/ ui/ shared/  Componentes reutilizables
  lib/
    calc/              Motor de cálculo puro (sin DB ni UI) — mano de obra, materiales,
                       otros costes, descuentos, moms, ROT
    quotes/            Adaptadores entre Prisma y el motor de cálculo, generación de
                       número de presupuesto, cacheo de totales
    pdf/               Documento PDF de la oferta
    auth/              Configuración de NextAuth y helpers de sesión
    validation/        Esquemas Zod para cada entidad
    db/                Cliente Prisma (singleton)
prisma/
  schema.prisma        Esquema completo de la base de datos
  seed.ts              Datos de ejemplo (empresa, categorías, precios, materiales,
                       plantillas, clientes y 2 presupuestos demo)
```

El **motor de cálculo** (`src/lib/calc/engine.ts`) es la única fuente de verdad para los
totales: es código puro (sin dependencias de Prisma ni de React), se usa tanto en el
servidor (al guardar un presupuesto, se cachean los totales en la base de datos) como en el
cliente (para mostrar los totales en tiempo real mientras se edita). Los porcentajes de
moms/IVA y de ROT-avdrag **nunca están fijados en el código**: se configuran por empresa
(`Company.vatRatePercent`, `Company.rotPercent`) y quedan además congelados por presupuesto
(snapshot) para que cambios futuros en la configuración no alteren ofertas ya emitidas.

## Puesta en marcha

### 1. Base de datos

Necesitas una base de datos PostgreSQL. Copia `.env.example` a `.env` y ajusta `DATABASE_URL`:

```bash
cp .env.example .env
```

### 2. Instalar dependencias y preparar la base de datos

```bash
npm install
npm run db:migrate   # aplica las migraciones
npm run db:seed      # datos de ejemplo: empresa, categorías, precios, materiales,
                      # plantillas, clientes y 2 presupuestos demo
```

### 3. Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Usuario de demostración:

```
Email: admin@reformas.se
Contraseña: demo1234
```

### 4. Build de producción

```bash
npm run build
npm run start
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Ejecuta `prisma/seed.ts` |
| `npm run db:studio` | Prisma Studio (explorar la base de datos) |

## Notas de diseño

- **ROT-avdrag**: se calcula únicamente sobre el importe de mano de obra (después de
  descuentos), nunca sobre materiales u otros costes. El porcentaje y el interruptor
  ROT sí/no son configurables por empresa y quedan fijados en cada presupuesto al crearlo.
- **Coste interno y beneficio** (sección "solo interno" del resumen): nunca se envía al
  PDF del cliente. El componente de PDF ni siquiera recibe esos campos.
- **Visibilidad del PDF**: cada presupuesto tiene interruptores independientes para mostrar
  horas, precio/hora, materiales individuales, precio de materiales, precio unitario o solo
  el total por trabajo.
- **Autoguardado**: el editor de presupuestos guarda automáticamente 1 segundo después del
  último cambio (debounce) mediante `PATCH /api/quotes/[id]`, que recalcula y cachea los
  totales en el servidor (los totales nunca se calculan "solo en el frontend").
- **Multiidioma**: la interfaz está en español y las ofertas en PDF usan encabezados en
  sueco (Offert, Kund, Arbete, Moms, ROT-avdrag...), como es habitual en una oferta comercial
  sueca. `Company.locale` y los campos `nameSv` en la biblioteca de trabajos dejan preparada
  la base para añadir más idiomas.
