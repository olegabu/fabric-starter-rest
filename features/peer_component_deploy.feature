Feature: Peer component deployment
  Deployment of peer component by API backend agent
  Request:
  org: {"domain":"example.com","masterIp":"localhost","orgIp":"localhost","enrollSecret":"adminpw","orgId":"org1","REMOTE_ORDERER_DOMAIN":"example.com"}
  components: [{"values":{"updateCount":1,"domain":"example.com","masterIp":"localhost","orgIp":"localhost","enrollSecret":"adminpw","REMOTE_ORDERER_DOMAIN":"example.com","componentType":"PEER","name":"peer2","peerPort":"7051","BOOTSTRAP_PEER_NAME":"peer0","BOOTSTRAP_PEER_PORT":"7051"},"file_values":{}}]

  Background: Start node "peer0.org1.example.test" (orderer, peer, api).
#    Given peer0.org1.example.test and node is up, services ""

  Scenario: Deploy peer2 in remote mode (from peer0's node).
  User can deploy another peer for same org on a new (secondary) node remotely from peer0's node
    Given Org masterIp (peer0) is configured with orgIp=masterIp="172.17.0.1"
      #TODO

    When User creates topology for component peer "peer2" and componentIp="second-peer-ip-addr"
    And  User makes POST /node/components request to primary peer0 node API agent

    Then Peer "peer2" is enrolled to CA
    Then Peer "peer2" is enrolled to TLSCA
    Then DNS record for peer0 and orderer is written to _etc_hosts
    Then Peer "peer2" is registered in DNS chaincode
    Then Peer "peer2" container is started with corresponded ENV
