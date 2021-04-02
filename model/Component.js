const _ = require('lodash');
const cfg = require('$/config.js');
const logger = cfg.log4js.getLogger('Component');

class Component {

    static fromHttpBody(body) {
        let comp = new Component(body)
        logger.debug("Component from http", comp)
        return comp
    }

    constructor(comp) {
        this.comp = comp
    }

    get name() {return this.valueProp('name')}
    get componentIp() {return this.valueProp('componentIp')}
    get componentType() {return this.valueProp('componentType')}

    get values() {return this.comp.values}
    valueProp (propName) {
        return _.get(this.comp, `values.${propName}`)
    }

}


module.exports = Component;
