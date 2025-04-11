// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { updateCfgFile } from './utils/update-cfg';
import { quickPickCfgFiles, quickPickGitRepo, quickPickGitCommit } from './utils/quick-pick';
import { registerLocaleKeyValueSignatureProvider } from "./signatureHelpProvider";
import { diffCfgFilesWithGit, diffCfgFiles, jsonifyDiffCfgData, stringifyDiffCfgData } from './utils/diff-cfg';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext): void {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('"FLFH" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	const updateKeysCommand = vscode.commands.registerCommand('extension.updateKeysFromSource', async () => {
		try {
			const sourceFile = await quickPickCfgFiles(vscode.l10n.t("Select the source .cfg file (Usually the one under locale/en/)"));
			if (!sourceFile) {
				return;
			}
			vscode.window.showInformationMessage(vscode.l10n.t(`Selected source file: {0}`, sourceFile.fsPath));
			const targetFile = await quickPickCfgFiles(vscode.l10n.t(`Select the target .cfg file (The language you want to translate to)`));
			if (!targetFile) {
				return;
			}
			if (sourceFile.fsPath === targetFile.fsPath) {
				vscode.window.showErrorMessage(vscode.l10n.t('Source and target files cannot be the same.'));
				return;
			}
			updateCfgFile(sourceFile.fsPath, targetFile.fsPath).then((success) => {
				if (success) {
					vscode.window.showInformationMessage(vscode.l10n.t(`Target file {0} updated successfully!`, targetFile.fsPath));
				} else {
					vscode.window.showErrorMessage(vscode.l10n.t(`Failed to update target file {0}.`, targetFile.fsPath));
				}
			});
		} catch (error: any) {
			vscode.window.showErrorMessage(vscode.l10n.t(`Error: {0}`, error.message));
		}
	});

	context.subscriptions.push(updateKeysCommand);

	const updateOnEditorCommand = vscode.commands.registerCommand('extension.updateKeysFromSourceOnEditor', async () => {
		try {
			const activeEditor = vscode.window.activeTextEditor;
			if (!activeEditor || !activeEditor.document.fileName.endsWith(".cfg")) {
				vscode.window.showErrorMessage(vscode.l10n.t('No active .cfg file is open in the editor.'));
				return;
			}
			const sourceFile = await quickPickCfgFiles(vscode.l10n.t("Select the source .cfg file (Usually the one under locale/en/)"));
			if (!sourceFile) {
				return;
			}
			const targetFile = activeEditor.document.uri;
			if (sourceFile.fsPath === targetFile.fsPath) {
				vscode.window.showErrorMessage(vscode.l10n.t('Source and target files cannot be the same.'));
				return;
			}
			vscode.window.showInformationMessage(vscode.l10n.t(`Selected source file: {0}`, sourceFile.fsPath));
			updateCfgFile(sourceFile.fsPath, targetFile.fsPath).then((success) => {
				if (success) {
					vscode.window.showInformationMessage(vscode.l10n.t(`Target file {0} updated successfully!`, targetFile.fsPath));
				} else {
					vscode.window.showErrorMessage(vscode.l10n.t(`Failed to update target file {0}.`, targetFile.fsPath));
				}
			});
		} catch (error: any) {
			vscode.window.showErrorMessage(vscode.l10n.t(`Error: {0}`, error.message));
		}
	});


	context.subscriptions.push(updateOnEditorCommand);

	const disposableCodeLens = vscode.languages.registerCodeLensProvider({ scheme: 'file', pattern: '**/*.cfg' }, {
		provideCodeLenses(document, token) {
			return [
				new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
					title: vscode.l10n.t("$(sync) FLFH: Update Keys"),
					tooltip: vscode.l10n.t("Update keys from source locale cfg file"),
					command: "extension.updateKeysFromSourceOnEditor"
				})
			];
		},
		resolveCodeLens(codeLens, token) {
			return codeLens;
		}
	});

	context.subscriptions.push(disposableCodeLens);

	const diffWithGitCommand = vscode.commands.registerCommand('extension.diffCfgDataWithGit', async () => {
		try {
			const gitRepoPath = await quickPickGitRepo();
			if (!gitRepoPath) {
				return;
			}

			const cfgFilePath = await quickPickCfgFiles(vscode.l10n.t('Select the .cfg file to diff'));
			if (cfgFilePath === undefined) {
				throw new Error(vscode.l10n.t('No .cfg file selected'));
			}

			const commitOld = await quickPickGitCommit(gitRepoPath);
			if (!commitOld) {
				return;
			}

			const commitNew = await quickPickGitCommit(gitRepoPath);
			if (!commitNew) {
				return;
			}

			const diffResult = await diffCfgFilesWithGit(cfgFilePath.fsPath, commitOld, commitNew, gitRepoPath);
			const formattedDiffResult = JSON.stringify(
				Object.fromEntries(
					[...diffResult.entries()].map(([key, innerMap]) => [
						key,
						Object.fromEntries(innerMap.entries())
					])
				),
				null,
				2
			); // Convert nested Map to JSON-compatible object and pretty-print
			const document = await vscode.workspace.openTextDocument({
				content: formattedDiffResult,
				language: 'json'
			});
			await vscode.window.showTextDocument(document);
		} catch (error: any) {
			vscode.window.showErrorMessage('Error diffing config data with Git: ' + error.message);
		}
	});

	const diffCommand = vscode.commands.registerCommand('extension.diffCfgData', async () => {
		const oldCfgFilePath = await quickPickCfgFiles(vscode.l10n.t('Select the old config file'));
		if (!oldCfgFilePath) {
			return;
		}

		const newCfgFilePath = await quickPickCfgFiles(vscode.l10n.t('Select the new config file'));
		if (!newCfgFilePath) {
			return;
		}

		try {
			const diffResult = await diffCfgFiles(oldCfgFilePath.fsPath, newCfgFilePath.fsPath);
			const formattedDiffResult = JSON.stringify(
				Object.fromEntries(
					[...diffResult.entries()].map(([key, innerMap]) => [
						key,
						Object.fromEntries(innerMap.entries())
					])
				),
				null,
				2
			); // Convert nested Map to JSON-compatible object and pretty-print
			const document = await vscode.workspace.openTextDocument({
				content: formattedDiffResult,
				language: 'json'
			});
			await vscode.window.showTextDocument(document);
		} catch (error: any) {
			vscode.window.showErrorMessage('Error diffing config data: ' + error.message);
		}
	});

	context.subscriptions.push(diffWithGitCommand, diffCommand);

	registerLocaleKeyValueSignatureProvider(context);
}

// This method is called when your extension is deactivated
export function deactivate(): void { }