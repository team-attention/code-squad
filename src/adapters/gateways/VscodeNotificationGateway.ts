import * as vscode from 'vscode';
import { INotificationPort } from '../../application/ports/INotificationPort';

export class VscodeNotificationGateway implements INotificationPort {
    showInfo(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    showWarning(message: string): void {
        vscode.window.showWarningMessage(message);
    }

    showError(message: string): void {
        vscode.window.showErrorMessage(message);
    }
}
