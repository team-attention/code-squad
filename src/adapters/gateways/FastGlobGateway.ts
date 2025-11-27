import fg from 'fast-glob';
import { IFileGlobber } from '../../application/useCases/CaptureSnapshotsUseCase';

export class FastGlobGateway implements IFileGlobber {
    async glob(pattern: string, cwd: string): Promise<string[]> {
        return fg(pattern, {
            cwd,
            absolute: true,
            ignore: ['**/node_modules/**'],
            dot: true,
        });
    }
}
