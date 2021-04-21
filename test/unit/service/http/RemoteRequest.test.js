jest.mock('http')
const remoteRequest = require("../../../../service/http/RemoteRequest")
const Org = require("../../../../model/Org");

const httpMock = require('http')


test('start remote component request', async () => {

    await remoteRequest.deployComponent(Org.fromConfig({myIp: 'localhost'}), {
        targetIp: 'x.x.x.x',
        componentName: 'peer0.org1.example.com',
        componentType: 'PEER'
    })

    expect(httpMock.request).toBeCalledWith({hostname:'x.x.x.x'})
})
