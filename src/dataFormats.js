let hexStr = num => `0x${num.toString(16)}`;

ffp.addDataFormat('PexFile', [{
    type: 'record',
    format: 'PexHeader',
    storageKey: 'header'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'bstring'},
    storageKey: 'stringTable'
}, {
    type: 'record',
    format: 'PexDebugInfo',
    storageKey: 'debugInfo'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'record', format: 'UserFlag'},
    storageKey: 'userFlags'
}, {
    type: 'array',
    count: {type: 'uint16'},
    entry: {type: 'record', format: 'Object'},
    storageKey: 'objects'
}]);

ffp.addDataFormat('PexHeader', [{
    type: 'uint32',
    storageKey: 'magic',
    errorMessage: 'PEX Magic does not match',
    expectedValue: 0xFA57C0DE
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
}]);

ffp.addDataFormat('PexDebugInfo', [{
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
}]);

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
    type: 'flagData',
    flag: {key: 'flags', value: 4},
    entry: {type: 'uint16'},
    storageKey: 'autoVarName'
}, {
    type: 'flagData',
    flag: {key: 'flags', value: 5, expect: 1},
    entry: {type: 'record', format: 'Function'},
    storageKey: 'readHandler'
}, {
    type: 'flagData',
    flag: {key: 'flags', value: 6, expect: 2},
    entry: {type: 'record', format: 'Function'},
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