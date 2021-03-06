let zIndex = 1
export function LayerConstructor({ ...options }, type) {
  let layer = {
    id: options.id,
    isFocused: false,
    hidden: false,
    type: type,
    zIndex: zIndex++,
    coords: {
      x: 0,
      y: 0,
    },
    size: {
      width: options.size ? options.size.width : 'auto',
      height: options.size ? options.size.height : 'auto',
    },
    originalSize: {
      width: options.originalSize ? options.originalSize.width : 'auto',
      height: options.originalSize ? options.originalSize.height : 'auto',
    },
    rotateAngle: {
      degree: 0,
      radian: 0,
    },
    content: options.content,
    view: options.activeView,
  }
  if (type === 'image') {
    layer.props = {
      brightness: 1,
      contrast: 100,
      hue: 0,
    }
    layer.fileName = options.fileName
  } else {
    layer.props = {
      align: 'left',
      bendAngle: 0,
      color: options.color ? options.color : '#000000',
      colorStroke: {
        active: false,
        color: options.color ? options.color : '#000000',
      },
      fontSize: 16,
      fontFamily: 'Sans-serif',
      style: {
        bold: false,
        italic: false,
        underline: false,
      },
    }
  }

  return layer
}
