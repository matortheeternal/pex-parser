let path = require('path'),
    fs = require('fs'),
    ffp = require('file-format-parser'),
    {PexFile, setGame} = require('../index');

const noScriptsErrorMessage = 'There are no scripts to compare.  ' +
    'Copy some .pex files to the test/input folder to test them.';

['TES5', 'FO4'].forEach(appName => {
    describe(`Pex Files (${appName})`, () => {
        let inputPath = path.resolve(__dirname, `./${appName}/input`);
            outputPath = path.resolve(__dirname, `./${appName}/output`);

        let testFile = function(filename) {
            let scriptPath = path.resolve(inputPath, filename),
                copyPath = path.resolve(outputPath, filename),
                script = new PexFile(scriptPath);
            script.parse();
            script.filePath = copyPath;
            script.write();
            let input = fs.readFileSync(scriptPath),
                output = fs.readFileSync(copyPath);
            expect(input).toBeDefined();
            expect(output).toBeDefined();
            expect(Buffer.isBuffer(input)).toBe(true);
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(input.length).toBe(output.length);
            expect(input).toEqual(output);
        };

        beforeAll(() => {
            ffp.setLogger({
                log: () => {},
                warn: () => {},
                error: console.error
            });
            setGame(appName);
        });

        let files = fs.readdirSync(inputPath, {})
            .filter(file => file.endsWith('.pex'));

        it('should have files to test', () => {
            if (!files.length)
                throw new Error(noScriptsErrorMessage)
        });

        files.forEach(file => {
            describe(file, () => {
                it('should be binary identical', () => testFile(file));
            });
        });
    });
});