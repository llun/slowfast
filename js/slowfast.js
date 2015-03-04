import React from 'react'
import d3 from 'd3'
import wg_fetch from 'whatwg-fetch'

const ADDING_POINT = 'adding', REMOVING_POINT = 'removing'

let rates = []
  , bisectRate = d3.bisector(datum => { return datum.time }).right
  , bisectPath = d3.bisector(datum => { return datum.x }).right
  , focusPoint = null
  , playingPath = []

let SlowFast = React.createClass({
  getInitialState() {
    return { loading: true, adjustPoints: false, url: '', video: '' }
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

    if (this.state.adjustPoints == ADDING_POINT) {
      return this.setState({ adjustPoints: false })
    }
    this.setState({ adjustPoints: ADDING_POINT })
  },

  removePoint() {
    this.video().pause()

    if (this.state.adjustPoints == REMOVING_POINT) {
      return this.setState({ adjustPoints: false })
    }
    this.setState({ adjustPoints: REMOVING_POINT })
  },

  componentDidMount() {
    let video = this.video()
  
    let idPattern = window.location.search.match(/(video=(\d+))/i)
    let id = '95251007'
    if (idPattern) {
      id = idPattern[2]
    }

    this.setState({ video: id })
    
    fetch(`http://vimeo-config.herokuapp.com/${id}.json`)
      .then(response => { return response.json() })
      .then(json => {
        video.src = json.request.files.h264.sd.url
        video.poster = json.video.thumbs.base

        video.addEventListener('timeupdate', this.handleTimeUpdate)
        video.addEventListener('durationchange', this.handleDuration)
      })
  },

  handleTimeUpdate(e) {
    let video = e.target

    let index = bisectPath(playingPath, this.scaleX(video.currentTime), 1)
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

        return { time: value[0], value: value[1] }
      })

      if (process.length > 2) rates = process
    }

    this.enableControl()
    this.setState({ loading: false })
  },

  redrawRates(group, path, x, y, line, playingPoint) {
    let self = this
    group.selectAll('.ratePoint').remove()
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
          .on('click', function() {
            if (self.state.adjustPoints == REMOVING_POINT) {
              let point = d3.select(this).datum()
              let index = rates.indexOf(point)
              if (index == 0 || index == rates.length - 1)  return

              rates = rates.slice(0, index).concat(rates.slice(index + 1))
              self.redrawRates(group, path, x, y, line, playingPoint)
            }
          })
    this.updatePath(path, x, y, line, playingPoint)
  },

  updatePath(path, x, y, line, playingPoint) {
    let video = this.video()
    playingPath = []

    path.attr('d', line(rates))
    let node = path.node()
    for (let i = 0; i < node.getTotalLength(); i++) {
      let point = node.getPointAtLength(i)
      playingPath.push(point)
    }

    let index = bisectPath(playingPath, x(video.currentTime), 1)
    let point = playingPath[index]

    playingPoint.attr('cx', point.x).attr('cy', point.y)
    video.playbackRate = y.invert(point.y)

    let location = window.location.toString()
    if (location.indexOf('?') > 0) {
      location = location.substring(0, location.indexOf('?'))
    }

    let encodedRates = rates.map(each => {
      return `${each.time}:${each.value}`
    }).join(',')
    this.setState({ url: `${location}?video=${this.state.video}&rates=${encodedRates}` })
  },

  enableControl() {
    let video = this.video()
      , width = 800
      , height = 200
      , x = d3.scale.linear().domain([0, video.duration]).range([0, width])
      , y = d3.scale.linear().domain([0.5, 4]).range([height, 0])
      , line = d3.svg.line().interpolate('monotone').x(rate => { return x(rate.time) }).y(rate => { return y(rate.value) })
      , self = this

    let panel = d3.select(this.refs.panel.getDOMNode())
    panel.attr('width', width).attr('height', height)

    let path = panel.append('path').attr('stroke', 'blue').attr('stroke-width', 2).attr('fill', 'none')
      , playingPoint = panel.append('circle').attr('cx', x(rates[0].time)).attr('cy', y(rates[0].value)).attr('r', 6).attr('fill', 'white').attr('stroke', 'red').attr('stroke-width', 2)
      , ratesGroup = panel.append('g')
      , marker = panel.append('circle').attr('cx', x(rates[0].time)).attr('cy', y(rates[0].value)).attr('r', 4).attr('fill', 'black').attr('display', 'none')

    this.redrawRates(ratesGroup, path, x, y, line, playingPoint)
    this.playingPoint = playingPoint

    panel
      .on('click', function() {
        if (self.state.adjustPoints == ADDING_POINT) {
          let mouse = d3.mouse(this)

          let time = x.invert(marker.attr('cx'))
          let rate = y.invert(marker.attr('cy'))

          let index = bisectRate(rates, time)
          rates = rates.slice(0, index).concat([{ time: time, value: rate }]).concat(rates.slice(index))
          self.redrawRates(ratesGroup, path, x, y, line, playingPoint)
          self.setState({ adjustPoints: false })
        }
      })
      .on('mouseover', function() {
        if (self.state.adjustPoints == ADDING_POINT) {
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

        if (self.state.adjustPoints == ADDING_POINT) {
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
        self.updatePath(path, x, y, line, playingPoint)
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
      <div className="container-fluid">

        <div className="row">
          <div className="col-xs-12">
            <header className="text-center">
              <h1>Slow<span className="fast">Fast</span></h1>
            </header>
          </div>
        </div>

        <div className="row">
          <div className="col-xs-12 player">
            <div className="video">
              <video ref="video" />
              <div className="control">
                <i className="fa fa-play play"></i>
                
                <i className="fa fa-step-backward begin"></i>
                <i className="fa fa-pause pause"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row">
          <div className="col-xs-12">
            <button disabled={this.state.loading || this.state.adjustPoints} className="btn btn-primary" onClick={this.play}>Play</button>
            <button disabled={this.state.loading || this.state.adjustPoints} className="btn btn-default" onClick={this.pause}>Pause</button>
            <button disabled={this.state.loading || this.state.adjustPoints} className="btn btn-default" onClick={this.reset}>Reset</button>
            <button disabled={this.state.loading || (this.state.adjustPoints == REMOVING_POINT)} className="btn btn-default" onClick={this.addPoint}>Add Point</button>
            <button disabled={this.state.loading || (this.state.adjustPoints == ADDING_POINT)} className="btn btn-default" onClick={this.removePoint}>Remove Point</button>

            <input type="text" className="form-control" defaultValue={this.state.url} />
          </div>
        </div>

        <div className="row">
          <div className="col-xs-12">
            <svg ref="panel" style={panelStyle}></svg>
          </div>
        </div>

      </div>
      )
  }
})

React.render(
  <SlowFast />,
  document.querySelector('body')
  )
