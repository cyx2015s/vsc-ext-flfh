import * as vscode from "vscode";

export async function quickPickCfgFiles(placeHolder: string = 'Select a .cfg file'): Promise<vscode.Uri | undefined> {
    const files = await vscode.workspace.findFiles('**/*.cfg');
    if (files.length === 0) {
        vscode.window.showInformationMessage('No .cfg files found in the workspace.');
        return undefined;
    }

    const items = files.map(file => ({
        label: vscode.workspace.asRelativePath(file),
        description: file.fsPath,
        uri: file
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: placeHolder,
        canPickMany: false
    });

    return selected ? selected.uri : undefined;
}