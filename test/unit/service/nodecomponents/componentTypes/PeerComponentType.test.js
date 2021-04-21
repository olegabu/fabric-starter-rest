jest.mock('../../../../../service/http/RemoteRequest')

const PeerComponentType= require('../../../../../service/nodecomponents/componentypes/PeerComponentType')
const Org = require("../../../../../model/Org");
const Component = require("../../../../../model/Component");
const remoteRequestMock = require('../../../../../service/http/RemoteRequest')
const fabricStarterRuntimeMock = jest.genMockFromModule('../../../../../service/context/fabric-starter-runtime')

const org = Org.fromConfig({myIp: 'localhost'});
const component = new Component({componentType: 'PEER', componentIp: 'remotehost'}, [{"fieldname": "file_peer0", "originalname": "test.tgz"}]);

describe('PeerComponentType', () => {
    it('should redirect remote peer to remote host', () => {
        const peerComponentType = new PeerComponentType(fabricStarterRuntimeMock);
        peerComponentType.deployRemote(org, {}, component)

        expect(remoteRequestMock.deployComponent).toBeCalledWith(org, component)
    })
})