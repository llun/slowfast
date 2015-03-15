import React from 'react/addons'

export default class Tooltip extends React.Component {

  constructor(props) {
    super(props)
    this.style = props.style || {}
  }

  componentWillReceiveProps(props) {
    let style = this.style
    if (props.position && this.refs.tooltip) {
      let tooltip = this.refs.tooltip.getDOMNode()
      style.opacity = 1
      style.left = props.position.x - tooltip.clientWidth / 2 + (props.offset.left || 0)
      style.top = props.position.y - tooltip.clientHeight + (props.offset.top || 0)
    } else {
      style.opacity = 0
    }
  }

  render() {
    return (
      <div className="tooltip top" ref="tooltip" style={this.style} onClick={this.props.onClick}>
        <div className="tooltip-arrow"></div>
        <div className="tooltip-inner">
          {this.props.message}
        </div>
      </div>
      )
  }
}