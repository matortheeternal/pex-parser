const fs = require('fs');
const ffp = require('ffp');
const legacy = require('legacy-encoding');

class PexFile {
    constructor(filePath) {
        if (!filePath)
            throw new Error('File path is required.');
        if (!fs.existsSync(filePath))
            throw new Error(`File path "${filePath}" does not exist.`);
        this.filePath = filePath;
        this.parse();
    }

    parse() {
        let pexFileFormat = ffp.getDataFormat('PexFile');
        ffp.parseFile(this.filePath, pexFileFormat, data => {
            Object.assign(this, data);
        });
    }
}

PexFile.magic = 0xFA57C0DE;

// DATA TYPES
//= require src/dataTypes.js

// DATA FORMATS
//= require src/dataFormats.js

// EXPORTS
module.exports = { PexFile };