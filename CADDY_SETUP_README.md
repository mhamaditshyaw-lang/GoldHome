# Caddy Setup Complete! ✅

## Problem FIXED
Caddy was stopping because it wasn't running as a persistent service. Now it's managed by PM2 which handles automatic restarts.

## Current Status
- ✅ Caddy is running via PM2
- ✅ Listening on port 443 (HTTPS)
- ✅ Automatically restarts if it crashes
- ✅ Configuration saved

## How It Works
1. Caddy runs as a PM2 process named `goldhome-caddy`
2. PM2 monitors Caddy and restarts it automatically if it stops
3. The configuration is saved in `ecosystem.caddy.config.cjs`

## Common Commands

### Check Status
```powershell
pm2 status goldhome-caddy
# OR use the status script:
powershell -ExecutionPolicy Bypass -File scripts\check_caddy_status.ps1
```

### View Logs
```powershell
pm2 logs goldhome-caddy
```

### Restart Caddy
```powershell
pm2 restart goldhome-caddy
```

### Stop Caddy
```powershell
pm2 stop goldhome-caddy
```

### Start Caddy (if stopped)
```powershell
pm2 start goldhome-caddy
```

### Real-time Monitoring
```powershell
pm2 monit
```

## Auto-Start on Windows Boot

To make Caddy start automatically when Windows boots:

### Option 1: Task Scheduler (Recommended)
1. Open Task Scheduler
2. Create a new task
3. Set trigger: "At startup"
4. Set action: Run program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\Administrator\Documents\GoldHome\GoldHomeServices95\scripts\startup_pm2.ps1"`
5. Set "Run whether user is logged on or not"
6. Save the task

### Option 2: Manual Startup
Run this command after each reboot:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\startup_pm2.ps1
```

## If You Need to Re-setup
Just run:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\start_caddy_fixed.ps1
```

## Configuration Files
- `Caddyfile` - Main Caddy configuration
- `ecosystem.caddy.config.cjs` - PM2 configuration for Caddy
- `scripts/start_caddy_fixed.ps1` - Setup script
- `scripts/check_caddy_status.ps1` - Status check script
- `scripts/startup_pm2.ps1` - Boot startup script

## Troubleshooting

### Caddy not starting?
```powershell
# View the error logs
pm2 logs goldhome-caddy --err

# Try restarting
pm2 restart goldhome-caddy

# If still failing, delete and recreate
pm2 delete goldhome-caddy
powershell -ExecutionPolicy Bypass -File scripts\start_caddy_fixed.ps1
```

### Port 443 conflict?
```powershell
# Find what's using port 443
netstat -ano | findstr ":443"

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Check if Caddy is serving
Visit: https://malialtwni.com

## What Was Changed
1. Created PM2 ecosystem config for Caddy (`ecosystem.caddy.config.cjs`)
2. Set PM2 to run Caddy as a binary (not Node.js app)
3. Configured automatic restart on failure
4. Saved PM2 configuration for persistence
5. Created helper scripts for status checking and startup

## Notes
- Caddy will automatically obtain/renew SSL certificates
- PM2 will restart Caddy if it crashes (up to 30 times)
- Minimum uptime of 10 seconds before considering restart
- 3-second delay between restarts
