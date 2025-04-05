const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { parseCfgFileData, parseCfgFileComments } = require('../utils/parse-cfg');

suite('parseCfgFileData Tests', () => {
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

        const result = await parseCfgFileData(tempFilePath);

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

        const result = await parseCfgFileData(tempFilePath);

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
            await parseCfgFileData(tempFilePath);
        }, /Invalid line format: invalid_line/);
    });

    test('should handle files with no sections (default section)', async () => {
        const cfgContent = `
            key1=value1
            key2=value2
        `;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFileData(tempFilePath);

        assert.deepStrictEqual(result,
            new Map([
                ['', new Map([['key1', 'value1'], ['key2', 'value2']])],
            ])
        );
    });

    test('should return an empty object for an empty file', async () => {
        const cfgContent = ``;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFileData(tempFilePath);

        assert.deepStrictEqual(result, new Map([
            ['', new Map()],
        ]));
    });
});

suite('parseCfgFileComments Tests', () => {
    let tempFilePath;

    setup(async () => {
        // Create a temporary file for testing
        tempFilePath = path.join(__dirname, 'temp-comments.cfg');
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

    test('should parse comments associated with sections', async () => {
        const cfgContent = `
            # Global comment
            [section1]
            # Comment for section1
            ; Another comment for section1
            key1=value1

            [section2]
            # Comment for section2
        `;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFileComments(tempFilePath);

        assert.deepStrictEqual(result, new Map([
            ['', ['Global comment']],
            ['section1', ['Comment for section1', 'Another comment for section1']],
            ['section2', ['Comment for section2']],
        ]));
    });

    test('should handle files with no comments', async () => {
        const cfgContent = `
            [section1]
            key1=value1

            [section2]
            key2=value2
        `;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFileComments(tempFilePath);

        assert.deepStrictEqual(result, new Map([
            ['', []],
            ['section1', []],
            ['section2', []],
        ]));
    });

    test('should handle files with only comments', async () => {
        const cfgContent = `
            # Global comment
            ; Another global comment
        `;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFileComments(tempFilePath);

        assert.deepStrictEqual(result, new Map([
            ['', ['Global comment', 'Another global comment']],
        ]));
    });

    test('should handle comments before and after sections', async () => {
        const cfgContent = `
            # Comment before section1
            [section1]
            # Comment inside section1
            key1=value1
            # Comment after key1

            # Comment before section2
            [section2]
            ; Comment inside section2
        `;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFileComments(tempFilePath);

        assert.deepStrictEqual(result, new Map([
            ['', ['Comment before section1']],
            ['section1', ['Comment inside section1', 'Comment after key1', 'Comment before section2']],
            ['section2', ['Comment inside section2']],
        ]));
    });

    test('should return an empty map for an empty file', async () => {
        const cfgContent = ``;
        await fs.writeFile(tempFilePath, cfgContent);

        const result = await parseCfgFileComments(tempFilePath);

        assert.deepStrictEqual(result, new Map([
            ['', []],
        ]));
    });
});