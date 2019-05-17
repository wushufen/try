const vscode = require('vscode')
const jsdom = require('jsdom')

const window = new jsdom.JSDOM().window
const document = window.document

let self = {
  async getText() {
    return vscode.window.activeTextEditor.document.getText()
  },
  writeText(text) {
    console.log(text)
    vscode.window.activeTextEditor.insertSnippet(new vscode.SnippetString(text))
  },
  registerCommand() {
    vscode.commands.registerCommand('autoStyle', async () => {
      let text = await this.getText()
      text = text.replace(/<template/ig, '<div').replace(/<\/template>/ig, '<div>')
      document.write(text)

      let css = ''
      let indent = 0
      function loop(node){
        let childNodes = node.childNodes
        let className = node.className || ''
        let classList = className.split(/\s+/)
        let classStr = '.' + classList.join('.')

        if(className){
          css += !css? '': '\n'
          indent += 1
          css += Array(indent).join('  ')
          css += classStr + ' {'
        }

        childNodes.forEach(node=>loop(node))

        if (className) {
          css += '\n'
          css += Array(indent).join('  ')
          css += '}'
          indent -= 1
        }
      }
      loop(document.documentElement)

      this.writeText(css)
    })
  },
  activate(context) {
    this.registerCommand()
  },
  deactivate() {
    console.log('deactivate')
  },
}


module.exports = {
  activate: self.activate.bind(self),
  deactivate: self.deactivate.bind(self),
}
