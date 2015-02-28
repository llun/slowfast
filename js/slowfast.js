import React from 'react'
import d3 from 'd3'

let rates = []
  , bisect = d3.bisector((a, b) => { return a.x - b.x }).right
  , focusPoint = null
  , playingPath = []
  , downTimer = null

let SlowFast = React.createClass({
  getInitialState() {
    return { loading: true }
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
    let video = this.video()
    video.addEventListener('timeupdate', this.handleTimeUpdate)
    video.addEventListener('durationchange', this.handleDuration)
  },

  handleTimeUpdate(e) {
    let video = e.target

    let index = bisect(playingPath, { x: this.scaleX(video.currentTime) }, 1)
    let point = playingPath[index]

    if (!point) { 
      this.video().pause()
      return
    }

    this.playingPoint.attr('cx', point.x).attr('cy', point.y)
    video.playbackRate = this.scaleY.invert(point.y)

    let progress = video.currentTime / video.duration * 100
  },

  handleDuration(e) {
    let video = e.target
    rates = [
      { time: 0.0, value: 1 },
      { time: video.duration, value: 1 }
    ]

    this.enableControl()
    this.setState({ loading: false })
  },

  enableControl() {
    let width = 800
      , height = 200
      , x = d3.scale.linear().domain([0, d3.max(rates, rate => { return rate.time })]).range([0, width])
      , y = d3.scale.linear().domain([0.5, 8]).range([height, 0])
      , line = d3.svg.line().interpolate('monotone').x(rate => { return x(rate.time) }).y(rate => { return y(rate.value) })
      , video = this.video()

    let panel = d3.select(this.refs.panel.getDOMNode())
    panel.attr('width', width).attr('height', height)

    let path = panel.append('path').attr('d', line(rates)).attr('stroke', 'blue').attr('stroke-width', 2).attr('fill', 'none')
    let node = path.node()
    for (let i = 0; i < node.getTotalLength(); i++) {
      let point = node.getPointAtLength(i)
      playingPath.push(point)
    }

    let playingPoint = panel.append('circle').attr('cx', x(rates[0].time)).attr('cy', y(rates[0].value)).attr('r', 6).attr('fill', 'white').attr('stroke', 'red').attr('stroke-width', 2)
    this.playingPoint = playingPoint
    let points = panel.selectAll('.ratePoint').data(rates)
      .enter()
        .append('circle')
          .attr('class', 'ratePoint')
          .attr('cx', rate => { return x(rate.time) })
          .attr('cy', rate => { return y(rate.value) })
          .attr('r', 4)
          .attr('fill', 'white')
          .attr('stroke', 'black')
          .attr('stroke-width', 2)
          .on('mousedown', function() {
            focusPoint = d3.select(this)
          })


    panel
      .on('mousedown', function() {
        clearTimeout(downTimer)
        downTimer = setTimeout(function() {
          console.log ('show menu')
        }, 2000)
      })
      .on('mousemove', function() {
        if (!focusPoint) return

        let mouse = d3.mouse(this)

        let rate = focusPoint.datum()
        let rateIndex = rates.indexOf(rate)

        let newTime = x.invert(mouse[0])
        let newRate = y.invert(mouse[1])

        if (rateIndex > 0) {
          let previousRate = rates[rateIndex - 1]
          if (newTime <= previousRate.time) return
        }

        if (rateIndex < rates.length - 1) {
          let nextRate = rates[rateIndex + 1]
          if (newTime >= nextRate.time) return
        }

        rate.time = newTime
        rate.value = newRate

        focusPoint.attr('cx', mouse[0]).attr('cy', mouse[1])
        path.attr('d', line(rates))
        
        playingPath = []
        node = path.node()
        for (let i = 0; i < node.getTotalLength(); i++) {
          let point = node.getPointAtLength(i)
          playingPath.push(point)
        }

        let index = bisect(playingPath, { x: x(video.currentTime) }, 1)
        let point = playingPath[index]

        playingPoint.attr('cx', point.x).attr('cy', point.y)
        video.playbackRate = y.invert(point.y)
        video.currentTime = x.invert(point.x)

      })
      .on('mouseup', () => {
        focusPoint = null
        if (downTimer) {
          clearTimeout(downTimer)
        }
      })

    this.scaleX = x
    this.scaleY = y

  },

  render() {
    let panelStyle = {
      overflow: 'visible',
      border: '1px solid black',
      boxSizing: 'content-box'
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
              <video ref="video" src="http://pdl.vimeocdn.com/11541/324/253488590.mp4?token2=1425138307_eeb3410cf095f773911b0240ca95806d&aksessionid=801766216ac073d9"/>
            </div>
          </div>
          
          <div className="row">
            <div className="col-xs-12">
              <button disabled={this.state.loading} className="btn btn-primary" onClick={this.play}>Play</button>
              <button disabled={this.state.loading} className="btn btn-default" onClick={this.pause}>Pause</button>
              <button disabled={this.state.loading} className="btn btn-default" onClick={this.reset}>Reset</button>
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
