create or replace function public.roadmap_reorder_item(
  p_item_id uuid,
  p_track_id uuid,
  p_status text,
  p_target_index integer,
  p_actor text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.roadmap_items%rowtype;
  v_source_key text;
  v_dest_key text;
  v_ids uuid[];
  v_source_ids uuid[];
  v_target_index integer;
  v_id uuid;
  v_position integer;
begin
  select *
    into v_current
  from public.roadmap_items
  where id = p_item_id;

  if not found then
    raise exception 'roadmap item not found';
  end if;

  v_source_key := v_current.track_id::text || ':' || v_current.status;
  v_dest_key := p_track_id::text || ':' || p_status;

  if v_source_key <= v_dest_key then
    perform pg_advisory_xact_lock(hashtextextended(v_source_key, 0));
    if v_dest_key <> v_source_key then
      perform pg_advisory_xact_lock(hashtextextended(v_dest_key, 0));
    end if;
  else
    perform pg_advisory_xact_lock(hashtextextended(v_dest_key, 0));
    perform pg_advisory_xact_lock(hashtextextended(v_source_key, 0));
  end if;

  select coalesce(array_agg(id order by position), '{}')
    into v_ids
  from public.roadmap_items
  where track_id = p_track_id
    and status = p_status
    and archived_at is null
    and id <> p_item_id;

  v_target_index := greatest(0, least(p_target_index, coalesce(array_length(v_ids, 1), 0)));
  v_ids := array_append(v_ids[1:v_target_index], p_item_id) || v_ids[v_target_index + 1:coalesce(array_length(v_ids, 1), 0)];

  v_position := 0;
  foreach v_id in array v_ids loop
    update public.roadmap_items
      set track_id = p_track_id,
          status = p_status,
          position = -1000000 - v_position,
          updated_by = p_actor,
          updated_at = now(),
          completed_at = case
            when v_id = p_item_id and p_status = 'completed' then coalesce(v_current.completed_at, now())
            when v_id = p_item_id then null
            else completed_at
          end
    where id = v_id;
    v_position := v_position + 1;
  end loop;

  v_position := 0;
  foreach v_id in array v_ids loop
    update public.roadmap_items
      set position = v_position,
          updated_by = p_actor,
          updated_at = now()
    where id = v_id;
    v_position := v_position + 1;
  end loop;

  if v_current.track_id <> p_track_id or v_current.status <> p_status then
    select coalesce(array_agg(id order by position), '{}')
      into v_source_ids
    from public.roadmap_items
    where track_id = v_current.track_id
      and status = v_current.status
      and archived_at is null
      and id <> p_item_id;

    v_position := 0;
    foreach v_id in array v_source_ids loop
      update public.roadmap_items
        set position = v_position,
            updated_by = p_actor,
            updated_at = now()
      where id = v_id;
      v_position := v_position + 1;
    end loop;
  end if;

  if v_current.status <> p_status then
    insert into public.roadmap_item_status_history (
      roadmap_item_id,
      from_status,
      to_status,
      changed_by
    ) values (
      p_item_id,
      v_current.status,
      p_status,
      p_actor
    );
  end if;
end;
$$;

revoke execute on function public.roadmap_create_item(
  text, text, uuid, text, uuid, text, text, text, integer, text, text, text, text
) from public, anon, authenticated;

revoke execute on function public.roadmap_reorder_item(
  uuid, uuid, text, integer, text
) from public, anon, authenticated;

grant execute on function public.roadmap_create_item(
  text, text, uuid, text, uuid, text, text, text, integer, text, text, text, text
) to service_role;

grant execute on function public.roadmap_reorder_item(
  uuid, uuid, text, integer, text
) to service_role;
