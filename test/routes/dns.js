'use strict';

const assert = require('assert');
// const expect = require('chai').expect;
const randomstring = require('randomstring');


describe('dns-middleware', function () {
    this.timeout(2000);

    const util = require('../../util');
    const dnsMiddle = require('../../routes/dns.js');


    before('initialize', async () => {
    });

    describe('Test Host file content', () => {

        describe('#mergHostRecords', () => {
            it('test new records are appended but not duplicated', () => {
                const currHosts = util.linesToKeyValueList(["192.168.99.1 aaa.com www.aaa.com"]);
                assert.deepStrictEqual(currHosts, {"192.168.99.1": "aaa.com www.aaa.com"});

                let newHosts = {"192.168.99.1": "bbb.com aaa.com"};
                const mergedHosts = util.mergeKeyValueLists(currHosts, newHosts);

                assert.deepStrictEqual(mergedHosts, {"192.168.99.1": "aaa.com www.aaa.com bbb.com"})

            });
        });
    });
});