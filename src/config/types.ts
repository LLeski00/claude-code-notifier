import { ChannelId, ChannelSettings } from '../domain';

export interface NotifierConfig {
  notifyOnIdle: boolean;
  channels: Partial<Record<ChannelId, ChannelSettings>>;
}
