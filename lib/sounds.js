import { Howl } from 'howler'

const sounds = {
  correct: new Howl({
    src: ['/sounds/correct.mp3'],
    volume: 0.5
  }),
  wrong: new Howl({
    src: ['/sounds/wrong.mp3'],
    volume: 0.4
  }),
  click: new Howl({
    src: ['/sounds/click.mp3'],
    volume: 0.3
  }),
  success: new Howl({
    src: ['/sounds/success.mp3'],
    volume: 0.6
  }),
  complete: new Howl({
    src: ['/sounds/complete.mp3'],
    volume: 0.7
  })
}

export const playSound = (soundName) => {
  if (sounds[soundName]) {
    sounds[soundName].play()
  }
}

export const setVolume = (volume) => {
  Object.values(sounds).forEach(sound => {
    sound.volume(volume)
  })
}

export const preloadSounds = () => {
  Object.values(sounds).forEach(sound => {
    sound.load()
  })
}