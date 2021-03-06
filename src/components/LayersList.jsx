import React, { Component } from 'react'
import TextSettings from './TextSettings'
import ImageSettings from './ImageSettings'
import LayerListItem from './LayerListItem'
import { connect } from 'react-redux'
import { reorderStore, setFocus } from '../actions'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import LayerActions from './LayerActions'

const reorder = (list, startIndex, endIndex) => {
  let result = Array.from(list).map(item => item.id)
  let zIndexes = Array.from(list).map(item => item.zIndex)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return {
    ids: result,
    zIndexes,
  }
}

const getTranslateY = string => {
  var mat = string.match(/^translate\((.+)\)$/)
  if (mat) return parseFloat(mat[1].split(', ')[1])
}

const getItemStyle = draggableStyle => {
  return {
    userSelect: 'none',
    position: 'static',
    ...draggableStyle,
    transform: draggableStyle.transform
      ? `translate(0, ${getTranslateY(draggableStyle.transform)}px)`
      : 'none',
  }
}

class LayersList extends Component {
  constructor(props) {
    super(props)

    this.onDragEnd = this.onDragEnd.bind(this)
    this.clickHandler = this.clickHandler.bind(this)
    this.handleBeforeDrag = this.handleBeforeDrag.bind(this)
    this.setSettingsStyle = this.setSettingsStyle.bind(this)
    this.scrollTo = this.scrollTo.bind(this)
  }

  handleBeforeDrag(id) {
    const layerSettings = document.querySelector(`.layer-list [data-dragid="${id}"] + div`)
    if (layerSettings) {
      layerSettings.style.position = 'absolute'
      layerSettings.style.width = 'calc(100% - 32px * 2)'
      layerSettings.style.opacity = 0.1
    }
  }

  setSettingsStyle(draggableIndex, id = false) {
    if (!id) {
      const domLayers = document.querySelectorAll('.layer-list-item > div')
      const layer = Array.from(domLayers).find((elem, index) => index === draggableIndex)
      if (layer) {
        const layerSettings = document.querySelector(
          `.layer-list [data-dragid="${layer.dataset.dragid}"] + div`
        )
        if (layerSettings) {
          layerSettings.style.position = 'relative'
          layerSettings.style.width = 'auto'
          layerSettings.style.opacity = 1
        }
      }
    } else {
      const layerSettings = document.querySelector(
        `.layer-list [data-dragid="${draggableIndex}"] + div`
      )
      if (layerSettings) {
        layerSettings.style.position = 'relative'
        layerSettings.style.width = 'auto'
        layerSettings.style.opacity = 1
      }
    }
  }

  onDragEnd(result) {
    this.setSettingsStyle(result.source.index)

    if (!result.destination) {
      return
    }
    const { layers } = this.props
    const reordered = reorder(layers, result.source.index, result.destination.index)
    const { reorderStore } = this.props
    reorderStore(reordered.ids, reordered.zIndexes)
  }

  clickHandler(e, id) {
    e.persist()
    let dragDiv = e.target.closest('.drag-item__container')
    const visibilityToggle = e.target.closest('.visibility-toggle')
    if (dragDiv || visibilityToggle) return

    const { setFocus, layers } = this.props
    const focused = layers.filter(layer => layer.isFocused)
    if (focused.length < 1 || focused[0].id !== id) {
      setFocus(id)
    }
  }

  scrollTo(element, to, duration) {
    const start = element.scrollTop,
      change = to - start,
      increment = 20
    let currentTime = 0

    const easeInOutCubic = function(t, s, c, d) {
      t /= d / 2
      if (t < 1) return (c / 2) * t * t * t + s
      t -= 2
      return (c / 2) * (t * t * t + 2) + s
    }

    const animateScroll = function() {
      currentTime += increment
      let val = easeInOutCubic(currentTime, start, change, duration)
      element.scrollTop = val
      if (currentTime < duration) {
        setTimeout(animateScroll, increment)
      }
    }
    animateScroll()
  }

  componentDidUpdate() {
    const { layers } = this.props
    const focussed = layers.filter(layer => layer.isFocused)[0]
    if (focussed) {
      const topPosition = document.querySelector(`.layer-list-item[data-itemid="${focussed.id}"]`)
        .offsetTop
      this.scrollTo(document.querySelector('.layer-list'), topPosition, 400)
    }
  }

  render() {
    const { layers } = this.props
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId='droppable'>
          {(provided, snapshot) => (
            <div style={{ position: 'relative', zIndex: 201 }}>
              <LayerActions layer={layers.filter(layer => layer.isFocused)[0]} />
              <div className='layer-list' {...provided.droppableProps} ref={provided.innerRef}>
                {layers.map((layer, index) => (
                  <Draggable key={layer.id} draggableId={`draggable-${layer.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className='layer-list-item'
                        style={getItemStyle(provided.draggableProps.style)}
                        onClick={e => this.clickHandler(e, layer.id)}
                        data-itemid={layer.id}>
                        <LayerListItem
                          setSettingsStyle={this.setSettingsStyle}
                          dragHandleProps={{
                            ...provided.dragHandleProps,
                            onMouseDown: (...args) => {
                              this.handleBeforeDrag(layer.id)
                              provided.dragHandleProps.onMouseDown(...args)
                            },
                          }}
                          {...layer}
                        />
                        {layer.type === 'image' ? (
                          <ImageSettings layer={layer} />
                        ) : (
                          <TextSettings layer={layer} />
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    )
  }
}

const mapStateToProps = state => {
  const activeView = state.views.filter(view => view.isActive)[0]
  return {
    activeView,
    layers: state.layers.filter(
      layer =>
        layer.view.viewId === activeView.viewId && layer.view.currentView === activeView.currentView
    ),
  }
}

const mapDispatchToProps = dispatch => ({
  reorderStore: (ids, zIndexes) => dispatch(reorderStore(ids, zIndexes)),
  setFocus: id => dispatch(setFocus(id)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LayersList)
