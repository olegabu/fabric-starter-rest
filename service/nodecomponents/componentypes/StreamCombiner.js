const util = require('util');
const PassThrough = require('stream').PassThrough;

//@
//@ From https://stackoverflow.com/questions/17471659/creating-a-node-js-stream-from-two-piped-streams
//@

//TODO: move to utils
const StreamCombiner = function() {
    this.streams = Array.prototype.slice.apply(arguments);

    this.on('pipe', function(source) {
        source.unpipe(this);
        for(let i in this.streams) {
            source = source.pipe(this.streams[i]);
        }
        this.transformStream = source;
    });
};

util.inherits(StreamCombiner, PassThrough);

StreamCombiner.prototype.pipe = function(dest, options) {
    return this.transformStream.pipe(dest, options);
};

module.exports=StreamCombiner
