class Org {

    static orgFromHttpBody(body) {
        return {orgId: body.orgId, orgIp: body.orgIp, peer0Port: body.peerPort, wwwPort: body.wwwPort}
    }
}


module.exports = {
    Org: Org
};