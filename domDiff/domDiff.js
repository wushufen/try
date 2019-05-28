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
    if (!arrayLike) return
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

  function assign(obj) {
    forEach(arguments, function (arg, i) {
      i > 0 && each(arg, function (value, key) {
        obj[key] = value
      })
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
    parse.el = parse.el || document.createElemnt('div')
    parse.el.innerHTML = html
    var node = parse.el.children[0]
    parse.el.removeChild(node) // ie
    return node
  }

  function getVnode(node) {
    var vnode = {
      nodeType: node.nodeType,
      tagName: node.tagName,
      tag: node.tagName.toLowerCase(),
      ns: node.namespaceURI,
      attrs: {},
      props: {},
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
        var name = m[2]
        if (m[1] === ':') name = 'bind'
        if (m[1] === '@') name = 'on'
        var arg = m[3]
        var mdfs = m[4]

        // "@#:value" => value 将会在code中解开双引号
        var dir = {
          raw: attr,
          expression: value,
          value: '@#:' + value,
          name: name,
          arg: arg,
          mdfs: mdfs
        }

        if (name === 'on') {
          if (value.match(/[=();]/)) {
            dir.value = '@#:function(){' + value + '}'
          } else {
            dir.value = '@#:function(){' + value + '.apply(__vm,arguments)}'
          }
        }
        if (name === 'model') {
          dir.setModel = '@#:function(value){' + value + '=value; __vm.$render()}'
        }
        if (name === 'for') {
          // (item, i) in list
          m = value.match(/(?:\(([^,]+),(\S+?)\)|(\S+))\s+(?:in|of)\s+(\S+)/)
          dir.item = m[1] || m[3]
          dir.index = m[2] || '$index'
          dir.list = m[4]
        }

        if (/^(for|if)$/.test(name)) {
          vnode.directives[name] = dir
        } else if (name === 'bind') {
          vnode.props[arg] = '@#:' + value
        } else {
          vnode.directives.push(dir)
        }
      } else {
        vnode.attrs[attr] = value
      }
    })
    return vnode
  }

  function createVnode(vnode, children) {
    vnode = assign({
      tagName: vnode.tagName,
      attrs: {},
      props: {},
      directives: [],
      children: []
      // parentNode: null,
    }, vnode)

    // ['child', [for...]] => ['child', ...]
    // 'text' => {nodeType:3, nodeValue:'text'}
    forEach(children, function (child) {
      if (child instanceof Array) {
        forEach(child, function (child) {
          if (typeof child !== 'object') {
            child = { nodeType: 3, nodeValue: String(child) }
          }
          vnode.children.push(child)
          // child.parentNode = vnode
        })
      } else {
        if (typeof child !== 'object') {
          child = { nodeType: 3, nodeValue: String(child) }
        }
        vnode.children.push(child)
        // child.parentNode = vnode
      }
    })

    return vnode
  }

  function createNode(vnode) {
    if (vnode.nodeType === 3) {
      return document.createTextNode(vnode.nodeValue)
    }

    // createElemnt namespaceURI
    var tag = vnode.tagName.toLowerCase()
    var node = vnode.ns && document.createElementNS
      ? document.createElementNS(vnode.ns, tag)
      : document.createElemnt(tag)

    // attrs
    each(vnode.attrs, function (value, name) {
      node.setAttribute(name, value)
    })

    // directives.bind
    each(vnode.directives, function (directive) {
      var name = directive.name
      var bind = VM.options.directives[name].bind
      bind(node, directive, vnode)
    })

    // props
    each(vnode.props, function (value, name) {
      node[name] = value
    })

    // children
    forEach(vnode.children, function (vchild) {
      var child = createNode(vchild)
      node.appendChild(child)
    })

    node.vnode = vnode // dev
    return node
  }

  function diff(node, vnode, parentNode) {
    parentNode = parentNode || node.parentNode
    var newNode
    // +
    if (!node && vnode) {
      newNode = createNode(vnode)
      parentNode.appendChild(newNode)
    }
    // -
    else if (node && !vnode) {
      parentNode.removeChild(node)
    }
    // +-
    else if (node.nodeType !== vnode.nodeType || node.tagName !== vnode.tagName) {
      newNode = createNode(vnode)
      parentNode.replaceChild(newNode, node)
    }
    // *text
    else if (node.nodeType === 3 && node.nodeValue !== vnode.nodeValue) {
      node.nodeValue = vnode.nodeValue
    }
    // *node
    else if (node.tagName && vnode.tagName) {
      // directives.update
      each(vnode.directives, function (directive) {
        var name = directive.name
        var update = VM.options.directives[name].update
        update(node, directive, vnode)
      })
      // *props
      if (node.tagName && vnode.tag) {
        each(vnode.props, function (value, name) {
          if (name === 'style') {
            assign(node.style, value)
            return
          }
          if (name === 'class') {
            each(value, function (bool, key) {
              var className = node.className.replace(RegExp('(?:^|\\s+)' + key, 'g'), '')
              if (bool) {
                node.className = className ? className + ' ' + key : key
              } else {
                node.className = className
              }
            })
            return
          }
          var oldValue = node[name]
          if (value !== oldValue) {
            node[name] = value
            if (oldValue && typeof oldValue === 'object') {
              node.setAttribute(name, value)
            }
          }
        })
      }
      // childNodes
      var children = toArray(node.childNodes)
      var newChildren = vnode.children
      var maxLength = Math.max(children.length, newChildren.length)
      for (var i = 0; i < maxLength; i++) {
        diff(children[i], newChildren[i], node)
      }
    }
  }

  var __createVnode = createVnode
  var __each = each
  function compile(node) {
    /*
    createVnode({tag:'div'}, [
      'textNode',
      createVnode({tag:'ul'}, [
        forEach(list, function(item, index){
          return createVnode({tag:'li'}, [loop, childNodes])
        })
      ]),
      bool? createVnode({tag:'span'}, [loop, childNodes]) : ''
    ])
    */
    var code = ''
    loop(node)
    function loop(node) {
      if (!code.match(/^$|\[\s*$/)) code += ',\n' // [childNode, ..]

      if (node.nodeType === 1) {
        var vnode = getVnode(node)
        var vnodeJson = toJson(vnode)
        var dirs = vnode.directives
        vnodeJson = vnodeJson.replace(/"@#:((?:\\.|.)*?)"/g, '$1') // rutime value

        // for if?
        // forEach(,()=> bool? createVnode(,,[..loop..]): "" )
        if (dirs['for']) {
          var dir = dirs['for']
          code += 'this.__each(' + dir.list + ',function(' + dir.item + ',' + dir.index + '){return '
        }
        // if
        // bool? createVnode(,,[..loop..]): ""
        if (dirs['if']) {
          code += dirs['if'].expression + '? '
        }

        // createVnode
        code += 'this.__createVnode(' + vnodeJson + ', [\n'

        // childNodes
        forEach(toArray(node.childNodes), function (childNode) {
          loop(childNode)
        })

        // end createVnode
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

    // data
    var data = options.data
    if (typeof data === 'function') data = data.call(vm)
    assign(vm, data)

    // methods
    each(options.methods, function (fn, key) {
      vm[key] = injectRender(vm, fn)
    })

    // el || template
    vm.$el = options.el || parse(options.template)

    // render
    var code = compile(vm.$el)
    var render = new Function('var __vm=this;with(__vm){return ' + code + '}')
    var timer
    vm.$el.innerHTML = ''
    vm.$render = function () {
      // update computed
      each(options.computed, function (fn, key) {
        vm[key] = fn.call(vm)
      })

      // update view
      cancelAnimationFrame(timer)
      timer = requestAnimationFrame(function () {
        var newVnode = render.call(vm)
        diff(vm.$el, newVnode)
        vm.__newVnode = newVnode
      })
    }
    vm.$render.render = render

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
    if (typeof Proxy === 'function') {
      return new Proxy(vm, {
        set: function (vm, key, val) {
          vm[key] = val
          vm.$render()
        },
        get: function (vm, key) {
          var val = vm[key]
          vm.$render()
          return val
        }
      })
    }
  }

  VM.prototype = {
    constructor: VM,
    __createVnode: createVnode,
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

  // :xxx VM.directive('bind') => vnode.props

  VM.directive('on', function (el, binding) {
    el['on' + binding.arg] = function (e) {
      binding.value(e)
    }
  })

  VM.directive('model', function (el, binding, vnode) {
    vnode.props.value = binding.value
    el.onkeyupxx = el.oninput = function () {
      binding.setModel(el.value)
    }
  })

  VM.compoment = function (name, definition) {

  }

}
