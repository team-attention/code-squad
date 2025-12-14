import { AgentStatus, AIType } from '../entities/AISession';

interface StatusPattern {
    status: AgentStatus;
    patterns: RegExp[];
    priority: number;
}

export interface ITerminalStatusDetector {
    detect(aiType: AIType, output: string): AgentStatus;
    detectFromBuffer(aiType: AIType, lines: string[]): AgentStatus;
}

const CLAUDE_PATTERNS: StatusPattern[] = [
    {
        status: 'waiting',
        priority: 3,
        patterns: [
            /Enter to select/,
            /\(y\/n\)/i,
            /\[Y\/n\]/i,
            /\[y\/N\]/i,
            /Tab\/Arrow keys/,
            /Press Enter to continue/,
            /\? .+$/,
            /Do you want to proceed\?/i,
        ],
    },
    {
        status: 'working',
        priority: 2,
        patterns: [
            /[●◐◓◑◒⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,
            /Reading/,
            /Writing/,
            /Searching/,
            /Analyzing/,
            /Thinking/,
            /Planning/,
        ],
    },
    {
        status: 'idle',
        priority: 1,
        patterns: [
            /^>\s*$/m,
            /-- INSERT --/,
            /-- NORMAL --/,
            /\d+ tokens/,
        ],
    },
];

const CODEX_PATTERNS: StatusPattern[] = [
    {
        status: 'waiting',
        priority: 3,
        patterns: [
            /\(y\/n\)/i,
            /\[Y\/n\]/i,
            /\? .+$/,
            /Confirm/i,
        ],
    },
    {
        status: 'working',
        priority: 2,
        patterns: [
            /[●◐◓◑◒⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,
            /\.\.\./,
            /Working/i,
            /Running/i,
            /Executing/i,
        ],
    },
    {
        status: 'idle',
        priority: 1,
        patterns: [
            /⮐\s*send/,              // "⮐ send" hint at bottom of Codex prompt
            /\^J\s*newline/,          // "^J newline" hint
            /\^T\s*transcript/,       // "^T transcript" hint
            /\^C\s*quit/,             // "^C quit" hint
            /To get started/,         // Welcome message
            /describe a task/,        // Welcome message
            /OpenAI Codex/,           // Header banner
            /^>\s*$/m,                // Standard prompt
            /\$\s*$/m,                // Shell prompt
        ],
    },
];

const GEMINI_PATTERNS: StatusPattern[] = [
    {
        status: 'waiting',
        priority: 3,
        patterns: [
            /\(y\/n\)/i,
            /\[Y\/n\]/i,
            /\? .+$/,
            /Confirm/i,
        ],
    },
    {
        status: 'working',
        priority: 2,
        patterns: [
            /[●◐◓◑◒⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,
            /\.\.\./,
            /Thinking/i,
            /Processing/i,
            /Generating/i,
        ],
    },
    {
        status: 'idle',
        priority: 1,
        patterns: [
            /Type your message/,      // "Type your message" prompt hint
            /@path\/to\/file/,        // "@path/to/file" hint
            /no sandbox/,             // Status bar indicator
            /GEMINI\.md/,             // Loaded context indicator
            /Tips for getting started/,  // Welcome message
            /^>\s*$/m,                // Standard prompt (maybe with text after)
            /\$\s*$/m,                // Shell prompt
        ],
    },
];

const GENERIC_PATTERNS: StatusPattern[] = [
    {
        status: 'waiting',
        priority: 3,
        patterns: [
            /\(y\/n\)/i,
            /\[Y\/n\]/i,
            /\? .+$/,
        ],
    },
    {
        status: 'working',
        priority: 2,
        patterns: [
            /[●◐◓◑◒⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,
            /\.\.\./,
        ],
    },
    {
        status: 'idle',
        priority: 1,
        patterns: [
            /^>\s*$/m,
            /\$\s*$/m,
        ],
    },
];

function getPatternsForAI(aiType: AIType): StatusPattern[] {
    switch (aiType) {
        case 'claude':
            return CLAUDE_PATTERNS;
        case 'codex':
            return CODEX_PATTERNS;
        case 'gemini':
            return GEMINI_PATTERNS;
        default:
            return GENERIC_PATTERNS;
    }
}

function stripAnsiCodes(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

export class TerminalStatusDetector implements ITerminalStatusDetector {
    detect(aiType: AIType, output: string): AgentStatus {
        const cleanOutput = stripAnsiCodes(output);
        const patterns = getPatternsForAI(aiType);

        // Sort by priority descending (check highest priority first)
        const sortedPatterns = [...patterns].sort((a, b) => b.priority - a.priority);

        for (const { status, patterns: regexps } of sortedPatterns) {
            for (const regex of regexps) {
                if (regex.test(cleanOutput)) {
                    return status;
                }
            }
        }

        // No pattern matched - return inactive (no clear AI signal)
        return 'inactive';
    }

    detectFromBuffer(aiType: AIType, lines: string[]): AgentStatus {
        // Check last few lines first (most recent output is most relevant)
        // Start from the end and work backwards
        for (let i = lines.length - 1; i >= 0; i--) {
            const status = this.detect(aiType, lines[i]);
            if (status !== 'inactive') {
                return status;
            }
        }

        // Also try joining last 3 lines for multi-line patterns
        if (lines.length >= 2) {
            const recentOutput = lines.slice(-3).join('\n');
            const status = this.detect(aiType, recentOutput);
            if (status !== 'inactive') {
                return status;
            }
        }

        return 'inactive';
    }
}
