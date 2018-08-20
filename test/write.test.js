let path = require('path'),
    fs = require('fs'),
    ffp = require('ffp'),
    {PexFile} = require('../dist/index');

let scriptsPath = path.resolve(__dirname, './scripts'),
    outputPath = path.resolve(__dirname, './output');

ffp.setLogger({
    log: () => {},
    warn: () => {},
    error: console.error
});

let testFile = function(filename, done) {
    let scriptPath = path.resolve(scriptsPath, filename),
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
        let files = fs.readdirSync(scriptsPath, {});
        files.forEach(file => {
            it(`should be binary identical, ${file}`, done => {
                testFile(file, done);
            });
        })
    });
});