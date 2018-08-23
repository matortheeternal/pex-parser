let fs = require('fs'),
    ffp = require('file-format-parser'),
    legacy = require('legacy-encoding');

let pexDataKeys = ['header', 'stringTable', 'debugInfo', 'userFlags', 'objects'];

let missingPexData = function(data) {
    return pexDataKeys.findIndex(key => !data[key]) > -1;
};

class PexFile {
    constructor(filePath) {
        this.filePath = filePath;
    }

    parse(cb) {
        if (!this.filePath) throw new Error('File path is required.');
        if (!fs.existsSync(this.filePath))
            throw new Error(`File path "${this.filePath}" does not exist.`);
        ffp.parseFile(this.filePath, 'PexFile', (err, data) => {
            Object.assign(this, data);
            cb && cb(err);
        });
    }

    write(cb) {
        if (!this.filePath) throw new Error('File path is required.');
        if (missingPexData(this)) throw new Error('PEX Data is incomplete.');
        ffp.writeFile(this.filePath, 'PexFile', this, cb);
    }
}

// DATA TYPES
//= require src/dataTypes.js

// DATA FORMATS
//= require src/dataFormats.js

// EXPORTS
module.exports = { PexFile };