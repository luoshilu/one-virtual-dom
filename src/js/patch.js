let type = {
  REPLACE : 0,
  REORDER : 1,
  PROPS : 2,
  TEXT : 3
}

let patch = function (node, patches) {
  let walker = {index: 0}
  dfsWalk(node, walker, patches)
}
function dfsWalk(node, walker, patches){
  let currentPatchs = patches[walker.index]  // 当前节点的补丁
  // 遍历子节点
  let len = node.childNodes ? node.childNodes.length : 0
  for(let i = 0; i < len; i++) {
    let child = node.childNodes[i]
    walker.index++
    dfsWalk(child, walker, patches)
  }
  if(currentPatchs) {
    // 应用patch
    applyPatches(node, currentPatchs)
  }
}
function applyPatches(node, patches) {
  // 应用 patches 列表
  patches.forEach((patch) => {
    // 根据不同 type 做不同操作
    switch (patch.type) {
      case type.REPLACE:
        let newNode = (typeof patch.node === 'string')?
                        document.createTextNode(patch.node) :
                        patch.node.render()
        // 替换当前元素
        node.parentNode.replaceChild(newNode, node)
        break
      case type.REORDER:
        reorderChildren(node, patch.moves)
        break
      case type.PROPS:
        setProps(node, patch.props)
        break
      case type.TEXT: 
        if(node.textContent) {
          node.textContent = patch.content
        } else {
          node.nodeValue = patch.content // ie
        }
        break
      default:
      throw new Error('Unknown patch type ' + patch.type)
    }
  })
}

function reorderChildren(node, moves) {
  let oldNodeList = Array.prototype.map.call(node.childNodes, e => e)
  let map = {}

  oldNodeList.forEach((node) => {
    let key = node.getAttribute('key')
    map[key] = node // 将 key 与节点一一对应
  })
  
  moves.forEach((move) => {
    let _index = move.index
    // move 类型
    if(move.type === 0) {
      // remove
      if(oldNodeList[_index] === node.childNodes[_index]){ // 要判定节点是否相等 (若之前发生 insert 操作，那么两节点则不同)
        node.removeChild(oldNodeList[_index])
      }
      oldNodeList.splice(_index, 1)
    } else if (move.type === 1) {
      // 插入的节点(oldNode or newNode)
      let insertNode = map[move.item.key] ?
                       map[move.item.key].clone(true) :
                       (typeof move.item === 'object') ?
                              move.item.render() :
                              document.createTextNode(move.item)
      // insert
      node.insertBefore(insertNode, node.childNodes[_index] || null)
    }
  })
}

function setProps(node, props) {
  for (var key in props) {
    if (props[key] === void 666) {
      node.removeAttribute(key)
    } else {
      var value = props[key]
      node.setAttribute(key, value)
    }
  }
}

export {patch, type}

