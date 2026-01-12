import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { formatComments, copyToClipboard, schedulePaste, CommentLike } from '../output/index.js';
import { SessionManager } from '../session/SessionManager.js';

export interface SubmitItem {
    filePath: string;
    startLine: number;
    endLine: number;
    comment: string;
}

export interface SubmitRequest {
    session_id: string;
    items: SubmitItem[];
}

export interface SubmitResponse {
    status: string;
}

export interface SubmitResult {
    output: string;
    sessionId: string;
}

const router: IRouter = Router();

// POST /api/submit
router.post('/', async (req: Request, res: Response) => {
    const sessionManager = req.app.locals.sessionManager as SessionManager;
    const body = req.body as SubmitRequest;

    if (!body.session_id) {
        res.status(400).json({ error: 'Missing session_id' });
        return;
    }

    if (!body.items || body.items.length === 0) {
        res.status(400).json({ error: 'No items to submit' });
        return;
    }

    // Convert SubmitItems to CommentLike objects
    const comments: CommentLike[] = body.items.map((item) => ({
        file: item.filePath,
        line: item.startLine,
        endLine: item.endLine !== item.startLine ? item.endLine : undefined,
        text: item.comment,
    }));

    // Format the output
    const formatted = formatComments(comments);

    // Copy to clipboard and schedule paste only if copy succeeds
    let clipboardSuccess = false;
    try {
        await copyToClipboard(formatted);
        clipboardSuccess = true;
    } catch (e) {
        console.error('Failed to copy to clipboard:', e);
        console.error('\n--- Output (copy manually) ---');
        console.error(formatted);
        console.error('--- End of output ---\n');
    }

    // Schedule paste only if clipboard copy succeeded
    if (clipboardSuccess) {
        try {
            await schedulePaste(body.session_id);
        } catch (e) {
            console.error('Failed to schedule paste:', e);
        }
    }

    // Send response before cleanup
    res.json({ status: 'ok' } as SubmitResponse);

    // Unregister the session
    await sessionManager.unregisterSession(body.session_id);
});

export { router as submitRouter };
