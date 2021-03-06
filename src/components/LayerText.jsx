import React from 'react'

const LayerText = props => {
  const { content, properties, opacity } = props
  let styles = {
    width: '100%',
    height: '100%',
    cursor: 'move',
    opacity: opacity ? opacity : 1,
    fontFamily: properties.fontFamily,
    fontStyle: properties.style.italic ? 'italic' : 'normal',
    fontWeight: properties.style.bold ? 'bold' : 'normal',
    textDecoration: properties.style.underline ? 'underline' : 'none',
    WebkitTextStrokeWidth:
      Math.floor(properties.fontSize / 50) < 1
        ? 1 + 'px'
        : Math.floor(properties.fontSize / 50) + 'px',
    WebkitTextStrokeColor: properties.colorStroke.active
      ? properties.colorStroke.color
      : 'transparent',
    color: properties.color,
    textAlign: properties.align,
    lineHeight: 1.2,
    whiteSpace: 'pre',
  }
  return <div style={styles}>{content ? content : 'Input text'}</div>
}

export default LayerText
