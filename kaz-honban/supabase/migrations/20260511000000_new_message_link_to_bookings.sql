-- Previous link target was /room/<booking_id>, but /room/* is gated to the
-- 15-minute join window. Outside that window, tapping the notification
-- redirected the user away with no visible chat — looked like a dead "view"
-- button. Point new-message notifications at /bookings?chat=<booking_id>
-- instead so the bookings list can auto-open the chat panel.

CREATE OR REPLACE FUNCTION public.notify_message_recipient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id UUID;
  v_sender_name TEXT;
  v_recent_exists BOOLEAN;
  v_link TEXT;
BEGIN
  SELECT CASE
           WHEN b.learner_id = NEW.sender_id THEN b.teacher_id
           WHEN b.teacher_id = NEW.sender_id THEN b.learner_id
           ELSE NULL
         END
  INTO v_recipient_id
  FROM public.bookings b
  WHERE b.id = NEW.booking_id;

  IF v_recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_link := '/bookings?chat=' || NEW.booking_id::text;

  -- Dedupe matches on the new link so we don't double-fire after the format
  -- change either.
  SELECT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = v_recipient_id
      AND n.type = 'new_message'
      AND n.link = v_link
      AND n.is_read = false
      AND n.created_at > now() - interval '10 minutes'
  ) INTO v_recent_exists;

  IF v_recent_exists THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    v_recipient_id,
    'new_message',
    'New message',
    COALESCE(v_sender_name, 'Someone') || ' sent you a message',
    v_link
  );

  RETURN NEW;
END;
$$;

-- Backfill: rewrite recent unread new_message notifications to the new link
-- shape so users who got one in the last 24h can actually open the chat.
UPDATE public.notifications
SET link = replace(link, '/room/', '/bookings?chat=')
WHERE type = 'new_message'
  AND link LIKE '/room/%'
  AND created_at > now() - interval '24 hours';
