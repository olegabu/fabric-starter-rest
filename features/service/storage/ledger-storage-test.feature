Feature: Storing chaincodes and apps in ledger
  Store and handle apps and chaincode in ledgers

  Background: "peer0.org1.example.test" is started (orderer, peer, api, dns-chaincode).
#    Given peer0.org1.example.test and node is up, services ""
    #"host-dns-helper,ca,orderer,peer"

  Scenario: Organization can save chaincode package in blockchain for using by other orgs
  Endpoint POST /storage/chaincodes is used fot storing the package in ledger
    Given Empty chaincode storage
    When User invokes POST /storage/chaincodes with params chaincodeId="test-chaincode", version="1", upload package payload
    Then subkey "test-chaincode" should appear in ledger object, and contain object like {version=1, package:base64data}
    And the list of chaincodes is returned without payload and contains "test-chaincode"

  Scenario: Upload large packages
    Given Empty chaincode storage
    When Save large package to storage