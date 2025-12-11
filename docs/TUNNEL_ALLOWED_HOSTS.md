# Fixing ALLOWED_HOSTS for Tunnels

When using tunnels (cloudflared, ngrok), you may see this error:

```
DisallowedHost at /
Invalid HTTP_HOST header: 'your-tunnel-url.trycloudflare.com'.
You may need to add 'your-tunnel-url.trycloudflare.com' to ALLOWED_HOSTS.
```

## Automatic Fix (Development Mode)

**Good news!** The Saleor settings have been updated to automatically allow tunnel domains when `DEBUG=True`:

- `.trycloudflare.com` (all cloudflared tunnel subdomains)
- `.ngrok.io` (all ngrok tunnel subdomains)
- `.ngrok-free.app` (ngrok free tier)
- `.ngrok.app` (ngrok app domain)

**No configuration needed!** Just restart the Saleor API service:

```powershell
docker compose -f infra/docker-compose.dev.yml restart saleor-api
```

## Manual Configuration

If you need to add specific hosts or use a different configuration:

### Option 1: Allow All Hosts (Development Only)

In `docker-compose.dev.yml`:

```yaml
ALLOWED_HOSTS: "*"
```

**Warning:** Only use this in development! Never in production.

### Option 2: Add Specific Tunnel URL

If automatic detection doesn't work, add your specific tunnel URL:

```yaml
ALLOWED_HOSTS: "localhost,127.0.0.1,saleor-api,linking-ipod-cup-embedded.trycloudflare.com"
```

### Option 3: Use Wildcard Pattern

Django supports wildcards using a leading dot:

```yaml
ALLOWED_HOSTS: "localhost,127.0.0.1,.trycloudflare.com,.ngrok.io"
```

This allows all subdomains of those domains.

## Verification

After restarting, test your tunnel URL:

```powershell
curl https://your-tunnel-url.trycloudflare.com/graphql/
```

You should no longer see the `DisallowedHost` error.

## Production

In production (`DEBUG=False`), you must explicitly set `ALLOWED_HOSTS`:

```yaml
ALLOWED_HOSTS: "yourdomain.com,api.yourdomain.com"
```

Never use `*` or tunnel domains in production!
