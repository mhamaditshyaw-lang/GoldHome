module.exports = {
  apps: [
    {
      name: 'goldhome',
      script: 'dist/index.js',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://hama:1c92AMVkvM91Ku@localhost:5432/altwn',
        SESSION_SECRET: 'bS6T09EEjFy1Ep3OiY4Ua26D9ihXFhkc',
        SESSION_COOKIE_SECURE: 'false'
      }
    }
  ]
};
