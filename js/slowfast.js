import React from 'react'
import d3 from 'd3'
import wg_fetch from 'whatwg-fetch'

let rates = []
  , bisectRate = d3.bisector(datum => { return datum.time }).right
  , bisectPath = d3.bisector(datum => { return datum.x }).right
  , focusPoint = null
  , playingPath = []

let SlowFast = React.createClass({
  getInitialState() {
    return { loading: true, adjustPoints: false }
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

  addPoint() {
    this.video().pause()

    if (this.state.adjustPoints == 'adding') {
      return this.setState({ adjustPoints: false })
    }
    this.setState({ adjustPoints: 'adding' })
  },

  componentDidMount() {
    let video = this.video()

    fetch('http://vimeo-config.herokuapp.com/95251007.json')
      .then(response => { return response.json() })
      .then(json => {
        video.src = json.request.files.h264.sd.url

        video.addEventListener('timeupdate', this.handleTimeUpdate)
        video.addEventListener('durationchange', this.handleDuration)
      })
  },

  handleTimeUpdate(e) {
    let video = e.target

    let index = bisectPath(playingPath, { x: this.scaleX(video.currentTime) }, 1)
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

  redrawRates(group, x, y) {
    console.log (rates)
    group.selectAll('.ratePoint').data(rates)
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
  },

  enableControl() {
    let width = 800
      , height = 200
      , x = d3.scale.linear().domain([0, d3.max(rates, rate => { return rate.time })]).range([0, width])
      , y = d3.scale.linear().domain([0.5, 8]).range([height, 0])
      , line = d3.svg.line().interpolate('monotone').x(rate => { return x(rate.time) }).y(rate => { return y(rate.value) })
      , video = this.video()
      , self = this

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
    let ratesGroup = panel.append('g')
    this.redrawRates(ratesGroup, x, y)
    let marker = panel.append('circle').attr('cx', x(rates[0].time)).attr('cy', y(rates[0].value)).attr('r', 4).attr('fill', 'black').attr('display', 'none')

    panel
      .on('click', function() {
        if (self.state.adjustPoints == 'adding') {
          let mouse = d3.mouse(this)

          let time = x.invert(marker.attr('cx'))
          let rate = y.invert(marker.attr('cy'))

          let index = bisectRate(rates, time)
          rates = rates.slice(0, index).concat([{ time: time, value: rate }]).concat(rates.slice(index))
          self.redrawRates(ratesGroup, x, y)
          self.setState({ adjustPoints: false })
        }
      })
      .on('mouseover', function() {
        if (self.state.adjustPoints == 'adding') {
          let mouse = d3.mouse(this)
          marker.attr('display', 'inherit')
        }
      })
      .on('mouseout', function() {
        marker.attr('display', 'none')
      })
      .on('mousemove', function() {
        let mouse = d3.mouse(this)

        let newTime = x.invert(mouse[0])
        let newRate = y.invert(mouse[1])

        let index = bisectPath(playingPath, mouse[0], 1)

        if (self.state.adjustPoints == 'adding') {
          let point = playingPath[index]

          if (point) {
            marker.attr('cx', point.x).attr('cy', point.y)
          }
        }

        if (!focusPoint) return

        let rate = focusPoint.datum()
        let rateIndex = rates.indexOf(rate)

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

        index = bisectPath(playingPath, x(video.currentTime), 1)
        point = playingPath[index]

        playingPoint.attr('cx', point.x).attr('cy', point.y)
        video.playbackRate = y.invert(point.y)
        video.currentTime = x.invert(point.x)

      })
      .on('mouseup', () => {
        focusPoint = null
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
              <video ref="video"/>
            </div>
          </div>
          
          <div className="row">
            <div className="col-xs-12">
              <button disabled={this.state.loading || this.state.adjustPoints} className="btn btn-primary" onClick={this.play}>Play</button>
              <button disabled={this.state.loading || this.state.adjustPoints} className="btn btn-default" onClick={this.pause}>Pause</button>
              <button disabled={this.state.loading || this.state.adjustPoints} className="btn btn-default" onClick={this.reset}>Reset</button>
              <button disabled={this.state.loading} className="btn btn-default" onClick={this.addPoint}>Add Point</button>
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
