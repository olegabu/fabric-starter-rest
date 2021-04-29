const _ = require('lodash')
const nock = require('nock')
const axios = require("axios");
axios.defaults.adapter = require('axios/lib/adapters/http')

const Org = require("../../../model/Org");
const Component = require("../../../model/Component");
const remoteRequest = require("../RemoteComponentRequest")
const Files = require("../../../model/Files");

jest.mock('../../http/FormDataFactory', () => {
    return {
        createFormData: (fields, files) => {
            const OriginalFormDataFabric = jest.requireActual('../../http/FormDataFactory');
            const {formData, formDataHeaders} = OriginalFormDataFabric.createFormData(fields, files);
            return {formData: JSON.stringify(formData), formDataHeaders}
        }
    }
})

const TEST_REMOTE_PROTOCOL = 'http'
const TEST_REMOTE_HOST = 'remotehost'
const TEST_REMOTE_PORT = 4443

test('deploy remote component request', async () => {

    const scope = nock(`${TEST_REMOTE_PROTOCOL}://${TEST_REMOTE_HOST}:${TEST_REMOTE_PORT}`)
        .matchHeader('content-type', /^multipart\/form-data;.*/)
        .post('/node/components', body => {
            checkMultipartData(body, 'form-data; name="org"');
            checkMultipartData(body, '"orgIp":"remotehost"');
            checkMultipartData(body, '[{"values":{');
            checkMultipartData(body, `form-data; name="${Files.componentFileName('peer0')}"; filename="file.tgz"`);
            return true;//&& filedPresent
        })
        .reply(200, "", {'Access-Control-Allow-Origin': '*'})

    const testComponent = new Component({
            name: 'peer0',
            componentType: 'PEER',
            componentIp: TEST_REMOTE_HOST,
            externalPort: TEST_REMOTE_PORT,
            communicationProtocol: TEST_REMOTE_PROTOCOL,
            componentName: 'peer0.org1.example.com'
        },
        [{fieldname: Files.componentFileName('peer0'), path: 'file.tgz'}]
    );

    const response = await remoteRequest.requestRemoteComponentDeployment(
        Org.fromOrg({orgIp: 'localhost'}),
        testComponent
    )

    nock.restore() //required with jest
})

function checkMultipartData(body, content) {
    if (!_.find(body._streams, fieldPart => _.includes(fieldPart, content)))
        throw new Error(`Fragment ${content} is not found in multipart body`)
}