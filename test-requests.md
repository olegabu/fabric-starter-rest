


# Multipart post
curl 'http://localhost:4000/chaincodes' -X POST  -H "Authorization: Bearer $JWT" --data-binary 


MSP archive:
```bash

HOST=localhost:4000
#HOST=api.org1.example.com:4000

MSP_FILE=msp.tgz

curl http://${HOST}/node/msp --output ${MSP_FILE} 

curl -i --connect-timeout 30 --max-time 120 --retry 1 -k http://${HOST}/integration/service/orgs_with_certs \
  -F peerName="peer0"  -F orgId="org2" -F domain="example.com" -F orgIp="orgIp" -F peerPort="8051" -F wwwPort="82" \
  -F certFiles=@${MSP_FILE} 


curl -F person=anonymous -F secret=@file.txt http://example.com/submit.cgi 

```


