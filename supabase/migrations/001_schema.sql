-- Enable PostGIS (run this first)
create extension if not exists postgis;

-- offerings table
create table offerings (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  category            text not null check (category in ('food','housing','healthcare','childcare','legal','jobs')),
  provider_type       text not null check (provider_type in ('gov','npo','mutual-aid')),
  address             text,
  location            geography(Point, 4326) not null,
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
create table pulse (
  id           uuid primary key default gen_random_uuid(),
  category     text not null check (category in ('food','housing','healthcare','childcare','legal','jobs')),
  description  text check (char_length(description) <= 280),
  neighborhood text not null,
  location     geography(Point, 4326) not null,
  created_at   timestamptz not null default now(),
  flag_count   int not null default 0,
  status       text not null default 'visible' check (status in ('visible','hidden'))
);

create index pulse_status_idx on pulse (status);
create index pulse_created_at_idx on pulse (created_at desc);
create index pulse_location_idx on pulse using gist (location);
