-- Ilha Zero: progresso na nuvem (estatísticas e configurações). Rodar uma vez no SQL Editor do Supabase.
-- Cada jogador só lê e grava a própria linha.
create table if not exists public.iz_saves (
  id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.iz_saves enable row level security;
drop policy if exists "iz own read" on public.iz_saves;
drop policy if exists "iz own insert" on public.iz_saves;
drop policy if exists "iz own update" on public.iz_saves;
create policy "iz own read" on public.iz_saves for select to authenticated using (id = auth.uid());
create policy "iz own insert" on public.iz_saves for insert to authenticated with check (id = auth.uid());
create policy "iz own update" on public.iz_saves for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select, insert, update on public.iz_saves to authenticated;
