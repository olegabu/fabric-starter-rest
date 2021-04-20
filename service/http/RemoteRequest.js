const http = require('http')

class RemoteRequest {

    startComponent({targetIp, componentName, componentType}) {
        http.request()
    }
}

module.exports = new RemoteRequest()