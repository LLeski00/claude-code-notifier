import * as vscode from 'vscode';

export enum NotificationEvent {
  TaskFinished = 'stop',
  NeedsInput = 'notification',
}

export type ChannelId = 'sound';

export interface ChannelSettings {
  enabled: boolean;
  [key: string]: unknown;
}

export interface NotificationChannel<TSettings extends ChannelSettings = ChannelSettings> {
  id: ChannelId;
  label: string;
  buildSettings(config: vscode.WorkspaceConfiguration): TSettings;
}
