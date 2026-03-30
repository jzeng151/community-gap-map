-- Add services column to store human-readable service type labels
-- e.g. ["Soup Kitchen / Food Pantry"] or ["Workforce1 Career Center"]
alter table offerings add column if not exists services jsonb;
