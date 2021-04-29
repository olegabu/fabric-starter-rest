jest.mock('../../../nodecomponents/RemoteComponentRequest')

const PeerComponentType = require('../PeerComponentType')
const Org = require("../../../../model/Org");
const Component = require("../../../../model/Component");
const remoteComponentRequestMock = require('../../RemoteComponentRequest')
const Files = require("../../../../model/Files");
const fabricStarterRuntimeMock = jest.genMockFromModule('../../../context/fabric-starter-runtime')

const org = Org.fromOrg({orgIp: 'localhost'});
const component = new Component({
    name: 'peer1',
    componentType: 'PEER',
    componentIp: 'remotehost'
},[]);

const expectedComponent = new Component(component.values,
    [{"fieldname": Files.componentFileName(component), stream: expect.anything(), filename: expect.anything()}]
);

describe('PeerComponentType deployment', () => {
    it('should redirect remote peer to remote host', async () => {
        const peerComponentType = new PeerComponentType(fabricStarterRuntimeMock);
        await peerComponentType.deployRemote(org, {}, component)

        const expectedOrg = Org.fromOrg({peerName: component.name});
        expect(remoteComponentRequestMock.requestRemoteComponentDeployment).toBeCalledWith(expect.objectContaining(expectedOrg), expectedComponent)
    })
})