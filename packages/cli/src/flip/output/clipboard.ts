import clipboardy from 'clipboardy';

/**
 * Copy text to system clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
    await clipboardy.write(text);
}
