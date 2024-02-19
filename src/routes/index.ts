import { browser } from "$app/environment";
import soundEffectAndroid from "$lib/assets/sound/android.mp3";
import soundEffectCaramelldansen from "$lib/assets/sound/caramelldansen.mp3";
import soundEffectCorrect from "$lib/assets/sound/correct.mp3";
import soundEffectGigachad from "$lib/assets/sound/gigachad.mp3";
import soundEffectiPhone from "$lib/assets/sound/iphone.opus";
import soundEffectKaching from "$lib/assets/sound/kaching.mp3";
import soundEffectMeow from "$lib/assets/sound/meow.mp3";
import soundEffectMinecraft from "$lib/assets/sound/minecraft.mp3";
import soundEffectSiren from "$lib/assets/sound/siren.mp3";
import soundEffectToBeContinued from "$lib/assets/sound/to_be_continued.mp3";
import soundEffectWindows from "$lib/assets/sound/windows.mp3";

export interface PreferencesSection {
    title: string;
    preferences: Preference[];
}

export type Preference = BooleanPreference | StringPreference | SoundsPreference | NumberPreference;
export interface BasePreference {
    ref: string;
    type: string;
    value: any;
    meta: string;
}
export interface BooleanPreference extends BasePreference {
    type: "boolean";
    value: boolean;
}
export interface StringPreference extends BasePreference {
    type: "string";
    value: string;
}
export interface SoundsPreference extends BasePreference {
    type: "sounds";
    value: string;
    options: typeof soundEffects;
}
export interface NumberPreference extends BasePreference {
    type: "number";
    value: number;
    min: number;
    max: number;
    step: number;
    range?: boolean;
}

export interface SoundEffect {
    name: string;
    src: any;
}

export class Statistics {
    cycles: Array<PomodoroCycle> = [];
}

export interface PomodoroCycle {
    type: string;
    startTime: number;
    endTime: number;
    originalLenght: number;
}

export const pomodoroSegments = [
    { name: "Pomodoro", id: "pomodoro" },
    { name: "Īsā pauze", id: "shortBreak" },
    { name: "Garā pauze", id: "longBreak" },
];

export const soundEffects: { [index: string]: string } = {
    "Bez skaņas": "",
    Android: soundEffectAndroid,
    Caramelldansen: soundEffectCaramelldansen,
    Pareizi: soundEffectCorrect,
    "Giga Chad": soundEffectGigachad,
    iPhone: soundEffectiPhone,
    Nauda: soundEffectKaching,
    Kaķis: soundEffectMeow,
    Minecraft: soundEffectMinecraft,
    Sirēna: soundEffectSiren,
    "To Be Continued": soundEffectToBeContinued,
    Windows: soundEffectWindows,
};

// default user preferences, possible values and descriptions
export const preferences: Array<PreferencesSection> = [
    {
        title: "Taimeris",
        preferences: [
            {
                ref: "pomodoro",
                type: "number",
                value: 25,
                meta: "Pomodoro ilgums (min)",
                min: 1,
                max: Infinity,
                step: 1,
            },
            {
                ref: "shortBreak",
                type: "number",
                value: 5,
                meta: "Īsās pauzes ilgums (min)",
                min: 1,
                max: Infinity,
                step: 1,
            },
            {
                ref: "longBreak",
                type: "number",
                value: 15,
                meta: "Garās pauzes ilgums (min)",
                min: 1,
                max: Infinity,
                step: 1,
            },
        ],
    },
    {
        title: "Pomodoro",
        preferences: [
            {
                ref: "autoSwitchSegment",
                type: "boolean",
                value: true,
                meta: "Automātiski pārslēgt ciklus",
            },
            {
                ref: "autoStartPomodoro",
                type: "boolean",
                value: true,
                meta: "Automātiski uzsākt pomodoro",
            },
            {
                ref: "autoStartBreaks",
                type: "boolean",
                value: true,
                meta: "Automātiski uzsākt pauzes",
            },
            {
                ref: "cyclesBeforeLongBreak",
                type: "number",
                value: 4,
                meta: "Garās pauzes cikli",
                min: 1,
                max: Infinity,
                step: 1,
            },
        ],
    },
    {
        title: "Paziņojumi",
        preferences: [
            {
                ref: "pomodoroSoundEffect",
                type: "sounds",
                value: "Caramelldansen",
                meta: "Pomodoro skaņa",
                options: soundEffects,
            },
            {
                ref: "breakSoundEffect",
                type: "sounds",
                value: "To Be Continued",
                meta: "Pauzes skaņa",
                options: soundEffects,
            },
            {
                ref: "audioVolume",
                type: "number",
                value: 50,
                meta: "Skaļums",
                min: 1,
                max: 100,
                step: 1,
                range: true,
            },
        ],
    },
];

export let defaultPreferenceValues: { [index: string]: any } = {};
preferences.forEach((section) => {
    section.preferences.forEach((preference) => {
        defaultPreferenceValues[preference.ref] = preference.value;
    });
});
let audioPlayer: HTMLAudioElement;
if (browser) {
    audioPlayer = new Audio();
}
export function playSoundEffect(name?: string, uri?: string) {
    console.debug("Playing sound effect", name, uri);
    // play from URI if given
    let src = uri || soundEffects[name!];
    if (!src) {
        audioPlayer.pause();
        return;
    }
    audioPlayer.src = src;
    audioPlayer.currentTime = 0;
    audioPlayer.play();
}
export function setAudioPlayerVolume(volume: number){
  audioPlayer.volume = volume / 100;
}

export function median(arr: Array<number>) {
    if (arr.length == 0) {
        return 0; // 0.
    }
    arr.sort((a, b) => a - b); // 1.
    const midpoint = Math.floor(arr.length / 2); // 2.
    const median =
        arr.length % 2 === 1
            ? arr[midpoint] // 3.1. If odd length, just take midpoint
            : (arr[midpoint - 1] + arr[midpoint]) / 2; // 3.2. If even length, take median of midpoints
    return median;
}
