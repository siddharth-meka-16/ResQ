-- ============================================================
-- ResQ — Official accounts require a .gov.in email
-- Run in Supabase SQL Editor AFTER 0001..0006
-- ============================================================

-- Hard server-side enforcement: OPERATOR / FIELD_TEAM / SHELTER_MANAGER
-- signups must use an exact @gov.in address (e.g. example@gov.in).
-- CITIZEN may use any email. Raising inside the trigger aborts the
-- auth.users insert, so signUp fails with this message.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_domain text;
begin
  if coalesce(new.raw_user_meta_data ->> 'role', 'CITIZEN') in
     ('OPERATOR', 'FIELD_TEAM', 'SHELTER_MANAGER') then
    v_domain := lower(
      substr(
        coalesce(new.email, ''),
        position('@' in coalesce(new.email, '')) + 1
      )
    );
    if v_domain is null or v_domain = '' or v_domain <> 'gov.in' then
      raise exception 'Official accounts must register with a government email like name@gov.in';
    end if;
  end if;

  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'Citizen'),
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'CITIZEN')
  );
  return new;
end;
$$;
