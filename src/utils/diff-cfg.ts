import { parseCfgFileData, CfgData } from "./parse-cfg";
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

interface ChangeData {
    oldValue: string | undefined;
    newValue: string | undefined;
}

type DiffCfgData = Map<string, Map<string, ChangeData>>;

export function stringifyDiffCfgData(diffCfgData: DiffCfgData): string {
    let result = '';
    for (const [section, changes] of diffCfgData) {
        if (section) {
            result += `[${section}]\n`;
        } for (const [key, change] of changes) {
            // ignore oldValue.
            if (change.newValue === undefined) {
                result += `;${key}=${change.oldValue}\n`;
            } else {
                result += `${key}=${change.newValue}\n`;
            }
        }
    }
    return result;
}

export function jsonifyDiffCfgData(diffCfgData: DiffCfgData): string {
    let result: { [key: string]: { [key: string]: ChangeData } } = {};
    for (const [section, changes] of diffCfgData) {
        result[section] = {};
        for (const [key, change] of changes) {
            result[section][key] = change;
        }
    }
    return JSON.stringify(result, null, 2);
}

export async function diffCfgFiles(oldCfgFilePath: string | CfgData, newCfgFilePath: string | CfgData): Promise<DiffCfgData> {
    // Read the old and new cfg files and parse them into maps.
    let oldCfgData: CfgData;
    let newCfgData: CfgData;
    if (typeof oldCfgFilePath === 'string') {
        oldCfgData = await parseCfgFileData(oldCfgFilePath);
    } else {
        oldCfgData = oldCfgFilePath as CfgData;
    }

    if (typeof newCfgFilePath === 'string') {
        newCfgData = await parseCfgFileData(newCfgFilePath);
    }
    else {
        newCfgData = newCfgFilePath as CfgData;
    }

    // Compare the keys in both maps,
    let diff: Map<string, Map<string, ChangeData>> = new Map<string, Map<string, ChangeData>>([["", new Map()]]);
    let allSections = [...oldCfgData.keys(), ...newCfgData.keys()];
    allSections = [...new Set(allSections)];
    for (const section of allSections) {
        let oldSectionData = oldCfgData.get(section) || new Map<string, string>();
        let newSectionData = newCfgData.get(section) || new Map<string, string>();
        let allKeys = [...oldSectionData.keys(), ...newSectionData.keys()];
        allKeys = [...new Set(allKeys)];
        let sectionDiff = new Map<string, ChangeData>();
        for (const key of allKeys) {
            let oldValue = oldSectionData.get(key);
            let newValue = newSectionData.get(key);
            if (oldValue !== newValue) {
                sectionDiff.set(key, { oldValue, newValue });
            }
        }
        diff.set(section, sectionDiff);
    }
    return diff;
}

export async function getDiffNewValues(diffCfgData: DiffCfgData): Promise<CfgData> {
    let newCfgData: CfgData = new Map<string, Map<string, string>>([["", new Map()]]);
    for (const [section, changes] of diffCfgData) {
        let newSectionData = new Map<string, string>();
        for (const [key, change] of changes) {
            if (change.newValue !== undefined) {
                newSectionData.set(key, change.newValue);
            }
        }
        newCfgData.set(section, newSectionData);
    }
    return newCfgData;
}

export async function getDiffOldValues(diffCfgData: DiffCfgData): Promise<CfgData> {
    let oldCfgData: CfgData = new Map<string, Map<string, string>>([["", new Map()]]);
    for (const [section, changes] of diffCfgData) {
        let oldSectionData = new Map<string, string>();
        for (const [key, change] of changes) {
            if (change.oldValue !== undefined) {
                oldSectionData.set(key, change.oldValue);
            }
        }
        oldCfgData.set(section, oldSectionData);
    }
    return oldCfgData;
}

export async function diffCfgFilesWithGit(cfgFilePath: string, commitOld: string, commitNew: string, gitRepoPath: string): Promise<DiffCfgData> {
    // Construct git commands to retrieve file content from the two commits.
    const oldFileCommand = `git --no-pager show ${commitOld}:${cfgFilePath}`;
    const newFileCommand = `git --no-pager show ${commitNew}:${cfgFilePath}`;

    try {
        // Execute git commands to get file content.
        const { stdout: oldFileContent } = await execAsync(oldFileCommand, { cwd: gitRepoPath });
        const { stdout: newFileContent } = await execAsync(newFileCommand, { cwd: gitRepoPath });

        // Parse the file content into CfgData.
        const oldCfgData = await parseCfgFileData(oldFileContent);
        const newCfgData = await parseCfgFileData(newFileContent);

        // Use the existing diff logic to compare the two CfgData objects.
        const diff = await diffCfgFiles(oldCfgData, newCfgData);

        return diff;
    } catch (error) {
        console.error('Error while diffing cfg data with git:', error);
        throw error;
    }
}