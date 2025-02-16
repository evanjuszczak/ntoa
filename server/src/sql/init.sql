-- Enable the vector extension
create extension if not exists vector;

-- Create the setup_vector_store function
create or replace function setup_vector_store()
returns void
language plpgsql
as $$
begin
  -- Create the documents table
  create table if not exists documents (
    id bigserial primary key,
    content text not null,
    embedding vector(1536),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
  );

  -- Create the match_documents function
  create or replace function match_documents(
    query_embedding vector(1536),
    match_count int default 5
  )
  returns table (
    id bigint,
    content text,
    metadata jsonb,
    similarity float
  )
  language plpgsql
  as $func$
  begin
    return query
    select
      d.id,
      d.content,
      d.metadata,
      1 - (d.embedding <=> query_embedding) as similarity
    from documents d
    where d.embedding is not null
    order by d.embedding <=> query_embedding
    limit match_count;
  end;
  $func$;
end;
$$; 