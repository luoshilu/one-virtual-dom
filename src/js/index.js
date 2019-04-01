import t from './tree'

import Diff from './diff'
import { patch } from './patch'

let data = {
  class: 'container',
  style: {
    color: 'red',
    border: '1px solid #000'
  },
  list: ['1', '2', '3']
}

let tree

function getTree(data) {
  return (
      t('div', {class: data.class}, [
        t('ul', {style:`color:${data.style.color};border:${data.style.border}`}, 
          data.list.map((text, i) => t('li', {key: i} ,[text]))
        )
    ])
  )
}
tree = getTree(data)
let vNode = tree.render()
document.body.appendChild(vNode)

function changeTree(data) {
  data.style.color = 'blue'
  // data.list.push('4')
  // data.list.shift()
  data.list.splice(1, 0, '4')
  return data
}

setTimeout(function(){
  data = changeTree(data)
  let newTree = getTree(data)
  let patchs = Diff(tree, newTree)
  patch(vNode, patchs)
  tree = newTree
  
}, 1000)