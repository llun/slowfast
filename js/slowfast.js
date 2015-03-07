class SlowFast {

  constructor(video, rates, transition) {
    this.video = video
    this.rates = rates || []
    this.transition = transition || SlowFast.LinearTransition
  }

  play() {
  }

  pause() {

  }

  addRate() {

  }

  removeRate() {

  }
}

SlowFast.LinearTransition = (start, end, time) => {

}

export default SlowFast