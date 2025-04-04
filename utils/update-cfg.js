const vscode = require('vscode');
const parseCfgFile = require('./parse-cfg').parseCfgFile;
const fs = require('fs').promises;

/**
 * This function reformats the target cfg file with the source cfg file
 * Keys are sorted in source target order
 * New values are added to the target file
 * 
 * @param {string} sourceFilePath 
 * @param {string} targetFilePath 
 */
const updateCfgFile = async function (sourceFilePath, targetFilePath) {
    try {

        // Read and parse the source and target cfg files
        const sourceData = await parseCfgFile(sourceFilePath);
        const targetData = await parseCfgFile(targetFilePath);
        const allSections = [...sourceData.keys()];
        for (const section of targetData.keys()) {
            if (!allSections.includes(section)) {
                allSections.push(section);
            }
        }
        let newTargetFileContent = [];
        for (const section of allSections) {
            if (section !== "") {
                newTargetFileContent.push(`[${section}]`);
            }
            const sourceSectionData = sourceData.get(section) || new Map();
            const targetSectionData = targetData.get(section) || new Map();
            const allKeys = [...sourceSectionData.keys()];
            for (const key of targetSectionData.keys()) {
                if (!allKeys.includes(key)) {
                    allKeys.push(key);
                }
            }
            // Sort keys in the order of source file keys
            for (const key of allKeys) {
                const sourceValue = sourceSectionData.get(key) || undefined;
                const targetValue = targetSectionData.get(key) || sourceValue;
                if (sourceValue === undefined) {
                    newTargetFileContent.push(`;${key}=${targetValue}`);
                } else {
                    newTargetFileContent.push(`${key}=${targetValue}`);
                }
            }
        }
        // Write the new content to the target cfg file
        console.log(newTargetFileContent);
        // fs.writeFile(targetFilePath, newTargetFileContent.join('\n'), 'utf8')
        //     .then(() => {
        //         vscode.window.showInformationMessage('Target cfg file updated successfully!');
        //     })
        //     .catch((err) => {
        //         console.error('Error writing to target cfg file:', err.message);
        //     });
        let edit = new vscode.WorkspaceEdit();
        const targetUri = vscode.Uri.file(targetFilePath);
        edit.delete(targetUri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)));
        edit.insert(targetUri, new vscode.Position(0, 0), newTargetFileContent.join('\n'));
        const success = await vscode.workspace.applyEdit(edit);

        if (success) {
            const document = await vscode.workspace.openTextDocument(targetUri);
            await document.save();
        } else {
            vscode.window.showErrorMessage('Failed to apply edits to the target cfg file.');
        }
        vscode.window.showInformationMessage('Target cfg file updated successfully!');

    }
    catch (error) {
        console.error('Error updating cfg file:', error.message);
    }
}
module.exports = { updateCfgFile };