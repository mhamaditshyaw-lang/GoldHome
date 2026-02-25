module.exports = {
    apps: [
        {
            name: 'goldhome-caddy',
            script: 'C:\\ProgramData\\chocolatey\\bin\\caddy.exe',
            args: 'run',
            cwd: 'C:\\Users\\Administrator\\Documents\\GoldHome\\GoldHomeServices95',
            interpreter: 'none',  // Don't use Node.js, run as executable
            autorestart: true,
            watch: false,
            max_restarts: 30,
            min_uptime: '10s',
            restart_delay: 3000,
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
