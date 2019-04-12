import Vue from 'vue'
import App from './app.vue'

import './style.css'
import './less.less'

new Vue({
  el: '#app',
  render(h) {
    return h(App)
  }
})


class C { }
console.trace(C)