const fs = require('fs');
const FormData = require('form-data');
const _ = require('lodash');

class FormDataFactory {

    createFormData(fields, files) {
        const formData = new FormData();
        this.appendValues(formData, fields);
        this.appendFiles(formData, files);
        return {formData, formDataHeaders: formData.getHeaders()}
    }

    appendValues(formData, fields) {
        _.each(fields, (val, key) => {
            val = typeof val === 'object' ? JSON.stringify(val) : val
            formData.append(key, val);
        })
    }

    appendFiles(formData, files) {
        _.each(files, f => {
            try {
                formData.append(f.fieldname, f.stream ? f.stream : fs.createReadStream(f.path, {encoding: 'binary'}), f.filename);
            } catch (e) {
                logger.error("Can't attach file to multipart: ", f, e)
            }
        })
    }
}

module.exports = new FormDataFactory()