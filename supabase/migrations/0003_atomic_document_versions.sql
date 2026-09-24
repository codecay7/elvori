create or replace function public.save_document_section(
  p_project_id uuid,
  p_section_id uuid,
  p_content text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_version_number integer;
  v_sections jsonb;
  v_section jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  /*
   * Serialize saves for the same project.
   *
   * This prevents two simultaneous saves from both
   * generating the same version number.
   */
  perform pg_advisory_xact_lock(
    hashtextextended(p_project_id::text, 0)
  );

  /*
   * Verify project ownership.
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
   * Verify that the section belongs to the project.
   */
  if not exists (
    select 1
    from public.document_sections
    where id = p_section_id
      and project_id = p_project_id
  ) then
    raise exception 'section_not_found';
  end if;

  /*
   * Update the section.
   */
  update public.document_sections
  set
    content = p_content,
    updated_at = now()
  where id = p_section_id
    and project_id = p_project_id;

  /*
   * Build the complete document snapshot AFTER the update.
   */
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

  /*
   * Calculate the next version while holding the project lock.
   */
  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.document_versions
  where project_id = p_project_id;

  /*
   * Store immutable snapshot.
   */
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
  );

  select jsonb_build_object(
    'version_number', v_version_number,
    'snapshot', jsonb_build_object(
      'sections', v_sections
    )
  )
  into v_section;

  return v_section;
end;
$$;

revoke all on function public.save_document_section(uuid, uuid, text)
from public;

grant execute on function public.save_document_section(uuid, uuid, text)
to authenticated;
