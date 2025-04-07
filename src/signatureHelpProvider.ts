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
export async function registerLocaleKeyValueSignatureProvider(context: vscode.ExtensionContext) {

    let lastTriggerUri: vscode.Uri | null | undefined;
    let lastTriggerLine: number | null | undefined;

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
                                signatures.push({
                                    label: `Key: ${section}.${key}`,
                                    documentation: new vscode.MarkdownString(`**Original Text**:\n\n\`\`\`md\n${fileData.get(section)!.get(key)}\n\`\`\``),
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