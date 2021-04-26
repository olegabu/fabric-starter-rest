const Org = require("../../../../model/Org");
const Component = require("../../../../model/Component");
const componentDeployer = require("../../../../service/nodecomponents/ComponentDeployer");

const componentTypeMock = {deployRemote: jest.fn()}

describe('ComponentDeployer', () => {
    it('should call `deployRemote` if component is intended for remote host', () => {
        const org = Org.fromConfig({myIp: 'localhost'});
        const component = new Component({componentType: 'PEER', componentIp: 'remotehost'});
        componentDeployer.deploy(org, {}, component, componentTypeMock)

        expect(componentTypeMock.deployRemote).toHaveBeenCalled()
    })
})