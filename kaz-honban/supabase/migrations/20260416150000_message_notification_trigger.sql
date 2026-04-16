-- When a user sends a chat message inside a booking, create a notification for
-- the other participant so the bell icon shows it. Deduped to one per booking
-- per recipient per 10-minute window, so a burst of messages doesn't spam.

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
BEGIN
  -- Find the other participant of the booking
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

  -- Dedupe: skip if an unread new_message notification for the same booking
  -- was created for this recipient in the last 10 minutes.
  SELECT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = v_recipient_id
      AND n.type = 'new_message'
      AND n.link = '/room/' || NEW.booking_id::text
      AND n.is_read = false
      AND n.created_at > now() - interval '10 minutes'
  ) INTO v_recent_exists;

  IF v_recent_exists THEN
    RETURN NEW;
  END IF;

  -- Fetch sender's display name
  SELECT display_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    v_recipient_id,
    'new_message',
    'New message',
    COALESCE(v_sender_name, 'Someone') || ' sent you a message',
    '/room/' || NEW.booking_id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_notify_recipient ON public.messages;
CREATE TRIGGER trg_messages_notify_recipient
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_recipient();
