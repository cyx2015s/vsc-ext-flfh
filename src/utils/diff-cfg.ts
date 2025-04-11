import { parseCfgFileData, CfgData } from "./parse-cfg";

interface ChangeData {
    oldValue: string | undefined;
    newValue: string | undefined;
}

type DiffCfgData = Map<string, Map<string, ChangeData>>;

export async function diffCfgFiles(oldCfgFilePath: string, newCfgFilePath: string): Promise<DiffCfgData> {
    // Read the old and new cfg files and parse them into maps.
    let oldCfgData = await parseCfgFileData(oldCfgFilePath);
    let newCfgData = await parseCfgFileData(newCfgFilePath);
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