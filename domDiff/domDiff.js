{
  function toArray(arrayLike) {
    var array = [], i = arrayLike.length
    while (i--) {
      array[i] = arrayLike[i]
    }
    return array
  }

  function toJson(obj) {
    return JSON.stringify(obj, null, '  ')
  }

  function extend(obj, obj2) {
    return Object.assign(obj, obj2)
  }

  function forEach(arrayLike, fn) {
    var array = []
    for (var i = 0; i < arrayLike.length; i++) {
      var value = fn.call(this, arrayLike[i], i)
      array.push(value)
    }
    return array
  }

  function each(list, fn) {
    var array = []
    if (list instanceof Array) {
      for (var i = 0; i < list.length; i++) {
        var rs = fn.call(this, list[i], i, i)
        array.push(rs)
      }
    } else {
      var i2 = 0
      for (var key in list) {
        if (list.hasOwnProperty(key)) {
          var rs2 = fn.call(this, list[key], key, i2++)
          array.push(rs2)
        }
      }
    }
    return array
  }

  function parse(html) {
    parse.el = parse.el || document.createElement('div')
    parse.el.innerHTML = html
    return parse.el.children[0]
  }

  function getDirs(node) {
    var dirs = []
    var attributes = toArray(node.attributes)
    forEach(attributes, function (attribute) {
      var attr = attribute.nodeName
      var value = attribute.nodeValue
      // v-bind:title  :title  v-on:click  @click.prevent.stop
      var m = attr.match(/^(:|@|v-([^.]*))([^.]*)(.*)/)
      if (m) {
        node.removeAttribute(attr)
        var name = m[2]
        if (m[1] === ':') name = 'bind'
        if (m[1] === '@') name = 'on'
        var arg = m[3]
        var mdfs = m[4]

        var dir = {
          attr: attr,
          value: value,
          name: name,
          arg: arg,
          mdfs: mdfs
        }
        if (/^(pre|for|if|else-if|else|model|is)$/.test(name)) {
          dirs[name] = dir
        } else {
          dirs.push(dir)
        }

        if (name === 'for') {
          m = value.match(/(?:\(([^,]+),(\S+?)\)|(\S+))\s+in\s+(\S+)/)
          dir.item = m[1] || m[3]
          dir.index = m[2] || '$index'
          dir.list = m[4]
        }
      }
    })
    return dirs
  }

  function getAttrsJson(node) {
    var lines = []
    forEach(node.attributes, function (attribute) {
      var nodeName = attribute.nodeName
      var nodeValue = attribute.nodeValue
      lines.push('"' + nodeName + '": "' + nodeValue + '"')
    })
    return '{' + lines.join(',\n') + '}'
  }

  function createElement(tag, options, childNodes) {
    options = options || {}
    var node = document.createElement(tag)

    if (options instanceof Array) {
      childNodes = options
      options = {}
    }

    if (options.attrs) {
      for (var attr in options) {
        node.setAttribute(attr, options[attr])
      }
    }

    if (childNodes) {
      forEach(childNodes, function (childNode) {
        if (childNode instanceof Array) {
          forEach(childNode, function (childNode) {
            if (typeof childNode === 'string') {
              childNode = document.createTextNode(childNode)
            }
            node.appendChild(childNode)
          })
        } else {
          if (typeof childNode !== 'object') {
            childNode = document.createTextNode(String(childNode))
          }
          node.appendChild(childNode)
        }
      })
    }
    return node
  }

  function compile(node) {
    /*
    createElement('div', {}, [
      'textNode',
      createElement('ul', {}, [
        forEach(list, function(item, index){
          return createElement('li', {}, [loop, childNodes])
        })
      ]),
      bool? createElement('span', {}, [loop, childNodes]) : ''
    ])
    */
    var code = ''
    loop(node)
    function loop(node) {
      if (!code.match(/^$|\[\s*$/)) code += ',\n' // [childNode, ..]

      if (node.nodeType === 1) {
        var dirs = getDirs(node)
        // for if?
        // forEach(,()=> bool? createElement(,,[..loop..]): "" )
        if (dirs['for']) {
          var dir = dirs['for']
          code += 'this.forEach(' + dir.list + ',function(' + dir.item + ',' + dir.index + '){return '
        }
        // if
        // bool? createElement(,,[..loop..]): ""
        if (dirs['if']) {
          code += dirs['if'].value + '? '
        }
        // createElement
        var attrsJson = getAttrsJson(node)
        code += 'this.createElement("' + node.tagName + '", ' + attrsJson + ', [\n'

        // childNodes
        forEach(toArray(node.childNodes), function (childNode) {
          loop(childNode)
        })

        // end createElement
        code += '])\n'
        // end if
        if (dirs['if']) code += ': ""\n' //: ""
        // end for
        if (dirs['for']) code += '})\n'
      } else if (node.nodeType === 3) {
        var nodeValue = node.nodeValue.replace(/\s+/g, ' ')
        nodeValue = nodeValue.replace(/\{\{/g, '"+')
        nodeValue = nodeValue.replace(/\}\}/g, '+"')
        code += '"' + nodeValue + '"'
      } else {
        code += '""'
      }
    }

    return code
  }

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
    if (dom.nodeType === 1) {
      if (dom.tagName !== newDom.tagName) {
        parentNode.replaceChild(newDom, dom)
        return
      }
    }
    // *text
    if (dom.nodeType === 3) {
      if (dom.textContent !== newDom.textContent) {
        dom.textContent = newDom.textContent
      }
      return
    }
    // *attr
    var attributes = toArray(dom.attributes).concat(toArray(newDom.attributes))
    forEach(attributes, function (attribute) {
      var attr = attribute.nodeName
      var value = dom.getAttribute(attr)
      var newValue = newDom.getAttribute(attr)
      if (value !== null && newValue === null) {
        dom.removeAttribute(attr)
      } else if (value !== newValue) {
        dom.setAttribute(attr, newValue)
      }
    })
    // *children
    var childNodes = toArray(dom.childNodes)
    var newChildNodes = toArray(newDom.childNodes)
    var maxLength = Math.max(childNodes.length, newChildNodes.length)
    for (var i = 0; i < maxLength; i++) {
      diff(childNodes[i], newChildNodes[i], dom)
    }
  }

  function injectRender(vm, fn) {
    var $fn = function () {
      fn.apply(vm, arguments)
      vm.$render()
    }
    return $fn
  }

  function VM(options) {
    var vm = this
    vm.$options = options || (options = {})
    vm.$el = options.el || parse(options.template)

    // render
    var render = new Function('with(this){return ' + compile(vm.$el) + '}')
    vm.$render = function () {
      var newDom = render.call(vm)
      diff(vm.$el, newDom)
    }
    vm.$render.render = render

    // data
    extend(vm, options.data)

    // methods
    each(options.methods, function (fn, key) {
      console.log(key, fn)
      vm[key] = injectRender(vm, fn)
    })


  }
  VM.prototype = {
    createElement: createElement,
    forEach: forEach
  }
}
