class Enroll {

    static fromHttpBody(body) {
        return {enrollSecret: body.enrollSecret}
    }
}


module.exports = Enroll;
