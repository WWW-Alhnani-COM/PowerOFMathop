// SoundEffects.jsx (مكون لا يقوم بعرض UI ولكنه يدير الأصوات)
import { useEffect } from 'react';

const SoundEffects = {
  play: (effect) => {
    if (typeof Audio !== 'undefined') {
      let src;
      switch (effect) {
        case 'correct': src = '/sounds/correct.mp3'; break;
        case 'wrong': src = '/sounds/wrong.mp3'; break;
        case 'click': src = '/sounds/click.mp3'; break;
        case 'win': src = '/sounds/win.mp3'; break;
        default: return;
      }
      try {
        const audio = new Audio(src);
        audio.play().catch(e => console.error("Error playing audio:", e));
      } catch (e) {
        console.error("Audio API error:", e);
      }
    }
  },
};

// مثال لمكون React يستخدمه (اختياري)
export const SoundEffectPlayer = ({ trigger, effect }) => {
    useEffect(() => {
        if (trigger) {
            SoundEffects.play(effect);
        }
    }, [trigger, effect]);
    return null;
}

export default SoundEffects;