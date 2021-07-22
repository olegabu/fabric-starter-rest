const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const tmp = require('tmp-promise');
const streams = require('../../../util/stream/streams')
const {Base64Encode, Base64Decode} = require('base64-stream')
const fileUtils = require('../../../util/fileUtils');

/*jest.mock('tmp-promise', () => {
    return {
        dir: () => {
            return {path: '/tmp/test-path'}
        },
        cleanup:()=>{
            jest.requireActual('../../http/FormDataFactory');

        }
    }
});*/

const ChaincodeService = require('../chaincode-service')
const FabricStarterClientMock = jest.genMockFromModule('../../../fabric-starter-client')
const fabricStarterClientMock = new FabricStarterClientMock();


const fabricStarterRuntimeMock = {
    getDefaultFabricStarterClient: () => {
        return fabricStarterClientMock
    }
}

const chaincodeService = new ChaincodeService(fabricStarterRuntimeMock);


const TEST_CHAINCODE_ID = 'testChaincode';
const TEST_TMP_ROOT_DIR = path.join(tmp.tmpdir, 'test-tmp-dir')


const TEST_CHAINCODE_ARCHIVE = 'UEsDBAoAAAAAAPyA6FIAAAAAAAAAAAAAAAAOABwAdGVzdENoYWluY29kZS9VVAkAA6z45mDF+OZg' +
    'dXgLAAEE6QMAAATpAwAAUEsDBAoAAAAAAPyA6FIAAAAAAAAAAAAAAAATABwAdGVzdENoYWluY29k' +
    'ZS8ua2VlcFVUCQADrPjmYKz45mB1eAsAAQTpAwAABOkDAABQSwECHgMKAAAAAAD8gOhSAAAAAAAA' +
    'AAAAAAAADgAYAAAAAAAAABAA/UEAAAAAdGVzdENoYWluY29kZS9VVAUAA6z45mB1eAsAAQTpAwAA' +
    'BOkDAABQSwECHgMKAAAAAAD8gOhSAAAAAAAAAAAAAAAAEwAYAAAAAAAAAAAAtIFIAAAAdGVzdENo' +
    'YWluY29kZS8ua2VlcFVUBQADrPjmYHV4CwABBOkDAAAE6QMAAFBLBQYAAAAAAgACAK0AAACVAAAA' +
    'AAA='

describe('ChaincodeService', () => {
    it('for not golang should call `installChaincode` with tmp path', async () => {

        await fs.emptyDir(TEST_TMP_ROOT_DIR)

        await chaincodeService.installChaincodeFromStream(
            TEST_CHAINCODE_ID,
            {version: '1.0', archiveType: '.zip', language: 'node'},
            streams.stringToStream(TEST_CHAINCODE_ARCHIVE).pipe(new Base64Decode()),
            {tmpRootDir: TEST_TMP_ROOT_DIR}
        )

        expect(fabricStarterRuntimeMock.getDefaultFabricStarterClient().installChaincode)
            .toHaveBeenCalledWith(TEST_CHAINCODE_ID, expect.anything(), '1.0', 'node')

        const tmDirContent = await fileUtils.readDir(TEST_TMP_ROOT_DIR);
        expect(tmDirContent).toHaveLength(0)
    })

    it('for GOLANG should call `installChaincode` with go-path', async () => {

        await fs.emptyDir(TEST_TMP_ROOT_DIR)

        const gopath = path.join(TEST_TMP_ROOT_DIR, 'gopath', 'src');
        const tmpPath = await chaincodeService.installChaincodeFromStream(
            TEST_CHAINCODE_ID,
            {version: '1.0', archiveType: '.zip', language: 'golang'},
            streams.stringToStream(TEST_CHAINCODE_ARCHIVE).pipe(new Base64Decode()),
            {tmpRootDir: TEST_TMP_ROOT_DIR, gopath: gopath}
        )

        expect(tmpPath).toEqual(gopath)

        expect(fabricStarterRuntimeMock.getDefaultFabricStarterClient().installChaincode)
            .toHaveBeenCalledWith(TEST_CHAINCODE_ID, expect.anything(), '1.0', 'golang')

        const tmDirContent = await fileUtils.readDir(tmpPath);
        expect(tmDirContent).toHaveLength(0)
    })
})