import React from 'react/addons'
import d3 from 'd3'
import SlowFast from 'slowfast'

let bisectRate = d3.bisector(datum => { return datum.time }).right
  , bisectPath = d3.bisector(datum => { return datum.x }).right
  , focusPoint = null
  , playingPath = []
  , width = 800
  , height = 200
  , pointStrokeSize = 2
  , playingPointSize = 10
  , markerPointSize = 8
  , slowfast = null

let Panel = React.createClass({
  getInitialState() {
    return { rates: this.props.initialRates }
  },

  componentDidUpdate() {
    this.drawPanel()
    window.addEventListener('resize', event => {
      this.drawPanel()
    })
  },

  drawPanel() {
    if (this.state.rates.length == 0) return

    let video = this.props.video
      , width = this.refs.panel.getDOMNode().clientWidth
      , x = d3.scale.linear().domain([0, video.duration]).range([0, width])
      , y = d3.scale.linear().domain([0.5, 4]).range([height, 0])
      , line = d3.svg.line().interpolate('monotone').x(rate => { return x(rate.time) }).y(rate => { return y(rate.rate) })
      , rates = this.state.rates
      , self = this

    let panel = d3.select(this.refs.panel.getDOMNode())
    panel.selectAll("*").remove()
    panel
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`)

    let path = panel.append('path').attr('stroke', 'blue').attr('stroke-width', pointStrokeSize).attr('fill', 'none')
      , playingPoint = panel.append('circle').attr('cx', x(rates[0].time)).attr('cy', y(rates[0].rate)).attr('r', playingPointSize).attr('fill', 'white').attr('stroke', 'red').attr('stroke-width', pointStrokeSize)
      , ratesGroup = panel.append('g')
      , marker = panel.append('circle').attr('cx', x(rates[0].time)).attr('cy', y(rates[0].rate)).attr('r', markerPointSize).attr('fill', 'black').attr('display', 'none')

    this.redrawRates(ratesGroup, path, x, y, line, playingPoint)
    this.playingPoint = playingPoint

    panel
      .on('click', function() {
        if (self.state.adjustPoints == ADDING_POINT) {
          let mouse = d3.mouse(this)

          let time = x.invert(marker.attr('cx'))
          let rate = y.invert(marker.attr('cy'))

          let index = bisectRate(rates, time)
          rates = rates.slice(0, index).concat([{ time: time, rate: rate }]).concat(rates.slice(index))
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
        rate.rate = newRate

        focusPoint.attr('cx', mouse[0]).attr('cy', mouse[1])
        self.updatePath(path, x, y, line, playingPoint)
      })
      .on('mouseup', () => {
        focusPoint = null
      })

    slowfast = new SlowFast(video, rates, (start, end, time) => {
      if (!end) { return start.rate }

      let index = bisectPath(playingPath, x(time), 1)
        , point = playingPath[index]

      if (!point) { return start.rate }
      this.playingPoint.attr('cx', point.x).attr('cy', point.y)
      return y.invert(point.y)
    })
  },

  addPoint() {
    slowfast.pause()

    if (this.state.adjustPoints == ADDING_POINT) {
      return this.setState({ adjustPoints: false })
    }
    this.setState({ adjustPoints: ADDING_POINT })
  },

  removePoint() {
    slowfast.pause()

    if (this.state.adjustPoints == REMOVING_POINT) {
      return this.setState({ adjustPoints: false })
    }
    this.setState({ adjustPoints: REMOVING_POINT })
  },

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
          .attr('fill', 'black')
          .attr('stroke', 'black')
          .attr('stroke-width', pointStrokeSize)
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
    slowfast.updateRates(rates)

    let location = window.location.toString()
    if (location.indexOf('?') > 0) {
      location = location.substring(0, location.indexOf('?'))
    }

    let encodedRates = rates.map(each => {
      return `${each.time.toFixed(2)}:${each.rate.toFixed(2)}`
    }).join(',')

    if (window.history) {
      history.pushState(null, null, `${location}?video=${this.state.video}&rates=${encodedRates}`);
    }
  },

  render() {
    return (
      <div className="row slowfast-panel">
        <div className="col-xs-12">
          <svg className="graph" ref="panel"></svg>
        </div>
      </div>
      )
  }
})

export default Panel