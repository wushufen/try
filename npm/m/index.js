var wutpl = require('wutpl')
var render = wutpl(`
{{for list item index}}
 - {{index}}: {{item}}
{{/for}}
`)
var html = render({
  list: [1,2,3]
})

console.log(html)