import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { AppState } from '../server/Server.js';
import { formatComments, copyToClipboard, schedulePaste, CommentLike } from '../output/index.js';

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
    const state = req.app.locals.state as AppState;
    const body = req.body as SubmitRequest;

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
        console.log('\n--- Output (copy manually) ---');
        console.log(formatted);
        console.log('--- End of output ---\n');
    }

    // Schedule paste only if clipboard copy succeeded
    if (clipboardSuccess) {
        try {
            await schedulePaste(body.session_id);
        } catch (e) {
            console.error('Failed to schedule paste:', e);
        }
    }

    // Send response before shutdown
    res.json({ status: 'ok' } as SubmitResponse);

    // Trigger shutdown with the output
    if (state.resolve) {
        state.resolve(formatted);
    }
});

export { router as submitRouter };
