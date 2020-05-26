let path = require('path'),
    fs = require('fs'),
    ffp = require('file-format-parser'),
    {PexFile} = require('../index'),
    opcodes = require('../src/opcodes.js');

let inputPath = path.resolve(__dirname, './input'),
    outputPath = path.resolve(__dirname, './output');

ffp.setLogger({
    log: () => {},
    warn: () => {},
    error: console.error
});

let getOpcode = function(name) {
    let entry = opcodes.find(opcode => opcode.name === name);
    return entry.code;
}

let targetOps = [
    getOpcode('callmethod'), 
    getOpcode('callstatic')
];

let resolveString = function(script, index) {
    return script.stringTable[index];
};

let getFunctionName = function(script, n) {
    let arg = n.arguments[1];
    return resolveString(script, arg.data);
};

let describeArg = function(script, arg) {
    if (arg.type === 0) {
        return 'null';
    } else if (arg.type === 1 || arg.type === 2) {
        return resolveString(script, arg.data);
    } else if (arg.type === 4) {
        return `float(${arg.data})`;
    } else if (arg.type === 5) {
        return arg.data > 0 ? 'true' : 'false';
    } else {
        return `${arg.data}`;
    }
};

let describeCall = function(script, n) {
    let opcode = opcodes.find(opcode => opcode.code === n.op),
        argDescription = n.arguments.map(arg => describeArg(script, arg)).join(', ');
    return `${opcode.name}: ${argDescription}`;
}

let getGfffCalls = function(script) {
    let calls = [];
    script.objects.forEach(object => {
        object.data.states.forEach(state => {
            state.functions.forEach(fn => {
                fn.function.instructions.forEach(n => {
                    if (!targetOps.includes(n.op)) return;
                    if (getFunctionName(script, n) !== 'GetFormFromFile') return;
                    calls.push(describeCall(script, n));
                });
            });
        });
    });
    return calls;
};

let surveyFile = function(filename) {
    let scriptPath = path.resolve(inputPath, filename),
        copyPath = path.resolve(outputPath, filename),
        script = new PexFile(scriptPath);
    script.parse();
    let gfffCalls = getGfffCalls(script);
    if (gfffCalls.length === 0) return;
    console.log(`${filename} GetFormFromFile calls:`);
    console.log(gfffCalls.join('\n'));
}

let files = fs.readdirSync(inputPath, {})
    .filter(file => file.endsWith('.pex'));

files.forEach(file => {
    surveyFile(file);
});