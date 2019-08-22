import React, { useState, useRef, useEffect } from 'react'
import { setTextSize } from '../../actions'
import { connect } from 'react-redux'

function TextSize(props) {
  const [value, setValue] = useState(props.fontSize)
  const { layerId, setTextSize, getNewCoords, coords, rotateAngle } = props
  const input = useRef(null)

  useEffect(() => {
    input.current.value = props.fontSize
  }, [props.fontSize])

  const deselectAll = () => {
    if (document.selection) {
      document.selection.empty()
    } else if (window.getSelection) {
      window.getSelection().removeAllRanges()
    }
  }

  const handleChange = () => {
    let newCoords = {}
    newCoords = getNewCoords(layerId, coords, rotateAngle, input.current.value)
    setValue(input.current.value)
    setTextSize(layerId, input.current.value, newCoords)
  }
  const handleSize = e => {
    e.persist()
    deselectAll()
    let newCoords = {}
    const sign = e.target.dataset.sign
    let value = parseFloat(input.current.value)

    if (sign === '+') {
      value = ++value
      newCoords = getNewCoords(layerId, coords, rotateAngle, value)
      setValue(value)
    } else if (sign === '-') {
      value = --value
      newCoords = getNewCoords(layerId, coords, rotateAngle, value)
      setValue(value)
    }
    setTextSize(layerId, value, newCoords)
  }
  return (
    <div
      style={{
        display: 'inline-block',
        width: '50%',
        maxWidth: '50%',
      }}>
      <div>
        <span className='setting-label'>Text size</span>
      </div>
      <span
        data-sign='-'
        className='size-control size-decrease'
        onClick={handleSize}>
        -
      </span>
      <input
        type='text'
        id='text-size'
        value={value}
        ref={input}
        onChange={handleChange}
      />

      <span
        data-sign='+'
        className='size-control size-increase'
        onClick={handleSize}>
        +
      </span>
    </div>
  )
}

const mapDispatchToProps = dispatch => ({
  setTextSize: (id, value, coords) => dispatch(setTextSize(id, value, coords)),
})

export default connect(
  null,
  mapDispatchToProps
)(TextSize)