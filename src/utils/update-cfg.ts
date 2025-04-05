import * as vscode from 'vscode';
import { parseCfgFileData, parseCfgFileComments } from './parse-cfg';

/**
 * Combines keys from two maps, ensuring no duplicates.
 * @param sourceMap - The source map.
 * @param targetMap - The target map.
 * @returns An array of unique keys from both maps.
 */
const combinedKeys = (sourceMap: Map<string, any>, targetMap: Map<string, any>): string[] => {
    const allKeys = [...sourceMap.keys()];
    for (const key of targetMap.keys()) {
        if (!allKeys.includes(key)) {
            allKeys.push(key);
        }
    }
    return allKeys;
};

/**
 * Formats a line for the cfg file.
 * @param key - The key.
 * @param value - The value.
 * @param isComment - Whether the line is a comment.
 * @returns The formatted line.
 */
const formatLine = (key: string, value: string, isComment: boolean): string =>
    isComment ? `;${key}=${value}` : `${key}=${value}`;

/**
 * Updates the target cfg file with data from the source cfg file.
 * @param sourceFilePath - The path to the source cfg file.
 * @param targetFilePath - The path to the target cfg file.
 * @returns A promise that resolves to true if the update was successful, false otherwise.
 */
export const updateCfgFile = async (sourceFilePath: string, targetFilePath: string): Promise<boolean> => {
    try {
        const sourceData = await parseCfgFileData(sourceFilePath);
        const targetData = await parseCfgFileData(targetFilePath);
        const sourceComments = await parseCfgFileComments(sourceFilePath);
        const targetComments = await parseCfgFileComments(targetFilePath);
        const allSections = combinedKeys(sourceData, targetData);

        let newTargetFileContent: string[] = [];
        for (const section of allSections) {
            if (section !== "") {
                newTargetFileContent.push(`\n[${section}]`);
            }
            const sourceSectionData = sourceData.get(section) || new Map();
            const targetSectionData = targetData.get(section) || new Map();
            const sourceSectionComments = sourceComments.get(section) || [];
            const targetSectionComments = targetComments.get(section) || [];
            const allKeys = combinedKeys(sourceSectionData, targetSectionData);

            for (const key of allKeys) {
                const sourceValue = sourceSectionData.get(key) || undefined;
                const targetValue = targetSectionData.get(key) || sourceValue;
                newTargetFileContent.push(formatLine(key, targetValue, sourceValue === undefined));
            }

            for (const comment of sourceSectionComments) {
                newTargetFileContent.push(`;${comment}`);
            }
            for (const comment of targetSectionComments) {
                newTargetFileContent.push(`#${comment}`);
            }
        }

        const edit = new vscode.WorkspaceEdit();
        const targetUri = vscode.Uri.file(targetFilePath);
        edit.delete(targetUri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)));
        edit.insert(targetUri, new vscode.Position(0, 0), newTargetFileContent.join('\n'));
        const success = await vscode.workspace.applyEdit(edit);

        if (success) {
            const document = await vscode.workspace.openTextDocument(targetUri);
            await document.save();
            return success;
        } else {
            return success;
        }
    } catch (error: any) {
        console.error('Error updating cfg file:', error.message);
        return false;
    }
};