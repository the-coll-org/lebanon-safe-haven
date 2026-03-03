#!/bin/bash
# Run this after DNS is configured

echo "Obtaining SSL certificate for safehaven.thecoll.org..."
certbot --nginx -d safehaven.thecoll.org --non-interactive --agree-tos -m admin@thecoll.org

echo ""
echo "SSL setup complete! Testing HTTPS..."
curl -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://safehaven.thecoll.org

echo ""
echo "Auto-renewal is configured via systemd timer."
