import * as assert from 'assert';
import { promises as fs } from 'fs';
import * as path from 'path';
import { updateCfgFile } from '../utils/update-cfg';

interface TestCase {
    sourceContent: string;
    targetContent: string;
    expectedContent: string;
}

suite('updateCfgFile Tests', () => {
    let sourceFilePath: string, targetFilePath: string;

    const testCases: TestCase[] = [
        {
            sourceContent: `key1=Key1`,
            targetContent: `key1=键1`,
            expectedContent: `key1=键1`
        },
        {
            sourceContent: `key1=Key1\nkey2=Key2\nkey3=Key3\nkey4=Key4\nkey5=Key5`,
            targetContent: `key1=键1\nkey3=键3\nkey2=键2`,
            expectedContent: `key1=键1\nkey2=键2\nkey3=键3\nkey4=Key4\nkey5=Key5`
        },
        {
            sourceContent: `# A comment\niron-plate=[item=iron-plate] Iron Plate`,
            targetContent: `iron-plate=[item=iron-plate]铁板\n# Another comment`,
            expectedContent: `; A comment\niron-plate=[item=iron-plate]铁板\n# Another comment`
        }
    ];

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
        } catch (err: any) {
            console.error(`Error deleting temp files: ${err.message}`);
        }
    });

    testCases.forEach((testCase, index) => {
        test(`Test case ${index + 1}`, async () => {
            await fs.writeFile(sourceFilePath, testCase.sourceContent);
            await fs.writeFile(targetFilePath, testCase.targetContent);

            await updateCfgFile(sourceFilePath, targetFilePath);

            const result = await fs.readFile(targetFilePath, 'utf8');
            assert.strictEqual(result.trim(), testCase.expectedContent.trim());
        });
    });
});