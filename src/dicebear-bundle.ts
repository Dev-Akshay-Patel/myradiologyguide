import { Style, Avatar } from '@dicebear/core';
import definition from '@dicebear/styles/glyphs.json' with { type: 'json' };

export const glyphsStyle = new Style(definition);

export interface DicebearOptions {
  seed?: string;
  size?: number;
  backgroundColor?: string[];
  [key: string]: any;
}

export function createDicebearAvatar(options: DicebearOptions | string = {}) {
  const rawOpts = typeof options === 'string' ? { seed: options } : (options || {});
  const seed = rawOpts.seed || 'default';
  
  const avatarOptions: Record<string, any> = { seed };

  if (typeof rawOpts.size === 'number' && rawOpts.size > 0) {
    avatarOptions.size = rawOpts.size;
  }
  if (Array.isArray(rawOpts.backgroundColor) && rawOpts.backgroundColor.length > 0) {
    avatarOptions.backgroundColor = rawOpts.backgroundColor;
  } else if (typeof rawOpts.backgroundColor === 'string' && rawOpts.backgroundColor) {
    avatarOptions.backgroundColor = [rawOpts.backgroundColor];
  }

  const avatar = new Avatar(glyphsStyle, avatarOptions);

  return {
    svg: avatar.toString(),
    dataUri: avatar.toDataUri(),
    seed,
  };
}

export function getRandomAvatar(seed: string = 'default'): string {
  const res = createDicebearAvatar({ seed });
  return res.dataUri;
}

export function getRandomAvatarSvg(seed: string = 'default'): string {
  const res = createDicebearAvatar({ seed });
  return res.svg;
}

const api = {
  create: createDicebearAvatar,
  getRandomAvatar,
  getRandomAvatarSvg,
  Style,
  Avatar,
  definition,
  glyphsStyle,
};

const root: any = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};
root.DiceBear = api;

export default api;
