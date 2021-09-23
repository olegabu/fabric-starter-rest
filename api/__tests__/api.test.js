const request = require('supertest')

const Files = require("../../model/Files");


const app = require('../../test/app/test-express-app')
require('../../api')(app, {}, {}, {})

const TEST_CHAINCODE_NAME='test-chaincode'

test('Chaincode install processing', async () => {
    await request(app)
        .post('/chaincodes/external')
        .field('version', '1.0')
        .field('targets', '[]')
        // .attach('file', 'test.tgz')
        .expect(200)
    /*
            .buffer()
            .parse((res, cb)=>{
                expect(res.pipe).toBeTruthy()
                cb()
            })
    */


    expect(componentsManagerMock.deployTopology).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(),
        [expect.objectContaining(expectedComponent)], expect.anything())
})
