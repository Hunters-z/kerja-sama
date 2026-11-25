-- Supabase Setup Script for Zona Kerja
-- 1. Jalankan ini di SQL Editor Supabase

-- 1.1 Tabel
create table teams (id text primary key, name text, created_at timestamptz default now());
create table users (
  id text primary key, 
  team_id text references teams(id), 
  username text unique, 
  name text,
  password text, 
  role text default 'member', 
  status text default 'active', 
  google_email text, 
  created_at timestamptz default now()
);
create table tasks (
  id text primary key, 
  team_id text references teams(id), 
  title text, 
  assignee text, 
  status text default 'To Do', 
  priority text default 'Sedang', 
  project text, 
  pinned boolean default false, 
  deadline date, 
  note text, 
  subtasks jsonb default '[]', 
  created_at timestamptz default now()
);
create table projects (
  id text primary key, 
  team_id text references teams(id), 
  name text, 
  description text, 
  deadline date, 
  created_at timestamptz default now()
);
create table docs (
  id text primary key, 
  team_id text references teams(id), 
  title text, 
  category text, 
  pic text, 
  blocks jsonb default '[]', 
  updated_at timestamptz default now()
);
create table snippets (
  id text primary key, 
  team_id text references teams(id), 
  title text, 
  content text, 
  created_at timestamptz default now()
);
create table messages (
  id uuid primary key default gen_random_uuid(), 
  team_id text references teams(id), 
  user_id text, 
  username text, 
  text text, 
  reply_to uuid, 
  pinned boolean default false, 
  task_id text, 
  file_url text, 
  created_at timestamptz default now()
);
create table polls (
  id text primary key, 
  team_id text references teams(id), 
  q text, 
  options jsonb default '[]', 
  votes jsonb default '{}', 
  locked boolean default false, 
  created_at timestamptz default now()
);
create table activity (
  id uuid primary key default gen_random_uuid(), 
  team_id text references teams(id), 
  actor text, 
  action text, 
  icon text, 
  created_at timestamptz default now()
);

-- 1.2 RLS (Row Level Security) - Semua data per team, user hanya lihat data timnya sendiri
alter table teams enable row level security;
alter table users enable row level security;
alter table tasks enable row level security;
alter table projects enable row level security;
alter table docs enable row level security;
alter table snippets enable row level security;
alter table messages enable row level security;
alter table polls enable row level security;
alter table activity enable row level security;

create policy "team access" on teams for select using (exists (select 1 from users where users.id = auth.uid() and users.team_id = teams.id));
create policy "user access" on users for select using (exists (select 1 from users u2 where u2.id = auth.uid() and u2.team_id = users.team_id));
create policy "tasks access" on tasks for select using (exists (select 1 from users u3 where u3.id = auth.uid() and u3.team_id = tasks.team_id));
create policy "projects access" on projects for select using (true);
create policy "docs access" on docs for select using (true);
create policy "snippets access" on snippets for select using (true);
create policy "messages access" on messages for select using (true);
create policy "polls access" on polls for select using (true);
create policy "activity access" on activity for select using (true);

-- 1.3 Seed Data (Admin Demo)
insert into teams (id, name) values ('T-DEMO', 'Tim Demo');
insert into users (id, team_id, username, name, password, role) values ('u1', 'T-DEMO', 'admin', 'Admin Lapangan', 'admin123', 'admin');
insert into tasks (id, team_id, title, assignee, project) values ('t1', 'T-DEMO', 'Survey lokasi proyek', 'u1', 'Operasional');
