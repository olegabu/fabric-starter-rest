const fs = require('fs');
const FormData = require('form-data');
const _ = require('lodash');

class FormDataFactory {

    createFormData(fields, files) {
        const formData = new FormData();
        _.each(fields, (val, key) => {
            val = typeof val === 'object' ? JSON.stringify(val) : val
            formData.append(key, val);
        })
        _.each(files, f => {
            try {
                formData.append(f.fieldname, fs.createReadStream(f.path, {encoding: 'binary'}));
            } catch (e) {
                logger.debug("Can't attach file to multipart: ", f)
            }
        })
        return {formData, formDataHeaders: formData.getHeaders()}
    }
}

module.exports = new FormDataFactory()