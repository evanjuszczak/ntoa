-- Enable the required extensions
create extension if not exists "uuid-ossp";

-- Create the saved_notes table if it doesn't exist
create table if not exists saved_notes (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    conversation jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster user-specific queries
create index if not exists saved_notes_user_id_idx on saved_notes(user_id);

-- Enable RLS (Row Level Security)
alter table saved_notes enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own notes" on saved_notes;
drop policy if exists "Users can insert their own notes" on saved_notes;
drop policy if exists "Users can update their own notes" on saved_notes;
drop policy if exists "Users can delete their own notes" on saved_notes;

-- Create policies
create policy "Users can view their own notes"
    on saved_notes for select
    using (auth.uid() = user_id);

create policy "Users can insert their own notes"
    on saved_notes for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own notes"
    on saved_notes for update
    using (auth.uid() = user_id);

create policy "Users can delete their own notes"
    on saved_notes for delete
    using (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
grant all on saved_notes to authenticated;
grant usage on sequence saved_notes_id_seq to authenticated; 