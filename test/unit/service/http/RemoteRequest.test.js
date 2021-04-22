// jest.mock('http')
// const httpMock = require('http')
const nock = require('nock')

const axios = require("axios");
const remoteRequest = require("../../../../service/http/RemoteRequest")

const Org = require("../../../../model/Org");
const Component = require("../../../../model/Component");

axios.defaults.adapter = require('axios/lib/adapters/http')

test('deploy remote component request', async () => {

    const scope = nock('https://remotehost')
        .log(console.log)
        .post('/node/components', (body) => {
            console.log("Remote deploy body:", body)
            return true
        })
        // .reply(200, 'domain matched', {'Access-Control-Allow-Origin': '*'})
        .reply((uri, requestBody) => {
            console.log(this.req)
        })

    const response = await remoteRequest.deployComponent(Org.fromConfig({myIp: 'localhost'}), new Component({
        componentIp: 'remotehost',
        componentName: 'peer0.org1.example.com',
        componentType: 'PEER'
    }))

    nock.restore()
    // expect(httpMock.request).toBeCalledWith({hostname: 'x.x.x.x'})
})
