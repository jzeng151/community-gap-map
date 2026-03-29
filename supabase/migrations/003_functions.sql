-- RPC function: atomically increment flag_count on a pulse post.
-- Returns the new flag_count so the caller knows if the threshold was hit.
-- Called from the frontend via supabase.rpc('flag_pulse', { post_id: '...' })
create or replace function flag_pulse(post_id uuid)
returns int
language plpgsql
security definer  -- runs with owner privileges so anon role can increment flag_count
set search_path = public  -- pin search_path to prevent schema injection
as $$
declare
  new_count int;
begin
  update pulse
  set flag_count = flag_count + 1
  where id = post_id and status = 'visible'
  returning flag_count into new_count;

  if new_count is null then
    raise exception 'Post not found or already hidden';
  end if;

  -- Hide the post once it reaches the threshold
  if new_count >= 3 then
    update pulse set status = 'hidden' where id = post_id;
  end if;

  return new_count;
end;
$$;

-- Grant anon role permission to call this function
grant execute on function flag_pulse(uuid) to anon, authenticated;
