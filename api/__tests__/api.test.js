const request = require('supertest')

const app = require('../../test/app/test-express-app')
const ChaincodeServiceMock = jest.genMockFromModule("../../service/chaincode/chaincode-service")

require('../../api')(app, {}, {}, new ChaincodeServiceMock())

const TEST_CHAINCODE_NAME = 'test-chaincode'

test('Chaincode install processing', async () => {
    await request(app)
        .post('/chaincodes/external')
        .field('version', '1.0')
        .attach('file', Buffer.from('test'), 'test.tar.gz')
        .expect(200)
})
