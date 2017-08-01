module.exports = {
  apps: [
    {
      name: 'flashman',
      script: 'bin/www',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      autorestart: true,
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
      exec_mode: "cluster"
    }
  ]
};
