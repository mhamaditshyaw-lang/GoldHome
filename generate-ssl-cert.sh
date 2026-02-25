
#!/bin/bash

# Generate self-signed SSL certificate for local deployment
# This creates a certificate valid for 365 days

echo "Generating self-signed SSL certificate for local deployment..."

# Create ssl directory if it doesn't exist
mkdir -p ./ssl

# Generate private key
openssl genrsa -out ./ssl/private.key 2048

# Generate certificate signing request (CSR)
openssl req -new -key ./ssl/private.key -out ./ssl/certificate.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.local"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in ./ssl/certificate.csr \
  -signkey ./ssl/private.key -out ./ssl/certificate.crt

# Set proper permissions
chmod 600 ./ssl/private.key
chmod 644 ./ssl/certificate.crt

echo "✓ SSL certificate generated successfully!"
echo "  Private Key: ./ssl/private.key"
echo "  Certificate: ./ssl/certificate.crt"
echo ""
echo "Update your .env.local file with:"
echo "  SSL_KEY_PATH=./ssl/private.key"
echo "  SSL_CERT_PATH=./ssl/certificate.crt"
echo ""
echo "Note: This is a self-signed certificate. Browsers will show a warning."
echo "For production, use Let's Encrypt or a trusted CA."

# Clean up CSR file
rm ./ssl/certificate.csr
