import React from 'react'

let speeds = [
  { time: 0.0, speed: 1 },
  { time: 20.0, speed: 2 },
  { time: 50.0, speed: 0.5 },
  { time: 60.0, speed: 0.1 },
  { time: 65.0, speed: 4 },
  { time: 114.126077, speed: 1 }
]

let SlowFast = React.createClass({
  getInitialState() {
    return { progress: 0, block: 0 }
  },

  video() {
    return this.refs.video.getDOMNode()
  },
  play(e) {
    this.video().play()
  },

  pause(e) {
    this.video().pause()
  },

  reset(e) {
    this.video().pause()
    this.video().currentTime = 0.0
  },

  componentDidMount() {
    this.video().addEventListener('play', this.handlePlay)
    this.video().addEventListener('timeupdate', this.handleTimeUpdate)
  },

  handlePlay(e) {
    console.log (e)
  },

  handleTimeUpdate(e) {
    let video = e.target
    let block = this.state.block

    if (video.currentTime >= speeds[block + 1].time && block < speeds.length - 1) {
      block++
    }

    if (block < speeds.length - 1) {
      if (speeds[block + 1].speed > speeds[block].speed) {
        video.playbackRate = Math.tan(Math.atan((speeds[block + 1].speed - speeds[block].speed)/speeds[block + 1].time)) * video.currentTime + speeds[block].speed
      } else {
        video.playbackRate = Math.tan(Math.atan((speeds[block].speed - speeds[block + 1].speed)/speeds[block + 1].time)) * (speeds[block + 1].time - video.currentTime) + speeds[block + 1].speed
      }
    }

    let progress = video.currentTime / video.duration * 100
    this.setState({ progress: progress, block: block })

    console.log (`block: ${block}, progress: ${progress}, rate: ${video.playbackRate}, cs: ${speeds[block].speed}, ns: ${speeds[block + 1].speed}`)
  },

  render() {
    let progressStyle = {
      width: `${this.state.progress}%`
    }

    return (
      <div>
        <nav className="navbar navbar-default navbar-static-top">
          <div className="container">
            <div className="navbar-header">
              <a className="navbar-brand" href="#">Slow Fast</a>
            </div>
          </div>
        </nav>

        <div className="container">

          <div className="row">
            <div className="col-xs-12">
              <video ref="video" src="sample.mp4"/>

              <div className="progress">
                <div className="progress-bar" style={progressStyle}>
                  <span className="sr-only">{this.state.progress}% Complete</span>
                </div>
              </div>
            </div>
          </div>

          
          <div className="row">
            <div className="col-xs-12">
              <button className="btn btn-primary" onClick={this.play}>Play</button>
              <button className="btn btn-default" onClick={this.pause}>Pause</button>
              <button className="btn btn-default" onClick={this.reset}>Reset</button>
              <p>Speed adjustment panel</p>
            </div>
          </div>

        </div>

      </div>)
  }
})

React.render(
  <SlowFast />,
  document.querySelector('body')
  )
