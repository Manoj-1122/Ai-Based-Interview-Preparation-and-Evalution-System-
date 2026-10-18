
ALTER TABLE public.profiles
  ADD COLUMN notify_new_content boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_interview_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_progress_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_tips_resources boolean NOT NULL DEFAULT false;
