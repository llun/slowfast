import React from 'react/addons'

export default class Tooltip extends React.Component {
  render() {
    return (
      <div className="tooltip top" style={this.props.style}>
        <div className="tooltip-arrow"></div>
        <div className="tooltip-inner">
          {this.props.message}
        </div>
      </div>
      )
  }
}