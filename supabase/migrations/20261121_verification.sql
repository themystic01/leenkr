-- Profile verification.
--
-- A creator asks for the check from the Verify tab: their social handles with
-- follower counts, plus the email the page belongs to. Only an operator can
-- approve or reject, and approving flips pages.verified — which the page guard
-- trigger keeps out of a creator's reach.

begin;

/* --------------------------- 1. the request ------------------------------ */

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  socials jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create index if not exists verification_requests_page_idx
  on public.verification_requests (page_id, created_at desc);

-- One open request per page; resubmitting replaces it.
create unique index if not exists verification_requests_pending_idx
  on public.verification_requests (page_id)
  where status = 'pending';

alter table public.verification_requests enable row level security;

drop policy if exists verification_requests_owner_read on public.verification_requests;
create policy verification_requests_owner_read on public.verification_requests
  for select
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists verification_requests_owner_insert on public.verification_requests;
create policy verification_requests_owner_insert on public.verification_requests
  for insert
  with check (
    owner_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.pages p
      where p.id = verification_requests.page_id and p.owner_id = auth.uid()
    )
  );

/* ------------------------- 2. creator side ------------------------------- */

-- The creator's latest request, or a bare "none" so the tab can draw itself.
create or replace function public.verification_me()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_page uuid;
  v_row jsonb;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;

  select id into v_page from public.pages where owner_id = auth.uid();
  if v_page is null then
    return jsonb_build_object('status', 'none', 'socials', '[]'::jsonb);
  end if;

  select jsonb_build_object(
      'id', r.id,
      'status', r.status,
      'email', r.email,
      'socials', r.socials,
      'note', r.note,
      'submittedAt', r.created_at,
      'reviewedAt', r.reviewed_at
    )
    into v_row
    from public.verification_requests r
    where r.page_id = v_page
    order by r.created_at desc
    limit 1;

  return coalesce(v_row, jsonb_build_object('status', 'none', 'socials', '[]'::jsonb));
end
$$;

-- The 25,000-follower rule is enforced here, not only in the browser. The
-- handles also become the page's social row, so the checklist on the public
-- page stays honest.
create or replace function public.verification_submit(p_email text, p_socials jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_page public.pages%rowtype;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id uuid;
  v_qualified boolean;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;

  if position('@' in v_email) < 2 or position('.' in v_email) = 0 then
    raise exception 'invalid_email';
  end if;

  if p_socials is null or jsonb_typeof(p_socials) <> 'array' or jsonb_array_length(p_socials) = 0 then
    raise exception 'socials_required';
  end if;

  select * into v_page from public.pages where owner_id = auth.uid();
  if not found then raise exception 'no_page'; end if;

  select exists (
    select 1
    from jsonb_array_elements(p_socials) entry
    where coalesce(trim(entry->>'handle'), '') <> ''
      and case
        when (entry->>'followers') ~ '^[0-9]{1,12}$'
          then (entry->>'followers')::bigint
        else 0
      end >= 25000
  ) into v_qualified;

  if not v_qualified then raise exception 'below_threshold'; end if;

  delete from public.verification_requests
    where page_id = v_page.id and status = 'pending';

  insert into public.verification_requests (page_id, owner_id, email, socials)
  values (v_page.id, auth.uid(), v_email, p_socials)
  returning id into v_id;

  delete from public.page_socials where page_id = v_page.id;
  insert into public.page_socials (page_id, platform, handle, position)
  select
    v_page.id,
    entry->>'platform',
    trim(entry->>'handle'),
    (ord - 1)::int
  from jsonb_array_elements(p_socials) with ordinality as rows(entry, ord)
  where coalesce(trim(entry->>'handle'), '') <> '';

  return jsonb_build_object('ok', true, 'id', v_id);
end
$$;

/* --------------------------- 3. operator side ---------------------------- */

create or replace function public.verification_admin(
  p_status text default 'pending',
  p_limit int default 50,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_total int;
  v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  with base as (
    select
      r.id,
      r.page_id as "pageId",
      p.username,
      p.name,
      p.verified,
      u.email as "ownerEmail",
      r.email,
      r.socials,
      r.status,
      r.note,
      r.created_at as "submittedAt",
      r.reviewed_at as "reviewedAt"
    from public.verification_requests r
    join public.pages p on p.id = r.page_id
    left join auth.users u on u.id = r.owner_id
  ), filtered as (
    select * from base b
    where coalesce(p_status, 'pending') = 'all' or b.status = p_status
  )
  select count(*) into v_total from filtered;

  with base as (
    select
      r.id,
      r.page_id as "pageId",
      p.username,
      p.name,
      p.verified,
      u.email as "ownerEmail",
      r.email,
      r.socials,
      r.status,
      r.note,
      r.created_at as "submittedAt",
      r.reviewed_at as "reviewedAt"
    from public.verification_requests r
    join public.pages p on p.id = r.page_id
    left join auth.users u on u.id = r.owner_id
  ), filtered as (
    select * from base b
    where coalesce(p_status, 'pending') = 'all' or b.status = p_status
  )
  select coalesce(jsonb_agg(to_jsonb(f) order by f."submittedAt" desc), '[]'::jsonb)
    into v_rows
    from (
      select * from filtered
      order by "submittedAt" desc
      limit v_limit offset v_offset
    ) f;

  return jsonb_build_object('total', v_total, 'rows', v_rows);
end
$$;

create or replace function public.verification_review(
  p_request uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.verification_requests%rowtype;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('approved', 'rejected') then raise exception 'invalid_status'; end if;

  select * into v_request from public.verification_requests where id = p_request;
  if not found then raise exception 'not_found'; end if;

  update public.verification_requests
    set status = p_status,
        note = nullif(trim(coalesce(p_note, '')), ''),
        reviewed_at = now(),
        reviewed_by = auth.uid()
    where id = p_request;

  if p_status = 'approved' then
    update public.pages set verified = true where id = v_request.page_id;
  end if;

  return jsonb_build_object('ok', true);
end
$$;

/* -------------------------------- 4. grants ------------------------------ */

revoke all on public.verification_requests from public, anon;
grant select, insert on public.verification_requests to authenticated;

revoke all on function public.verification_me() from public, anon;
revoke all on function public.verification_submit(text, jsonb) from public, anon;
revoke all on function public.verification_admin(text, int, int) from public, anon;
revoke all on function public.verification_review(uuid, text, text) from public, anon;

grant execute on function public.verification_me() to authenticated;
grant execute on function public.verification_submit(text, jsonb) to authenticated;
grant execute on function public.verification_admin(text, int, int) to authenticated;
grant execute on function public.verification_review(uuid, text, text) to authenticated;

commit;
