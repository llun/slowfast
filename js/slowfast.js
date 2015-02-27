import React from 'react'
import d3 from 'd3'

let rates = [
  { time: 0.0, value: 1 },
  { time: 20.0, value: 2 },
  { time: 50.0, value: 0.5 },
  { time: 60.0, value: 0.1 },
  { time: 65.0, value: 4 },
  { time: 114.126077, value: 1 }
]

let bisect = d3.bisector((a, b) => {
  return a.x - b.x
}).right

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
    this.video().addEventListener('timeupdate', this.handleTimeUpdate)

    let width = 800
      , height = 200
      , x = d3.scale.linear().domain([0, d3.max(rates, rate => { return rate.time })]).range([0, width])
      , y = d3.scale.linear().domain([0, d3.max(rates, rate => { return rate.value })]).range([height, 0])
      , line = d3.svg.line().interpolate('cardinal').x(rate => { return x(rate.time) }).y(rate => { return y(rate.value) })

    let panel = d3.select(this.refs.panel.getDOMNode())
    panel.attr('width', width).attr('height', height)

    let path = panel.append('path').attr('d', line(rates)).attr('stroke', 'blue').attr('stroke-width', 2).attr('fill', 'none')
    let points = panel.selectAll('circle').data(rates)
      .enter()
        .append('circle')
          .attr('cx', rate => { return x(rate.time) })
          .attr('cy', rate => { return y(rate.value) })
          .attr('r', 4)
          .attr('fill', 'white')
          .attr('stroke', 'black')
          .attr('stroke-width', 2)

    this.playingPoint = panel.append('circle').attr('cx', x(rates[0].time)).attr('cy', y(rates[0].value)).attr('r', 6).attr('fill', 'white').attr('stroke', 'red').attr('stroke-width', 2)
    this.x = x
    this.y = y
    this.path = path

    let node = this.path.node()
    this.points = []
    for (let i = 0; i < node.getTotalLength(); i++) {
      let point = node.getPointAtLength(i)
      this.points.push(point)
    }
  },

  handleTimeUpdate(e) {
    let video = e.target

    let index = bisect(this.points, { x: this.x(video.currentTime) }, 1)
    let point = this.points[index]

    this.playingPoint.attr('cx', point.x).attr('cy', point.y)
    video.playbackRate = this.y.invert(point.y)

    let progress = video.currentTime / video.duration * 100
    this.setState({ progress: progress })
  },

  render() {
    let progressStyle = {
      width: `${this.state.progress}%`
    }

    let panelStyle = {
      overflow: 'visible'
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
            <div className="col-xs-12">
              <svg ref="panel" style={panelStyle}></svg>
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
