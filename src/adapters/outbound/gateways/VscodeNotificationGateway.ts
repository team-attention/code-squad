import * as vscode from 'vscode';
import notifier from 'node-notifier';
import { INotificationPort } from '../../../application/ports/outbound/INotificationPort';

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

    showSystemNotification(title: string, message: string, onClick?: () => void): void {
        notifier.notify({
            title,
            message,
            sound: true,
        }, (err, response) => {
            // 'activate' means user clicked the notification
            if (!err && response === 'activate' && onClick) {
                onClick();
            }
        });
    }
}
