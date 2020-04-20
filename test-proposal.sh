https://hyperledger.github.io/fabric-sdk-node/release-1.4/tutorial-sign-transaction-offline.html


apiServer=localhost:4000

1. JWT=`(curl -d '{"username":"user1","password":"pass"}' -H "Content-Type: application/json" http://${apiServer:-localhost:4000}/users | tr -d '"')`; echo $JWT

CERT="-----BEGIN CERTIFICATE-----\nMIICbjCCAhWgAwIBAgIUEZxRPGpqHlZvPzokRmS57yKXA34wCgYIKoZIzj0EAwIw\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMjAwNDIwMTIzMzAwWhcNMjEwNDIwMTIz\nODAwWjAuMRwwDQYDVQQLEwZjbGllbnQwCwYDVQQLEwRvcmcxMQ4wDAYDVQQDEwV1\nc2VyMTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABBzV1UGQUhUwLiOSz3T4cAwg\nvPeS0o93ZfOTv1+6uelEUb31Hnbcbud/kc6vzB1J6sjHrG/aU3bBIJsyYmVMUkOj\ngcswgcgwDgYDVR0PAQH/BAQDAgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFPfk\nJNN8haub9J9DAaazu1oSbQbmMCsGA1UdIwQkMCKAINYYLydF9MDP9XVHuwzE1/12\n1Zxb1hKEbw5UOKMo0zUIMFwGCCoDBAUGBwgBBFB7ImF0dHJzIjp7ImhmLkFmZmls\naWF0aW9uIjoib3JnMSIsImhmLkVucm9sbG1lbnRJRCI6InVzZXIxIiwiaGYuVHlw\nZSI6ImNsaWVudCJ9fTAKBggqhkjOPQQDAgNHADBEAiBZkmgS62q9isP4znvnyZmj\n92dbqjjsLA93fkPysLM5UwIgULze5/4dpklR93LShm2SglAkVcS2Oq6q61YI2mNu\nmeo=\n-----END CERTIFICATE-----\n"
2. curl -H "Authorization: Bearer $JWT" -H 'Content-Type: application/json' --data-binary '{"fcn":"put","args":["a","10"],"chaincodeId":"dns","signerCertificate":"'$CERT'"}'  "http://${apiServer:-localhost:4000}/channels/common/chaincodes/dns/prepare/proposal"
Ответ: {proposal, txId}

returned PROPOSAL='{"proposal":{"header":{"buffer":{"type":"Buffer","data":[10,135,1,8,3,16,1,26,12,8,133,189,246,244,5,16,192,134,180,219,3,34,6,99,111,109,109,111,110,42,64,57,99,98,57,98,52,56,99,99,97,102,101,54,50,48,101,53,54,48,48,50,53,99,50,102,98,101,98,56,53,51,98,56,49,49,51,51,100,102,49,55,102,98,54,49,97,55,51,99,100,51,51,53,55,48,102,54,98,100,53,52,102,100,56,58,7,18,5,18,3,100,110,115,66,32,95,185,84,19,91,232,147,129,118,95,14,22,95,250,171,44,28,190,100,194,61,11,103,100,243,40,250,254,234,189,52,173,18,175,7,10,146,7,10,4,111,114,103,49,18,137,7,45,45,45,45,45,66,69,71,73,78,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,10,77,73,73,67,98,106,67,67,65,104,87,103,65,119,73,66,65,103,73,85,69,90,120,82,80,71,112,113,72,108,90,118,80,122,111,107,82,109,83,53,55,121,75,88,65,51,52,119,67,103,89,73,75,111,90,73,122,106,48,69,65,119,73,119,10,99,122,69,76,77,65,107,71,65,49,85,69,66,104,77,67,86,86,77,120,69,122,65,82,66,103,78,86,66,65,103,84,67,107,78,104,98,71,108,109,98,51,74,117,97,87,69,120,70,106,65,85,66,103,78,86,66,65,99,84,68,86,78,104,10,98,105,66,71,99,109,70,117,89,50,108,122,89,50,56,120,71,84,65,88,66,103,78,86,66,65,111,84,69,71,57,121,90,122,69,117,90,88,104,104,98,88,66,115,90,83,53,106,98,50,48,120,72,68,65,97,66,103,78,86,66,65,77,84,10,69,50,78,104,76,109,57,121,90,122,69,117,90,88,104,104,98,88,66,115,90,83,53,106,98,50,48,119,72,104,99,78,77,106,65,119,78,68,73,119,77,84,73,122,77,122,65,119,87,104,99,78,77,106,69,119,78,68,73,119,77,84,73,122,10,79,68,65,119,87,106,65,117,77,82,119,119,68,81,89,68,86,81,81,76,69,119,90,106,98,71,108,108,98,110,81,119,67,119,89,68,86,81,81,76,69,119,82,118,99,109,99,120,77,81,52,119,68,65,89,68,86,81,81,68,69,119,86,49,10,99,50,86,121,77,84,66,90,77,66,77,71,66,121,113,71,83,77,52,57,65,103,69,71,67,67,113,71,83,77,52,57,65,119,69,72,65,48,73,65,66,66,122,86,49,85,71,81,85,104,85,119,76,105,79,83,122,51,84,52,99,65,119,103,10,118,80,101,83,48,111,57,51,90,102,79,84,118,49,43,54,117,101,108,69,85,98,51,49,72,110,98,99,98,117,100,47,107,99,54,118,122,66,49,74,54,115,106,72,114,71,47,97,85,51,98,66,73,74,115,121,89,109,86,77,85,107,79,106,10,103,99,115,119,103,99,103,119,68,103,89,68,86,82,48,80,65,81,72,47,66,65,81,68,65,103,101,65,77,65,119,71,65,49,85,100,69,119,69,66,47,119,81,67,77,65,65,119,72,81,89,68,86,82,48,79,66,66,89,69,70,80,102,107,10,74,78,78,56,104,97,117,98,57,74,57,68,65,97,97,122,117,49,111,83,98,81,98,109,77,67,115,71,65,49,85,100,73,119,81,107,77,67,75,65,73,78,89,89,76,121,100,70,57,77,68,80,57,88,86,72,117,119,122,69,49,47,49,50,10,49,90,120,98,49,104,75,69,98,119,53,85,79,75,77,111,48,122,85,73,77,70,119,71,67,67,111,68,66,65,85,71,66,119,103,66,66,70,66,55,73,109,70,48,100,72,74,122,73,106,112,55,73,109,104,109,76,107,70,109,90,109,108,115,10,97,87,70,48,97,87,57,117,73,106,111,105,98,51,74,110,77,83,73,115,73,109,104,109,76,107,86,117,99,109,57,115,98,71,49,108,98,110,82,74,82,67,73,54,73,110,86,122,90,88,73,120,73,105,119,105,97,71,89,117,86,72,108,119,10,90,83,73,54,73,109,78,115,97,87,86,117,100,67,74,57,102,84,65,75,66,103,103,113,104,107,106,79,80,81,81,68,65,103,78,72,65,68,66,69,65,105,66,90,107,109,103,83,54,50,113,57,105,115,80,52,122,110,118,110,121,90,109,106,10,57,50,100,98,113,106,106,115,76,65,57,51,102,107,80,121,115,76,77,53,85,119,73,103,85,76,122,101,53,47,52,100,112,107,108,82,57,51,76,83,104,109,50,83,103,108,65,107,86,99,83,50,79,113,54,113,54,49,89,73,50,109,78,117,10,109,101,111,61,10,45,45,45,45,45,69,78,68,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,10,125,18,24,201,10,157,101,76,173,166,135,83,164,12,228,245,126,20,142,115,222,154,211,207,98,179,216]},"offset":0,"markedOffset":-1,"limit":1084,"littleEndian":false,"noAssert":false},"payload":{"buffer":{"type":"Buffer","data":[10,25,10,23,8,1,18,5,18,3,100,110,115,26,12,10,3,112,117,116,10,1,97,10,2,49,48]},"offset":0,"markedOffset":-1,"limit":27,"littleEndian":false,"noAssert":false},"extension":{"buffer":{"type":"Buffer","data":[]},"offset":0,"markedOffset":-1,"limit":0,"littleEndian":false,"noAssert":false}}}'

not used: TX='"txId":{"_nonce":{"type":"Buffer","data":[201,10,157,101,76,173,166,135,83,164,12,228,245,126,20,142,115,222,154,211,207,98,179,216]},"_transaction_id":"9cb9b48ccafe620e560025c2fbeb853b81133df17fb61a73cd33570f6bd54fd8"}'


3. to decerialise - use deserializeBuffers(proposal):

    deserializeBuffers(obj) {
        let result = obj && Object.entries(obj).reduce((result, entry) => {
            const key = entry[0];
            let value = entry[1];
            if (value && typeof value === 'object'){
                if (value.type==="Buffer" && Array.isArray(value.data)) {
                    value=Buffer.from(value.data);
                } else {
                    value = this.deserializeBuffers(value);
                }
            }
            result[key]=value;
            return result;
        }, {});
        return result;
    }



4. sign proposal on client:

const elliptic = require('elliptic');
const { KEYUTIL } = require('jsrsasign');

const privateKeyPEM = '<The PEM encoded private key>';
const { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM); // convert the pem encoded key to hex encoded private key

const EC = elliptic.ec;
const ecdsaCurve = elliptic.curves['p256'];

const ecdsa = new EC(ecdsaCurve);
const signKey = ecdsa.keyFromPrivate(prvKeyHex, 'hex');
const sig = ecdsa.sign(Buffer.from(digest, 'hex'), signKey);

// now we have the signature, next we should send the signed transaction proposal to the peer
const signature = Buffer.from(sig.toDER());

const signedProposal = {
    signature,
    proposal_bytes: proposalBytes,
};

SIGNED_PROPOSAL=JSON.stringify(signedProposal)




5. send signed proposal and prepare unsigned transaction:
curl -H "Authorization: Bearer $JWT" -H 'Content-Type: application/json' --data-binary '{"signedProposal":'$SIGNED_PROPOSAL', "proposal":'$proposal'}'  "http://${apiServer:-localhost:4000}/channels/common/chaincodes/dns/prepare/transaction"

Ответ:
{commitRequest, commitProposal}

use deserializeBuffers, sing commitProposal


6. Commit transaction:
curl -H "Authorization: Bearer $JWT" -H 'Content-Type: application/json' --data-binary '{"signedCommitProposal":'$SIGNED_PROPOSAL', "commitRequest":'$commitRequest}'  "http://${apiServer:-localhost:4000}/channels/common/chaincodes/dns/commit/transaction"

Ответ: должно быть статус 200