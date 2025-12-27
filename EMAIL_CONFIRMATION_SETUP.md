# Email Confirmation Setup Guide

## Issue: Confirmation Emails Not Being Sent

If confirmation emails are not being sent after user registration, check the following:

## 1. Celery Worker Must Be Running

The confirmation email is sent via a **Celery task** (`finish_creating_user`) that runs asynchronously. If Celery is not running, emails will not be sent.

### Check if Celery is Running

```bash
# In your Saleor backend directory
# Check if Celery worker process is running
ps aux | grep celery

# Or check Docker containers
docker ps | grep celery
```

### Start Celery Worker

```bash
# In your Saleor backend directory
celery -A saleor worker --loglevel=info

# Or if using Docker Compose, ensure the celery service is running
docker-compose -f infra/docker-compose.dev.yml up celery-worker
```

### Verify Celery is Processing Tasks

Check the Celery logs for:
- `finish_creating_user` task execution
- Email sending errors
- Task completion messages

## 2. Email Service Configuration

Saleor needs to be configured to send emails. Check your email plugin configuration:

### Option A: SMTP Configuration

In Saleor Dashboard → Configuration → Plugins:
- Enable "User Email" plugin
- Configure SMTP settings:
  - SMTP Host
  - SMTP Port
  - SMTP User
  - SMTP Password
  - Use TLS/SSL

### Option B: Webhook-Based Email Service

If using a webhook-based email service (SendGrid, Mailgun, etc.):
- Configure webhook URL
- Ensure webhook secret is set
- Verify webhook is receiving events

### Check Email Configuration

```bash
# In Saleor Django shell
python manage.py shell

>>> from saleor.site.models import SiteSettings
>>> site = SiteSettings.objects.get()
>>> print(f"Email confirmation enabled: {site.enable_account_confirmation_by_email}")
>>> print(f"Allow login without confirmation: {site.allow_login_without_confirmation}")
```

## 3. Site Settings

Verify these settings in Saleor Dashboard:

1. **Enable Account Confirmation by Email**: Must be `True`
   - Dashboard → Configuration → Site Settings
   - Or via GraphQL: `shopSettingsUpdate` mutation

2. **Allow Login Without Confirmation**: Can be `True` or `False`
   - If `True`: Users can sign in even if not confirmed (better UX for resending emails)
   - If `False`: Users must confirm before signing in

## 4. Test Email Sending

### Test via Django Shell

```python
# In Saleor Django shell
python manage.py shell

>>> from saleor.account.models import User
>>> from saleor.account.notifications import send_account_confirmation
>>> from saleor.graphql.plugins.dataloaders import get_plugin_manager_promise
>>> from saleor.graphql.site.dataloaders import get_site_promise
>>> from saleor.core.tokens import token_generator
>>> from saleor.core.context import RequestorAwareContext

>>> user = User.objects.filter(is_confirmed=False).first()
>>> if user:
...     manager = get_plugin_manager_promise(RequestorAwareContext()).get()
...     site = get_site_promise(RequestorAwareContext()).get()
...     if site.settings.enable_account_confirmation_by_email:
...         token = token_generator.make_token(user)
...         send_account_confirmation(
...             user=user,
...             redirect_url="http://localhost:3001/default-channel/confirm-email",
...             channel_slug="default-channel",
...             manager=manager,
...             token=token,
...         )
...         print(f"Confirmation email sent to {user.email}")
```

### Check Celery Task Logs

```bash
# Watch Celery logs in real-time
celery -A saleor worker --loglevel=info

# Or if using Docker
docker logs -f saleor-celery-worker-dev
```

Look for:
- `[INFO] Task saleor.account.tasks.finish_creating_user[...] succeeded`
- `[ERROR]` messages indicating email sending failures

## 5. Common Issues

### Issue: Celery Not Running
**Symptom**: No emails sent, no errors in logs
**Solution**: Start Celery worker

### Issue: Email Plugin Not Configured
**Symptom**: Task runs but no email sent
**Solution**: Configure email plugin in Dashboard

### Issue: SMTP Credentials Invalid
**Symptom**: Task fails with SMTP errors
**Solution**: Verify SMTP credentials in plugin settings

### Issue: Email in Spam Folder
**Symptom**: Email sent but user doesn't see it
**Solution**: Check spam folder, verify sender email domain

## 6. Development Setup

For local development, you can:

1. **Use Console Email Backend** (emails print to console):
   ```python
   # In settings.py (development only)
   EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
   ```

2. **Use File Email Backend** (emails saved to files):
   ```python
   # In settings.py (development only)
   EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
   EMAIL_FILE_PATH = '/tmp/app-messages'
   ```

3. **Use MailHog** (local SMTP server):
   ```bash
   # Install MailHog
   # macOS: brew install mailhog
   # Linux: Download from https://github.com/mailhog/MailHog
   
   # Run MailHog
   mailhog
   
   # Access web UI at http://localhost:8025
   ```

## 7. Production Setup

For production:

1. **Use Reliable SMTP Service**:
   - SendGrid
   - AWS SES
   - Mailgun
   - Postmark

2. **Configure Email Plugin**:
   - Set up SMTP credentials
   - Test email sending
   - Monitor email delivery rates

3. **Monitor Celery**:
   - Set up Celery monitoring (Flower, etc.)
   - Monitor task queues
   - Set up alerts for failed tasks

## 8. Quick Fix: Allow Login Without Confirmation

If emails are not working and you need users to be able to sign in:

1. Enable "Allow Login Without Confirmation" in Site Settings
2. Users can sign in even if not confirmed
3. After signing in, they can use "Resend Confirmation Email" feature
4. Once confirmed, they get full account access

## 9. Verify Email is Being Sent

Check Saleor logs for:
```
[INFO] Sending account confirmation email to user@example.com
[INFO] Task saleor.account.tasks.finish_creating_user[...] succeeded
```

If you see errors, check:
- Celery worker logs
- Email plugin configuration
- SMTP/webhook settings

## 10. Troubleshooting Steps

1. ✅ Check Celery is running: `ps aux | grep celery`
2. ✅ Check email plugin is enabled in Dashboard
3. ✅ Verify SMTP/webhook configuration
4. ✅ Check `enable_account_confirmation_by_email` is `True`
5. ✅ Test email sending via Django shell
6. ✅ Check Celery task logs for errors
7. ✅ Verify email service credentials
8. ✅ Check spam folder
9. ✅ Enable "Allow Login Without Confirmation" for better UX

---

## Current Implementation

The sign-up flow now:
1. ✅ Sends confirmation email automatically (via Celery task)
2. ✅ Redirects to verification page if confirmation required
3. ✅ Allows users to sign in to resend email (if `allow_login_without_confirmation` is enabled)
4. ✅ Provides clear instructions and error messages

If emails are not being sent, the most common cause is **Celery not running**.

