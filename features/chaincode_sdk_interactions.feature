Feature: Chaincode operations are to be delegated to SDk container

  Background: Start node "peer0.org1.example.test" (orderer, peer, api).
#    Given peer0.org1.example.test and node is up, services ""

  Scenario: Get list of installed chaincodes
  For Fabric v.2x "lifecycle" feature is used
    Given Chaincode "dns" is instantiated (committed) on channel "common"
    When Client requests list of instantiated chaincodes on channel "common"
    Then Chaincode "dns" of version "1.0" is returned

  Scenario: Install chaincode as external service
  For Fabric v.2x "lifecycle" feature is used
    Given No chaincode "test" is installed
    When Web-client requests installation of chaincode "test" as external service
    Then Exec install on peer
    And Run chaincode on the target host "localhost"

