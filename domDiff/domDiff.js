function diff(dom, newDom, parentNode) {
  parentNode = parentNode || dom.parentNode

  // +dom
  if (!dom) {
    parentNode.appendChild(newDom)
    return
  }
  // -dom
  if (!newDom) {
    parentNode.removeChild(dom)
    return
  }
  // *nodeType
  if (dom.nodeType !== newDom.nodeType) {
    parentNode.replaceChild(newDom, dom)
    return
  }
  // *tagName
  if (dom.nodeType == 1) {
    if (dom.tagName !== newDom.tagName) {
      parentNode.replaceChild(newDom, dom)
      return
    }
  }
  // *text
  if (dom.nodeType == 3) {
    if (dom.textContent !== newDom.textContent) {
      dom.textContent = newDom.textContent
    }
    return
  }
  // *attr
  var attributes = [].slice.call(dom.attributes)
    .concat([].slice.call(newDom.attributes))
  for(var i = 0; i < attributes.length; i++){
    var attr = attributes[i]
    if (!attr.specified) continue // ie
    var attrName = attr.nodeName
    var attrValue = dom.getAttribute(attrName)
    var newAttrValue = newDom.getAttribute(attrName)
    if (newAttrValue === null) {
      dom.removeAttribute(attrName)
    } else if (attrValue !== newAttrValue) {
      dom.setAttribute(attrName, newAttrValue)
    }
  }

  // *children
  var childNodes = [].slice.call(dom.childNodes)
  var newChildNodes = [].slice.call(newDom.childNodes)
  var maxLength = Math.max(childNodes.length, newChildNodes.length)
  for(var i = 0; i< maxLength; i++){
    diff(childNodes[i], newChildNodes[i], dom)
  }
}


function parse(html){
  parse.el = parse.el || document.createElement('div')
  parse.el.innerHTML = html
  return parse.el.children[0]
}


function compile(html) {
  var dom = parse(html)
}