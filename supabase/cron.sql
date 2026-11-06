-- =====================================================================
-- Planes Adayai · programar los avisos (ejecutar DESPUÉS de desplegar la función "notify")
-- Sustituye los dos valores <...> y ejecútalo en SQL Editor. Se guardan cifrados en Vault.
-- <NOTIFY_SECRET> es una contraseña larga inventada por ti; pon la misma en los secretos de la función.
-- =====================================================================

select vault.create_secret('https://<TU-PROYECTO>.supabase.co', 'project_url');
select vault.create_secret('<NOTIFY_SECRET>', 'notify_secret');

-- Cada 10 minutos: la función decide qué toca (matches pendientes, recordatorio de las 20:00,
-- resumen del jueves a las 19:00 hora de Canarias). No repite avisos.
select cron.unschedule('planes-adayai-notify') where exists (select 1 from cron.job where jobname = 'planes-adayai-notify');
select cron.schedule('planes-adayai-notify', '*/10 * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret')),
    body    := '{}'::jsonb
  );
$$);
