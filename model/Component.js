const _ = require('lodash');
const Files = require('./Files');
const cfg = require('../config.js');
const logger = cfg.log4js.getLogger('Component');

class Component {

    static fromHttpBody(body, files) {
        const values = _.get(body, 'values')
        let component = new Component(values, files)
        logger.debug("Component from http", component)
        return component
    }

    static fromComponent(component, valuesUpdate, filesUpdateArr) {
        return new Component(
            _.assign({}, _.get(component, 'values'), valuesUpdate),
            Files.mergedFiles(_.get(component, 'files'), filesUpdateArr)
        )
    }

    constructor(values, files) {
        this.values = values;
        this.files = files;
    }

    get name() {return this.valueProp('name')}
    get componentIp() {return this.valueProp('componentIp')}
    get componentType() {return this.valueProp('componentType')}
    get externalPort() {return this.valueProp('externalPort')}
    get communicationProtocol() {return this.valueProp('communicationProtocol')}

    valueProp (propName) {
        return _.get(this, `values.${propName}`)
    }

}


module.exports = Component;
