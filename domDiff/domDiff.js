// 从零实现mvvm框架，重写一个轻量的vue并兼容ie6

{
  if (!window.requestAnimationFrame) {
    var requestAnimationFrame = function (fn) {
      setTimeout(fn, 0)
    }
    var cancelAnimationFrame = function (timer) {
      clearTimeout(timer)
    }
  }

  function forEach(arrayLike, fn) {
    for (var i = 0; i < arrayLike.length; i++) {
      fn.call(this, arrayLike[i], i)
    }
  }

  function each(list, fn) {
    var array = [], i = 0, rs
    if (list instanceof Array || typeof list === 'string') {
      while (i < list.length) {
        rs = fn.call(this, list[i], i, i++)
        array.push(rs)
      }
    } else if (typeof list === 'number') {
      while (i++ < list) {
        rs = fn.call(this, i, i, i)
        array.push(rs)
      }
    } else {
      for (var key in list) {
        if (list.hasOwnProperty(key)) {
          rs = fn.call(this, list[key], key, i++)
          array.push(rs)
        }
      }
    }
    return array
  }

  function assign(obj, obj2) {
    each(obj2, function (value, key) {
      obj[key] = value
    })
    return obj
  }

  function toArray(arrayLike) {
    var array = [], i = arrayLike.length
    while (i--) array[i] = arrayLike[i]
    return array
  }

  function toJson(val) {
    if (typeof val === 'string') {
      return '"' + val + '"'
    }
    if (/number|boolean/.test(typeof val) || val === null) {
      return String(val)
    }
    if (val instanceof Array) {
      var arr = []
      forEach(val, function (item) {
        arr.push(toJson(item))
      })
      return '[' + arr.join(',\n') + ']'
    }
    if (typeof val === 'object') {
      var items = []
      each(val, function (item, key) {
        items.push('"' + key + '": ' + toJson(item))
      })
      return '{' + items.join(',\n') + '}'
    }
  }

  function parse(html) {
    parse.el = parse.el || document.createElement('div')
    parse.el.innerHTML = html
    return parse.el.children[0]
  }

  function getNodeData(node) {
    var data = {
      ns: node.namespaceURI,
      attrs: {},
      directives: []
    }
    var attributes = toArray(node.attributes)
    forEach(attributes, function (attribute) {
      if (!attribute.specified) return // ie
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

        if (name === 'on') {
          if (value.match(/[=();]/)) {
            dir.value = 'function(){' + value + '}'
          } else {
            dir.value = 'function(){' + value + '.apply(__vm,arguments)}'
          }
        }
        if (name === 'model') {
          dir.setModel = 'function(value){' + value + '=value; __vm.$render()}'
        }
        if (name === 'for') {
          // (item, i)|item    in|of    list
          m = value.match(/(?:\(([^,]+),(\S+?)\)|(\S+))\s+(?:in|of)\s+(\S+)/)
          dir.item = m[1] || m[3]
          dir.index = m[2] || '$index'
          dir.list = m[4]
        }

        if (/^(for|if)$/.test(name)) {
          data.directives[name] = dir
        } else {
          data.directives.push(dir)
        }
      } else {
        data.attrs[attr] = value
      }
    })
    return data
  }

  function createElement(tag, data, childNodes) {
    tag = tag.toLowerCase()
    data = data || {}
    if (data instanceof Array) {
      childNodes = data
      data = {}
    }

    // namespaceURI
    var node = data.ns && document.createElementNS
      ? document.createElementNS(data.ns, tag)
      : document.createElement(tag)

    // attrs
    if (data.attrs) {
      for (var attr in data.attrs) {
        node.setAttribute(attr, data.attrs[attr])
      }
    }

    // directives
    if (data.directives) {
      forEach(data.directives, function (directive) {
        var name = directive.name
        var fn = VM.options.directives[name].bind
        fn(node, directive)
      })
    }

    // childNodes
    if (childNodes) {
      forEach(childNodes, function (childNode) {
        if (childNode instanceof Array) {
          forEach(childNode, function (childNode) {
            if (typeof childNode !== 'object') {
              childNode = document.createTextNode(String(childNode))
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

  var __createElement = createElement
  var __each = each
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
        var nodeData = getNodeData(node)
        var nodeDataJson = toJson(nodeData)
        var dirs = nodeData.directives

        nodeDataJson = nodeDataJson.replace(/"value":\s*"((?:\\.|.)*?)"/g, 'value: $1')
        nodeDataJson = nodeDataJson.replace(/"setModel":\s*"((?:\\.|.)*?)"/g, 'setModel: $1')


        // for if?
        // forEach(,()=> bool? createElement(,,[..loop..]): "" )
        if (dirs['for']) {
          var dir = dirs['for']
          code += 'this.__each(' + dir.list + ',function(' + dir.item + ',' + dir.index + '){return '
        }
        // if
        // bool? createElement(,,[..loop..]): ""
        if (dirs['if']) {
          code += dirs['if'].value + '? '
        }

        // createElement
        code += 'this.__createElement("' + node.tagName + '", ' + nodeDataJson + ', [\n'

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
      if (dom.nodeValue !== newDom.nodeValue) {
        dom.nodeValue = newDom.nodeValue
      }
      return
    }
    // *attr
    var attributes = toArray(newDom.attributes)//.concat(toArray(dom.attributes))
    forEach(attributes, function (attribute) {
      if (!attribute.specified) return // ie
      var attr = attribute.nodeName
      var value = dom.getAttribute(attr)
      var newValue = newDom.getAttribute(attr)
      if (value !== null && newValue === null) {
        dom.removeAttribute(attr)
      } else if (value !== newValue) {
        dom.setAttribute(attr, newValue)
        if(attr === 'class'){ // ie
          dom.className = newValue
        }
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
      var restore = injectRenderToAsyncs(vm)
      fn.apply(this, arguments)
      restore()

      vm.$render()
    }
    return $fn
  }

  function injectRenderToAsyncs(vm) {
    var setTimeout = window.setTimeout
    window.setTimeout = function () {
      var fn = arguments[0]
      arguments[0] = injectRender(vm, fn)
      setTimeout.apply(this, arguments)
    }

    var setInterval = window.setInterval
    window.setInterval = function () {
      var fn = arguments[0]
      arguments[0] = injectRender(vm, fn)
      setInterval.apply(this, arguments)
    }

    var XMLHttpRequest = window.XMLHttpRequest || window.ActiveXObject
    var XHRprototype = XMLHttpRequest.prototype
    var send = XHRprototype.send
    XHRprototype.send = function () {
      var xhr = this
      each(xhr, function (handler, name) {
        if (name.match(/^on/) && typeof handler === 'function') {
          xhr[name] = injectRender(vm, handler)
        }
      })
      return send && send.apply(xhr, arguments)
    }

    return function () {
      window.setTimeout = setTimeout
      window.setInterval = setInterval
      XHRprototype.send = send
    }
  }

  function VM(options) {
    var vm = this
    vm.$options = options || (options = {})

    // el || template
    vm.$el = options.el || parse(options.template)

    // render
    var code = compile(vm.$el)
    var render = new Function('var __vm=this;with(__vm){return ' + code + '}')
    var timer
    vm.$render = function () {
      // update computed
      each(options.computed, function (fn, key) {
        vm[key] = fn.call(vm)
      })

      // update view
      cancelAnimationFrame(timer)
      timer = requestAnimationFrame(function () {
        var newDom = render.call(vm)
        diff(vm.$el, newDom)
      })
    }
    vm.$render.render = render
    vm.$el.innerHTML = ''

    // data
    var data = options.data
    if (typeof data === 'function') data = data.call(vm)
    assign(vm, data)

    // methods
    each(options.methods, function (fn, key) {
      vm[key] = injectRender(vm, fn)
    })

    // computed

    // watch

    // created

    // mounted
    if (options.mounted) {
      vm.mounted = injectRender(vm, options.mounted)
      setTimeout(function () {
        vm.mounted()
      }, 0)
    }

    vm.$render()

    // proxy
    // if (typeof Proxy === 'function') {
    //   return new Proxy(vm, {
    //     set: function (vm, key, val) {
    //       vm[key] = val
    //       vm.$render()
    //     },
    //     get: function (vm, key) {
    //       var val = vm[key]
    //       vm.$render()
    //       return val
    //     }
    //   })
    // }
  }

  VM.prototype = {
    constructor: VM,
    __createElement: createElement,
    __each: each
  }

  VM.options = {
    directives: {}
  }

  VM.directive = function (name, definition) {
    if (typeof definition === 'function') {
      definition = {
        bind: definition,
        update: definition
      }
    }
    VM.options.directives[name] = definition
  }

  // props
  VM.directive('bind', function (el, binding) {
    var arg = binding.arg, value = binding.value
    if (arg === 'class') {
      each(value, function (bool, key) {
        if (bool) {
          el.className += el.className ? ' ' + key : key
        } else {
          el.className = el.className.replace(RegExp('^|\\s+'+key, 'g'), '')
        }
      })
      return
    }
    if (arg === 'style') {
      assign(el.style, value)
      return
    }
    el.setAttribute(arg, String(value))
    // el[binding.arg] = binding.value  // todo: bind is props, not attribute
  })

  VM.directive('on', function (el, binding) {
    el['on' + binding.arg] = function (e) {
      binding.value(e)
    }
  })

  VM.directive('model', function (el, binding) {
    el.value = binding.value
    el.onkeydownx = el.onkeyup = el.oninput = function () {
      binding.setModel(el.value)
    }
  })

  VM.compoment = function (name, definition) {

  }

}
