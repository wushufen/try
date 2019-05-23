function diff(dom, vnode, parent) {
  // +dom
  if (!dom) {
    parent.appendChild(createElement(vnode))
    return
  }
  // -dom
  if (!vnode) {
    dom.parentNode.removeChild(dom)
    return
  }
  // ^type
  if (dom.nodeType !== vnode.nodeType) {
    dom.parentNode.removeChild(dom)
    parent.appendChild(createElement(vnode))
  }
  // ^attr

  // ^children

}

function createElement(vnode) {

}