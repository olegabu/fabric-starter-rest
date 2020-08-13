const ref = require("ref");
const ffi = require("ffi");
const Struct = require("ref-struct");
const ArrayType = require("ref-array");
const ByteArray = ArrayType(ref.types.byte);
const gostDist = require('crypto-gost/dist/CryptoGost.js');
const gostCrypto = gostDist.CryptoGost;
const gostEngine = gostDist.GostEngine;

const GoByteArray = Struct({
    data: ByteArray,
    len: "longlong",
    cap: "longlong"
});

const GoString = Struct({
    p: "string",
    n: "longlong"
});

const GoInt = "longlong";

const libGost = ffi.Library("./lib-fabric-gost.so", {
    Verify: ["bool", [GoString, GoByteArray, GoByteArray]],
    Sign: [GoInt, [GoString, GoByteArray, GoByteArray]]
});

const GOST_R_34_11 = 'GOST R 34.11';

const Hasher = gostEngine.getGostDigest({
    name: GOST_R_34_11,
    version: 1994,
    mode: 'HASH'
});

const SUCCESS = 0;
// const FAIL = 1;

function goString(s) {
    let str = new GoString();
    str["p"] = s;
    str["n"] = s.length;
    return str;
}

function goByteArray(b) {
    let resultArray = ByteArray(b);
    let outArray = new GoByteArray();
    outArray["data"] = resultArray;
    outArray["len"] = b.length;
    outArray["cap"] = b.length;
    return {outArray, resultArray};
}

function hex(data) {
    return gostCrypto.coding.Hex.encode(data);
}

function sign(key, content) {
    let signatureBuffer = goByteArray(new Array(64));
    let rc = libGost.Sign(goString(key), goByteArray(content).outArray, signatureBuffer.outArray);
    if (rc === SUCCESS) {
        return signatureBuffer.resultArray.toArray();
    }
    throw Error(`Could not sign data:\n\tKEY:${JSON.stringify(key)}\n`);
}

function verify(key, signature, content) {
    return libGost.Verify(goString(key), goByteArray(signature).outArray, goByteArray(content).outArray);
}

function digest(data) {
    let content = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return Hasher.digest(content);
}

module.exports = {
    digest: digest,
    sign: sign,
    verify: verify
};
