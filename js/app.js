import React from 'react/addons'
import wg_fetch from 'whatwg-fetch'

import Panel from './panel'

let App = React.createClass({
  getInitialState() {
    return { loading: true, playing: false, rates: [] }
  },

  video() {
    return this.refs.video.getDOMNode()
  },

  play(e) {
    if (this.state.loading || this.state.adjustPoints) return

    this.video().play()
    this.setState({ playing: true })
  },

  pause(e) {
    this.video().pause()
    this.setState({ playing: false })
  },

  begin(e) {
    this.pause()
    this.video().currentTime = 0;
  },

  componentDidMount() {
    let video = this.video()
  
    let idPattern = window.location.search.match(/(video=(\d+))/i)
    let id = '95251007'
    if (idPattern) {
      id = idPattern[2]
    }
    
    fetch(`http://vimeo-config.herokuapp.com/${id}.json`)
      .then(response => { return response.json() })
      .then(json => {
        video.src = json.request.files.h264.sd.url
        video.poster = json.video.thumbs.base
        video.addEventListener('durationchange', this.handleDuration)
      })
  },

  handleDuration() {
    let video = this.video()
      , rates = [
      { time: 0.0, rate: 1 },
      { time: video.duration, rate: 1 }
    ]

    let ratePattern = window.location.search.match(/(rates=((\d+\.\d+\:\d+\,*)+))/i)
    if (ratePattern) {
      let data = ratePattern[2]
      let process = data.split(',').map(each => {
        let value = each.split(':')
        if (value.length < 2) { return { time: -1, value: -1 } } // Invalid data

        if (value[0] < 0) value[0] = 0
        if (value[0] > video.duration) value[0] = video.duration

        if (value[1] < 0.5) value[1] = 0.5
        if (value[1] > 4) value[1] = 4

        return { time: value[0], rate: value[1] }
      })

      if (process.length > 2) rates = process
    }

    this.setState({ loading: false, rates: rates, video: video })
  },

  render() {
    let videoClassNames = React.addons.classSet({
      video: true,
      playing: this.state.playing
    })

    return (
      <div className="app">

        <div className="row">
          <div className="col-xs-12 player">
            <div className={videoClassNames}>
              <video ref="video" />
              <div className="control">
                <i className="fa fa-play play" onClick={this.play}></i>
                
                <i className="fa fa-step-backward begin" onClick={this.begin}></i>
                <i className="fa fa-pause pause" onClick={this.pause}></i>
              </div>
            </div>
          </div>
        </div>

        <Panel video={this.state.video} initialRates={this.state.rates} />
      </div>
      )
  }
})

React.render(
  <App />,
  document.querySelector('main')
  )
