#!/bin/sh

set -e

flashman_mqtt_cert_root=$1
flashman_domain=$2
destination_user=$3

for domain in $RENEWED_DOMAINS; do
  case $domain in
  $flashman_domain)

    # Make sure the certificate and private key files are
    # never world readable, even just for an instant while
    # we're copying them into flashman MQTT cert root.
    umask 077

    cp "$RENEWED_LINEAGE/fullchain.pem" "$flashman_mqtt_cert_root/cert.pem"
    cp "$RENEWED_LINEAGE/privkey.pem" "$flashman_mqtt_cert_root/key.pem"

    # Apply the proper file ownership and permissions for
    # the daemon to read its certificate and key.
    chown $destination_user "$flashman_mqtt_cert_root/cert.pem" \
      "$flashman_mqtt_cert_root/key.pem"
    chmod 400 "$flashman_mqtt_cert_root/cert.pem" \
      "$flashman_mqtt_cert_root/key.pem"

    ;;
  esac
done