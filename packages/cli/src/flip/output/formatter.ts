/**
 * Minimal Comment interface compatible with @code-squad/core Comment
 */
export interface CommentLike {
    file: string;
    line: number;
    endLine?: number;
    text: string;
}

/**
 * Format Comment-like entities for AI agent consumption
 */
export function formatComments(comments: CommentLike[]): string {
    if (comments.length === 0) {
        return '';
    }

    let output = 'The user has annotated the following code locations:\n\n';

    for (const comment of comments) {
        const lineRange = comment.endLine && comment.endLine !== comment.line
            ? `${comment.line}-${comment.endLine}`
            : `${comment.line}`;
        const location = `${comment.file}:${lineRange}`;

        output += `- ${location} -> "${comment.text}"\n`;
    }

    output += '\nPlease review these comments and address them.';

    return output;
}
