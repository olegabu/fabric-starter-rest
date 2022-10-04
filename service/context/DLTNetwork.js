class DLTNetwork {

    config = {}
    fabricNetworkClient = null

    logout() {
        this.fabricNetworkClient && this.fabricNetworkClient.logoutUser('?')
    }

}

module.exports = DLTNetwork