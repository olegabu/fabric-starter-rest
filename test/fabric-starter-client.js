const assert = require('assert');
const logger = require('log4js').getLogger('FabricStarterClientTest');
const fs = require('fs-extra');
const randomstring = require('randomstring');

const cfg = require('../config.js');

describe('FabricStarterClient.', function () {
  this.timeout(4000);

  const FabricStarterClient = require('../fabric-starter-client');
  const fabricStarterClient = new FabricStarterClient();

  let username = 'user7';
  let password = 'pass7';

  let channelId = 'common';
  let chaincodeId = 'reference';
  let fcn = 'ping';
  let args = [];

  before('initialize', async () => {
    await fabricStarterClient.init();
  });

  describe('Login regular user.', () => {

    describe('#loginOrRegister', () => {
      it('logs in or registers with username and password then logs in with username only', async () => {
        await fabricStarterClient.loginOrRegister(username, password);
        assert(fabricStarterClient.user, 'cannot get user from loginOrRegister');
        await fabricStarterClient.login(fabricStarterClient.user.getName());
      });
    });

    describe('#register stores keys and subsequent #login passes without password', () => {
      async function deleteStore() {
        try {
          await fs.remove('./hfc-cvs');
          await fs.remove('./hfc-kvs');
        } catch (e) {
          logger.error('cannot remove dirs', e);
        }
        await fabricStarterClient.init();
      }

      beforeEach('delete key and user store and initialize', async () => {
        await deleteStore();
      });

      afterEach('delete key and user store and initialize', async () => {
        await deleteStore();
      });

      it('registers with existing username and password, recovers if already registered then logs in' +
        ' without password', async () => {
        try {
          await fabricStarterClient.register(username, password);
        } catch (e) {
          if (e.message.includes('already registered')) {
            await fabricStarterClient.login(username, password);
          } else {
            assert.fail('failed to register ' + e);
          }
        }

        await fabricStarterClient.login(username);

        await deleteStore();

        try {
          await fabricStarterClient.login(username);
          assert.fail('should fail login with no password');
        } catch (e) {
          logger.trace('failed login with no password');
        }

        try {
          await fabricStarterClient.login(username, password);
          logger.trace('logged in with password');
        } catch (e) {
          assert.fail('failed to login with password ' + e);
        }

      });

      it('registers with random username and password then logs in without password', async () => {
        const random = randomstring.generate();
        const rusername = 'user' + random;
        const rpassword = 'pass' + random;

        try {
          await fabricStarterClient.register(rusername, rpassword);
        } catch (e) {
          assert.fail('failed to register ' + e);
        }

        await fabricStarterClient.login(rusername, rpassword);

        await fabricStarterClient.login(rusername);

        await deleteStore();

        try {
          await fabricStarterClient.login(rusername);
          assert.fail('should fail login with no password');
        } catch (e) {
          logger.trace('failed login with no password');
        }

        try {
          await fabricStarterClient.login(rusername, rpassword);
          logger.trace('logged in with password');
        } catch (e) {
          assert.fail('failed to login with password ' + e);
        }

      });

    });
  });

    describe('Create-Join channel', () => {
        before('login', async () => {
            await fabricStarterClient.loginOrRegister(username, password);
        });

        let testChannelName = "common";

        describe('#createChannelCommon', () => {
            it('create channel "Common"', async () => {
                let result = await fabricStarterClient.createChannel(testChannelName);
                await setTimeout(function () {}, 1000);
                const channel = await fabricStarterClient.getChannel(testChannelName, true);
                assert.equal(channel.getName(), testChannelName);
            })
        });

        describe('#joinChannelCommon', () => {
            it('join channel "Common"', async () => {
                try {
                    await fabricStarterClient.joinChannel(testChannelName);
                    assert.fail('should fail joining second time');
                } catch (e) {
                    console.log(e);
                    assert.ok(e.actual == "should fail joining second time");
                }
            })
        });

        describe('#updateChannelConfig', () => {
            it('add org to channel', async () => {
                await fabricStarterClient.addOrgToChannel(testChannelName, "org2");
                assert.ok(false);
            })
        })
    });

    describe('Consortium access', () => {
        before('login', async () => {
            await fabricStarterClient.loginOrRegister(username, password);
        });

      describe('#getConsortiumMembers', () => {
          it('get Consortium members', async () => {
              let orgs = await fabricStarterClient.getConsortiumMemberList();
              let result = orgs[0]
              logger.warn('result ', result)
              assert.equal(result, 'org1')
          })
      })

  });


  describe('Query peer.', () => {

    before('login', async () => {
      await fabricStarterClient.loginOrRegister(username, password);
    });

    describe('#queryInstalledChaincodes', () => {
      it('queries chaincodes installed on peer', async () => {
        const installedChaincodes = await fabricStarterClient.queryInstalledChaincodes();
        logger.trace('installedChaincodes', installedChaincodes);
      });
    });

    describe('#getMspid', () => {
      it('returns mspid of the client', async () => {
        const mspid = fabricStarterClient.getMspid();
        logger.trace('mspid', mspid);
      });
    });

    describe('#queryChannels', () => {
      it('queries channels this peer joined', async () => {
        const channels = await fabricStarterClient.queryChannels();
        logger.trace('channels', channels);
      });
    });
  });

  describe('Query channel.', () => {

    before('login', async () => {
      await fabricStarterClient.loginOrRegister(username, password);
    });

    describe('#queryInfo', () => {
      it('queries blockchain info of this channel', async () => {
        const channels = await fabricStarterClient.queryChannels();
        channels.forEach(async c => {
          const blockchainInfo = await fabricStarterClient.queryInfo(c.channel_id);
          logger.trace('blockchainInfo for ' + c.channel_id, blockchainInfo);
        });
      });
    });

    describe('#getOrganizations #getPeersForOrgOnChannel #peersForOrg', () => {
      it('queries organizations of this channel then queries peers of each organization', async () => {
        const channels = await fabricStarterClient.queryChannels();
        channels.forEach(async c => {
          const organizations = await fabricStarterClient.getOrganizations(c.channel_id);
          logger.trace('organizations for ' + c.channel_id, organizations);

          const peersForOrgOnChannel = fabricStarterClient.getPeersForOrgOnChannel(c.channel_id);
          logger.trace('peers of my org for ' + c.channel_id, peersForOrgOnChannel);

          organizations.forEach(async org => {
            const orgName = org.id;
            const peersForOrg = await fabricStarterClient.getPeersForOrg(orgName);
            logger.trace('peers of ' + orgName + ' for ' + c.channel_id, peersForOrg);
          });
        });
      });
    });

    describe('#queryInstantiatedChaincodes', () => {
      it('queries chaincodes instantiated on this channel', async () => {
        const channels = await fabricStarterClient.queryChannels();
        channels.forEach(async c => {
          const instantiatedChaincodes = await fabricStarterClient.queryInstantiatedChaincodes(c.channel_id);
          logger.trace('instantiatedChaincodes for ' + c.channel_id, instantiatedChaincodes);
        });
      });
    });

  });

  describe('Invoke and query chaincode.', () => {

    before('login', async () => {
      await fabricStarterClient.loginOrRegister(username, password);
    });

    describe('#invoke', () => {
      it('invokes chaincode on this channel', async () => {
        await fabricStarterClient.registerBlockEvent(channelId, block => {
          logger.debug('block', block);
        }, e => {
          logger.error('registerBlockEvent', e);
        });

        const invokeResponse = await fabricStarterClient.invoke(channelId, chaincodeId, fcn, args);
        logger.trace('invokeResponse', invokeResponse);

        await fabricStarterClient.disconnectChannelEventHub(channelId);
      });
    });

    describe('#query', () => {
      it('queries chaincode on this channel', async () => {
        const queryResponses = await fabricStarterClient.query(channelId, chaincodeId, fcn, args);
        logger.trace('queryResponses', queryResponses);
      });
    });
  });

}); // FabricStarterClient