
# Local LAN Network Deployment Guide

This guide explains how to deploy the system locally with HTTPS access from your LAN network.

## Prerequisites

1. A local domain name (e.g., `cleaning.local`)
2. Router with DNS configuration capability or local DNS server
3. SSL certificate (self-signed or from Let's Encrypt)

## Setup Steps

### 1. Generate SSL Certificate

For local testing with self-signed certificate:

```bash
chmod +x generate-ssl-cert.sh
./generate-ssl-cert.sh
```

For production with Let's Encrypt (requires public domain):

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com
```

### 2. Configure Environment

Copy `.env.local` and update the values:

```bash
cp .env.local .env
```

Edit `.env` and set:
- `DOMAIN`: Your local domain (e.g., cleaning.local)
- `SSL_KEY_PATH`: Path to your SSL private key
- `SSL_CERT_PATH`: Path to your SSL certificate
- `SESSION_SECRET`: A secure random string (min 32 characters)

### 3. Configure Router/DNS

#### Option A: Router DNS Configuration

1. Access your router admin panel (usually 192.168.1.1 or 192.168.0.1)
2. Find DNS settings (may be under DHCP or Network settings)
3. Add a DNS entry:
   - Hostname: `cleaning.local` (or your chosen domain)
   - IP Address: Your server's local IP (e.g., 192.168.1.100)

#### Option B: Edit Hosts File (Client-side)

On each device that needs access:

**Windows:** Edit `C:\Windows\System32\drivers\etc\hosts`
**Linux/Mac:** Edit `/etc/hosts`

Add:
```
192.168.1.100    cleaning.local
```

### 4. Firewall Configuration

Allow HTTPS traffic on port 443:

**Linux (UFW):**
```bash
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
```

**Windows:** Configure Windows Firewall to allow inbound traffic on ports 80 and 443

### 5. Start the Server

```bash
npm run build
npm start
```

The server will be accessible at:
- `https://cleaning.local` (or your configured domain)
- `https://192.168.1.100` (direct IP access)

## Security Considerations

1. **HTTPS Only**: Always use HTTPS for production
2. **Strong Session Secret**: Use a cryptographically secure random string
3. **Certificate Validation**: For production, use trusted CA certificates
4. **Network Security**: Ensure your router firewall is properly configured
5. **Regular Updates**: Keep all dependencies up to date

## Troubleshooting

### Browser Certificate Warning

If using self-signed certificates, browsers will show a security warning. This is normal. You can:
- Add the certificate to trusted store
- Use Let's Encrypt for trusted certificates
- Accept the warning (not recommended for production)

### Cannot Access from Other Devices

1. Check firewall settings
2. Verify DNS configuration
3. Ensure server is binding to 0.0.0.0, not localhost
4. Ping the server IP from client device

### Port Already in Use

If port 443 is occupied:
1. Check what's using it: `sudo lsof -i :443`
2. Stop the conflicting service
3. Or use a different port (update nginx/reverse proxy accordingly)

## Recommended: Using Nginx as Reverse Proxy

For better security and performance, use Nginx:

```nginx
server {
    listen 80;
    server_name cleaning.local;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cleaning.local;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then run your app on port 5000 and let Nginx handle SSL termination.
