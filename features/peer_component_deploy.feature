Feature: Peer component deployment
  Deployment of peer component by backend agent

  Background: Remote Main node org1.example.test is started (orderer, peer, api).
    Given first-org-primary-node org1.example.test is up

  Scenario: Local Secondary peer deployment
    Given Org name is "org1", domain is "example.com", primary host is "127.0.0.1"
    Given Primary Orderer is running on "primary" host
    Given FabricCA is running on "primary" host
    Given Primary node is running on "primary" host
    When User requests to start secondary peer "peer2" with PRIMARY_IP set to primary host
    Then Peer "peer2" is enrolled to CA
    Then Peer "peer2" is enrolled to TLSCA
    Then DNS record for peer0 and orderer is written in _etc_hosts
    Then Peer "peer2" is registered in DNS chaincode
    Then Peer "peer2" container is started with corresponded ENV
