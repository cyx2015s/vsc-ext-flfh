import { promises as fs } from 'fs';

/**
 * Parses a cfg file and returns its data as a Map.
 * @param filePath - The path to the cfg file.
 * @returns A promise that resolves to a Map representing the parsed data.
 */
export const parseCfgFileData = async (filePath: string): Promise<Map<string, Map<string, string>>> => {
    const content = await fs.readFile(filePath, 'utf8');
    const result = new Map<string, Map<string, string>>([["", new Map()]]);

    let currentSection = "";
    content.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith(';')) { return; }

        if (/^\[.*\]$/.test(line)) {
            currentSection = line.slice(1, -1);
            result.set(currentSection, result.get(currentSection) || new Map());
        } else if (line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');
            result.get(currentSection)!.set(key, value);
        } else {
            throw new Error(`Invalid line format: ${line}`);
        }
    });
    return result;
};

/**
 * Parses comments from a cfg file and returns them as a Map.
 * @param filePath - The path to the cfg file.
 * @returns A promise that resolves to a Map of comments.
 */
export const parseCfgFileComments = async (filePath: string): Promise<Map<string, string[]>> => {
    const content = await fs.readFile(filePath, 'utf8');
    const result = new Map<string, string[]>([["", []]]);

    let currentSection = "";
    content.split('\n').forEach(line => {
        line = line.trim();
        if (/^\[.*\]$/.test(line)) {
            currentSection = line.slice(1, -1);
            result.set(currentSection, result.get(currentSection) || []);
        } else if (line.startsWith('#') || line.startsWith(';')) {
            const comment = line.slice(1);
            result.get(currentSection)!.push(comment);
        }
    });
    return result;
};