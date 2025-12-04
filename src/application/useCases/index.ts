export { AddCommentUseCase } from './AddCommentUseCase';
export { SubmitCommentsUseCase } from './SubmitCommentsUseCase';
export { GenerateDiffUseCase } from './GenerateDiffUseCase';
export { CaptureSnapshotsUseCase } from './CaptureSnapshotsUseCase';
export { EditCommentUseCase } from './EditCommentUseCase';
export { DeleteCommentUseCase } from './DeleteCommentUseCase';

// Re-export from ports for backward compatibility
export { AddCommentInput } from '../ports/inbound/IAddCommentUseCase';
export { IFileGlobber } from '../ports/outbound/IFileGlobber';
