import * as assert from 'assert';
import { promises as fs } from 'fs';
import * as path from 'path';
import { parseCfgFileData, parseCfgFileComments } from '../utils/parse-cfg';

interface ParseDataTestCase {
    cfgContent: string;
    expectedResult: Map<string, Map<string, string>>;
}

interface ParseCommentsTestCase {
    cfgContent: string;
    expectedResult: Map<string, string[]>;
}

suite('parseCfgFileData Tests', () => {
    let tempFilePath: string;

    const dataTestCases: ParseDataTestCase[] = [
        {
            cfgContent: `# This is a comment\n[section1\nkey1=value1\nkey2=value2\n[section2]\nkeyA=valueA\nkeyB=valueB`,
            expectedResult: new Map([
                ['', new Map()],
                ['section1', new Map([['key1', 'value1'], ['key2', 'value2']])],
                ['section2', new Map([['keyA', 'valueA'], ['keyB', 'valueB']])]
            ])
        },
        {
            cfgContent: `# Comment line\n; Another comment\n[section]\nkey=value\n# Another comment`,
            expectedResult: new Map([
                ['', new Map()],
                ['section', new Map([['key', 'value']])]
            ])
        },
        {
            cfgContent: `key1=value1\nkey2=value2
            `,
            expectedResult: new Map([
                ['', new Map([['key1', 'value1'], ['key2', 'value2']])]
            ])
        }
    ];

    setup(async () => {
        // Create a temporary file for testing
        tempFilePath = path.join(__dirname, 'temp.cfg');
    });

    teardown(async () => {
        // Clean up the temporary file after each test
        try {
            await fs.unlink(tempFilePath);
        } catch (err: any) {
            console.error(`Error deleting temp file: ${err.message}`);
        }
    });

    dataTestCases.forEach((testCase, index) => {
        test(`Data Test Case ${index + 1}`, async () => {
            await fs.writeFile(tempFilePath, testCase.cfgContent);

            const result = await parseCfgFileData(tempFilePath);

            assert.deepStrictEqual(result, testCase.expectedResult);
        });
    });
});

suite('parseCfgFileComments Tests', () => {
    let tempFilePath: string;

    const commentsTestCases: ParseCommentsTestCase[] = [
        {
            cfgContent: `\n# Global comment\n[section1]\n# Comment for section1\n; Another comment for section1\nkey1=value1\n[section2]\n# Comment for section2`,
            expectedResult: new Map([
                ['', ['Global comment']],
                ['section1', ['Comment for section1', 'Another comment for section1']],
                ['section2', ['Comment for section2']]
            ])
        },
        {
            cfgContent: `\n[section1]\nkey1=value1\n[section2]\nkey2=value2`,
            expectedResult: new Map([
                ['', []],
                ['section1', []],
                ['section2', []]
            ])
        },
        {
            cfgContent: `\n# Global comment\n; Another global comment`,
            expectedResult: new Map([
                ['', ['Global comment', 'Another global comment']]
            ])
        }
    ];

    setup(async () => {
        // Create a temporary file for testing
        tempFilePath = path.join(__dirname, 'temp-comments.cfg');
    });

    teardown(async () => {
        // Clean up the temporary file after each test
        try {
            await fs.unlink(tempFilePath);
        } catch (err: any) {
            console.error(`Error deleting temp file: ${err.message}`);
        }
    });

    commentsTestCases.forEach((testCase, index) => {
        test(`Comments Test Case ${index + 1}`, async () => {
            await fs.writeFile(tempFilePath, testCase.cfgContent);

            const result = await parseCfgFileComments(tempFilePath);

            assert.deepStrictEqual(result, testCase.expectedResult);
        });
    });
});