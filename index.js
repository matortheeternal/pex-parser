let fs = require('fs'),
    ffp = require('file-format-parser');

let skyrimOpcodes = require('./src/skyrimOpcodes'),
    falloutOpcodes = require('./src/falloutOpcodes'),
    pexDataKeys = ['header', 'stringTable', 'debugInfo', 'userFlags', 'objects'];

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

let endiannessMap = {
    TES5: 'BE',
    SSE: 'BE',
    FO4: 'LE'
};

let opcodes = {
    TES5: skyrimOpcodes,
    SSE: skyrimOpcodes,
    FO4: falloutOpcodes
};

let setGame = function(appName) {
    let endianness = endiannessMap[appName];
    if (!endiannessMap.hasOwnProperty(appName))
        throw new Error(`Unknown game ${appName}, allowed games:` +
            Object.keys(endiannessMap));
    ffp.setEndianness(endianness);

    Object.defineProperty(PexFile, 'opcodes', {
        value: opcodes[appName],
        configurable: true,
        writeable: false
    });
};

require('./src/dataTypes')(PexFile, ffp);
require('./src/dataFormats')(ffp);

// EXPORTS
module.exports = { PexFile, setGame };