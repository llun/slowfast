import React from 'react/addons'
import d3 from 'd3'
import SlowFast from 'slowfast'

import Tooltip from './tooltip'

let rates = []
  , bisectRate = d3.bisector(datum => { return datum.time }).right
  , bisectPath = d3.bisector(datum => { return datum.x }).right
  , focusPoint = null
  , playingPath = []
  , width = 800
  , height = 200
  , pointStrokeSize = 2
  , playingPointSize = 10
  , markerPointSize = 8
  , slowfast = null
  , actionTimeout = null
  , initial = false

export default class Panel extends React.Component {
  constructor(props) {
    super(props)
    this.state = { add: false, remove: false, initial: false }
  }

  componentDidMount() {
    window.addEventListener('resize', event => {
      this.drawPanel(true)
    })
  }

  componentDidUpdate() {
    this.drawPanel(false)
  }

  drawPanel(resize) {

    if (this.props.initialRates.length == 0 || (this.state.initial && !resize)) {
      return
    }

    let video = this.props.video
      , width = this.refs.panel.getDOMNode().clientWidth
      , x = d3.scale.linear().domain([0, video.duration]).range([0, width])
      , y = d3.scale.linear().domain([0.5, 4]).range([height, 0])
      , line = d3.svg.line().interpolate('monotone').x(rate => { return x(rate.time) }).y(rate => { return y(rate.rate) })
      , self = this

    rates = (rates.length > 0 ? rates : this.props.initialRates)

    let panel = d3.select(this.refs.panel.getDOMNode())
    panel.selectAll("*").remove()
    panel
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`)
      // Drawing axis
      .append('g')
        .attr('class', 'axis x')
        .attr('transform', `translate(0,${height})`)
        .call(d3.svg.axis().scale(x).orient('bottom').tickSize(-height))
        .append('text')
          .style("text-anchor", "end")
          .text('Time (seconds)')
          .attr('x', width)
          .attr('y', 30)

    let path = panel.append('path').attr('stroke', 'black').attr('stroke-width', pointStrokeSize).attr('fill', 'none')
      , playingPoint = panel.append('circle').attr('cx', x(rates[0].time)).attr('cy', y(rates[0].rate)).attr('r', playingPointSize).attr('fill', 'white').attr('stroke', 'red').attr('stroke-width', pointStrokeSize)
      , ratesGroup = panel.append('g')
      , marker = panel.append('circle').attr('cx', x(rates[0].time)).attr('cy', y(rates[0].rate)).attr('r', markerPointSize).attr('fill', 'black').attr('display', 'none')

    slowfast = new SlowFast(video, rates, (start, end, time) => {
      if (!end) { return start.rate }

      let index = bisectPath(playingPath, x(time), 1)
        , point = playingPath[index]

      if (!point) { return start.rate }
      playingPoint.attr('cx', point.x).attr('cy', point.y)
      return y.invert(point.y)
    })
    this.redrawRates(ratesGroup, path, x, y, line, playingPoint)
    this.playingPoint = playingPoint

    // Event Handlers
    panel
      .on('mousedown', function() {
        let mouse = d3.mouse(this)
        
        // Cancel add
        if (self.state.add) {
          let index = self.state.add.index
          rates = rates.slice(0, index).concat(rates.slice(index + 1))
          self.redrawRates(ratesGroup, path, x, y, line, playingPoint)

          self.setState({ add: false })
        }

        // Cancel remove
        if (self.state.remove) {
          self.setState({ remove: false })
        }

        actionTimeout = setTimeout(() => {
          let time = x.invert(mouse[0])
            , rate = y.invert(mouse[1])
            , index = bisectRate(rates, time)

          slowfast.pause()
          rates = rates.slice(0, index).concat([{ time: time, rate: rate }]).concat(rates.slice(index))
          self.redrawRates(ratesGroup, path, x, y, line, playingPoint)

          self.setState({ add: { x: mouse[0], y: mouse[1], index: index } })
        }, 2000)
      })
      .on('mousemove', function() {
        let mouse = d3.mouse(this)

        let newTime = x.invert(mouse[0])
        let newRate = y.invert(mouse[1])

        let index = bisectPath(playingPath, mouse[0], 1)

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
        rate.rate = newRate

        focusPoint.attr('cx', mouse[0]).attr('cy', mouse[1])
        self.updatePath(path, x, y, line, playingPoint)
      })
      .on('mouseup', () => {
        focusPoint = null
        clearTimeout(actionTimeout)
      })

    this.setState({ initial: true })
  }

  confirmAdd() {
    this.setState({ add: false })
  }

  confirmRemove() {
    let index = this.state.remove.index

    rates = rates.slice(0, index).concat(rates.slice(index + 1))
    this.redrawRates(...this.state.remove.arguments)

    this.setState({ remove: false })
  }

  redrawRates(group, path, x, y, line, playingPoint) {
    let self = this
    group.selectAll('.ratePoint').remove()
    group.selectAll('.ratePoint').data(rates)
      .enter()
        .append('circle')
          .attr('class', 'ratePoint')
          .attr('cx', rate => { return x(rate.time) })
          .attr('cy', rate => { return y(rate.rate) })
          .attr('r',  markerPointSize)
          .attr('fill', 'white')
          .attr('stroke', 'black')
          .attr('stroke-width', pointStrokeSize)
          .on('mousedown', function() {
            focusPoint = d3.select(this)
          })
          .on('click', function() {
            if (rates.length > 2) {

              let point = d3.select(this).datum()
              let index = rates.indexOf(point)

              self.setState({ remove: { 
                x: x(point.time), y: y(point.rate), index: index, 
                arguments: [group, path, x, y, line, playingPoint]} })
            }

          })
    this.updatePath(path, x, y, line, playingPoint)
  }

  updatePath(path, x, y, line, playingPoint) {
    playingPath = []

    path.attr('d', line(rates))
    let node = path.node()
    for (let i = 0; i < node.getTotalLength(); i++) {
      let point = node.getPointAtLength(i)
      playingPath.push(point)
    }
    slowfast.updateRates(rates)

    let location = window.location.toString()
    if (location.indexOf('?') > 0) {
      location = location.substring(0, location.indexOf('?'))
    }

    let encodedRates = rates.map(each => {
      return `${each.time.toFixed(2)}:${each.rate.toFixed(2)}`
    }).join(',')

    if (window.history) {
      history.pushState(null, null, `${location}?video=${this.props.videoID}&rates=${encodedRates}`);
    }
  }

  render() {
    let tooltipOffset = { top: -((markerPointSize / 2) + 2)}
      , panelStyle = {
        display: this.props.show ? 'block' : 'none'
      }

    return (
      <div className="row" style={panelStyle}>
        <div className="col-xs-12">
        
          <div className="slowfast-panel">
            <svg className="graph" ref="panel"></svg>

            <Tooltip
              position={this.state.add}
              offset={tooltipOffset}
              message="Add Point"
              onClick={this.confirmAdd.bind(this)} />

            <Tooltip
              position={this.state.remove}
              offset={tooltipOffset}
              message="Remove Point"
              onClick={this.confirmRemove.bind(this)} />
          </div>
          
        </div>
      </div>
      )
  }
}