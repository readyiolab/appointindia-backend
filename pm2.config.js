module.exports = {
  apps: [
    {
      name: 'job-portal-backend',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
