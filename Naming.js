const _ = require('lodash');
const cfg = require('./config.js');

module.exports = {

    evalPattern: function (env) {
        let result = cfg.NAMING_URL_PATTERN || '';
        _.forEach(_.keys(env), key => {
            result = result.replace(new RegExp("\\${" + key + "}", 'g'), env[key]);
        });
        return result;
    },

    getApiOrgAddress: function (org, domain) {
        let orgEnv = _.assign({}, _.env, {ORG: org, DOMAIN: domain});
        let nameDomainFromPattern = this.evalPattern(orgEnv);
        return `api.${nameDomainFromPattern}`;
    },

    getPeerOrgAddress: function (org, domain, peerNum = 0) {
        let orgEnv = _.assign({}, _.env, {ORG: org, DOMAIN: domain});
        let nameDomainFromPattern = this.evalPattern(orgEnv);
        return `peer${peerNum}.${nameDomainFromPattern}`;
    },

    getWwwOrgAddress: function (org, domain) {
        let orgEnv = _.assign({}, cfg.env, {ORG: org, DOMAIN: domain});
        let nameDomainFromPattern = this.evalPattern(orgEnv);
        return `www.${nameDomainFromPattern}`;
    }
};