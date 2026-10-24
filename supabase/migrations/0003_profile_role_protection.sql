CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
    AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
    AND COALESCE(auth.role(), '') <> 'service_role'
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role = 'admin'
    )
  THEN
    RAISE EXCEPTION 'Only administrators may change profile roles'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles AS actor
      WHERE actor.id = auth.uid()
        AND actor.role = 'admin'
    )
  THEN
    RAISE EXCEPTION 'Only administrators may assign profile roles'
      USING ERRCODE = '42501';
  END IF;

  IF p_role IS NULL OR p_role NOT IN ('aspirant', 'mentor', 'admin') THEN
    RAISE EXCEPTION 'Invalid profile role: %', p_role
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET role = p_role,
      updated_at = pg_catalog.now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated, service_role;
