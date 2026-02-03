import * as vscode from 'vscode';
import { IWorkspaceStatePort } from '@code-squad/core';

export class VscodeWorkspaceStateGateway implements IWorkspaceStatePort {
  constructor(private readonly workspaceState: vscode.Memento) {}

  get<T>(key: string): T | undefined {
    return this.workspaceState.get<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.workspaceState.update(key, value);
  }
}
