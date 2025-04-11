import * as assert from 'assert';
import { promises as fs } from 'fs';
import * as path from 'path';
import { diffCfgFiles } from '../utils/diff-cfg';

interface DiffTestCase {
    oldCfgContent: string;
    newCfgContent: string;
    expectedResult: Map<string, Map<string, { oldValue: string | undefined; newValue: string | undefined }>>;
}

suite('diffCfgFiles Tests', () => {
    let oldTempFilePath: string;
    let newTempFilePath: string;

    const diffTestCases: DiffTestCase[] = [
        {
            oldCfgContent: `[section1]\nkey1=value1\nkey2=value2\n[section2]\nkeyA=valueA`,
            newCfgContent: `[section1]\nkey1=value1\nkey2=newValue2\n[section2]\nkeyB=valueB`,
            expectedResult: new Map([
                ['', new Map()],
                ['section1', new Map([['key2', { oldValue: 'value2', newValue: 'newValue2' }]])],
                ['section2', new Map([
                    ['keyA', { oldValue: 'valueA', newValue: undefined }],
                    ['keyB', { oldValue: undefined, newValue: 'valueB' }]
                ])]
            ])
        },
        {
            oldCfgContent: `[section]\nkey=value`,
            newCfgContent: `[section]\nkey=newValue`,
            expectedResult: new Map([
                ['', new Map()],
                ['section', new Map([['key', { oldValue: 'value', newValue: 'newValue' }]])]
            ])
        },
        {
            oldCfgContent: `key1=value1\nkey2=value2`,
            newCfgContent: `key1=value1\nkey3=value3`,
            expectedResult: new Map([
                ['', new Map([
                    ['key2', { oldValue: 'value2', newValue: undefined }],
                    ['key3', { oldValue: undefined, newValue: 'value3' }]
                ])]
            ])
        }
    ];

    setup(async () => {
        // Create temporary files for testing
        oldTempFilePath = path.join(__dirname, 'old-temp.cfg');
        newTempFilePath = path.join(__dirname, 'new-temp.cfg');
    });

    teardown(async () => {
        // Clean up the temporary files after each test
        try {
            await fs.unlink(oldTempFilePath);
            await fs.unlink(newTempFilePath);
        } catch (err: any) {
            console.error(`Error deleting temp files: ${err.message}`);
        }
    });

    diffTestCases.forEach((testCase, index) => {
        test(`Diff Test Case ${index + 1}`, async () => {
            await fs.writeFile(oldTempFilePath, testCase.oldCfgContent);
            await fs.writeFile(newTempFilePath, testCase.newCfgContent);

            const result = await diffCfgFiles(oldTempFilePath, newTempFilePath);

            assert.deepStrictEqual(result, testCase.expectedResult);
        });
    });
});