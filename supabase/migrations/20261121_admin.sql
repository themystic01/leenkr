-- Admin control panel.
--
-- Operators are listed in admin_users; every cross-creator read and write runs
-- through a security-definer RPC that refuses anyone who is not on that list.
-- The browser keeps using the anon key, and the service role never leaves
-- api/storage.js.

begin;

/* ------------------------------ 1. operators ----------------------------- */

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- No policies on purpose: the table is only reachable through is_admin().
revoke all on public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  )
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.admin_me()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return public.is_admin();
end
$$;

revoke all on function public.admin_me() from public, anon;
grant execute on function public.admin_me() to authenticated;

/* --------------------------- 2. moderation state ------------------------- */

alter table public.pages add column if not exists suspended_at timestamptz;
alter table public.pages add column if not exists suspended_reason text;

-- An owner can still edit their page, but verification and takedowns are set by
-- an operator only. Anything else silently keeps the stored value.
create or replace function public.pages_guard_privileged()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  new.verified := old.verified;
  new.suspended_at := old.suspended_at;
  new.suspended_reason := old.suspended_reason;
  return new;
end
$$;

drop trigger if exists pages_guard_privileged on public.pages;
create trigger pages_guard_privileged
  before update on public.pages
  for each row execute function public.pages_guard_privileged();

/* ------------------------- 3. suspended pages vanish --------------------- */

drop policy if exists pages_read on public.pages;
create policy pages_read on public.pages
  for select
  using ((published and suspended_at is null) or owner_id = auth.uid());

drop policy if exists page_products_read on public.page_products;
create policy page_products_read on public.page_products
  for select
  using (exists (
    select 1 from public.pages p
    where p.id = page_products.page_id
      and ((p.published and p.suspended_at is null) or p.owner_id = auth.uid())
  ));

drop policy if exists page_links_read on public.page_links;
create policy page_links_read on public.page_links
  for select
  using (exists (
    select 1 from public.pages p
    where p.id = page_links.page_id
      and ((p.published and p.suspended_at is null) or p.owner_id = auth.uid())
  ));

drop policy if exists page_socials_read on public.page_socials;
create policy page_socials_read on public.page_socials
  for select
  using (exists (
    select 1 from public.pages p
    where p.id = page_socials.page_id
      and ((p.published and p.suspended_at is null) or p.owner_id = auth.uid())
  ));

drop policy if exists page_connects_read on public.page_connects;
create policy page_connects_read on public.page_connects
  for select
  using (exists (
    select 1 from public.pages p
    where p.id = page_connects.page_id
      and ((p.published and p.suspended_at is null) or p.owner_id = auth.uid())
  ));

/* --------------------------- 4. checkout guard --------------------------- */

create or replace function public.purchase_product(p_product uuid, p_email text, p_name text, p_provider text default 'simulated')
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_product public.page_products%rowtype;
  v_page public.pages%rowtype;
  v_amount numeric(12,2);
  v_platform numeric(12,2);
  v_gateway numeric(12,2);
  v_order public.page_orders%rowtype;
begin
  select * into v_product from public.page_products where id = p_product;
  if not found then return jsonb_build_object('error','Product not found'); end if;

  select * into v_page from public.pages where id = v_product.page_id;
  if v_page.published is not true or v_page.suspended_at is not null then
    return jsonb_build_object('error','This page is not live');
  end if;

  if v_product.is_free then return jsonb_build_object('error','This product is free'); end if;
  if coalesce(trim(p_email),'') = '' or position('@' in p_email) = 0 then
    return jsonb_build_object('error','Enter a valid email');
  end if;

  v_amount := v_product.price;
  if v_amount <= 0 then return jsonb_build_object('error','This product has no price'); end if;

  v_platform := round(v_amount * 0.05, 2);
  v_gateway := least(round(v_amount * 0.015 + 100, 2), 2000);
  if v_gateway >= v_amount then v_gateway := round(v_amount * 0.015, 2); end if;

  insert into public.page_orders (
    page_id, product_id, buyer_email, buyer_name, amount, currency,
    platform_fee, gateway_fee, creator_net, provider, reference, status, paid_at
  ) values (
    v_product.page_id, v_product.id, lower(trim(p_email)), nullif(trim(p_name),''),
    v_amount, coalesce(v_product.currency,'NGN'), v_platform, v_gateway,
    greatest(v_amount - v_platform - v_gateway, 0), coalesce(p_provider,'simulated'),
    'LK-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)), 'paid', now()
  ) returning * into v_order;

  update public.page_products
    set purchase_count = purchase_count + 1
    where id = v_product.id;

  return jsonb_build_object(
    'order_id', v_order.id,
    'reference', v_order.reference,
    'download_token', v_order.download_token,
    'amount', v_order.amount,
    'currency', v_order.currency,
    'creator_net', v_order.creator_net
  );
end
$function$;

/* ----------------------------- 5. admin reads ---------------------------- */

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  return jsonb_build_object(
    'creators', (select count(*) from auth.users),
    'pages', (select count(*) from public.pages),
    'live', (select count(*) from public.pages where published and suspended_at is null),
    'draft', (select count(*) from public.pages where not published and suspended_at is null),
    'suspended', (select count(*) from public.pages where suspended_at is not null),
    'paidOrders', (select count(*) from public.page_orders where status = 'paid'),
    'gross', coalesce((select sum(amount) from public.page_orders where status = 'paid'), 0),
    'platformFees', coalesce((select sum(platform_fee) from public.page_orders where status = 'paid'), 0),
    'pendingPayouts', (select count(*) from public.payouts where status = 'pending'),
    'pendingPayoutAmount', coalesce((select sum(amount) from public.payouts where status = 'pending'), 0),
    'last7Orders', (select count(*) from public.page_orders where status = 'paid' and paid_at >= now() - interval '7 days'),
    'last7Gross', coalesce((select sum(amount) from public.page_orders where status = 'paid' and paid_at >= now() - interval '7 days'), 0)
  );
end
$$;

create or replace function public.admin_pages(
  p_search text default null,
  p_state text default 'all',
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_total int;
  v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  with base as (
    select
      p.id,
      p.username,
      p.name,
      p.owner_id as "ownerId",
      u.email as "ownerEmail",
      p.published,
      p.verified,
      p.suspended_at as "suspendedAt",
      p.suspended_reason as "suspendedReason",
      p.created_at as "createdAt",
      (select count(*) from public.page_products pp where pp.page_id = p.id) as products,
      (select count(*) from public.page_orders o where o.page_id = p.id and o.status = 'paid') as sales,
      coalesce((select sum(o.amount) from public.page_orders o where o.page_id = p.id and o.status = 'paid'), 0) as gmv
    from public.pages p
    left join auth.users u on u.id = p.owner_id
  ), filtered as (
    select * from base b
    where (
      coalesce(trim(p_search), '') = ''
      or b.username ilike '%' || trim(p_search) || '%'
      or coalesce(b.name, '') ilike '%' || trim(p_search) || '%'
      or coalesce(b."ownerEmail", '') ilike '%' || trim(p_search) || '%'
    )
    and (
      coalesce(p_state, 'all') = 'all'
      or (p_state = 'live' and b.published and b."suspendedAt" is null)
      or (p_state = 'draft' and not b.published and b."suspendedAt" is null)
      or (p_state = 'suspended' and b."suspendedAt" is not null)
      or (p_state = 'unverified' and not b.verified)
    )
  )
  select count(*) into v_total from filtered;

  with base as (
    select
      p.id,
      p.username,
      p.name,
      p.owner_id as "ownerId",
      u.email as "ownerEmail",
      p.published,
      p.verified,
      p.suspended_at as "suspendedAt",
      p.suspended_reason as "suspendedReason",
      p.created_at as "createdAt",
      (select count(*) from public.page_products pp where pp.page_id = p.id) as products,
      (select count(*) from public.page_orders o where o.page_id = p.id and o.status = 'paid') as sales,
      coalesce((select sum(o.amount) from public.page_orders o where o.page_id = p.id and o.status = 'paid'), 0) as gmv
    from public.pages p
    left join auth.users u on u.id = p.owner_id
  ), filtered as (
    select * from base b
    where (
      coalesce(trim(p_search), '') = ''
      or b.username ilike '%' || trim(p_search) || '%'
      or coalesce(b.name, '') ilike '%' || trim(p_search) || '%'
      or coalesce(b."ownerEmail", '') ilike '%' || trim(p_search) || '%'
    )
    and (
      coalesce(p_state, 'all') = 'all'
      or (p_state = 'live' and b.published and b."suspendedAt" is null)
      or (p_state = 'draft' and not b.published and b."suspendedAt" is null)
      or (p_state = 'suspended' and b."suspendedAt" is not null)
      or (p_state = 'unverified' and not b.verified)
    )
  )
  select coalesce(jsonb_agg(to_jsonb(f) order by f."createdAt" desc), '[]'::jsonb)
    into v_rows
    from (
      select * from filtered
      order by "createdAt" desc
      limit v_limit offset v_offset
    ) f;

  return jsonb_build_object('total', v_total, 'rows', v_rows);
end
$$;

create or replace function public.admin_orders(
  p_search text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_total int;
  v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  with base as (
    select
      o.id,
      o.product_id as "productId",
      pp.title as "productTitle",
      p.username as "creatorUsername",
      u.email as "creatorEmail",
      o.buyer_email as "buyerEmail",
      o.buyer_name as "buyerName",
      o.amount,
      o.currency,
      o.platform_fee as "platformFee",
      o.gateway_fee as "gatewayFee",
      o.creator_net as "creatorNet",
      o.provider,
      o.reference,
      o.status,
      o.paid_at as "paidAt",
      o.created_at as "createdAt"
    from public.page_orders o
    join public.page_products pp on pp.id = o.product_id
    join public.pages p on p.id = o.page_id
    left join auth.users u on u.id = p.owner_id
  ), filtered as (
    select * from base b
    where (
      coalesce(trim(p_search), '') = ''
      or b."buyerEmail" ilike '%' || trim(p_search) || '%'
      or b.reference ilike '%' || trim(p_search) || '%'
      or coalesce(b."productTitle", '') ilike '%' || trim(p_search) || '%'
      or coalesce(b."creatorUsername", '') ilike '%' || trim(p_search) || '%'
      or coalesce(b."creatorEmail", '') ilike '%' || trim(p_search) || '%'
    )
  )
  select count(*) into v_total from filtered;

  with base as (
    select
      o.id,
      o.product_id as "productId",
      pp.title as "productTitle",
      p.username as "creatorUsername",
      u.email as "creatorEmail",
      o.buyer_email as "buyerEmail",
      o.buyer_name as "buyerName",
      o.amount,
      o.currency,
      o.platform_fee as "platformFee",
      o.gateway_fee as "gatewayFee",
      o.creator_net as "creatorNet",
      o.provider,
      o.reference,
      o.status,
      o.paid_at as "paidAt",
      o.created_at as "createdAt"
    from public.page_orders o
    join public.page_products pp on pp.id = o.product_id
    join public.pages p on p.id = o.page_id
    left join auth.users u on u.id = p.owner_id
  ), filtered as (
    select * from base b
    where (
      coalesce(trim(p_search), '') = ''
      or b."buyerEmail" ilike '%' || trim(p_search) || '%'
      or b.reference ilike '%' || trim(p_search) || '%'
      or coalesce(b."productTitle", '') ilike '%' || trim(p_search) || '%'
      or coalesce(b."creatorUsername", '') ilike '%' || trim(p_search) || '%'
      or coalesce(b."creatorEmail", '') ilike '%' || trim(p_search) || '%'
    )
  )
  select coalesce(jsonb_agg(to_jsonb(f) order by f."createdAt" desc), '[]'::jsonb)
    into v_rows
    from (
      select * from filtered
      order by "createdAt" desc
      limit v_limit offset v_offset
    ) f;

  return jsonb_build_object('total', v_total, 'rows', v_rows);
end
$$;

create or replace function public.admin_payouts(
  p_status text default 'pending',
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_total int;
  v_rows jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  with base as (
    select
      w.id,
      w.owner_id as "ownerId",
      u.email as "creatorEmail",
      p.username as "creatorUsername",
      w.amount,
      w.currency,
      w.status,
      w.provider,
      w.reference,
      w.note,
      w.requested_at as "requestedAt",
      w.processed_at as "processedAt",
      a.bank_name as "bankName",
      a.account_number as "accountNumber",
      a.account_name as "accountName"
    from public.payouts w
    left join auth.users u on u.id = w.owner_id
    left join public.pages p on p.owner_id = w.owner_id
    left join public.payout_accounts a on a.id = w.account_id
  ), filtered as (
    select * from base b
    where coalesce(p_status, 'pending') = 'all' or b.status = p_status
  )
  select count(*) into v_total from filtered;

  with base as (
    select
      w.id,
      w.owner_id as "ownerId",
      u.email as "creatorEmail",
      p.username as "creatorUsername",
      w.amount,
      w.currency,
      w.status,
      w.provider,
      w.reference,
      w.note,
      w.requested_at as "requestedAt",
      w.processed_at as "processedAt",
      a.bank_name as "bankName",
      a.account_number as "accountNumber",
      a.account_name as "accountName"
    from public.payouts w
    left join auth.users u on u.id = w.owner_id
    left join public.pages p on p.owner_id = w.owner_id
    left join public.payout_accounts a on a.id = w.account_id
  ), filtered as (
    select * from base b
    where coalesce(p_status, 'pending') = 'all' or b.status = p_status
  )
  select coalesce(jsonb_agg(to_jsonb(f) order by f."requestedAt" desc), '[]'::jsonb)
    into v_rows
    from (
      select * from filtered
      order by "requestedAt" desc
      limit v_limit offset v_offset
    ) f;

  return jsonb_build_object('total', v_total, 'rows', v_rows);
end
$$;

/* ---------------------------- 6. admin writes ---------------------------- */

create or replace function public.admin_set_page(
  p_page uuid,
  p_published boolean default null,
  p_verified boolean default null,
  p_suspend boolean default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_page public.pages%rowtype;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  select * into v_page from public.pages where id = p_page;
  if not found then raise exception 'not_found'; end if;

  update public.pages
    set published = coalesce(p_published, published),
        verified = coalesce(p_verified, verified),
        suspended_at = case
          when coalesce(p_suspend, suspended_at is not null)
            then coalesce(suspended_at, now())
          else null
        end,
        suspended_reason = case
          when coalesce(p_suspend, suspended_at is not null)
            then nullif(trim(coalesce(p_reason, suspended_reason, '')), '')
          else null
        end
    where id = p_page;

  return jsonb_build_object('ok', true);
end
$$;

create or replace function public.admin_set_payout(
  p_payout uuid,
  p_status text,
  p_reference text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payout public.payouts%rowtype;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('paid', 'rejected') then raise exception 'invalid_status'; end if;

  select * into v_payout from public.payouts where id = p_payout;
  if not found then raise exception 'not_found'; end if;

  update public.payouts
    set status = p_status,
        reference = coalesce(nullif(trim(coalesce(p_reference, '')), ''), reference),
        note = coalesce(nullif(trim(coalesce(p_note, '')), ''), note),
        processed_at = now()
    where id = p_payout;

  return jsonb_build_object('ok', true);
end
$$;

/* -------------------------------- 7. grants ------------------------------ */

revoke all on function public.admin_stats() from public, anon;
revoke all on function public.admin_pages(text, text, int, int) from public, anon;
revoke all on function public.admin_orders(text, int, int) from public, anon;
revoke all on function public.admin_payouts(text, int, int) from public, anon;
revoke all on function public.admin_set_page(uuid, boolean, boolean, boolean, text) from public, anon;
revoke all on function public.admin_set_payout(uuid, text, text, text) from public, anon;

grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_pages(text, text, int, int) to authenticated;
grant execute on function public.admin_orders(text, int, int) to authenticated;
grant execute on function public.admin_payouts(text, int, int) to authenticated;
grant execute on function public.admin_set_page(uuid, boolean, boolean, boolean, text) to authenticated;
grant execute on function public.admin_set_payout(uuid, text, text, text) to authenticated;

/* -------------------------------- 8. seed -------------------------------- */

-- The nzaghacollins page owner is the only operator.
insert into public.admin_users (user_id, note)
select owner_id, 'Owner'
from public.pages
where username = 'nzaghacollins'
on conflict (user_id) do update set note = excluded.note;

commit;
