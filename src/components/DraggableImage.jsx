import React, { PureComponent } from 'react'
import { DragSource } from 'react-dnd'
import { ItemTypes } from '../constants'
import LayerImage from './LayerImage'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { setFocus, rotateLayer, resizeLayer } from '../actions'
import { connect } from 'react-redux'

const ImageSource = {
  beginDrag(props, dnd, element) {
    if (!props.isFocused) {
      props.setFocus(props.id)
    }
    return {
      id: props.id,
      coords: props.coords,
      size: props.size,
      content: props.content,
      rotateAngle: props.rotateAngle,
      zIndex: props.zIndex,
    }
  },
}

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
  }
}

class DraggableImage extends PureComponent {
  constructor(props) {
    super(props)

    this.layerRef = null

    this.state = {
      isRotating: false,
      isTransforming: false,
    }

    this.coords = {}
    this.size = {}
    this.newSize = {}
    this.startCoords = {}

    this.currentAngle = this.props.rotateAngle
    this.boxCenterPoint = {}
    this.angle = this.props.rotateAngle
    this.startAngle = 0

    this.getPositionFromCenter = this.getPositionFromCenter.bind(this)
    this.rotateMouseDown = this.rotateMouseDown.bind(this)
    this.rotateMouseUp = this.rotateMouseUp.bind(this)
    this.rotateMouseMove = this.rotateMouseMove.bind(this)
    this.deselectAll = this.deselectAll.bind(this)
    this.setLayerFocus = this.setLayerFocus.bind(this)

    this.transformMouseDown = this.transformMouseDown.bind(this)
    this.transformMouseUp = this.transformMouseUp.bind(this)
    this.transformMouseMove = this.transformMouseMove.bind(this)

    this.respectAspectRatio = this.respectAspectRatio.bind(this)
    this.setMinSize = this.setMinSize.bind(this)
  }

  setLayerFocus() {
    if (!this.props.isFocused) {
      this.props.setFocus(this.props.id)
    }
  }

  deselectAll() {
    if (document.selection) {
      document.selection.empty()
    } else if (window.getSelection) {
      window.getSelection().removeAllRanges()
    }
  }

  getPositionFromCenter(e) {
    const fromBoxCenter = {
      x: e.clientX - this.boxCenterPoint.x,
      y: -(e.clientY - this.boxCenterPoint.y),
    }
    return fromBoxCenter
  }

  rotateMouseDown(e) {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    this.setState(
      state => {
        return {
          ...state,
          isRotating: true,
        }
      },
      () => {
        const boxPosition = this.layerRef.getBoundingClientRect()
        // get the current center point
        this.boxCenterPoint.x = boxPosition.left + boxPosition.width / 2
        this.boxCenterPoint.y = boxPosition.top + boxPosition.height / 2

        this.startAngle = this.props.rotateAngle
      }
    )
  }

  rotateMouseUp(e) {
    e.stopPropagation()
    this.deselectAll()
    if (this.state.isRotating) {
      const newCurrentAngle = this.currentAngle + (this.angle - this.startAngle)
      this.setState(
        state => {
          return {
            ...state,
            isRotating: false,
          }
        },
        () => {
          this.currentAngle = newCurrentAngle
          this.props.rotateLayer(this.props.id, newCurrentAngle)
          // this.setLayerFocus()
        }
      )
    }
  }

  rotateMouseMove(e) {
    if (this.state.isRotating) {
      const fromBoxCenter = this.getPositionFromCenter(e)
      const newAngle =
        45 - Math.atan2(fromBoxCenter.y, fromBoxCenter.x) * (180 / Math.PI)

      const newRotateAngle =
        this.currentAngle + (newAngle - (this.startAngle ? this.startAngle : 0))

      this.layerRef.style.transform = `rotate(${newRotateAngle}deg)`
      this.angle = newRotateAngle
    }
  }

  transformMouseDown(e) {
    e.persist()
    e.stopPropagation()
    this.setState(
      state => {
        return {
          ...state,
          isTransforming: true,
        }
      },
      () => {
        this.startCoords.x = e.clientX
        this.startCoords.y = e.clientY
        this.size.width = this.layerRef.offsetWidth
        this.size.height = this.layerRef.offsetHeight
        console.log(this.size)
      }
    )
  }

  transformMouseUp(e) {
    this.deselectAll()
    if (this.state.isTransforming) {
      e.stopPropagation()
      this.setState(
        state => {
          return {
            ...state,
            isTransforming: false,
          }
        },
        () => {
          const { id, resizeLayer } = this.props
          resizeLayer(id, this.newSize, this.coords)
        }
      )
    }
  }

  transformMouseMove(e) {
    this.deselectAll()
    if (this.state.isTransforming) {
      this.newSize.width =
        Math.abs(e.clientX - this.startCoords.x) >
        Math.abs(e.clientY - this.startCoords.y)
          ? e.clientX - this.startCoords.x + this.size.width
          : e.clientY - this.startCoords.y + this.size.width
      this.newSize.height = this.layerRef.clientHeight

      let layerWidth = this.layerRef.clientWidth
      let layerHeight = this.layerRef.clientHeight

      this.newSize = this.respectAspectRatio(
        this.props.originalSize,
        this.newSize
      )
      // this.newSize = this.setMinSize(this.props.originalSize, this.newSize, 20)

      this.coords.x = this.coords.x - (this.newSize.width - layerWidth) / 2
      this.coords.y = this.coords.y - (this.newSize.height - layerHeight) / 2

      this.layerRef.style.top = this.coords.y + 'px'
      this.layerRef.style.left = this.coords.x + 'px'

      this.layerRef.style.width = this.newSize.width + 'px'
      this.layerRef.style.height = this.newSize.height + 'px'

      this.size.width = this.newSize.width
      this.size.height = this.newSize.height
      this.startCoords.x = e.clientX
      this.startCoords.y = e.clientY
    }
  }

  respectAspectRatio(originalSize, newSize) {
    let newImageSize = {
      width: newSize.width,
      height: newSize.height,
    }
    let originalAspectRation = originalSize.width / originalSize.height
    let newAspectRation = newSize.width / newSize.height

    if (newAspectRation !== originalAspectRation) {
      newImageSize.height =
        newImageSize.width / (originalSize.width / originalSize.height)
    }
    return newImageSize
  }

  // setMinSize(originalSize, currentSize, minSize) {
  //   if (currentSize.width < minSize) {
  //     currentSize.width = minSize
  //     currentSize.height =
  //       currentSize.height / (originalSize.width / originalSize.height)
  //   } else if (currentSize.height < minSize) {
  //     currentSize.height = minSize
  //     currentSize.width =
  //       (originalSize.width / originalSize.height) * currentSize.height
  //   }
  //   return currentSize
  // }

  componentDidMount() {
    window.addEventListener('mouseup', this.rotateMouseUp)
    window.addEventListener('mousemove', this.rotateMouseMove)

    window.addEventListener('mouseup', this.transformMouseUp)
    window.addEventListener('mousemove', this.transformMouseMove)

    const { connectDragPreview } = this.props
    if (connectDragPreview) {
      // and we can draw whatever we want on the custom drag layer instead.
      connectDragPreview(getEmptyImage(), {
        captureDraggingState: true,
      })
    }
  }

  render() {
    const {
      connectDragSource,
      isDragging,
      coords,
      size,
      content,
      zIndex,
      rotateAngle,
      isFocused,
    } = this.props
    this.coords = coords
    let styles = {
      width: size.width + 'px',
      height: size.height + 'px',
      top: coords.y + 'px',
      left: coords.x + 'px',
      opacity: isDragging ? 0 : 1,
      zIndex: zIndex,
      position: 'absolute',
      transform: `rotate(${rotateAngle}deg)`,
    }
    let className = 'single-layer__container image-layer'
    className += isFocused ? ' focused-layer' : ''

    return this.state.isRotating || this.state.isTransforming ? (
      <div
        className={className}
        style={styles}
        onClick={this.setLayerFocus}
        ref={div => (this.layerRef = div)}>
        <LayerImage content={content} />
        <div
          className='transform-layer rotate-layer'
          onMouseDown={this.rotateMouseDown}
          onMouseUp={this.rotateMouseUp}
        />
        <div
          className='transform-layer resize-layer'
          onMouseDown={this.transformMouseDown}
          onMouseUp={this.transformMouseUp}
        />
      </div>
    ) : (
      connectDragSource(
        <div className={className} style={styles} onClick={this.setLayerFocus}>
          <LayerImage content={content} />
          <div
            className='transform-layer rotate-layer'
            onMouseDown={this.rotateMouseDown}
            onMouseUp={this.rotateMouseUp}
          />
          <div
            className='transform-layer resize-layer'
            onMouseDown={this.transformMouseDown}
            onMouseUp={this.transformMouseUp}
          />
        </div>
      )
    )
  }
}

const mapStateToProps = state => ({ images: state })

DraggableImage = DragSource(ItemTypes.EDITOR_LAYER_ITEM, ImageSource, collect)(
  DraggableImage
)

DraggableImage = connect(
  mapStateToProps,
  { setFocus, rotateLayer, resizeLayer }
)(DraggableImage)

export default DraggableImage
