const _ = require('lodash');
const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('Component');

class Component {

    static fromHttpBody(body, files) {
        const values = _.get(body, 'values')
        let component = new Component(values, files)
        logger.debug("Component from http", component)
        return component
    }

    constructor(values, files) {
        this.values = values;
        this.files = files;
    }

    get name() {return this.valueProp('name')}
    get componentIp() {return this.valueProp('componentIp')}
    get componentType() {return this.valueProp('componentType')}

    valueProp (propName) {
        return _.get(this, `values.${propName}`)
    }

}


module.exports = Component;
