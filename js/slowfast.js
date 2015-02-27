import React from 'react'
import d3 from 'd3'

let rates = [
  { time: 0.0, rate: 1 },
  { time: 20.0, rate: 2 },
  { time: 50.0, rate: 0.5 },
  { time: 60.0, rate: 0.1 },
  { time: 65.0, rate: 4 },
  { time: 114.126077, rate: 1 }
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

    if (video.currentTime >= rates[block + 1].time && block < rates.length - 1) {
      block++
    }

    if (block < rates.length - 1) {
      if (rates[block + 1].rate > rates[block].rate) {
        video.playbackRate = Math.tan(Math.atan((rates[block + 1].rate - rates[block].rate)/rates[block + 1].time)) * video.currentTime + rates[block].rate
      } else {
        video.playbackRate = Math.tan(Math.atan((rates[block].rate - rates[block + 1].rate)/rates[block + 1].time)) * (rates[block + 1].time - video.currentTime) + rates[block + 1].rate
      }
    }

    let progress = video.currentTime / video.duration * 100
    this.setState({ progress: progress, block: block })

    console.log (`block: ${block}, progress: ${progress}, rate: ${video.playbackRate}, cs: ${rates[block].rate}, ns: ${rates[block + 1].rate}`)
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
            </div>
          </div>

          <div className="row">
            <div className="col-xs-12" ref="rateAdjustment">
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
