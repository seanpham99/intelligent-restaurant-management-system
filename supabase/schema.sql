-- Intelligent Restaurant Management System – Supabase/PostgreSQL Schema
-- Run this in the Supabase SQL editor to initialize all tables.

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
create table if not exists public.users (
    id          uuid primary key default uuid_generate_v4(),
    email       text unique not null,
    full_name   text not null,
    role        text not null check (role in ('customer', 'kitchen_staff', 'manager')),
    is_active   boolean not null default true,
    created_at  timestamptz not null default now()
);

-- ─── Menu Items ───────────────────────────────────────────────────────────────
create table if not exists public.menu_items (
    id                          uuid primary key default uuid_generate_v4(),
    name                        text not null,
    description                 text,
    price                       numeric(10, 2) not null check (price >= 0),
    category                    text not null check (category in ('drink', 'appetizer', 'main', 'dessert')),
    estimated_cook_time_seconds integer not null default 0 check (estimated_cook_time_seconds >= 0),
    is_available                boolean not null default true,
    created_at                  timestamptz not null default now()
);

-- ─── Orders ──────────────────────────────────────────────────────────────────
create table if not exists public.orders (
    id             uuid primary key default uuid_generate_v4(),
    table_number   integer not null check (table_number >= 1),
    status         text not null default 'pending'
                       check (status in ('pending', 'in_progress', 'ready', 'delivered', 'cancelled')),
    priority_score numeric(12, 4) not null default 0,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- ─── Order Items ─────────────────────────────────────────────────────────────
create table if not exists public.order_items (
    id                          uuid primary key default uuid_generate_v4(),
    order_id                    uuid not null references public.orders(id) on delete cascade,
    menu_item_id                uuid not null references public.menu_items(id),
    menu_item_name              text not null,
    category                    text not null check (category in ('drink', 'appetizer', 'main', 'dessert')),
    quantity                    integer not null check (quantity >= 1),
    notes                       text,
    unit_price                  numeric(10, 2) not null,
    estimated_cook_time_seconds integer not null default 0
);

-- ─── Ingredients ─────────────────────────────────────────────────────────────
create table if not exists public.ingredients (
    id                  uuid primary key default uuid_generate_v4(),
    name                text not null,
    unit                text not null,
    current_quantity    numeric(12, 4) not null default 0 check (current_quantity >= 0),
    low_stock_threshold numeric(12, 4) not null default 0 check (low_stock_threshold >= 0),
    updated_at          timestamptz not null default now()
);

-- ─── Inventory Alerts ────────────────────────────────────────────────────────
create table if not exists public.inventory_alerts (
    id            uuid primary key default uuid_generate_v4(),
    alert_type    text not null check (alert_type in ('low_stock', 'temperature_breach')),
    message       text not null,
    ingredient_id uuid references public.ingredients(id),
    sensor_id     text,
    resolved      boolean not null default false,
    created_at    timestamptz not null default now()
);

-- ─── Sensor Readings (time-series log) ───────────────────────────────────────
create table if not exists public.sensor_readings (
    id          bigserial primary key,
    sensor_id   text not null,
    sensor_type text not null,
    value       numeric(12, 4) not null,
    unit        text not null,
    recorded_at timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_orders_status        on public.orders(status);
create index if not exists idx_orders_created_at    on public.orders(created_at);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_sensor_readings_time on public.sensor_readings(recorded_at desc);

-- ─── Realtime – enable for live UI updates ────────────────────────────────────
-- Run in Supabase Dashboard → Database → Replication to add these tables.
-- Or uncomment:
-- alter publication supabase_realtime add table public.orders;
-- alter publication supabase_realtime add table public.inventory_alerts;

-- ─── Row-Level Security (basic example) ──────────────────────────────────────
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.menu_items enable row level security;
alter table public.ingredients enable row level security;
alter table public.inventory_alerts enable row level security;

-- Allow all authenticated users to read menu items
create policy "Menu items are publicly readable"
    on public.menu_items for select
    using (true);

-- Allow authenticated users to insert orders
create policy "Authenticated users can place orders"
    on public.orders for insert
    with check (auth.role() = 'authenticated');

-- Allow all authenticated users to read orders
create policy "Authenticated users can read orders"
    on public.orders for select
    using (auth.role() = 'authenticated');

-- Kitchen staff and managers can update orders
create policy "Kitchen staff can update orders"
    on public.orders for update
    using (auth.role() = 'authenticated');
