import React from 'react/addons'

export default class Tooltip extends React.Component {

  constructor(props) {
    super(props)
    this.style = props.style || {}
  }

  componentWillReceiveProps(props) {
    if (props.position && this.refs.tooltip) {
      let tooltip = this.refs.tooltip.getDOMNode()
      this.style.opacity = 1
      this.style.left = props.position.x - tooltip.clientWidth / 2
      this.style.top = props.position.y - tooltip.clientHeight / 2
    }    
  }

  render() {
    return (
      <div className="tooltip top" ref="tooltip" style={this.style}>
        <div className="tooltip-arrow"></div>
        <div className="tooltip-inner">
          {this.props.message}
        </div>
      </div>
      )
  }
}