create or replace function public.create_project_with_initial_section(
  p_name text,
  p_description text,
  p_content text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_project public.projects%rowtype;
  v_section public.document_sections%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  if p_name is null or length(trim(p_name)) = 0 or length(p_name) > 120 then
    raise exception 'invalid_project_name';
  end if;

  if p_description is not null and length(p_description) > 2000 then
    raise exception 'invalid_project_description';
  end if;

  if p_content is null or length(p_content) > 2000000 then
    raise exception 'invalid_section_content';
  end if;

  insert into public.projects (
    owner_id,
    name,
    description
  )
  values (
    v_user_id,
    trim(p_name),
    nullif(trim(p_description), '')
  )
  returning *
  into v_project;

  insert into public.document_sections (
    project_id,
    name,
    slug,
    content,
    position
  )
  values (
    v_project.id,
    'Main Document',
    'main-document',
    p_content,
    0
  )
  returning *
  into v_section;

  return jsonb_build_object(
    'project', jsonb_build_object(
      'id', v_project.id,
      'name', v_project.name,
      'description', v_project.description,
      'status', v_project.status,
      'created_at', v_project.created_at,
      'updated_at', v_project.updated_at
    ),
    'section', jsonb_build_object(
      'id', v_section.id,
      'name', v_section.name,
      'slug', v_section.slug,
      'content', v_section.content,
      'position', v_section.position,
      'updated_at', v_section.updated_at
    )
  );
end;
$$;

revoke all on function public.create_project_with_initial_section(text, text, text)
from public;

grant execute on function public.create_project_with_initial_section(text, text, text)
to authenticated;

-- Backfill projects created before initial-section creation was implemented.
insert into public.document_sections (
  project_id,
  name,
  slug,
  content,
  position
)
select
  p.id,
  'Main Document',
  'main-document',
  $$\documentclass[11pt,a4paper]{article}

\usepackage[margin=1in]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}

\begin{document}

\begin{center}
    {\LARGE \textbf{Your Name}}\\
    \vspace{4pt}
    Software Engineer
\end{center}

\section*{Experience}

\textbf{Software Engineer} \hfill 2025 -- Present

\begin{itemize}[leftmargin=*]
    \item Built scalable web applications using modern technologies.
    \item Collaborated with engineering teams to deliver production features.
\end{itemize}

\section*{Projects}

\textbf{Elvori}
\begin{itemize}[leftmargin=*]
    \item Conversational LaTeX document workspace.
\end{itemize}

\section*{Education}

Bachelor of Computer Applications

\end{document}$$,
  0
from public.projects p
where not exists (
  select 1
  from public.document_sections s
  where s.project_id = p.id
);
