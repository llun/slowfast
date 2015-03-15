import React from 'react/addons'

export default class Tooltip extends React.Component {
  render() {
    let style = this.props.style || {}

    if (this.props.position && this.refs.tooltip) {
      let tooltip = this.refs.tooltip.getDOMNode()
      console.log (tooltip.clientWidth, tooltip.clientHeight)
      console.log (tooltip)

      style.opacity = 1
      style.left = this.props.position.x - tooltip.clientWidth / 2
      style.top = this.props.position.y - tooltip.clientHeight / 2
    }

    return (
      <div className="tooltip top" ref="tooltip" style={style}>
        <div className="tooltip-arrow"></div>
        <div className="tooltip-inner">
          {this.props.message}
        </div>
      </div>
      )
  }
}