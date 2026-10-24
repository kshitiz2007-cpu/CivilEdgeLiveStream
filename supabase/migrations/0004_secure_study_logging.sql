CREATE OR REPLACE FUNCTION public.log_study_minutes(
  p_user_id UUID,
  p_minutes INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_date DATE;
  v_streak INTEGER;
  v_mins INTEGER;
  v_result JSONB;
BEGIN
  IF p_minutes IS NULL OR p_minutes < 0 THEN
    RAISE EXCEPTION 'Study minutes must be a non-negative integer'
      USING ERRCODE = '22023';
  END IF;

  IF COALESCE(auth.role(), '') <> 'service_role'
    AND auth.uid() IS DISTINCT FROM p_user_id
  THEN
    RAISE EXCEPTION 'Users may only log study time for their own profile'
      USING ERRCODE = '42501';
  END IF;

  SELECT last_study_date, streak_days, study_minutes
  INTO v_last_date, v_streak, v_mins
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_last_date IS NULL THEN
    v_streak := 1;
    v_mins := p_minutes;
  ELSIF v_last_date = v_today THEN
    v_mins := v_mins + p_minutes;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    v_streak := v_streak + 1;
    v_mins := p_minutes;
  ELSE
    v_streak := 1;
    v_mins := p_minutes;
  END IF;

  UPDATE public.profiles
  SET study_minutes = v_mins,
      streak_days = v_streak,
      last_study_date = v_today,
      updated_at = pg_catalog.now()
  WHERE id = p_user_id;

  SELECT pg_catalog.to_jsonb(p) INTO v_result
  FROM public.profiles AS p
  WHERE id = p_user_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.log_study_minutes(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_study_minutes(UUID, INTEGER) TO authenticated, service_role;
