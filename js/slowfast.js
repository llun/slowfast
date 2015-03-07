import transitions from './transitions'

class SlowFast {

  constructor(video, rates, transition) {
    this.video = video
    this.rates = rates || []
    this.transition = transition || transitions.linear
  }

  play() {
    if (video) video.play()
  }

  pause() {

  }

  updateRates() {

  }
}

export default SlowFast