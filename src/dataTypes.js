ffp.addDataType('null', {
    read: () => null
});

ffp.addDataType('uint16', {
    read: stream => stream.read(2).readUInt16BE()
});

ffp.addDataType('uint32', {
    read: stream => stream.read(4).readUInt32BE()
});

ffp.addDataType('int32', {
    read: stream => stream.read(4).readInt32BE()
});

ffp.addDataType('float', {
    read: stream => stream.read(4).readFloatBE()
});

ffp.addDataType('bstring', {
    read: stream  => {
        let len = stream.read(2).readUInt16BE();
        if (len === 0) return '';
        let buf = stream.read(len);
        return legacy.decode(buf, 'cp1252');
    }
});

ffp.addDataType('time_t', {
    read: stream => {
        let buf = stream.read(8),
            uint64 = buf.readUInt32BE() * 4294967296 + buf.readUInt32BE(4);
        return new Date(uint64 * 1000);
    }
});

// OPCODES
//= require opcodes.js

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
            instruction = { arguments: [], op: uint8.read(stream) },
            opcodeInfo = opcodes[instruction.op];
        if (!opcodeInfo)
            throw new Error(`Unknown opcode ${instruction.op}`);
        let args = instruction.arguments,
            VariableData = ffp.getDataFormat('VariableData'),
            numArgs = opcodeInfo.numArgs;
        for (let i = 0; i < numArgs; i++)
            args.push(ffp.parseSchema(stream, VariableData));
        if (opcodeInfo.varArgs) getAdditionalArgs(stream, args, VariableData);
        return instruction;
    }
});