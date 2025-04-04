const fs = require('fs').promises;


/**
 * This function will parse the cfg file and return an object with the parsed data
 * @param {string} filePath - The path to the configuration file to be parsed.
 * @returns {Promise<Map>} - A promise that resolves to an object representing the parsed configuration.
 */
const parseCfgFileData = async (filePath) => {
    const content = await fs.readFile(filePath, 'utf8');
    const result = new Map([["", new Map()]]); // Initialize with an empty section

    let currentSection = "";
    content.split('\n').forEach(line => {
        line = line.trim(); // remove \n and spaces
        if (!line || line.startsWith('#') || line.startsWith(';')) return; // skip empty lines and comments

        if (/^\[.*\]$/.test(line)) {
            currentSection = line.slice(1, -1); // get section name
            result.set(currentSection, result.get(currentSection) || new Map());
        } else if (line.includes('=')) {
            // factorio does not support spaces in key names
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');
            result.get(currentSection).set(key, value);
        } else {
            throw new Error(`Invalid line format: ${line}`);
        }
    });
    return result;
}

const parseCfgFileComments = async (filePath) => {
    const content = await fs.readFile(filePath, 'utf8');
    const result = new Map([["", []]]); // Initialize with an empty section

    let currentSection = "";
    content.split('\n').forEach(line => {
        line = line.trim(); // remove \n and spaces
        if (/^\[.*\]$/.test(line)) {
            currentSection = line.slice(1, -1); // get section name
            result.set(currentSection, result.get(currentSection) || []);
        }
        if (line.startsWith('#') || line.startsWith(';')) {
            const cleanedComment = line.slice(1).trim(); // remove prefix and trim whitespaces
            result.get(currentSection).push(cleanedComment); // add cleaned comment to the current section
        }
    });
    return result;
}

module.exports = { parseCfgFileData, parseCfgFileComments };