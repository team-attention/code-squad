import { Response } from 'express';
import { SyncEvent } from './types.js';

export class SSEManager {
    private clients: Set<Response> = new Set();

    addClient(res: Response): void {
        this.clients.add(res);

        res.on('close', () => {
            this.clients.delete(res);
        });
    }

    removeClient(res: Response): void {
        this.clients.delete(res);
    }

    broadcast(event: SyncEvent): void {
        const data = JSON.stringify(event);
        const message = `data: ${data}\n\n`;

        this.clients.forEach(client => {
            client.write(message);
        });
    }

    closeAll(): void {
        this.clients.forEach(client => {
            client.end();
        });
        this.clients.clear();
    }

    get clientCount(): number {
        return this.clients.size;
    }
}
