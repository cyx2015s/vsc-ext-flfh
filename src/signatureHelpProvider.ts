import * as vscode from 'vscode';
import { updateCfgFile } from './utils/update-cfg';
import { quickPickCfgFiles } from './utils/quick-pick';
import { parseCfgFileData } from './utils/parse-cfg';
// Place in a separate file to make closures more explicit.
// Also make adding further updates easier.

/**
 * 
 * @param context The extension context.
 * @returns null
 */
export function registerLocaleKeyValueSignatureProvider(context: vscode.ExtensionContext) {

    let lastTriggerUri: vscode.Uri | null | undefined;
    let lastTriggerLine: number | null | undefined;
    context.subscriptions.push(
        vscode.commands.registerCommand('factorio-locale-format-helper.insertText', async (text: string) => {
            const activeEditor = vscode.window.activeTextEditor;
            const edit = new vscode.WorkspaceEdit();
            edit.insert(activeEditor!.document.uri, activeEditor!.selection.active, text);
            await vscode.workspace.applyEdit(edit);
            await vscode.commands.executeCommand("editor.action.triggerParameterHints");
            return;
        })
    );

    let disposableProvider = vscode.languages.registerSignatureHelpProvider(
        { pattern: '**/*.cfg', scheme: 'file' },
        {
            async provideSignatureHelp(document, position, token, context): Promise<vscode.SignatureHelp | null | undefined> {

                const currentUri = document.uri;
                const currentLine = position.line;
                try {
                    if (!document.lineAt(position.line).text.includes("=")) {
                        // When there are no = signs
                        return null;
                    }
                    if (token.isCancellationRequested) {
                        return null;
                    }
                    if (context.isRetrigger) {
                        if (lastTriggerUri && lastTriggerUri.toString() === currentUri.toString() && lastTriggerLine && lastTriggerLine === currentLine) {
                            return context.activeSignatureHelp;
                        }
                    }

                    const lineText = document.lineAt(currentLine).text;
                    const keyMatch = lineText.match(/^([^=]+?)=/);
                    if (!keyMatch) { return null; }

                    const key = keyMatch[1].trim();
                    const cfgFiles = await vscode.workspace.findFiles('**/en/*.cfg');
                    if (!cfgFiles || cfgFiles.length === 0) { return null; }
                    let signatures: vscode.SignatureInformation[] = [];
                    for (const file of cfgFiles) {
                        if (file.fsPath === currentUri.fsPath) {
                            continue;
                        }
                        const fileData = await parseCfgFileData(file.fsPath);
                        for (const section of fileData.keys()) {
                            if (fileData.get(section)!.has(key)) {
                                const originalText = fileData.get(section)!.get(key) ?? "";
                                const matches = originalText.match(/((__.*?__)|(\[.*?\]))/g) || [];
                                const insertLinks = matches.map((match) => `[\`${match}\`](command:factorio-locale-format-helper.insertText?${encodeURIComponent(JSON.stringify(match))})`).join(", ") || vscode.l10n.t("None");
                                const documentation = new vscode.MarkdownString(vscode.l10n.t(`**Original Text** \n\`\`\`md\n{0}\n\`\`\` \n **Parameters** \n\n{1}`, originalText, insertLinks), true);
                                documentation.isTrusted = true;
                                signatures.push({
                                    label: vscode.l10n.t(`Key: {0}.{1}`, section, key),
                                    documentation: documentation,
                                    parameters: []
                                });
                            }
                        }
                        if (token.isCancellationRequested) {
                            return null;
                        }
                    }
                    let signatureHelp = {
                        signatures: signatures,
                        activeSignature: 0,
                        activeParameter: 0,
                    };
                    return signatureHelp;
                }
                finally {
                    lastTriggerUri = currentUri;
                    lastTriggerLine = currentLine;
                }
            }
        },
        '='
    );

    context.subscriptions.push(disposableProvider);
    return;
}