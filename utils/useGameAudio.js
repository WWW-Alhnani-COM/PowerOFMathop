import { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

// ثوابت الأنماط المستخدمة عبر المكونات (Buttons)
// يتم تصديرها لاستخدامها في مكونات الأزرار
export const BASE_BUTTON_STYLE = "font-bold py-3 px-6 rounded-2xl shadow-xl transition duration-300 transform active:scale-95 flex items-center justify-center border-b-4";

export const BUTTON_THEMES = {
  primary: "bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-700 shadow-indigo-500/60",
  success: "bg-green-500 hover:bg-green-600 text-white border-green-700 shadow-green-500/60",
  error: "bg-red-500 hover:bg-red-600 text-white border-red-700 shadow-red-500/60",
};

/**
 * Hook لإدارة الصوت والمؤثرات الصوتية في اللعبة.
 * يتم استخدامه في المكون الرئيسي (App.jsx) أو أي مكون يحتاج لتشغيل أصوات.
 * @returns {object} يحتوي على playSound, isMuted, toggleMute.
 */
export const useGameAudio = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [isAudioReady, setIsAudioReady] = useState(false);

    useEffect(() => {
        const startAudio = async () => {
            // Tone.js يتطلب تفاعل مستخدم لبدء السياق الصوتي (AudioContext)
            if (Tone.context.state !== 'running') {
                await Tone.start();
                setIsAudioReady(true);
            } else {
                setIsAudioReady(true);
            }
        };

        // يستمع إلى أول نقرة لبدء تشغيل Tone.js (مطلوب في المتصفحات الحديثة)
        window.addEventListener('click', startAudio, { once: true });
        return () => window.removeEventListener('click', startAudio);
    }, []);

    const playSound = useCallback((type) => {
        if (isMuted || !isAudioReady) return;

        // يستخدم Synth بسيط كنغمة سريعة
        // toDestination يربط الصوت بمخرجات الجهاز (السماعات)
        const synth = new Tone.Synth().toDestination();
        
        switch (type) {
            case 'success':
                // نغمة نجاح (تصاعدية ومبهجة)
                synth.triggerAttackRelease("C5", "8n"); 
                synth.triggerAttackRelease("E5", "8n", "+8n");
                synth.triggerAttackRelease("G5", "8n", "+4n"); 
                break;
            case 'error':
                // نغمة خطأ (منخفضة وغير متناغمة)
                synth.triggerAttackRelease("C3", "16n"); 
                synth.triggerAttackRelease("B2", "16n", "+16n");
                break;
            case 'click':
                // صوت نقرة خفيف
                synth.triggerAttackRelease("C4", "32n");
                break;
            default:
                break;
        }
    }, [isMuted, isAudioReady]);

    const toggleMute = () => setIsMuted(prev => !prev);

    return { playSound, isMuted, toggleMute };
};