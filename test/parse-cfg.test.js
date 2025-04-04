const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { parseCfgFile } = require('../utils/parse-cfg');

suite('parseCfgFile Tests', () => {
    let tempFilePath;

    setup(async () => {
        // Create a temporary file for testing
        tempFilePath = path.join(__dirname, 'temp.cfg');
    });

    teardown(async () => {
        // Clean up the temporary file after each test
        try {
            await fs.unlink(tempFilePath);
        } catch (err) {
            // Ignore errors if the file doesn't exist
            console.error(`Error deleting temp file: ${err.message}`);
        }
    });

    test('should parse a valid cfg file with sections and key-value pairs', async () => {
        const cfgContent = `
            # This is a comment
            [section1]
            key1=value1
            key2=value2

            [section2]
            keyA=valueA
            keyB=valueB
        `;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFile(tempFilePath);

        assert.deepStrictEqual(result, new Map([
            ['', new Map()],
            ['section1', new Map([['key1', 'value1'], ['key2', 'value2']])],
            ['section2', new Map([['keyA', 'valueA'], ['keyB', 'valueB']])],
        ]));
    });

    test('should ignore comments and empty lines', async () => {
        const cfgContent = `
            # Comment line
            ; Another comment

            [section]
            key=value

            # Another comment
        `;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFile(tempFilePath);

        assert.deepStrictEqual(result,
            new Map([
                ['', new Map()],
                ['section', new Map([['key', 'value']])],
            ])
        );
    });

    test('should throw an error for invalid line format', async () => {
        const cfgContent = `
            [section]
            invalid_line
        `;
        await fs.writeFile(tempFilePath, cfgContent);

        await assert.rejects(async () => {
            await parseCfgFile(tempFilePath);
        }, /Invalid line format: invalid_line/);
    });

    test('should handle files with no sections (default section)', async () => {
        const cfgContent = `
            key1=value1
            key2=value2
        `;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFile(tempFilePath);

        assert.deepStrictEqual(result,
            new Map([
                ['', new Map([['key1', 'value1'], ['key2', 'value2']])],
            ])
        );
    });

    test('should return an empty object for an empty file', async () => {
        const cfgContent = ``;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFile(tempFilePath);

        assert.deepStrictEqual(result, new Map([
            ['', new Map()],
        ]));
    });
});