ffp.addDataType('null', {
    read: () => null,
    write: () => null
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

let flagTest = function(store, entity) {
    let flagsValue = store[entity.flag.key],
        maskedValue = flagsValue & entity.flag.value;
    return entity.flag.expect ?
        maskedValue === entity.flag.expect : maskedValue !== 0;
};

ffp.addDataType('flagData', {
    read: (stream, entity, store) => {
        debugger;
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

// OPCODES
//= require opcodes.js

const VARTYPE_INTEGER = 3;

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