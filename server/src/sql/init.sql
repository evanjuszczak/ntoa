-- Enable the pgvector extension
create extension if not exists vector;

-- Create the documents table if it doesn't exist
create table if not exists documents (
  id bigserial primary key,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a function to calculate cosine similarity
create or replace function cosine_similarity(a vector, b vector)
returns float
language plpgsql
as $$
begin
  return (a <#> b) * -1;
end;
$$;

-- Create a function to match documents by embedding similarity
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    cosine_similarity(documents.embedding, query_embedding) as similarity
  from documents
  where cosine_similarity(documents.embedding, query_embedding) > match_threshold
  order by cosine_similarity(documents.embedding, query_embedding) desc
  limit match_count;
end;
$$; 