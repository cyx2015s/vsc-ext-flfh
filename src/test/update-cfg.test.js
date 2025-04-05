const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { updateCfgFile } = require('../utils/update-cfg.js');

suite('updateCfgFile Tests', () => {
    let sourceFilePath, targetFilePath;

    setup(async () => {
        // Create temporary files for testing
        sourceFilePath = path.join(__dirname, 'source.cfg');
        targetFilePath = path.join(__dirname, 'target.cfg');
    });

    teardown(async () => {
        // Clean up the temporary files after each test
        try {
            await fs.unlink(sourceFilePath);
            await fs.unlink(targetFilePath);
        } catch (err) {
            console.error(`Error deleting temp files: ${err.message}`);
        }
    });

    test('base test', async () => {
        const sourceContent = `key1=Key1`; // Fill with source file content
        const targetContent = `key1=键1`; // Fill with target file content
        const expectedContent = `key1=键1`; // Fill with expected target file content

        await fs.writeFile(sourceFilePath, sourceContent);
        await fs.writeFile(targetFilePath, targetContent);

        await updateCfgFile(sourceFilePath, targetFilePath);

        const result = await fs.readFile(targetFilePath, 'utf8');
        assert.strictEqual(result.trim(), expectedContent.trim());
    });

    test('should arange target file keys in order of source file keys', async () => {
        const sourceContent =
            `key1=Key1
key2=Key2
key3=Key3
key4=Key4
key5=Key5`; // Fill with source file content
        const targetContent = `key1=键1
key3=键3
key2=键2`; // Fill with target file content
        const expectedContent = `key1=键1
key2=键2
key3=键3
key4=Key4
key5=Key5`; // Fill with expected target file content

        await fs.writeFile(sourceFilePath, sourceContent);
        await fs.writeFile(targetFilePath, targetContent);

        await updateCfgFile(sourceFilePath, targetFilePath);

        const result = await fs.readFile(targetFilePath, 'utf8');
        assert.strictEqual(result.trim(), expectedContent.trim());
    });
});