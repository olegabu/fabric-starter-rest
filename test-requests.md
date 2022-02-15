

# Form-url-encoded POST

```bash
BOOTSTRAP_HOST=localhost:4000
ORG_HOST=remotehost:4000
#BOOTSTRAP_HOST=api.org1.example.com:4000


# Orderer TLS
curl http://${BOOTSTRAP_HOST}:4000/node/msp/orderer --output msp_orderer.tgz


MSP_FILE=msp_org2.tgz

# Get MSP archive:
curl http://${ORG_HOST}/node/msp/org --output ${MSP_FILE} 
#OR
tar czf msp_org2.tgz peerOrganizations ordererOrganizations


# Send integration request with certs:
curl -i --connect-timeout 30 --max-time 120 --retry 1 -k http://${BOOTSTRAP_HOST}/integration/service/orgs \
  -F peerName="peer0"  -F orgId="org2" -F domain="example.com" -F orgIp="192.168.99.128" -F peerPort="7051" -F wwwPort="80" \
  -F certFiles=@${MSP_FILE}
  

# Add org to channel (with certs)
JWT=`(curl -d '{"username":"user1","password":"pass"}' -H "Content-Type: application/json" http://${BOOTSTRAP_HOST}/users | tr -d '"')`

curl -i --connect-timeout 30 --max-time 120 --retry 1 -k http://${BOOTSTRAP_HOST}/channels/:channelId/orgs \
  -H "Authorization: Bearer $JWT" \
  -F peerName="peer0"  -F orgId="org2" -F domain="example.com" -F orgIp="192.168.99.128" -F peerPort="7051" -F wwwPort="80" \
  -F certFiles=@${MSP_FILE}

# Add org to consortium
/consortium/members


# Raft orderer
 
tar czf msp-orderer.tgz -C crypto-config/ordererOrganizations/example2.com/ msp

#sudo chown -R $USER crypto-config

curl -i -k  --connect-timeout 30 --max-time 240 --retry 0 \
  http://${BOOTSTRAP_HOST}/integration/service/raft  \
    -F ordererName=orderer -F domain=osn-org2 -F ordererPort=7050 -F wwwPort=80 -F ordererIp=192.168.1.23 \
    -F orgId=org2 -F certFiles=@msp-orderer.tgz \
    --output crypto-config/configtx/example2.com/genesis.pb
     


#
DNS
registerOrg '{"orgId":"test","domain":"domain2.com","orgIp":"192.1.1.1","peerPort":"7051"}'
registerOrderer '{"ordererName":"test-orderer", "domain":"ex2.com", "ordererPort":"7050", "ordererIp":"192.168.99.1","orgId":"org2"}'
```



# Multipart post
curl 'http://localhost:4000/chaincodes' -X POST  -H "Authorization: Bearer $JWT" --data-binary 


tar czf msp-orderer.tgz -C crypto-config/ordererOrganizations/ex2.com/ msp

curl -k -0 --connect-timeout 30 --max-time 240 --retry 0 \
  http://192.168.99.1:4000/integration/service/raft  \
    -F ordererName=orderer -F domain=ex2.com -F ordererPort=7050 -F wwwPort=8000 -F ordererIp=192.168.99.100 \
    -F orgId=org11 -F certFiles=@msp-orderer.tgz \
    --output crypto-config/configtx/ex2.com/genesis.pb

curl -v http://localhost:4000/node/msp/org --output msp-org.tgz

curl -i --connect-timeout 30 --max-time 120 --retry 1 -k http://192.168.99.1:4000/integration/service/orgs \
  -F peerName="peer0"  -F orgId="org12" -F domain="example2.com" -F orgIp="192.168.1.23" -F peerPort="8051" -F wwwPort="81" \
  -F certFiles=@msp-org.tgz
  
  
  
  curl -i --connect-timeout 30 --max-time 120 --retry 1 -k http://192.168.99.1:4000/channels/test/orgs \
    -H "Authorization: Bearer $JWT" \
    -F peerName="peer0"  -F orgId="org11" -F domain="ex2.com" -F orgIp="192.168.99.100" -F peerPort="7051" -F wwwPort="8000"
    
    
https://cloud.redhat.com/blog/grpc-or-http/2-ingress-connectivity-in-openshift
https://kubernetes.io/blog/2018/11/07/grpc-load-balancing-on-kubernetes-without-tears/

https://www.educba.com/java-runtimeexception/

https://github.com/hyperledger/fabric-samples/tree/main/test-network-k8s
https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html



tar czf msp-orderer.tgz -C crypto-config ordererOrganizations/example2.com/msp

curl -v -k  --connect-timeout 30 --max-time 240 --retry 0 \
http://192.168.99.1:4000/integration/service/raft \
-F ordererName=orderer -F domain=org2-osn.example.com -F ordererPort=7050 -F wwwPort=79 -F ordererIp=192.168.99.131 \
-F orgId=org2 -F certFiles=@msp-orderer.tgz \
--output crypto-config/configtx/org2-osn.example.com/genesis.pb


'{"172.17.0.1": "orderer.example.com www.example.com www.orderer.example.com www.org1.example.com peer0-org1.example.com","192.168.99.131": "orderer.org2-osn.example.com www.org2-osn.example.com www.orderer.org2-osn.example.com orderer.org2-osn.example.com www.org2-osn.example.com www.orderer.org2-osn.example.com"}'


curl 'http://localhost:4000/channels/common/chaincodes/dns' \ 
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer ' \
--data-raw '{"chaincodeId":"dns","channelId":"common","fcn":"put","args":["a","19"],"targets":[],"waitForTransactionEvent":true,"funccall_stub":"put a 19"}'


curl -i -v  --connect-timeout 30 --max-time 120 --retry 1 -k http://192.168.99.1:4000/integration/service/orgs \
-F peerName="peer0"  -F orgId="org2" -F domain="example.com" -F orgIp="172.18.0.3" -F peerPort="8051" -F wwwPort="811" \
-F certFiles=@msp-org.tgz


registerOrg '{"orgId":"org1","domain":"example.com","orgIp":"192.168.99.1","peerPort":"443"}'
registerOrderer '{"ordererName":"orderer", "domain":"example.com", "ordererPort":"443", "ordererIp":"192.168.99.1","orgId":"org1"}'

registerOrg '{"orgId":"org2","domain":"example.com","orgIp":"192.168.99.1","peerPort":"8051"}'


 1:  _gateway (192.168.101.1)                              0.243ms asymm 64
 2:  100.64.96.38 (100.64.96.38)                           0.255ms
 3:  169.254.10.13 (169.254.10.13)                         0.490ms
 4:  169.254.6.13 (169.254.6.13)                           1.162ms
 5:  no reply
 6:  no reply
 7:  172.16.30.4 (172.16.30.4)                             1.054ms
 8:  172.16.30.63 (172.16.30.63)                           1.392ms
 9:  169.254.0.3 (169.254.0.3)                             1.589ms
10:  178.176.150.190 (178.176.150.190)                     2.358ms
11:  83.169.204.114 (83.169.204.114)                       3.403ms asymm 12
12:  10.222.99.88 (10.222.99.88)                           2.747ms
13:  178.176.150.217 (178.176.150.217)                     3.464ms asymm 12
14:  172.21.3.142 (172.21.3.142)                           4.360ms (This broken router returned corrupted payload) asymm 12
15:  172.21.3.59 (172.21.3.59)                             4.517ms (This broken router returned corrupted payload) asymm 12
16:  172.21.3.63 (172.21.3.63)                             4.389ms asymm 12
17:  no reply
18:  no reply


140019564836672:error:0200206E:system library:connect:Connection timed out:crypto/bio/b_sock2.c:110:
140019564836672:error:2008A067:BIO routines:BIO_connect:connect error:crypto/bio/b_sock2.c:111:
connect:errno=110






[user@ift-bcdx-partner0 ~]$ tracepath -p 7051 -n 84.252.147.75 -b
 1?: [LOCALHOST]                      pmtu 1500
 1:  192.168.101.1 (_gateway)                              0.215ms asymm 64
 1:  192.168.101.1 (_gateway)                              0.179ms asymm 64
 2:  100.64.96.38 (100.64.96.38)                           0.302ms
 3:  169.254.10.1 (169.254.10.1)                           1.328ms
 4:  169.254.6.9 (169.254.6.9)                             1.794ms
 5:  no reply
 6:  no reply
 7:  172.16.30.68 (172.16.30.68)                           1.279ms
 8:  172.16.30.125 (172.16.30.125)                         1.414ms
 9:  no reply
10:  178.176.150.190 (178.176.150.190)                     2.297ms
11:  83.169.204.118 (83.169.204.118)                       3.522ms asymm 12
12:  10.222.99.88 (10.222.99.88)                           2.916ms
13:  178.176.150.217 (178.176.150.217)                     3.690ms asymm 12
14:  172.21.3.142 (172.21.3.142)                           4.198ms (This broken router returned corrupted payload) asymm 12
15:  172.21.3.59 (172.21.3.59)                             4.414ms (This broken router returned corrupted payload) asymm 12
16:  172.21.3.63 (172.21.3.63)                             4.447ms asymm 12
17:  no reply

[user@ift-bcdx-partner0 ~]$ date
Tue Feb 15 12:42:08 MSK 2022

[user@ift-bcdx-partner0 ~]$





[user@ift-bcdx-partner0 ~]$ openssl s_client -connect 84.252.147.75:7051
^C
[user@ift-bcdx-partner0 ~]$ openssl s_client -connect 84.252.147.75:7051
139870375515968:error:0200206E:system library:connect:Connection timed out:crypto/bio/b_sock2.c:110:
139870375515968:error:2008A067:BIO routines:BIO_connect:connect error:crypto/bio/b_sock2.c:111:
connect:errno=110

[user@ift-bcdx-partner0 ~]$ date
Tue Feb 15 12:29:39 MSK 2022

[user@ift-bcdx-partner0 ~]$ tracepath 84.252.147.75 -p 7051
 1?: [LOCALHOST]                      pmtu 1500
 1:  _gateway                                              0.201ms asymm 64
 1:  _gateway                                              0.169ms asymm 64
 2:  100.64.96.38                                          0.402ms
 3:  169.254.10.1                                          0.552ms
 4:  169.254.6.13                                          1.018ms
 5:  no reply
 6:  no reply
 7:  172.16.30.4                                           1.033ms
 8:  172.16.30.61                                          1.640ms
 9:  169.254.0.3                                           1.499ms
10:  178.176.150.190                                       2.190ms
11:  83.169.204.114                                        3.378ms asymm 12
12:  10.222.99.88                                          2.799ms
13:  178.176.150.217                                       3.400ms asymm 12
14:  172.21.3.142                                          4.571ms (This broken router returned corrupted payload) asymm 12
15:  172.21.3.59                                           4.402ms (This broken router returned corrupted payload) asymm 12
16:  172.21.3.63                                           4.563ms asymm 12
17:  no reply
18:  no reply
19:  no reply
20:  no reply
21:  no reply
22:  no reply
23:  no reply
24:  no reply
25:  no reply
26:  no reply
^C
[user@ift-bcdx-partner0 ~]$ date
Tue Feb 15 12:30:38 MSK 2022