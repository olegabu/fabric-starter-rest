const http = require('http')

class RemoteRequest {

    deployComponent(org, component) {

        http.request({hostname: component.componentIp, port: component.externalPort || 443, path:'/node/components', method:'POST'})
    }
}

module.exports = new RemoteRequest()