const _ = require('lodash')

module.exports = {

    componentFileName(component) {
        return `file_${_.get(component, 'name') || component}`
    },

    mergedFiles: (filesArr1, filesArr2) => {
        return _.unionWith([], filesArr2, filesArr1,
            (file, fileNew) => _.isEqual(getFieldName(file), getFieldName(fileNew)))
    }
}

function getFieldName(fileObj) {
    return _.get(fileObj, 'fieldname')
}

