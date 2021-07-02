const stream = require('stream');
const util = require('util');
const ConcatStream = require('stream3-concat');
const cfg = require('../../config.js');
const logger = cfg.log4js.getLogger('StreamConcatWaiting');

class StreamConcatWaiting extends ConcatStream {

    constructor(streams) {
        try {
            const emptyWaitingStream = new WaitingStream()
            super(emptyWaitingStream)
            if (streams) {
                super.add(streams)
            } else {
                this.waitingStream = emptyWaitingStream
            }
        } catch (e) {
            console.log(e)
        }
    }

    add(stream) {
        super.add(stream)
        this.complete()
    }

    addWithWait(stream) {
        super.add(stream)
        this._resetWaitStream(this)
    }

    complete() {
        if (this.waitingStream) {
            this.remove(this.waitingStream)
        }
        this.waitingStream = null
    }

    async waitFortStream(times, producerFunc) {
        return new Promise((resolve, reject)=>{
            if (times === 0) {
                this.complete()
                return resolve()
            }
            setTimeout(() => {
                let streamResult = producerFunc && producerFunc()
                if (streamResult) {
                    this.addWithWait(streamResult)
                    resolve()
                } else {
                    this.waitFortStream(times - 1, producerFunc)
                    resolve()
                }
            }, 1000)
        })
    }

    _resetWaitStream() {
        const waitingStream = new WaitingStream()
        super.add(waitingStream)
        if (this.waitingStream) {
            this.remove(this.waitingStream)
        }
        this.waitingStream = waitingStream
    }
}


class WaitingStream extends stream.Readable {
    _read(obj) {
        // hang
    };
}

module.exports = StreamConcatWaiting
