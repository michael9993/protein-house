# SMTP App Configuration Guide

## How to Fill Out the SMTP Configuration Form

### Step 1: Configuration Name

**Configuration name**: Enter a descriptive name for this SMTP configuration.

Examples:

- `Production` - For production email server
- `Development` - For development/testing
- `Gmail` - If using Gmail
- `saleor` - Generic name (as you mentioned)

**Purpose**: You can have multiple configurations for different channels or environments.

---

### Step 2: SMTP Server Connection

Fill in your SMTP server details based on your email provider:

#### **Gmail (Recommended for Testing)**

1. **Host**: `smtp.gmail.com`
2. **Port**: `587` (for TLS) or `465` (for SSL)
3. **User**: Your Gmail address (e.g., `your-email@gmail.com`)
4. **Password**: **App Password** (NOT your regular Gmail password)
   - To create an App Password:
     1. Go to [Google Account Settings](https://myaccount.google.com/)
     2. Enable 2-Factor Authentication (if not already enabled)
     3. Go to Security → App passwords
     4. Generate a new app password for "Mail"
     5. Copy the 16-character password (no spaces)
5. **Encryption**: Select **TLS** (for port 587) or **SSL** (for port 465)

#### **Outlook/Hotmail**

1. **Host**: `smtp-mail.outlook.com`
2. **Port**: `587`
3. **User**: Your Outlook email address
4. **Password**: Your Outlook password
5. **Encryption**: **TLS**

#### **Yahoo Mail**

1. **Host**: `smtp.mail.yahoo.com`
2. **Port**: `587` or `465`
3. **User**: Your Yahoo email address
4. **Password**: Your Yahoo password (or app password)
5. **Encryption**: **TLS** (port 587) or **SSL** (port 465)

#### **Custom SMTP Server**

1. **Host**: Your SMTP server address (e.g., `mail.yourdomain.com`)
2. **Port**: Usually `587` (TLS) or `465` (SSL) or `25` (no encryption)
3. **User**: Your SMTP username
4. **Password**: Your SMTP password
5. **Encryption**:
   - **TLS** - For port 587 (most common, recommended)
   - **SSL** - For port 465 (legacy, but still used)
   - **No encryption** - For port 25 (not recommended, insecure)

---

### Step 3: Encryption Options Explained

- **TLS (Transport Layer Security)**:

  - ✅ **Recommended** for most modern SMTP servers
  - Uses port **587**
  - Starts as plain connection, then upgrades to encrypted
  - Most secure and widely supported

- **SSL (Secure Sockets Layer)**:

  - Uses port **465**
  - Encrypted from the start
  - Legacy protocol, but still widely used
  - Some providers prefer this

- **No encryption**:
  - Uses port **25**
  - ⚠️ **Not recommended** - insecure
  - Only use for local testing (e.g., Mailpit)

---

### Step 4: Complete Configuration Example (Gmail)

Here's a complete example for Gmail:

```
Configuration name: Gmail Production

SMTP Server Connection:
  Host: smtp.gmail.com
  Port: 587
  User: your-email@gmail.com
  Password: xxxx xxxx xxxx xxxx  (16-character app password)
  Encryption: TLS
```

---

### Step 5: After SMTP Configuration

1. **Save the SMTP connection settings**
2. **Configure Sender**:
   - Sender Name: Your store name (e.g., "Saleor Store")
   - Sender Email: Your email address (must match SMTP user for Gmail)
3. **Enable Events**:
   - ✅ Order fulfilled (for fulfillment emails)
   - ✅ Invoice sent (for invoice emails)
   - ✅ Order created (optional)
   - ✅ Other events as needed

---

### Step 6: Testing

1. **Test the configuration**:

   - Create a test order
   - Fulfill it
   - Check if the fulfillment email is sent

2. **Check logs**:

   ```powershell
   docker-compose -f docker-compose.dev.yml logs saleor-smtp-app
   ```

3. **Common Issues**:
   - **Authentication failed**: Check if you're using App Password (for Gmail)
   - **Connection timeout**: Check firewall/port blocking
   - **SSL/TLS error**: Try switching between TLS and SSL

---

## Quick Reference: Common Email Providers

| Provider        | Host                  | Port | Encryption | Notes                 |
| --------------- | --------------------- | ---- | ---------- | --------------------- |
| Gmail           | smtp.gmail.com        | 587  | TLS        | Requires App Password |
| Gmail           | smtp.gmail.com        | 465  | SSL        | Requires App Password |
| Outlook         | smtp-mail.outlook.com | 587  | TLS        | Use regular password  |
| Yahoo           | smtp.mail.yahoo.com   | 587  | TLS        | May need App Password |
| Mailpit (Local) | localhost             | 1025 | None       | For testing only      |

---

## Troubleshooting

### Gmail Authentication Error

**Problem**: "535-5.7.8 Username and Password not accepted"

**Solution**:

1. Make sure 2-Factor Authentication is enabled
2. Use an **App Password**, not your regular password
3. Remove spaces from the app password when pasting

### Connection Timeout

**Problem**: Cannot connect to SMTP server

**Solution**:

1. Check if port is blocked by firewall
2. Try different port (587 vs 465)
3. Verify host address is correct

### SSL/TLS Error

**Problem**: SSL handshake failed

**Solution**:

1. Try switching between TLS and SSL
2. Check if your provider supports the selected encryption
3. Verify port matches encryption type (587=TLS, 465=SSL)

---

## Next Steps

After configuring SMTP:

1. ✅ Test with a fulfillment email
2. ✅ Verify emails are received
3. ✅ Configure email templates (optional)
4. ✅ Set up channel-specific configurations (if needed)
