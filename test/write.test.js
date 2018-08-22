let path = require('path'),
    fs = require('fs'),
    ffp = require('ffp'),
    {PexFile} = require('../dist/index');

let inputPath = path.resolve(__dirname, './input'),
    outputPath = path.resolve(__dirname, './output');

ffp.setLogger({
    log: () => {},
    warn: () => {},
    error: console.error
});

let testFile = function(filename, done) {
    let scriptPath = path.resolve(inputPath, filename),
        copyPath = path.resolve(outputPath, filename),
        script = new PexFile(scriptPath);
    script.parse(err => {
        expect(err).toBeUndefined();
        script.filePath = copyPath;
        script.write(err => {
            expect(err).toBeUndefined();
            let input = fs.readFileSync(scriptPath),
                output = fs.readFileSync(copyPath);
            expect(input).toBeDefined();
            expect(output).toBeDefined();
            expect(Buffer.isBuffer(input)).toBe(true);
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(input.length).toBe(output.length);
            expect(input).toEqual(output);
            console.log(`Verified ${filename}`);
            done();
        });
    });
};

describe('Pex File Writing', () => {
    describe('binary identical', () => {
        let files = fs.readdirSync(inputPath, {})
            .filter(file => file.endsWith('.pex'));
        if (!files.length) {
            it(`should have files to test`, () => {
                throw new Error('There are no scripts to compare.  Copy some .pex files to the test/input folder to test them.')
            });
        } else {
            files.forEach(file => {
                it(`should be binary identical, ${file}`, done => {
                    testFile(file, done);
                });
            });
        }
    });
});