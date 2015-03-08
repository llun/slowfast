import transitions from './transitions'

class SlowFast {

  constructor(video, rates, transition) {
    this.rates = rates || []
    this.transition = transition || transitions.linear

    this.blocks = rates.map((rate, index) => {
      return { start: rate, end: rates[index + 1] }
    })
    this.currentBlock = 0

    this.video = video
    video.addEventListener('timeupdate', this.handleTimeUpdate.bind(this))
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

  handleTimeUpdate() {
    let video = this.video
      , transition = this.transition
      , blocks = this.blocks
      , currentTime = video.currentTime

    let block = blocks[this.currentBlock]
    if (block.end && currentTime >= block.end.time) { this.currentBlock++ }

    video.playbackRate = transition(block.start, block.end, currentTime)
  }
}

export default SlowFast