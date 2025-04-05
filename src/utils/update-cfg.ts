import * as vscode from 'vscode';
import { parseCfgFileData, parseCfgFileComments } from './parse-cfg';
import { promises as fs } from 'fs';

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

        let newTargetFileContentMap: Map<string, string[]> = new Map([["", []]]);

        const sourceContent = await fs.readFile(sourceFilePath, 'utf8');
        let currentSection = '';
        sourceContent.split('\n').forEach((line) => {
            line = line.trim();
            if (/^\[.*\]$/.test(line)) {
                // Section header
                currentSection = line.slice(1, -1);
                newTargetFileContentMap.set(currentSection, []);
            } else if (line.trim() === '') {
                // Empty line
                newTargetFileContentMap.get(currentSection)!.push('');
            } else if (line.startsWith(";") || line.startsWith("#")) {
                // Comment line
                newTargetFileContentMap.get(currentSection)!.push(";" + line.slice(1));
            } else {
                // Key-value pair
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=');
                const targetValue = targetData.get(currentSection)?.get(key) ?? value;
                newTargetFileContentMap.get(currentSection)!.push(formatLine(key, targetValue, false));
            }
        });
        for (const section of allSections) {
            if (!sourceData.has(section)) {
                // It is a section that is not in the source file
                // Add it in commented form
                newTargetFileContentMap.set(section, []);
                for (const [key, value] of targetData.get(section)!.entries()) {
                    newTargetFileContentMap.get(section)?.push(formatLine(key, value, true));
                }

            } else {
                for (const [key, value] of targetData.get(section)!.entries()) {
                    if (!sourceData.get(section)!.has(key)) {
                        // It is a key that is not in the source file
                        // Add it in commented form
                        newTargetFileContentMap.get(section)?.push(formatLine(key, value, true));
                    }
                }
            }
            for (const comment of targetComments.get(section)!) {
                newTargetFileContentMap.get(section)?.push(`#${comment}`);
            }
        }
        let newTargetFileContent: string[] = []
        for (const [section, lines] of newTargetFileContentMap.entries()) {
            if (section !== "") {
                // Add section header only if it's not the default section
                newTargetFileContent.push(`[${section}]`);
            }
            for (const line of lines) {
                newTargetFileContent.push(line);
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