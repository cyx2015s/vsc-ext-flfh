const vscode = require('vscode');
const { parseCfgFileData, parseCfgFileComments } = require('./parse-cfg');

/**
 * 
 * @param {Map} sourceMap 
 * @param {Map} targetMap 
 * @returns {Iterable<string>} - Returns an array of keys from both maps, ensuring no duplicates.
 */
const combinedKeys = (sourceMap, targetMap) => {
    const allKeys = [...sourceMap.keys()];
    for (const key of targetMap.keys()) {
        if (!allKeys.includes(key)) {
            allKeys.push(key);
        }
    }
    return allKeys;
}

/**
 * 
 * @param {string} key 
 * @param {string} value 
 * @param {boolean} isComment 
 * @returns 
 */
const formatLine = (key, value, isComment) => isComment ? `;${key}=${value}` : `${key}=${value}`;


/**
 * This function reformats the target cfg file with the source cfg file
 * Keys are sorted in source target order
 * New values are added to the target file
 * 
 * @param {string} sourceFilePath 
 * @param {string} targetFilePath 
 * @returns {Promise<boolean>} - Returns true if the update was successful, false otherwise.
 */
const updateCfgFile = async function (sourceFilePath, targetFilePath) {
    try {

        // Read and parse the source and target cfg files
        const sourceData = await parseCfgFileData(sourceFilePath);
        const targetData = await parseCfgFileData(targetFilePath);
        const sourceComments = await parseCfgFileComments(sourceFilePath);
        const targetComments = await parseCfgFileComments(targetFilePath);
        const allSections = combinedKeys(sourceData, targetData);
        let newTargetFileContent = [];
        for (const section of allSections) {
            if (section !== "") {
                newTargetFileContent.push(`\n[${section}]`);
            }
            const sourceSectionData = sourceData.get(section) || new Map();
            const targetSectionData = targetData.get(section) || new Map();
            const sourceSectionComments = sourceComments.get(section) || new Map();
            const targetSectionComments = targetComments.get(section) || new Map();
            const allKeys = combinedKeys(sourceSectionData, targetSectionData);
            for (const key of allKeys) {
                // add key value pairs to the new target file content
                const sourceValue = sourceSectionData.get(key) || undefined;
                const targetValue = targetSectionData.get(key) || sourceValue;
                newTargetFileContent.push(formatLine(key, targetValue, sourceValue === undefined));
            }
            // there's no good way to decide where to put the comments, so we just add them at the end of the section
            // distinguish with the prefix
            for (const comment of sourceSectionComments) {
                newTargetFileContent.push(`;${comment}`);
            }
            for (const comment of targetSectionComments) {
                newTargetFileContent.push(`#${comment}`);
            }
        }
        // Write the new content to the target cfg file
        let edit = new vscode.WorkspaceEdit();
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
    }
    catch (error) {
        console.error('Error updating cfg file:', error.message);
        return false;
    }
}
module.exports = { updateCfgFile };