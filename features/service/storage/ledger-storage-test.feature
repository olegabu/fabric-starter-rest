Feature: Store chaincodes and apps in ledger
  Store and handle apps and chaincode in ledgers

  Background: "peer0.org1.example.test" is started (orderer, peer, api, dns-chaincode).
#    Given peer0.org1.example.test and node is up

  Scenario: Store chaincode package in ledger
    Endpoint POST /storage/chaincode should store the package in ledger
    Given No package with id "test-chaincode" present
    When User invokes POST /storage/chaincode with params chaincodeId="test-chaincode" version="1" package payload
    Then subkey "test-chaincode" should appear in ledger object, and contain object like {version=1, package:base64data}


