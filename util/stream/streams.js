const stream = require('stream')

function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

stringToStream = (string) => {
    return new stream.Readable({
        read() {
            this.push(string);
            this.push(null);
        }
    });
}


module.exports = {
    streamToString: streamToString,
    stringToStream: stringToStream
}