import { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import * as path from 'path';
import * as os from 'os';
import type { WorktreeInfo } from '@code-squad/core';
import { GitAdapter } from '../adapters/GitAdapter.js';
import { loadConfig, getWorktreeCopyPatterns } from '../config.js';
import { copyFilesWithPatterns } from '../fileUtils.js';

const git = new GitAdapter();

function shorten(p: string): string {
    const home = os.homedir();
    return p.startsWith(home) ? '~' + p.slice(home.length) : p;
}

type View = 'list' | 'create' | 'delete';

function App({ initialWorktrees, root }: { initialWorktrees: WorktreeInfo[]; root: string }) {
    const { exit } = useApp();
    const [view, setView] = useState<View>('list');
    const [worktrees, setWorktrees] = useState(initialWorktrees);
    const [cursor, setCursor] = useState(0);
    const [input, setInput] = useState('');
    const [msg, setMsg] = useState<{ text: string; color: string } | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(() => setMsg(null), 2000);
        return () => clearTimeout(t);
    }, [msg]);

    const refresh = useCallback(async () => {
        const wts = await git.listWorktrees(root);
        setWorktrees(wts);
        setCursor(c => Math.min(c, Math.max(0, wts.length - 1)));
    }, [root]);

    useInput((ch, key) => {
        if (busy) return;

        if (view === 'list') {
            if (key.upArrow) {
                setCursor(c => Math.max(0, c - 1));
            } else if (key.downArrow) {
                setCursor(c => Math.min(worktrees.length - 1, c + 1));
            } else if (key.return && worktrees.length > 0) {
                process.stdout.write(worktrees[cursor].path + '\n');
                exit();
            } else if (ch === 'n') {
                setView('create');
                setInput('');
            } else if (ch === 'd' && worktrees.length > 0) {
                setView('delete');
            } else if (ch === 'q' || key.escape) {
                exit();
            }
            return;
        }

        if (view === 'create') {
            if (key.escape) {
                setView('list');
                return;
            }
            if (key.return && input.trim()) {
                const name = input.trim();
                setBusy(true);
                const base = path.join(path.dirname(root), `${path.basename(root)}.worktree`);
                const wtPath = path.join(base, name);

                git.createWorktree(wtPath, name, root)
                    .then(async () => {
                        const config = await loadConfig(root);
                        const patterns = getWorktreeCopyPatterns(config);
                        if (patterns.length > 0) {
                            await copyFilesWithPatterns(root, wtPath, patterns);
                        }
                        process.stdout.write(wtPath + '\n');
                        exit();
                    })
                    .catch((e: Error) => {
                        setMsg({ text: e.message, color: 'red' });
                        setView('list');
                        setBusy(false);
                    });
                return;
            }
            if (key.backspace || key.delete) {
                setInput(v => v.slice(0, -1));
                return;
            }
            if (ch && !key.ctrl && !key.meta) {
                setInput(v => v + ch);
            }
            return;
        }

        if (view === 'delete') {
            if (ch === 'y' || key.return) {
                const target = worktrees[cursor];
                setBusy(true);

                git.removeWorktree(target.path, root, true)
                    .then(() => git.deleteBranch(target.branch, root, true))
                    .then(async () => {
                        setMsg({ text: `Deleted ${target.branch}`, color: 'green' });
                        await refresh();
                        setBusy(false);
                        setView('list');
                    })
                    .catch((e: Error) => {
                        setMsg({ text: e.message, color: 'red' });
                        setBusy(false);
                        setView('list');
                    });
            } else if (ch === 'n' || key.escape) {
                setView('list');
            }
        }
    });

    return (
        <Box flexDirection="column" paddingX={1} paddingY={1}>
            {/* Header */}
            <Box marginBottom={1}>
                <Text bold color="cyan">Code Squad</Text>
                {busy && <Text color="yellow"> ...</Text>}
            </Box>

            {/* List */}
            {view === 'list' && (
                worktrees.length === 0 ? (
                    <Box marginBottom={1}>
                        <Text dimColor>No worktrees yet. Press </Text>
                        <Text color="yellow">n</Text>
                        <Text dimColor> to create one.</Text>
                    </Box>
                ) : (
                    <Box flexDirection="column" marginBottom={1}>
                        {worktrees.map((wt, i) => (
                            <Box key={wt.path}>
                                <Text color={i === cursor ? 'cyan' : undefined}>
                                    {i === cursor ? '❯ ' : '  '}
                                </Text>
                                <Text bold={i === cursor}>
                                    {wt.branch.padEnd(20)}
                                </Text>
                                <Text dimColor> {shorten(wt.path)}</Text>
                            </Box>
                        ))}
                    </Box>
                )
            )}

            {/* Create */}
            {view === 'create' && (
                <Box flexDirection="column" marginBottom={1}>
                    <Text bold>New Worktree</Text>
                    <Box marginTop={1}>
                        <Text dimColor>{'> '}</Text>
                        <Text color="cyan">{input}</Text>
                        <Text dimColor>{'█'}</Text>
                    </Box>
                </Box>
            )}

            {/* Delete confirm */}
            {view === 'delete' && worktrees[cursor] && (
                <Box flexDirection="column" marginBottom={1}>
                    <Text>
                        Delete <Text bold color="yellow">{worktrees[cursor].branch}</Text>?
                    </Text>
                </Box>
            )}

            {/* Message */}
            {msg && (
                <Box marginBottom={1}>
                    <Text color={msg.color as any}>{msg.text}</Text>
                </Box>
            )}

            {/* Footer */}
            <Box gap={2}>
                {view === 'list' && (
                    <>
                        {worktrees.length > 0 && (
                            <>
                                <Text><Text dimColor>{'↑↓'}</Text> <Text dimColor>navigate</Text></Text>
                                <Text><Text dimColor>{'↵'}</Text> <Text dimColor>switch</Text></Text>
                            </>
                        )}
                        <Text><Text color="yellow">n</Text> <Text dimColor>new</Text></Text>
                        {worktrees.length > 0 && (
                            <Text><Text color="yellow">d</Text> <Text dimColor>delete</Text></Text>
                        )}
                        <Text><Text color="yellow">q</Text> <Text dimColor>quit</Text></Text>
                    </>
                )}
                {view === 'create' && (
                    <>
                        <Text><Text dimColor>{'↵'}</Text> <Text dimColor>create</Text></Text>
                        <Text><Text dimColor>esc</Text> <Text dimColor>cancel</Text></Text>
                    </>
                )}
                {view === 'delete' && (
                    <>
                        <Text><Text color="yellow">y</Text> <Text dimColor>confirm</Text></Text>
                        <Text><Text color="yellow">n</Text> <Text dimColor>cancel</Text></Text>
                    </>
                )}
            </Box>
        </Box>
    );
}

export async function runTui(workspaceRoot: string): Promise<void> {
    const worktrees = await git.listWorktrees(workspaceRoot);
    const { waitUntilExit } = render(
        <App initialWorktrees={worktrees} root={workspaceRoot} />,
        { stdout: process.stderr }
    );
    await waitUntilExit();
}
