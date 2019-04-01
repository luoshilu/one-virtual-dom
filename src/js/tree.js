
/**
 * Tree 类，元素节点生成 dom-tree
 */
class Tree {
  constructor(tagName, props, children){
    this.tagName = tagName,
    this.props = props || {}
    this.children = children || []
    this.count = 0 // 子节点数量
    this.key = props ? props.key : void 999

    if(Array.isArray(this.props)) {
      this.children = this.props
      this.props = {}
    }
    this.each(this.children)
  }
  // each child
  each(children) {
    children.forEach((child, i) => {
      if (child instanceof Tree) {
        this.count += child.count
      } else {
        children[i] = '' + child
      }
      this.count++
    })
  }
  setAttr(node, key, value) {
    switch (key) {
      case 'style':
        node.style.cssText = value
        break
      case 'value':
        let tagName = node.tagName || ''
        tagName = tagName.toLowerCase()
        if (
          tagName === 'input' || tagName === 'textarea'
        ) {
          node.value = value
        } else {
          // if it is not a input or textarea, use `setAttribute` to set
          node.setAttribute(key, value)
        }
        break
      default:
        node.setAttribute(key, value)
        break
    }
  }
  // 生成 virtual-dom
  render() {
    let ele = document.createElement(this.tagName)
    for( let key in this.props) {
      this.setAttr(ele, key, this.props[key])
    }
    let children = this.children.map((child) => {
      if (child instanceof Tree) {
        ele.appendChild(this.render.call(child))
      } else {
        ele.appendChild(document.createTextNode(child))
      }
    })
    return ele
  }
}

function t() {
  return new Tree(...arguments)
}

export default t