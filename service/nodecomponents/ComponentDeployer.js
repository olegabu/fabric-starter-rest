const _ = require('lodash');

class ComponentDeployer {

    deploy(org, bootstrap, component, componentType) {
        const addresses = this.getAddresses(org,bootstrap, component)


        if (this.targetIsLocalPrimaryHost(addresses))
            return componentType.deployLocalPrimary(org, bootstrap, component)

        if (this.targetIsLocalSecondaryHost(addresses))
            return  componentType.deployLocalSecondary(org, bootstrap, component)

        if (this.targetIsLocalPrimaryJoiningHost(addresses))
            return componentType.deployLocalJoined(org, bootstrap, component)

        if (this.targetIsLocalSecondaryJoiningHost(addresses))
            return componentType.deployLocalSecondaryJoined(org, bootstrap, component)

        if (this.targetIsRemoteSecondaryHost(addresses)) {
            return this.deployRemote(org, bootstrap, component, componentType, addresses)
        }
    }

    getAddresses(org, bootstrap, component) {
        const thisIp = org.orgIp
        const primaryIp = org.masterIp || org.orgIp
        const bootstrapIp = _.get(bootstrap, 'ip');
        const targetIp = _.get(component, 'componentIp');
        return {thisIp, primaryIp, bootstrapIp, targetIp}
    }

    targetIsLocalPrimaryHost({bootstrapIp, ...addresses}) {
        return isThisTargetHost(addresses) && isThisPrimaryHost(addresses) && _.isEmpty(bootstrapIp)
    }

    targetIsLocalSecondaryHost({bootstrapIp, ...addresses}) {
        return isThisTargetHost(addresses) && !isThisPrimaryHost(addresses) && _.isEmpty(bootstrapIp)
    }

    targetIsLocalPrimaryJoiningHost({bootstrapIp, ...addresses}) {
        return isThisTargetHost(addresses) &&  isThisPrimaryHost(addresses) && !_.isEmpty(bootstrapIp)
    }

    targetIsLocalSecondaryJoiningHost({bootstrapIp, ...addresses}) {
        return isThisTargetHost(addresses) && !isThisPrimaryHost(addresses) && !_.isEmpty(bootstrapIp)
    }

    targetIsRemoteSecondaryHost(addresses) {
        return !isThisTargetHost(addresses)
    }



    getRemoteIntegrationIP(org, bootstrap) {
        let masterIp = org.masterIp || org.orgIp
        const bootstrapIp = _.get(bootstrap, 'ip');

        return _.isEqual(masterIp, org.orgIp) ? bootstrapIp : masterIp
    }

}

function isThisTargetHost(addresses) {
    return _.isEmpty(addresses.targetIp) || _.isEqual(addresses.thisIp, addresses.targetIp);
}

function isThisPrimaryHost(addresses) {
    return _.isEqual(addresses.primaryIp, addresses.thisIp);
}

module.exports= new ComponentDeployer()