import { createAvatar } from '@dicebear/core';
import * as collection from '@dicebear/collection';

export interface DicebearOptions {
  seed?: string;
  style?: string;
  size?: number;
  radius?: number;
  backgroundColor?: string[];
}

export function createDicebearAvatar(options: DicebearOptions = {}) {
  const seed = options.seed || 'Glyphs';
  let styleName = options.style || 'shapes';
  if (styleName.toLowerCase() === 'glyphs') {
    styleName = 'shapes';
  }
  
  const selectedStyle = (collection as any)[styleName] || (collection as any)['shapes'] || (collection as any)['thumbs'] || collection.personas;
  
  const avatar = createAvatar(selectedStyle as any, {
    seed,
    radius: options.radius !== undefined ? options.radius : 0,
    backgroundColor: options.backgroundColor || ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    size: options.size,
  });

  return {
    svg: avatar.toString(),
    dataUri: avatar.toDataUri(),
    seed,
  };
}

export function getRandomAvatar(seed: string = 'Glyphs', style: string = 'shapes'): string {
  const res = createDicebearAvatar({ seed: seed || 'Glyphs', style });
  return res.dataUri;
}

export function getRandomAvatarSvg(seed: string = 'Glyphs', style: string = 'shapes'): string {
  const res = createDicebearAvatar({ seed: seed || 'Glyphs', style });
  return res.svg;
}

const api = {
  create: createDicebearAvatar,
  getRandomAvatar,
  getRandomAvatarSvg,
  collection,
};

const root: any = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};
root.DiceBear = api;

export default api;
