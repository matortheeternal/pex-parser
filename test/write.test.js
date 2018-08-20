let path = require('path'),
    fs = require('fs'),
    {PexFile} = require('../dist/index');

let inputPath = path.resolve(__dirname, './fixtures/game.pex'),
    outputPath = path.resolve(__dirname, './output/game.pex');

describe('Pex File Writing', () => {
    it('should yield a binary identical file', done => {
        let script = new PexFile(inputPath);
        script.parse(err => {
            expect(err).toBeUndefined();
            script.filePath = outputPath;
            script.write(err => {
                expect(err).toBeUndefined();
                let input = fs.readFileSync(inputPath),
                    output = fs.readFileSync(outputPath);
                expect(input).toBeDefined();
                expect(output).toBeDefined();
                expect(Buffer.isBuffer(input)).toBe(true);
                expect(Buffer.isBuffer(output)).toBe(true);
                expect(input.length).toBe(output.length);
                expect(input).toEqual(output);
                done();
            });
        });
    });
});