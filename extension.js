// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { updateCfgFile } = require('./utils/update-cfg.js');


async function quickPickCfgFiles() {
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
		placeHolder: 'Select a .cfg file',
		canPickMany: false
	});

	return selected ? selected.uri : undefined;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('"factorio-locale-format-helper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	const disposable = vscode.commands.registerCommand('factorio-locale-format-helper.updateKeysFromSource', async function () {
		try {

			const sourceFile = await quickPickCfgFiles();
			const targetFile = await quickPickCfgFiles();
			if (!sourceFile || !targetFile) {
				return;
			}
			if (sourceFile.fsPath === targetFile.fsPath) {
				vscode.window.showErrorMessage('Source and target files cannot be the same.');
				return;
			}
			updateCfgFile(sourceFile.fsPath, targetFile.fsPath).then((success) => {
				if (success) {
					vscode.window.showInformationMessage('Target file updated successfully!');
				} else {
					vscode.window.showErrorMessage('Failed to update target file.');
				}
			})

		} catch (error) {
			vscode.window.showErrorMessage(`Error: ${error.message}`);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
