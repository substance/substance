function isBoolean(val) {
  return (val === true || val === false || (val && val.constructor === Boolean) )
}

export default isBoolean