openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out jetty.crt -keyout jetty.key -subj "/C=RU/L=Moscow/CN=Jenkins TLS"
openssl pkcs12 -inkey jetty.key -in jetty.crt -export -out jetty.pkcs12
keytool -importkeystore -srckeystore jetty.pkcs12 -srcstoretype PKCS12 -destkeystore keystore.jks