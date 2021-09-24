const stream = require('stream')
const _ = require('lodash')


const convertStreamToString = async (stream) => {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

const stringToStream = async (string) => {
    return new stream.Readable({
        read() {
            this.push(string);
            this.push(null);
        }
    });
}

const dataFromEventStream = async (stream) => {
    const content = await convertStreamToString(stream);
    return _.takeRight(content.split('data:'), 1)
}


module.exports = {
    streamToString: convertStreamToString,
    stringToStream: stringToStream,
    dataFromEventStream: dataFromEventStream
}