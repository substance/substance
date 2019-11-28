/**
  Get the value of a querystring parameter
  @param  {String} param The field to get the value of
  @param  {String} url   The URL to get the value from (optional)
  @return {String}       The param value
 */
export default function getQueryStringParam (param, url) {
  if (typeof window === 'undefined') return null
  const href = url || window.location.href
  const reg = new RegExp('[?&]' + param + '=([^&#]*)', 'i')
  const string = reg.exec(href)
  return string ? decodeURIComponent(string[1]) : null
}
