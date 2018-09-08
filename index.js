let fs = require('fs'),
    ffp = require('file-format-parser');

require('./src/dataTypes');
require('./src/dataFormats');

let pexDataKeys = ['header', 'stringTable', 'debugInfo', 'userFlags', 'objects'];

let missingPexData = function(data) {
    return pexDataKeys.findIndex(key => !data[key]) > -1;
};

class PexFile {
    constructor(filePath) {
        this.filePath = filePath;
    }

    parse() {
        if (!this.filePath) throw new Error('File path is required.');
        if (!fs.existsSync(this.filePath))
            throw new Error(`File path "${this.filePath}" does not exist.`);
        let data = ffp.parseFile(this.filePath, 'PexFile');
        Object.assign(this, data);
    }

    write() {
        if (!this.filePath) throw new Error('File path is required.');
        if (missingPexData(this)) throw new Error('PEX Data is incomplete.');
        ffp.writeFile(this.filePath, 'PexFile', this);
    }
}

// EXPORTS
module.exports = { PexFile };