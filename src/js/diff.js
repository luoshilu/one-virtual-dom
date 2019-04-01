import { type } from "./patch"
import listDiff from './listdiff'
let _ = {
  isString(obj) {
    return typeof obj === 'string'
  },
  toArray (listLike) {
    if (!listLike) {
      return []
    }
    var list = []
    for (var i = 0, len = listLike.length; i < len; i++) {
      list.push(listLike[i])
    }
    return list
  }
}

function diff(oldtree, newtree) {
  let index = 0
  let patches = {}
  dfsWalk(oldtree, newtree, index, patches)
  return patches
}

function dfsWalk(oldNode, newNode, index, patches) {
  let currentPatch = [] // 记录节点的改变

  // 空节点(被移除)
  if(newNode === null) {

  } 
  // 是否为文本节点
  else if(_.isString(newNode) && _.isString(oldNode)){
    if(oldNode !== newNode) {
      currentPatch.push({type: type.TEXT, content: newNode})
    }
  }
  // 节点对象是否相同
  else if(
    oldNode.tagName === newNode.tagName &&
    oldNode.key === newNode.key
  ){
    // 检查属性
    let propsPatches = diffProps(oldNode, newNode)
    if(propsPatches) {
      currentPatch.push({type: type.PROPS, props: propsPatches })
    }
    // 检查子节点
    diffChildren(
      oldNode.children,
      newNode.children,
      index,
      patches,
      currentPatch
    )
  } else {
    // 替换
    currentPatch.push({ type: type.REPLACE, node: newNode })
  }

  // 保存 patch
  if (currentPatch.length) {
    patches[index] = currentPatch
  }
}

function diffChildren (oldChildren, newChildren, index, patches, currentPatch) {
  let diffs = listDiff(oldChildren, newChildren, 'key')
  newChildren = diffs.children
  if (diffs.moves.length) {
    let reorderPatch = { type: type.REORDER, moves: diffs.moves }
    currentPatch.push(reorderPatch)
  }

  let leftNode = null
  let currentNodeIndex = index

  oldChildren.forEach((child, i) => {
    let newChild = newChildren[i]
    currentNodeIndex = (leftNode && leftNode.count)
      ? currentNodeIndex + leftNode.count + 1
      : currentNodeIndex + 1
    dfsWalk(child, newChild, currentNodeIndex, patches)
    leftNode = child
  })
}

function diffProps(oldNode, newNode){
  let count = 0
  let oldProps = oldNode.props
  let newProps = newNode.props

  let key, value
  let propsPatches = {}

  // Find out different properties
  for (key in oldProps) {
    value = oldProps[key]
    if (newProps[key] !== value) {
      count++
      propsPatches[key] = newProps[key]
    }
  }

  // Find out new property
  for (key in newProps) {
    value = newProps[key]
    if (!oldProps.hasOwnProperty(key)) {
      count++
      propsPatches[key] = newProps[key]
    }
  }

  // If properties all are identical
  if (count === 0) {
    return null
  }

  return propsPatches
}

export default diff