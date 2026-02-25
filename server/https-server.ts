
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Express } from 'express';
import { log } from './vite';

export function createHttpsServer(app: Express) {
  const sslKeyPath = process.env.SSL_KEY_PATH;
  const sslCertPath = process.env.SSL_CERT_PATH;
  
  if (!sslKeyPath || !sslCertPath) {
    log('⚠ SSL certificate paths not configured. Using HTTP instead.');
    return null;
  }

  try {
    const privateKey = fs.readFileSync(path.resolve(sslKeyPath), 'utf8');
    const certificate = fs.readFileSync(path.resolve(sslCertPath), 'utf8');
    
    const credentials = {
      key: privateKey,
      cert: certificate,
      // Optional: Add CA bundle if using intermediate certificates
      // ca: fs.readFileSync(path.resolve('/path/to/ca_bundle.crt'), 'utf8')
    };

    const httpsServer = https.createServer(credentials, app);
    log('✓ HTTPS server configured successfully');
    
    return httpsServer;
  } catch (error) {
    log(`✗ Failed to configure HTTPS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}
