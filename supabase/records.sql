-- Ranking online do Deep Spear. Rodar uma vez no SQL Editor do Supabase.
-- Cada jogador tem 1 linha por (tipo, espécie, semana); o valor só pode subir.
create table if not exists public.records (
  uid uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('week', 'fish', 'depth')),
  species text not null default '',
  week text not null check (week ~ '^\d{4}-S\d{2}$'),
  region text not null default 'cv',
  name text not null default 'Mergulhador' check (char_length(name) <= 24),
  value real not null check (value >= 0 and value < 20000),
  updated_at timestamptz not null default now(),
  primary key (uid, kind, species, week)
);
-- limites realistas contra trapaça grosseira
alter table public.records drop constraint if exists records_sane;
alter table public.records add constraint records_sane check (
  (kind = 'fish' and value <= 400) or (kind = 'depth' and value <= 120) or (kind = 'week' and value <= 15000));

alter table public.records enable row level security;
drop policy if exists "records read" on public.records;
drop policy if exists "records insert own" on public.records;
drop policy if exists "records update own" on public.records;
create policy "records read" on public.records for select to authenticated using (true);
create policy "records insert own" on public.records for insert to authenticated with check (uid = auth.uid());
create policy "records update own" on public.records for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());

-- nunca deixa um recorde baixar
create or replace function public.records_keep_max() returns trigger language plpgsql as $$
begin
  new.value := greatest(old.value, new.value);
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists records_keep_max on public.records;
create trigger records_keep_max before update on public.records for each row execute function public.records_keep_max();

create index if not exists records_board on public.records (kind, species, week, value desc);
grant select, insert, update on public.records to authenticated;
