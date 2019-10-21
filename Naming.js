const _ = require('lodash');
const cfg = require('./config.js');

module.exports = {

    getApiOrgAddress: function (orgDomain, domain) {
        let nameDomainFromPattern = this.evalPattern(orgDomain, domain);
        return `api.${nameDomainFromPattern}`;
    },

    getPeerOrgAddress: function (orgDomain, peerNum = 0, domain) {
        let nameDomainFromPattern = this.evalPattern(orgDomain, domain);
        return `peer${peerNum}.${nameDomainFromPattern}`;
    },

    getWwwOrgAddress: function (orgDomain, domain) {
        let nameDomainFromPattern = this.evalPattern(orgDomain, domain);
        return `www.${nameDomainFromPattern}`;
    },

    evalPattern: function (orgDomain, domain) {
        let orgEnv = domain
            ? _.assign({},  cfg.env, {ORG_DOMAIN: orgDomain})
            : _.assign({},  cfg.env, {ORG: orgDomain, DOMAIN: domain});

        let result = (domain ? cfg.NAMING_URL_PATTERN : cfg.NAMING_ORG_DOMAIN_PATTERN) || '';

        _.forEach(_.keys(env), key => {
            result = result.replace(new RegExp("\\${" + key + "}", 'g'), env[orgEnv]);
        });
        return result;
    },
};