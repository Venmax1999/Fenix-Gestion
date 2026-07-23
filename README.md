# Raíces Tucumán · Sistema de Gestión
## Powered by Supabase + Vercel

---

## 🗄️ PASO 1: Configurar Supabase

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Abrir tu proyecto → **SQL Editor**
3. Pegar y ejecutar el contenido de `supabase/migrations/001_initial_schema.sql`
4. Crear usuarios en **Authentication → Users → Add user**:
   - Email: `admin@raices.com` / Password: `admin1234` (o el que prefieras)
   - Email: `vendedor@raices.com` / Password: `vendedor1234`

> **Opcional**: Para asignar roles, editar el usuario en Authentication → Users → Edit → User Metadata:
> ```json
> { "display_name": "Administrador", "role": "admin" }
> ```

---

## 💻 PASO 2: Correr en local

```bash
cd client
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

## 🚀 PASO 3: Deploy en Vercel

1. Subir el directorio `client/` a un repositorio GitHub
2. En [vercel.com](https://vercel.com) → New Project → importar repo
3. **Root Directory**: `client`
4. **Environment Variables** (en Vercel → Settings → Environment Variables):
   ```
   VITE_SUPABASE_URL    = https://vfygmbqwvhocndnwixgq.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_0Y5hiqevIceiSKOt_0RacQ_2sHxa3bL
   ```
5. Deploy → ¡listo!

---

## 🏗️ Arquitectura

```
Frontend (Vercel)
  └── @supabase/supabase-js
       ├── CRUD directo → supabase.from('tabla')
       ├── Transacciones → supabase.rpc('crear_venta' | 'anular_venta' | 'ajustar_stock')
       └── Auth real → supabase.auth.signInWithPassword()

Supabase (Backend completo)
  ├── PostgreSQL - Mismas tablas que gestion-pro
  ├── Row Level Security - Solo usuarios autenticados
  └── Database Functions (SQL/PL-pgSQL)
       ├── get_dashboard()    - KPIs del dashboard
       ├── crear_venta()      - Transacción completa de venta
       ├── anular_venta()     - Anulación + restauro de stock
       ├── ajustar_stock()    - Ajuste manual de inventario
       └── next_sku()         - Auto-generador de SKU
```

---

## 📋 Módulos

| Módulo | Descripción |
|--------|-------------|
| 📊 Dashboard | KPIs: ventas del día/mes, ticket promedio, top productos, stock crítico |
| 🛒 Nueva Venta | Buscador dinámico, carrito, IVA automático, comprobante imprimible |
| 📋 Ventas | Historial con filtros, PDF de comprobante, anulación con restauro de stock |
| 📦 Productos | ABM completo, SKU auto, categorías, alertas de stock crítico |
| 👥 Clientes | ABM con CUIT, cuenta corriente integrada |
| 🏭 Proveedores | ABM completo |
| 📚 Kárdex | Historial de movimientos con filtros, ajustes manuales de stock |

---

## 🔧 Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon/publishable) de Supabase |

> ⚠️ El archivo `.env` está incluido solo para desarrollo local. **No subir a git.**
> En producción, configurar las variables en el panel de Vercel.

---

## 📁 Estructura del Proyecto

```
raices-tucuman/
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   ← Ejecutar en Supabase SQL Editor
└── client/                          ← Frontend (deploy en Vercel)
    ├── .env                         ← Vars locales (no subir a git)
    ├── src/
    │   ├── supabaseClient.js        ← API layer (reemplaza api.js)
    │   ├── contexts/AuthContext.jsx ← Auth con Supabase Auth
    │   ├── components/
    │   └── pages/
```
