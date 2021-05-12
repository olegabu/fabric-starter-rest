const assert = require('assert');
const {Given, When, Then} = require('cucumber');

Given('Org name is {string}, domain is {string}, primary host is {string}', function (org, domain, primaryIp) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Given('Primary Orderer is running on {string} host', function (ordererAddr) {

});

Given('FabricCA is running on {string} host', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Given('Primary node is running on {string} host', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

When('User requests to start secondary peer {string} with primary ip set to {string}', function (string, string2) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('Peer {string} is enrolled to CA', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('Peer {string} is enrolled to TLSCA', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('DNS record for peer0 and orderer is written in _etc_hosts', function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});


Then('Peer {string} is registered in DNS chaincode', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

Then('Peer {string} container is started with corresponded ENV', function (string) {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
});

