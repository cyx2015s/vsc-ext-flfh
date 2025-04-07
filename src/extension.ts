// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { updateCfgFile } from './utils/update-cfg';
import { quickPickCfgFiles } from './utils/quick-pick';
import { registerLocaleKeyValueSignatureProvider } from "./signatureHelpProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext): void {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('"factorio-locale-format-helper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	let disposableCommand = vscode.commands.registerCommand('factorio-locale-format-helper.updateKeysFromSource', async () => {
		try {
			const sourceFile = await quickPickCfgFiles("Select the source .cfg file (Usually the one under locale/en/)");
			if (!sourceFile) {
				return;
			}
			vscode.window.showInformationMessage(`Selected source file: ${sourceFile.fsPath}`);
			const targetFile = await quickPickCfgFiles(`Select the target .cfg file (The language you want to translate to)`);
			if (!targetFile) {
				return;
			}
			if (sourceFile.fsPath === targetFile.fsPath) {
				vscode.window.showErrorMessage('Source and target files cannot be the same.');
				return;
			}
			updateCfgFile(sourceFile.fsPath, targetFile.fsPath).then((success) => {
				if (success) {
					vscode.window.showInformationMessage(`Target file ${targetFile.fsPath} updated successfully!`);
				} else {
					vscode.window.showErrorMessage(`Failed to update target file ${targetFile.fsPath}.`);
				}
			});
		} catch (error: any) {
			vscode.window.showErrorMessage(`Error: ${error.message}`);
		}
	});

	context.subscriptions.push(disposableCommand);

	disposableCommand = vscode.commands.registerCommand('factorio-locale-format-helper.updateKeysFromSourceOnEditor', async () => {
		try {
			const sourceFile = await quickPickCfgFiles("Select the source .cfg file (Usually the one under locale/en/)");
			if (!sourceFile) {
				return;
			}
			const activeEditor = vscode.window.activeTextEditor;
			if (!activeEditor || !activeEditor.document.fileName.endsWith(".cfg")) {
				vscode.window.showErrorMessage('No active .cfg file is open in the editor.');
				return;
			}
			const targetFile = activeEditor.document.uri;
			if (sourceFile.fsPath === targetFile.fsPath) {
				vscode.window.showErrorMessage('Source and target files cannot be the same.');
				return;
			}
			vscode.window.showInformationMessage(`Selected source file: ${sourceFile.fsPath}`);
			updateCfgFile(sourceFile.fsPath, targetFile.fsPath).then((success) => {
				if (success) {
					vscode.window.showInformationMessage(`Target file ${targetFile.fsPath} updated successfully!`);
				} else {
					vscode.window.showErrorMessage(`Failed to update target file ${targetFile.fsPath}.`);
				}
			});
		} catch (error: any) {
			vscode.window.showErrorMessage(`Error: ${error.message}`);
		}
	});


	context.subscriptions.push(disposableCommand);

	let disposableEditor = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor && editor.document.fileName.endsWith(".cfg")) {
			disposableEditor.show();
		} else {
			disposableEditor.hide();
		}
	});


	if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.fileName.endsWith(".cfg")) {
		disposableEditor.show();
	} else {
		disposableEditor.hide();
	}
	disposableEditor.text = "$(sync) FLFH: Update Keys";
	disposableEditor.tooltip = "Update keys from source locale cfg file";
	disposableEditor.command = "factorio-locale-format-helper.updateKeysFromSourceOnEditor";
	disposableEditor.show();

	context.subscriptions.push(disposableEditor);

	registerLocaleKeyValueSignatureProvider(context);
}

// This method is called when your extension is deactivated
export function deactivate(): void { }