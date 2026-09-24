create or replace function public.restore_document_version(
  p_project_id uuid,
  p_version_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_snapshot jsonb;
  v_sections jsonb;
  v_version_number integer;
  v_result jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  /*
   * Serialize all version mutations for a project.
   * This prevents two concurrent saves/restores from generating
   * the same version number.
   */
  perform pg_advisory_xact_lock(
    hashtextextended(p_project_id::text, 0)
  );

  /*
   * Authorization is enforced at the database boundary as well
   * as in the API layer.
   */
  if not exists (
    select 1
    from public.projects
    where id = p_project_id
      and owner_id = v_user_id
  ) then
    raise exception 'project_not_found';
  end if;

  /*
   * Only restore a version belonging to this project.
   */
  select snapshot
  into v_snapshot
  from public.document_versions
  where id = p_version_id
    and project_id = p_project_id;

  if v_snapshot is null then
    raise exception 'version_not_found';
  end if;

  /*
   * Validate the snapshot shape before touching live data.
   */
  if jsonb_typeof(v_snapshot -> 'sections') <> 'array' then
    raise exception 'invalid_version_snapshot';
  end if;

  v_sections := v_snapshot -> 'sections';

  /*
   * Apply the snapshot exactly.
   *
   * Existing sections are updated.
   * Sections missing from the snapshot are removed.
   * Sections present in the snapshot but missing from the
   * current document are recreated using their original UUID.
   */

  /*
   * Delete sections that do not exist in the restored snapshot.
   */
  delete from public.document_sections ds
  where ds.project_id = p_project_id
    and not exists (
      select 1
      from jsonb_array_elements(v_sections) section
      where section ->> 'id' = ds.id::text
    );

  /*
   * Insert missing sections.
   */
  insert into public.document_sections (
    id,
    project_id,
    name,
    slug,
    content,
    position
  )
  select
    (section ->> 'id')::uuid,
    p_project_id,
    section ->> 'name',
    section ->> 'slug',
    section ->> 'content',
    (section ->> 'position')::integer
  from jsonb_array_elements(v_sections) section
  where not exists (
    select 1
    from public.document_sections ds
    where ds.id = (section ->> 'id')::uuid
      and ds.project_id = p_project_id
  );

  /*
   * Update existing sections.
   */
  update public.document_sections ds
  set
    name = section ->> 'name',
    slug = section ->> 'slug',
    content = section ->> 'content',
    position = (section ->> 'position')::integer,
    updated_at = now()
  from jsonb_array_elements(v_sections) section
  where ds.id = (section ->> 'id')::uuid
    and ds.project_id = p_project_id;

  /*
   * Create a NEW version representing the restore.
   * Historical versions remain immutable.
   */
  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.document_versions
  where project_id = p_project_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'content', content,
        'position', position
      )
      order by position
    ),
    '[]'::jsonb
  )
  into v_sections
  from public.document_sections
  where project_id = p_project_id;

  insert into public.document_versions (
    project_id,
    version_number,
    snapshot,
    created_by
  )
  values (
    p_project_id,
    v_version_number,
    jsonb_build_object(
      'sections', v_sections
    ),
    v_user_id
  )
  returning jsonb_build_object(
    'id', id,
    'version_number', version_number,
    'created_at', created_at,
    'snapshot', snapshot
  )
  into v_result;

  return v_result;

exception
  when invalid_text_representation then
    raise exception 'invalid_version_snapshot';
  when foreign_key_violation then
    raise exception 'invalid_version_snapshot';
  when unique_violation then
    raise exception 'invalid_version_snapshot';
end;
$$;

revoke all on function public.restore_document_version(uuid, uuid)
from public;

grant execute on function public.restore_document_version(uuid, uuid)
to authenticated;
