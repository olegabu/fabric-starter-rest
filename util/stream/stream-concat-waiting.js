const stream = require('stream');
const util = require('util');
const ConcatStream = require('stream3-concat');

class StreamConcatWaiting {

    constructor(streams) {
        streams = makeArray(streams);
        this.stream = new ConcatStream(streams);
        waitStream(this)
    }

    add(stream) {
        this.stream.add(stream)
        waitStream(this)
    }

    end() {
        if (this.waitingStream) {
            this.stream.remove(this.waitingStream)
        }
        this.waitingStream = null
    }
}


class WaitingStream extends stream.Readable {
    _read(obj) {
        // hang
    };
}

function waitStream(scope) {
    const waitingStream = new WaitingStream()
    scope.stream.add(waitingStream)

    if (scope.waitingStream) {
        scope.stream.remove(scope.waitingStream)
    }
    scope.waitingStream = waitingStream
}


function makeArray(streams) {
    if (!Array.isArray(streams)) {
        streams = [streams]
    }
    return streams;
}

module.exports = StreamConcatWaiting
