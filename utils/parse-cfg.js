const fs = require('fs').promises;
const vscode = require('vscode');


/**
 * This function will parse the cfg file and return an object with the parsed data
 * @param {string} filePath - The path to the configuration file to be parsed.
 * @returns {Promise<Map>} - A promise that resolves to an object representing the parsed configuration.
 */
const parseCfgFile = async function (filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim();
    }
    const result = new Map(); // Initialize an empty Map to store the parsed data
    result.set("", new Map()); // Initialize the default section
    let currentSection = ""; // Initialize currentSection to an empty string (Default section)
    for (const line of lines) {
        if (line.startsWith('#') || line.startsWith(';')) {
            // Skip comments
            continue;
        } else if (line.trim() === '') {
            // Skip empty lines
            continue;
        } else if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.slice(1, -1).trim();
            result.set(currentSection, new Map()); // Initialize a new section
        } else if (line.includes('=')) {
            const [key, value] = line.split('=');
            result.get(currentSection).set(key, value); // Add key-value pair to the current section

        } else {
            vscode.window.showErrorMessage(`Invalid line format: ${line}`);
        }
    }
    return result;
}

module.exports = { parseCfgFile };