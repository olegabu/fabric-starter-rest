const _ = require('lodash');

class Enroll {

    static fromHttpBody(body) {
        if (typeof body === 'string') { //TODO: dry
            body = JSON.parse(body)
        }
        return {
            enrollSecret: _.get(body, 'enrollSecret')
        }
    }
}

module.exports = Enroll;
