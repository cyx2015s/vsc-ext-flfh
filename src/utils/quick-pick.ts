import * as vscode from "vscode";

export async function quickPickCfgFiles(placeHolder: string = 'Select a .cfg file'): Promise<vscode.Uri | undefined> {
    const files = await vscode.workspace.findFiles('**/*.cfg');
    if (files.length === 0) {
        vscode.window.showInformationMessage(vscode.l10n.t('No .cfg files found in the workspace.'));
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

export async function quickPickGitRepo(): Promise<string | undefined> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage(vscode.l10n.t('No workspace folders found.'));
        return undefined;
    }

    const items = folders.map(folder => ({
        label: folder.name,
        description: folder.uri.fsPath,
        path: folder.uri.fsPath
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: vscode.l10n.t('Select a Git repository'),
        canPickMany: false
    });

    return selected ? selected.path : undefined;
}

export async function quickPickGitCommit(repoPath: string): Promise<string | undefined> {
    const exec = require('child_process').exec;

    return new Promise((resolve, reject) => {
        exec('git log --oneline', { cwd: repoPath }, (error: any, stdout: string) => {
            if (error) {
                vscode.window.showErrorMessage(vscode.l10n.t('Failed to retrieve Git commits: {0}', error.message));
                return reject(error);
            }

            const commits = stdout.split('\n').filter(line => line.trim() !== '').map(line => {
                const [hash, ...message] = line.split(' ');
                return { label: hash, description: message.join(' ') };
            });

            vscode.window.showQuickPick(commits, {
                placeHolder: vscode.l10n.t('Select a commit'),
                canPickMany: false
            }).then(selected => {
                resolve(selected ? selected.label : undefined);
            });
        });
    });
}