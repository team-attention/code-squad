import { useState, useRef, useCallback, useMemo } from 'react';
import * as fs from 'fs';
import * as os from 'os';
import { expandTilde, splitPathForCompletion } from './pathUtils.js';

const MAX_VISIBLE = 5;

export interface VisibleSuggestion {
    name: string;
    isSelected: boolean;
}

export interface DirectorySuggestions {
    visibleSuggestions: VisibleSuggestion[];
    hasMore: boolean;
    isOpen: boolean;
    triggerComplete: (inputPath: string) => Promise<string | null>;
    selectNext: () => void;
    selectPrev: () => void;
    acceptSelected: (inputPath: string) => string | null;
    clearSuggestions: () => void;
}

/**
 * 디렉토리 자동완성 훅
 * - Tab: triggerComplete → 매치 1개면 인라인 완성, 여러 개면 제안 목록 표시
 * - Tab (목록 열림): selectNext → 다음 항목
 * - ↑↓ (목록 열림): selectPrev/selectNext
 * - Enter (목록 열림): acceptSelected → 선택 항목 적용
 * - 문자 입력: clearSuggestions → 목록 닫기
 */
export function useDirectorySuggestions(): DirectorySuggestions {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const requestIdRef = useRef(0);

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
        setSelectedIndex(0);
        setIsOpen(false);
    }, []);

    const triggerComplete = useCallback(async (inputPath: string): Promise<string | null> => {
        const reqId = ++requestIdRef.current;
        const { parentDir, leafPrefix } = splitPathForCompletion(inputPath);

        let entries: string[];
        try {
            const dirEntries = await fs.promises.readdir(parentDir, { withFileTypes: true });
            entries = dirEntries
                .filter(e => e.isDirectory() && !e.name.startsWith('.'))
                .filter(e => e.name.toLowerCase().startsWith(leafPrefix.toLowerCase()))
                .map(e => e.name)
                .sort();
        } catch {
            return null;
        }

        // Stale check
        if (reqId !== requestIdRef.current) return null;

        if (entries.length === 0) {
            clearSuggestions();
            return null;
        }

        if (entries.length === 1) {
            // Single match — inline complete
            clearSuggestions();
            const completed = parentDir.endsWith('/')
                ? parentDir + entries[0] + '/'
                : parentDir + '/' + entries[0] + '/';
            return collapseHome(completed);
        }

        // Multiple matches — store all, show scrolling window
        const commonPrefix = findCommonPrefix(entries);
        setSuggestions(entries);
        setSelectedIndex(0);
        setIsOpen(true);

        if (commonPrefix.length > leafPrefix.length) {
            const completed = parentDir.endsWith('/')
                ? parentDir + commonPrefix
                : parentDir + '/' + commonPrefix;
            return collapseHome(completed);
        }

        return null;
    }, [clearSuggestions]);

    const selectNext = useCallback(() => {
        setSelectedIndex(prev => (prev + 1) % Math.max(suggestions.length, 1));
    }, [suggestions.length]);

    const selectPrev = useCallback(() => {
        setSelectedIndex(prev => (prev - 1 + Math.max(suggestions.length, 1)) % Math.max(suggestions.length, 1));
    }, [suggestions.length]);

    const acceptSelected = useCallback((inputPath: string): string | null => {
        if (!isOpen || suggestions.length === 0) return null;
        const selected = suggestions[selectedIndex];
        if (!selected) return null;

        const { parentDir } = splitPathForCompletion(inputPath);
        const completed = parentDir.endsWith('/')
            ? parentDir + selected + '/'
            : parentDir + '/' + selected + '/';

        clearSuggestions();
        return collapseHome(completed);
    }, [isOpen, suggestions, selectedIndex, clearSuggestions]);

    // Scrolling window: show MAX_VISIBLE items around selectedIndex
    const visibleSuggestions = useMemo((): VisibleSuggestion[] => {
        if (suggestions.length === 0) return [];

        let start: number;
        if (suggestions.length <= MAX_VISIBLE) {
            start = 0;
        } else {
            // Center the selected item, clamped to edges
            start = Math.min(
                Math.max(0, selectedIndex - Math.floor(MAX_VISIBLE / 2)),
                suggestions.length - MAX_VISIBLE
            );
        }

        const end = Math.min(start + MAX_VISIBLE, suggestions.length);
        return suggestions.slice(start, end).map(name => ({
            name,
            isSelected: name === suggestions[selectedIndex],
        }));
    }, [suggestions, selectedIndex]);

    const hasMore = suggestions.length > MAX_VISIBLE;

    return {
        visibleSuggestions,
        hasMore,
        isOpen,
        triggerComplete,
        selectNext,
        selectPrev,
        acceptSelected,
        clearSuggestions,
    };
}

function findCommonPrefix(strs: string[]): string {
    if (strs.length === 0) return '';
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
        while (!strs[i].toLowerCase().startsWith(prefix.toLowerCase())) {
            prefix = prefix.slice(0, -1);
            if (prefix === '') return '';
        }
    }
    return prefix;
}

function collapseHome(p: string): string {
    const home = os.homedir();
    if (p === home) return '~';
    if (p.startsWith(home + '/')) return '~' + p.slice(home.length);
    return p;
}
