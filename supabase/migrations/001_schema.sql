-- Enable PostGIS (run this first)
create extension if not exists postgis;

-- offerings table
create table offerings (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  category            text not null check (category in ('food','housing','healthcare','childcare','legal','jobs')),
  provider_type       text not null check (provider_type in ('gov','npo','mutual-aid')),
  address             text,
  lat                 float8 not null,
  lng                 float8 not null,
  location            geography(Point, 4326) generated always as (st_makepoint(lng, lat)::geography) stored,
  hours_json          jsonb,
  availability_status text not null default 'unknown' check (availability_status in ('open','closed','unknown')),
  data_source         text,
  imported_at         timestamptz not null default now(),
  flagged             boolean not null default false
);

-- spatial index for geo queries (ST_DWithin, ST_Distance)
create index offerings_location_idx on offerings using gist (location);
create index offerings_category_idx on offerings (category);
create index offerings_provider_type_idx on offerings (provider_type);
create index offerings_availability_idx on offerings (availability_status);

-- pulse table
-- NOTE: There is intentionally no `description` column. Free-text descriptions
-- are collected by the form for moderation context but discarded server-side
-- before insert. This is the primary anonymity guarantee.
create table pulse (
  id           uuid primary key default gen_random_uuid(),
  category     text not null check (category in ('food','housing','healthcare','childcare','legal','jobs')),
  neighborhood text not null,
  lat          float8 not null,
  lng          float8 not null,
  location     geography(Point, 4326) generated always as (st_makepoint(lng, lat)::geography) stored,
  created_at   timestamptz not null default now(),
  flag_count   int not null default 0,
  status       text not null default 'visible' check (status in ('visible','hidden'))
);

create index pulse_status_idx on pulse (status);
create index pulse_created_at_idx on pulse (created_at desc);
create index pulse_location_idx on pulse using gist (location);
