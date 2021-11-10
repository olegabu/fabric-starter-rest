

# Form-url-encoded POST

```bash
HOST=localhost:4000
#HOST=api.org1.example.com:4000

MSP_FILE=msp_org2.tgz

# Get MSP archive:
curl http://${HOST}/node/msp --output ${MSP_FILE} 
#OR
tar czf msp_org2.tgz peerOrganizations ordererOrganizations


# Send integration request with certs:
curl -i --connect-timeout 30 --max-time 120 --retry 1 -k http://${HOST}/integration/service/orgs_with_certs \
  -F peerName="peer0"  -F orgId="org2" -F domain="example.com" -F orgIp="orgIp" -F peerPort="8051" -F wwwPort="82" \
  -F certFiles=@${MSP_FILE} 

```



# Multipart post
curl 'http://localhost:4000/chaincodes' -X POST  -H "Authorization: Bearer $JWT" --data-binary 

