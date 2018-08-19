let fs = require('fs'),
    ffp = require('ffp'),
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
        let pexFileFormat = ffp.getDataFormat('PexFile');
        ffp.parseFile(this.filePath, pexFileFormat, (err, data) => {
            Object.assign(this, data);
            cb && cb(err);
        });
    }

    write(cb) {
        if (!this.filePath) throw new Error('File path is required.');
        if (missingPexData(this)) throw new Error('PEX Data is incomplete.');
        ffp.writeFile(this.filePath, pexFileFormat, this, cb);
    }
}

PexFile.magic = 0xFA57C0DE;

// DATA TYPES
ffp.addDataType('null', {
    read: () => null
});

ffp.addDataType('uint16', {
    read: stream => stream.read(2).readUInt16BE(),
    write: (stream, entity, data) => {
        let buf = Buffer.alloc(2);
        buf.writeUInt16BE(data);
        stream.write(buf);
    }
});

ffp.addDataType('uint32', {
    read: stream => stream.read(4).readUInt32BE(),
    write: (stream, entity, data) => {
        let buf = Buffer.alloc(4);
        buf.writeUInt32BE(data);
        stream.write(buf);
    }
});

ffp.addDataType('int32', {
    read: stream => stream.read(4).readInt32BE(),
    write: (stream, entity, data) => {
        let buf = Buffer.alloc(4);
        buf.writeInt32BE(data);
        stream.write(buf);
    }
});

ffp.addDataType('float', {
    read: stream => stream.read(4).readFloatBE(),
    write: (stream, entity, data) => {
        let buf = Buffer.alloc(4);
        buf.writeFloatBE(data);
        stream.write(buf);
    }
});

ffp.addDataType('bstring', {
    read: stream  => {
        let len = stream.read(2).readUInt16BE();
        if (len === 0) return '';
        let buf = stream.read(len);
        return legacy.decode(buf, 'cp1252');
    },
    write: (stream, entity, data) => {
        let buf = Buffer.alloc(2 + data.length);
        buf.writeUInt16BE(data.length);
        buf.write(data, 2, data.length, 'ascii');
        stream.write(buf);
    }
});

const twoTo32 = Math.pow(2, 32);

ffp.addDataType('time_t', {
    read: stream => {
        let buf = stream.read(8),
            uint64 = buf.readUInt32BE() * twoTo32 + buf.readUInt32BE(4);
        return new Date(uint64 * 1000);
    },
    write: (stream, entity, data) => {
        let buf = Buffer.alloc(8),
            num = Math.trunc(data / 1000),
            big = Math.trunc(num / twoTo32),
            small = num % twoTo32;
        buf.writeUInt32BE(big);
        buf.writeUInt32BE(small, 4);
        stream.write(buf);
    }
});

// OPCODES
const opcodes = [{
    code: 0x00,
    name: 'nop',
    numArgs: 0
}, {
    code: 0x01,
    name: 'iadd',
    numArgs: 3
}, {
    code: 0x02,
    name: 'fadd',
    numArgs: 3
}, {
    code: 0x03,
    name: 'isub',
    numArgs: 3
}, {
    code: 0x04,
    name: 'fsub',
    numArgs: 3
}, {
    code: 0x05,
    name: 'imul',
    numArgs: 3
}, {
    code: 0x06,
    name: 'fmul',
    numArgs: 3
}, {
    code: 0x07,
    name: 'idiv',
    numArgs: 3
}, {
    code: 0x08,
    name: 'fdiv',
    numArgs: 3
}, {
    code: 0x09,
    name: 'imod',
    numArgs: 3
}, {
    code: 0x0A,
    name: 'not',
    numArgs: 2
}, {
    code: 0x0B,
    name: 'ineg',
    numArgs: 2
}, {
    code: 0x0C,
    name: 'fneg',
    numArgs: 2
}, {
    code: 0x0D,
    name: 'assign',
    numArgs: 2
}, {
    code: 0x0E,
    name: 'cast',
    numArgs: 2
}, {
    code: 0x0F,
    name: 'cmp_eq',
    numArgs: 3
}, {
    code: 0x10,
    name: 'cmp_lt',
    numArgs: 3
}, {
    code: 0x11,
    name: 'cmp_le',
    numArgs: 3
}, {
    code: 0x12,
    name: 'cmp_gt',
    numArgs: 3
}, {
    code: 0x13,
    name: 'cmp_ge',
    numArgs: 3
}, {
    code: 0x14,
    name: 'jmp',
    numArgs: 1
}, {
    code: 0x15,
    name: 'jmpt',
    numArgs: 2
}, {
    code: 0x16,
    name: 'jmpf',
    numArgs: 2
}, {
    code: 0x17,
    name: 'callmethod',
    numArgs: 3,
    varArgs: true
}, {
    code: 0x18,
    name: 'callparent',
    numArgs: 2,
    varArgs: true
}, {
    code: 0x19,
    name: 'callstatic',
    numArgs: 3,
    varArgs: true
}, {
    code: 0x1A,
    name: 'return',
    numArgs: 1
}, {
    code: 0x1B,
    name: 'strcat',
    numArgs: 3
}, {
    code: 0x1C,
    name: 'propget',
    numArgs: 3
}, {
    code: 0x1D,
    name: 'propset',
    numArgs: 3
}, {
    code: 0x1E,
    name: 'array_create',
    numArgs: 2
}, {
    code: 0x1F,
    name: 'array_length',
    numArgs: 2
}, {
    code: 0x20,
    name: 'array_getelement',
    numArgs: 3
}, {
    code: 0x21,
    name: 'array_setelement',
    numArgs: 3
}, {
    code: 0x22,
    name: 'array_findelement',
    numArgs: 4
}, {
    code: 0x23,
    name: 'array_rfindelement',
    numArgs: 4
}];

const VARTYPE_INTEGER = 3;

let getAdditionalArgs = function(stream, args, VariableData) {
    let additionalArgs = ffp.parseSchema(stream, VariableData);
    if (additionalArgs.type !== VARTYPE_INTEGER)
        throw new Error(`Found additional args VariableData type ${additionalArgs.type}, expected type 3.`);
    for (let i = 0; i < additionalArgs.data; i++)
        args.push(ffp.parseSchema(stream, VariableData));
};

ffp.addDataType('Instruction', {
    read: stream => {
        let uint8 = ffp.getDataType('uint8'),
            op = uint8.read(stream),
            opcodeInfo = opcodes[op];
        if (!opcodeInfo)
            throw new Error(`Unknown opcode ${op}`);
        let args = [],
            VariableData = ffp.getDataFormat('VariableData'),
            numArgs = opcodeInfo.numArgs;
        for (let i = 0; i < numArgs; i++)
            args.push(ffp.parseSchema(stream, VariableData));
        if (opcodeInfo.varArgs) getAdditionalArgs(stream, args, VariableData);
        return { op: op, arguments: args };
    },
    write: (stream, entity, data) => {
        let buf = Buffer.alloc(1);
        buf.writeUInt8(data.op);
        stream.write(buf);
        let VariableData = ffp.getDataFormat('VariableData');
        data.arguments.forEach(arg => {
            ffp.writeSchema(stream, VariableData, arg);
        });
    }
});

// DATA FORMATS
let hexStr = num => `0x${num.toString(16)}`;

ffp.addDataFormat('PexFile', {
    header: [{
        type: 'uint32',
        storageKey: 'magic',
        callback: value => {
            if (value !== PexFile.magic)
                throw new Error(`Expected magic ${hexStr(PexFile.magic)}, found ${hexStr(value)}`);
        }
    }, {
        type: 'uint8',
        storageKey: 'majorVersion'
    }, {
        type: 'uint8',
        storageKey: 'minorVersion'
    }, {
        type: 'uint16',
        storageKey: 'gameId'
    }, {
        type: 'time_t',
        storageKey: 'compilationTime'
    }, {
        type: 'bstring',
        storageKey: 'sourceFileName'
    }, {
        type: 'bstring',
        storageKey: 'username'
    }, {
        type: 'bstring',
        storageKey: 'machinename'
    }],
    stringTable: {
        type: 'array',
        count: {type: 'uint16'},
        entry: {type: 'bstring'}
    },
    debugInfo: [{
        type: 'uint8',
        storageKey: 'hasDebugInfo'
    }, {
        type: 'time_t',
        storageKey: 'modificationTime'
    }, {
        type: 'array',
        count: {type: 'uint16'},
        entry: {type: 'record', format: 'DebugFunction'},
        storageKey: 'functions'
    }],
    userFlags: {
        type: 'array',
        count: {type: 'uint16'},
        entry: {type: 'record', format: 'UserFlag'}
    },
    objects: {
        type: 'array',
        count: {type: 'uint16'},
        entry: {type: 'record', format: 'Object'}
    }
});

ffp.addDataFormat('DebugFunction', [{
    type: 'uint16',
    storageKey: 'objectNameIndex'
}, {
    type: 'uint16',
    storageKey: 'stateNameIndex'
}, {
    type: 'uint16',
    storageKey: 'functionNameIndex'
}, {
    type: 'uint8',
    storageKey: 'functionType'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'uint16'},
    storageKey: 'lineNumbers'
}]);

ffp.addDataFormat('UserFlag', [{
    type: 'uint16',
    storageKey: 'nameIndex'
}, {
    type: 'uint8',
    storageKey: 'flagIndex'
}]);

ffp.addDataFormat('Object', [{
    type: 'uint16',
    storageKey: 'nameIndex'
}, {
    type: 'uint32',
    storageKey: 'size'
}, {
    type: 'record',
    format: 'ObjectData',
    storageKey: 'data'
}]);

ffp.addDataFormat('ObjectData', [{
    type: 'uint16',
    storageKey: 'parentClassName'
}, {
    type: 'uint16',
    storageKey: 'docstring'
}, {
    type: 'uint32',
    storageKey: 'userFlags'
}, {
    type: 'uint16',
    storageKey: 'autoStateName'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'record', format: 'Variable'},
    storageKey: 'variables'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'record', format: 'Property'},
    storageKey: 'properties'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'record', format: 'State'},
    storageKey: 'states'
}]);

ffp.addDataFormat('Variable', [{
    type: 'uint16',
    storageKey: 'name'
}, {
    type: 'uint16',
    storageKey: 'typeName'
}, {
    type: 'uint32',
    storageKey: 'userFlags'
}, {
    type: 'record',
    format: 'VariableData',
    storageKey: 'data'
}]);

ffp.addDataFormat('VariableData', [{
    type: 'uint8',
    storageKey: 'type'
}, {
    type: 'union',
    storageKey: 'data',
    switchKey: 'type',
    cases: {
        0: {type: 'null'},
        1: {type: 'uint16'},
        2: {type: 'uint16'},
        3: {type: 'int32'},
        4: {type: 'float'},
        5: {type: 'uint8'}
    }
}]);

ffp.addDataFormat('Property', [{
    type: 'uint16',
    storageKey: 'name'
}, {
    type: 'uint16',
    storageKey: 'type'
}, {
    type: 'uint16',
    storageKey: 'docstring'
}, {
    type: 'uint32',
    storageKey: 'userFlags'
}, {
    type: 'uint8',
    storageKey: 'flags'
}, {
    type: 'uint16',
    storageKey: 'autoVarName'
}, {
    type: 'record',
    format: 'Function',
    storageKey: 'readHandler'
}, {
    type: 'record',
    format: 'Function',
    storageKey: 'writeHandler'
}]);

ffp.addDataFormat('State', [{
    type: 'uint16',
    storageKey: 'name'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'record', format: 'NamedFunction'},
    storageKey: 'functions'
}]);

ffp.addDataFormat('NamedFunction', [{
    type: 'uint16',
    storageKey: 'functionName'
}, {
    type: 'record',
    format: 'Function',
    storageKey: 'function'
}]);

ffp.addDataFormat('Function', [{
    type: 'uint16',
    storageKey: 'returnType'
}, {
    type: 'uint16',
    storageKey: 'docstring'
}, {
    type: 'uint32',
    storageKey: 'userFlags'
}, {
    type: 'uint8',
    storageKey: 'flags'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'record', format: 'VariableType'},
    storageKey: 'params'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'record', format: 'VariableType'},
    storageKey: 'locals'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'Instruction'},
    storageKey: 'instructions'
}]);

ffp.addDataFormat('VariableType', [{
    type: 'uint16',
    storageKey: 'name'
}, {
    type: 'uint16',
    storageKey: 'type'
}]);

// EXPORTS
module.exports = { PexFile };