export type FilesChangeEvent = {
    type: 'files-changed';
};

export type FileContentEvent = {
    type: 'file-changed';
    path: string;
};

export type GitChangeEvent = {
    type: 'git-changed';
};

export type SyncEvent = FilesChangeEvent | FileContentEvent | GitChangeEvent;
