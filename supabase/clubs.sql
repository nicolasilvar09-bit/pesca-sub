-- Clubes de pesca do Deep Spear. Rodar uma vez no SQL Editor do Supabase (depois do records.sql).
-- Cada jogador está em no máximo 1 clube; um clube tem até 20 membros. O ranking semanal de clubes
-- soma o "Campeão da semana" (records, kind = 'week') de todos os membros.
create table if not exists public.clubs (
  id text primary key check (id ~ '^[A-Z0-9]{6}$'),
  name text not null check (char_length(name) between 2 and 24),
  emblem text not null default '🐟' check (char_length(emblem) <= 4),
  color text not null default '#2fd0c0' check (color ~ '^#[0-9a-fA-F]{6}$'),
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.club_members (
  uid uuid primary key default auth.uid() references auth.users on delete cascade,
  club text not null references public.clubs on delete cascade,
  name text not null default 'Mergulhador' check (char_length(name) <= 24),
  joined_at timestamptz not null default now()
);
create index if not exists club_members_club on public.club_members (club);

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
drop policy if exists "clubs read" on public.clubs;
drop policy if exists "clubs create" on public.clubs;
drop policy if exists "clubs edit own" on public.clubs;
drop policy if exists "clubs delete own" on public.clubs;
create policy "clubs read" on public.clubs for select to authenticated using (true);
create policy "clubs create" on public.clubs for insert to authenticated with check (owner = auth.uid());
create policy "clubs edit own" on public.clubs for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy "clubs delete own" on public.clubs for delete to authenticated using (owner = auth.uid());
drop policy if exists "members read" on public.club_members;
drop policy if exists "members join" on public.club_members;
drop policy if exists "members change own" on public.club_members;
drop policy if exists "members leave" on public.club_members;
create policy "members read" on public.club_members for select to authenticated using (true);
create policy "members join" on public.club_members for insert to authenticated with check (uid = auth.uid());
create policy "members change own" on public.club_members for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());
create policy "members leave" on public.club_members for delete to authenticated using (uid = auth.uid());

-- no máximo 20 por clube
create or replace function public.club_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.club_members where club = new.club and uid <> new.uid) >= 20 then
    raise exception 'clube cheio';
  end if;
  return new;
end $$;
drop trigger if exists club_limit on public.club_members;
create trigger club_limit before insert or update on public.club_members for each row execute function public.club_limit();

-- ranking semanal dos clubes
create or replace view public.club_week with (security_invoker = true) as
  select m.club, r.week, round(sum(r.value)::numeric, 1) as total, count(*) as n
  from public.records r join public.club_members m on m.uid = r.uid
  where r.kind = 'week' group by m.club, r.week;

grant select, insert, update, delete on public.clubs, public.club_members to authenticated;
grant select on public.club_week to authenticated;
