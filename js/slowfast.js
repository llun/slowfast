import React from 'react'

let speeds = []

let SlowFast = React.createClass({
  getInitialState() {
    return { progress: 0 }
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
    console.log (e.target.currentTime)
    console.log (e.target.duration)

    let progress = e.target.currentTime / e.target.duration * 100
    this.setState({ progress: progress })
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
