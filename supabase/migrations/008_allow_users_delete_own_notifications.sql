create policy "Users can delete own notifications"
  on public.notification_deliveries for delete
  using (auth.uid() = user_id);
