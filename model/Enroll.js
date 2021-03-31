class Enroll {

    static fromHttpBody(body) {
        if (typeof body === 'string') { //TODO: dry
            body= JSON.parse(body)
        }
        return {enrollSecret: body.enrollSecret}
    }
}


module.exports = Enroll;
