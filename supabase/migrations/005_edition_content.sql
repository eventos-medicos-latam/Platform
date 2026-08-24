-- =========================================================
-- speakers
-- =========================================================

create table speakers (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  slot_label text,
  name text,
  photo text null,
  specialty text,
  role text,
  institution text,
  country text,
  city text,
  bio text,
  web text null,
  talks text[] not null default '{}',
  track_id text null references tracks (id),
  order_num int not null default 0,
  featured boolean not null default false,
  status speaker_status not null default 'invitado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger speakers_set_updated_at
  before update on speakers
  for each row execute function set_updated_at();

alter table speakers enable row level security;

create policy speakers_public_read on speakers
  for select using (status = 'publicado');

create policy speakers_admin_all on speakers
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- agenda_items
-- =========================================================

create table agenda_items (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  day int not null,
  day_label text,
  day_concept text,
  date date,
  start_time text,
  end_time text,
  title text not null,
  description text,
  type agenda_type not null,
  track_id text null references tracks (id),
  room text,
  sponsor_company_id uuid null references companies (id),
  order_num int not null default 0,
  visible boolean not null default true,
  status publication_status not null default 'borrador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agenda_items_set_updated_at
  before update on agenda_items
  for each row execute function set_updated_at();

alter table agenda_items enable row level security;

create policy agenda_items_public_read on agenda_items
  for select using (visible and status = 'publicado');

create policy agenda_items_admin_all on agenda_items
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- agenda_item_speakers (junction, reemplaza AgendaItem.speakerIds[])
-- =========================================================

create table agenda_item_speakers (
  agenda_item_id uuid not null references agenda_items (id) on delete cascade,
  speaker_id uuid not null references speakers (id) on delete cascade,
  primary key (agenda_item_id, speaker_id)
);

alter table agenda_item_speakers enable row level security;

create policy agenda_item_speakers_public_read on agenda_item_speakers
  for select using (
    exists (
      select 1 from agenda_items ai
      where ai.id = agenda_item_speakers.agenda_item_id
        and ai.visible and ai.status = 'publicado'
    )
  );

create policy agenda_item_speakers_admin_all on agenda_item_speakers
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- faq_items
-- =========================================================

create table faq_items (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  question text not null,
  answer text not null,
  order_num int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger faq_items_set_updated_at
  before update on faq_items
  for each row execute function set_updated_at();

alter table faq_items enable row level security;

create policy faq_items_public_read on faq_items
  for select using (visible = true);

create policy faq_items_admin_all on faq_items
  for all using (is_admin()) with check (is_admin());
