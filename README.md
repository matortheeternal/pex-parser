# pex-parser

JavaScript parser for compiled Papyrus script files. 

Based off of [UESP - Compiled Script File Format](http://en.uesp.net/wiki/Tes5Mod:Compiled_Script_File_Format).

Built using [ffp](https://github.com/matortheeternal/ffp).

## installation

```
npm i matortheeternal/pex-parser --save
```

## usage

```javascript
let {PexFile} = require('pex-parser');
let script = new PexFile('./path/to/script.pex');
script.parse();
// you can read things and make changes here
script.filePath = './path/to/copy.pex';
script.write();
```

## properties

### `header`

The header of the script file.  Includes the following properties:

- `magic` - Magic number used to recognize PEX files.  Should be `0xFA57C0D3`.
- `majorVersion` - Major version of the papyrus compiler used to compile the script.
- `minorVersion` - Minor version of the papyrus compiler used to compile the script.
- `gameId` - ID of the game the script was compiled for.  `1` is Skyrim.
- `compilationTime` - The date and time when the script was compiled.
- `sourceFileName` - The name of the source file which was compiled.
- `username` - The Windows username of the user who compiled the script.
- `machinename` - The Windows machine name of the computer which compiled the script.

### `stringTable`

Array of strings.  Other fields will refer to strings in this table by index.

### `debugInfo`

Debug information for the script.  Includes the following properties:

- `hasDebugInfo` - 1 if the script has debug info, 0 if it doesn't.
- `modificationTime` - The date and time when the debug information was added to the script (?)
- `functions` - array of DebugFunction entries.

### `userFlags`

Array of UserFlag entries for the script.

### `objects`

Array of compiled script Objects.
