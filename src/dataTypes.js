let legacy = require('legacy-encoding');

const opcodes = require('./opcodes.js');
const VARTYPE_INTEGER = 3;

module.exports = function(PexFile, ffp) {
    let uint8 = ffp.getDataType('uint8'),
        uint16 = ffp.getDataType('uint16'),
        uint32 = ffp.getDataType('uint32');

    ffp.addDataType('null', {
        read: () => null,
        write: () => null
    });

    ffp.addDataType('bstring', {
        read: stream  => {
            let len = uint16.read(stream);
            if (len === 0) return '';
            let buf = stream.read(len);
            return legacy.decode(buf, 'cp1252');
        },
        write: (stream, entity, data) => {
            uint16.write(stream, null, data.length);
            let buf = Buffer.alloc(data.length);
            buf.write(data, 0, data.length, 'ascii');
            stream.write(buf);
        }
    });

    const twoTo32 = Math.pow(2, 32);

    ffp.addDataType('time_t', {
        read: stream => {
            let big = uint32.read(stream),
                small = uint32.read(stream);
            return new Date((big * twoTo32 + small) * 1000);
        },
        write: (stream, entity, data) => {
            let num = Math.trunc(data / 1000),
                big = Math.trunc(num / twoTo32),
                small = num % twoTo32;
            uint32.write(stream, null, big);
            uint32.write(stream, null, small);
        }
    });

    let flagTest = function(store, entity) {
        let flagsValue = store[entity.flag.key],
            maskedValue = flagsValue & entity.flag.value;
        return entity.flag.expect ?
            maskedValue === entity.flag.expect : maskedValue !== 0;
    };

    ffp.addDataType('flagData', {
        read: (stream, entity, store) => {
            if (!flagTest(store, entity)) return;
            let entryType = ffp.getDataType(entity.entry.type);
            if (!entryType)
                throw new Error(`Data type ${entity.entry.type} not found.`);
            return entryType.read(stream, entity.entry, store);
        },
        write: (stream, entity, data, context) => {
            if (!flagTest(context, entity)) return;
            let entryType = ffp.getDataType(entity.entry.type);
            if (!entryType)
                throw new Error(`Data type ${entity.entry.type} not found.`);
            return entryType.write(stream, entity.entry, data, context);
        }
    });

    let getAdditionalArgs = function(stream, args, VariableData) {
        let additionalArgs = ffp.parseSchema(stream, VariableData);
        if (additionalArgs.type !== VARTYPE_INTEGER)
            throw new Error(`Found additional args VariableData type ${additionalArgs.type}, expected type 3.`);
        args.push(additionalArgs);
        for (let i = 0; i < additionalArgs.data; i++)
            args.push(ffp.parseSchema(stream, VariableData));
    };

    ffp.addDataType('Instruction', {
        read: stream => {
            let op = uint8.read(stream),
                opcodeInfo = PexFile.opcodes[op];
            if (!opcodeInfo)
                throw new Error(`Unknown opcode ${op}`);
            let args = [],
                VariableData = ffp.getDataFormat('VariableData'),
                numArgs = opcodeInfo.numArgs;
            for (let i = 0; i < numArgs; i++)
                args.push(ffp.parseSchema(stream, VariableData));
            if (opcodeInfo.varArgs)
                getAdditionalArgs(stream, args, VariableData);
            return { op: op, arguments: args };
        },
        write: (stream, entity, data) => {
            uint8.write(stream, null, data.op);
            let VariableData = ffp.getDataFormat('VariableData');
            data.arguments.forEach(arg => {
                ffp.writeSchema(stream, VariableData, arg);
            });
        }
    });
};