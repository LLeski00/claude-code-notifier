import { ChannelSettings, NotificationChannel } from '../domain';
import { getDefaultSoundPath } from '../paths';

export interface SoundChannelSettings extends ChannelSettings {
  soundFile: string;
}

export const soundChannel: NotificationChannel<SoundChannelSettings> = {
  id: 'sound',
  label: 'Sound',
  buildSettings(config) {
    const custom = config.get<string>('soundFile', '').trim();
    return {
      enabled: true,
      soundFile: custom.length > 0 ? custom : getDefaultSoundPath(),
    };
  },
};
