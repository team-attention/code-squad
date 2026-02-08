import { useState, useEffect, useRef } from 'react';
import { validatePath, expandTilde } from './pathUtils.js';
import type { PathValidationResult } from './pathUtils.js';

export interface PathValidationState {
    validation: PathValidationResult | null;
    isGitRepo: boolean;
}

/**
 * 경로 유효성 검사 훅 (300ms 디바운스)
 */
export function usePathValidation(inputPath: string): PathValidationState {
    const [validation, setValidation] = useState<PathValidationResult | null>(null);
    const [isGitRepo, setIsGitRepo] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const expanded = expandTilde(inputPath);
        if (!expanded || expanded.length < 2) {
            setValidation(null);
            setIsGitRepo(false);
            return;
        }

        timerRef.current = setTimeout(async () => {
            const reqId = ++requestIdRef.current;
            const result = await validatePath(inputPath);
            if (reqId !== requestIdRef.current) return;
            setValidation(result);
            setIsGitRepo(result.isGitRepo);
        }, 300);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [inputPath]);

    return { validation, isGitRepo };
}
