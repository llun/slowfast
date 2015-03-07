import transitions from './transitions'

class SlowFast {

  constructor(video, rates, transition) {
    this.video = video
    this.rates = rates || []
    this.block = 0
    this.transition = transition || transitions.linear
  }

  play() {
    if (this.video) this.video.play()
  }

  pause() {
    if (this.video) this.video.pause()
  }

  reset() {
    if (this.video) {
      this.video.currentTime = 0
      this.video.pause()
    }
  }

  updateRates(rates) {
    this.rates = rates
    this.pause()
  }
}

export default SlowFast