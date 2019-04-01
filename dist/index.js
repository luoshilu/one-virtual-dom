(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.demo = {})));
}(this, (function (exports) { 'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Tree 类，元素节点生成 dom-tree
 */
var Tree = function () {
  function Tree(tagName, props, children) {
    _classCallCheck(this, Tree);

    this.tagName = tagName, this.props = props || {};
    this.children = children || [];
    this.count = 0; // 子节点数量
    this.key = props ? props.key : void 999;

    if (Array.isArray(this.props)) {
      this.children = this.props;
      this.props = {};
    }
    this.each(this.children);
  }
  // each child


  _createClass(Tree, [{
    key: 'each',
    value: function each(children) {
      var _this = this;

      children.forEach(function (child, i) {
        if (child instanceof Tree) {
          _this.count += child.count;
        } else {
          children[i] = '' + child;
        }
        _this.count++;
      });
    }
  }, {
    key: 'setAttr',
    value: function setAttr(node, key, value) {
      switch (key) {
        case 'style':
          node.style.cssText = value;
          break;
        case 'value':
          var tagName = node.tagName || '';
          tagName = tagName.toLowerCase();
          if (tagName === 'input' || tagName === 'textarea') {
            node.value = value;
          } else {
            // if it is not a input or textarea, use `setAttribute` to set
            node.setAttribute(key, value);
          }
          break;
        default:
          node.setAttribute(key, value);
          break;
      }
    }
    // 生成 virtual-dom

  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var ele = document.createElement(this.tagName);
      for (var key in this.props) {
        this.setAttr(ele, key, this.props[key]);
      }
      var children = this.children.map(function (child) {
        if (child instanceof Tree) {
          ele.appendChild(_this2.render.call(child));
        } else {
          ele.appendChild(document.createTextNode(child));
        }
      });
      return ele;
    }
  }]);

  return Tree;
}();

function t() {
  return new (Function.prototype.bind.apply(Tree, [null].concat(Array.prototype.slice.call(arguments))))();
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var type = {
  REPLACE: 0,
  REORDER: 1,
  PROPS: 2,
  TEXT: 3
};

var patch = function patch(node, patches) {
  var walker = { index: 0 };
  dfsWalk$1(node, walker, patches);
};
function dfsWalk$1(node, walker, patches) {
  var currentPatchs = patches[walker.index]; // 当前节点的补丁
  // 遍历子节点
  var len = node.childNodes ? node.childNodes.length : 0;
  for (var i = 0; i < len; i++) {
    var child = node.childNodes[i];
    walker.index++;
    dfsWalk$1(child, walker, patches);
  }
  if (currentPatchs) {
    // 应用patch
    applyPatches(node, currentPatchs);
  }
}
function applyPatches(node, patches) {
  // 应用 patches 列表
  patches.forEach(function (patch) {
    // 根据不同 type 做不同操作
    switch (patch.type) {
      case type.REPLACE:
        var newNode = typeof patch.node === 'string' ? document.createTextNode(patch.node) : patch.node.render();
        // 替换当前元素
        node.parentNode.replaceChild(newNode, node);
        break;
      case type.REORDER:
        reorderChildren(node, patch.moves);
        break;
      case type.PROPS:
        setProps(node, patch.props);
        break;
      case type.TEXT:
        if (node.textContent) {
          node.textContent = patch.content;
        } else {
          node.nodeValue = patch.content; // ie
        }
        break;
      default:
        throw new Error('Unknown patch type ' + patch.type);
    }
  });
}

function reorderChildren(node, moves) {
  var oldNodeList = Array.prototype.map.call(node.childNodes, function (e) {
    return e;
  });
  var map = {};

  oldNodeList.forEach(function (node) {
    var key = node.getAttribute('key');
    map[key] = node; // 将 key 与节点一一对应
  });

  moves.forEach(function (move) {
    var _index = move.index;
    // move 类型
    if (move.type === 0) {
      // remove
      if (oldNodeList[_index] === node.childNodes[_index]) {
        // 要判定节点是否相等 (若之前发生 insert 操作，那么两节点则不同)
        node.removeChild(oldNodeList[_index]);
      }
      oldNodeList.splice(_index, 1);
    } else if (move.type === 1) {
      // 插入的节点(oldNode or newNode)
      var insertNode = map[move.item.key] ? map[move.item.key].clone(true) : _typeof(move.item) === 'object' ? move.item.render() : document.createTextNode(move.item);
      // insert
      node.insertBefore(insertNode, node.childNodes[_index] || null);
    }
  });
}

function setProps(node, props) {
  for (var key in props) {
    if (props[key] === void 666) {
      node.removeAttribute(key);
    } else {
      var value = props[key];
      node.setAttribute(key, value);
    }
  }
}

/**
 * Diff two list in O(N).
 * @param {Array} oldList - Original List
 * @param {Array} newList - List After certain insertions, removes, or moves
 * @return {Object} - {moves: <Array>}
 *                  - moves is a list of actions that telling how to remove and insert
 */
function listdiff(oldList, newList, key) {
  var oldMap = makeKeyIndexAndFree(oldList, key);
  var newMap = makeKeyIndexAndFree(newList, key);

  var newFree = newMap.free;

  var oldKeyIndex = oldMap.keyIndex;
  var newKeyIndex = newMap.keyIndex;

  var moves = [];

  // a simulate list to manipulate
  var children = [];
  var i = 0;
  var item;
  var itemKey;
  var freeIndex = 0;

  // first pass to check item in old list: if it's removed or not
  while (i < oldList.length) {
    item = oldList[i];
    itemKey = getItemKey(item, key);
    if (itemKey) {
      if (!newKeyIndex.hasOwnProperty(itemKey)) {
        children.push(null);
      } else {
        var newItemIndex = newKeyIndex[itemKey];
        children.push(newList[newItemIndex]);
      }
    } else {
      var freeItem = newFree[freeIndex++];
      children.push(freeItem || null);
    }
    i++;
  }

  var simulateList = children.slice(0);

  // remove items no longer exist
  i = 0;
  while (i < simulateList.length) {
    if (simulateList[i] === null) {
      remove(i);
      removeSimulate(i);
    } else {
      i++;
    }
  }

  // i is cursor pointing to a item in new list
  // j is cursor pointing to a item in simulateList
  var j = i = 0;
  while (i < newList.length) {
    item = newList[i];
    itemKey = getItemKey(item, key);

    var simulateItem = simulateList[j];
    var simulateItemKey = getItemKey(simulateItem, key);

    if (simulateItem) {
      if (itemKey === simulateItemKey) {
        j++;
      } else {
        // new item, just inesrt it
        if (!oldKeyIndex.hasOwnProperty(itemKey)) {
          insert(i, item);
        } else {
          // if remove current simulateItem make item in right place
          // then just remove it
          var nextItemKey = getItemKey(simulateList[j + 1], key);
          if (nextItemKey === itemKey) {
            remove(i);
            removeSimulate(j);
            j++; // after removing, current j is right, just jump to next one
          } else {
            // else insert item
            insert(i, item);
          }
        }
      }
    } else {
      insert(i, item);
    }

    i++;
  }

  //if j is not remove to the end, remove all the rest item
  var k = simulateList.length - j;
  while (j++ < simulateList.length) {
    k--;
    remove(k + i);
  }

  function remove(index) {
    var move = { index: index, type: 0 };
    moves.push(move);
  }

  function insert(index, item) {
    var move = { index: index, item: item, type: 1 };
    moves.push(move);
  }

  function removeSimulate(index) {
    simulateList.splice(index, 1);
  }

  return {
    moves: moves,
    children: children
  };
}

/**
 * Convert list to key-item keyIndex object.
 * @param {Array} list
 * @param {String|Function} key
 */
function makeKeyIndexAndFree(list, key) {
  var keyIndex = {};
  var free = [];
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    var itemKey = getItemKey(item, key);
    if (itemKey) {
      keyIndex[itemKey] = i;
    } else {
      free.push(item);
    }
  }
  return {
    keyIndex: keyIndex,
    free: free
  };
}

function getItemKey(item, key) {
  if (!item || !key) return void 666;
  return typeof key === 'string' ? item[key] : key(item);
}

var _ = {
  isString: function isString(obj) {
    return typeof obj === 'string';
  },
  toArray: function toArray(listLike) {
    if (!listLike) {
      return [];
    }
    var list = [];
    for (var i = 0, len = listLike.length; i < len; i++) {
      list.push(listLike[i]);
    }
    return list;
  }
};

function diff(oldtree, newtree) {
  var index = 0;
  var patches = {};
  dfsWalk(oldtree, newtree, index, patches);
  return patches;
}

function dfsWalk(oldNode, newNode, index, patches) {
  var currentPatch = []; // 记录节点的改变

  // 空节点(被移除)
  if (newNode === null) {}
  // 是否为文本节点
  else if (_.isString(newNode) && _.isString(oldNode)) {
      if (oldNode !== newNode) {
        currentPatch.push({ type: type.TEXT, content: newNode });
      }
    }
    // 节点对象是否相同
    else if (oldNode.tagName === newNode.tagName && oldNode.key === newNode.key) {
        // 检查属性
        var propsPatches = diffProps(oldNode, newNode);
        if (propsPatches) {
          currentPatch.push({ type: type.PROPS, props: propsPatches });
        }
        // 检查子节点
        diffChildren(oldNode.children, newNode.children, index, patches, currentPatch);
      } else {
        // 替换
        currentPatch.push({ type: type.REPLACE, node: newNode });
      }

  // 保存 patch
  if (currentPatch.length) {
    patches[index] = currentPatch;
  }
}

function diffChildren(oldChildren, newChildren, index, patches, currentPatch) {
  var diffs = listdiff(oldChildren, newChildren, 'key');
  newChildren = diffs.children;
  if (diffs.moves.length) {
    var reorderPatch = { type: type.REORDER, moves: diffs.moves };
    currentPatch.push(reorderPatch);
  }

  var leftNode = null;
  var currentNodeIndex = index;

  oldChildren.forEach(function (child, i) {
    var newChild = newChildren[i];
    currentNodeIndex = leftNode && leftNode.count ? currentNodeIndex + leftNode.count + 1 : currentNodeIndex + 1;
    dfsWalk(child, newChild, currentNodeIndex, patches);
    leftNode = child;
  });
}

function diffProps(oldNode, newNode) {
  var count = 0;
  var oldProps = oldNode.props;
  var newProps = newNode.props;

  var key = void 0,
      value = void 0;
  var propsPatches = {};

  // Find out different properties
  for (key in oldProps) {
    value = oldProps[key];
    if (newProps[key] !== value) {
      count++;
      propsPatches[key] = newProps[key];
    }
  }

  // Find out new property
  for (key in newProps) {
    value = newProps[key];
    if (!oldProps.hasOwnProperty(key)) {
      count++;
      propsPatches[key] = newProps[key];
    }
  }

  // If properties all are identical
  if (count === 0) {
    return null;
  }

  return propsPatches;
}

var data = {
  class: 'container',
  style: {
    color: 'red',
    border: '1px solid #000'
  },
  list: ['1', '2', '3']
};

var tree = void 0;

function getTree(data) {
  return t('div', { class: data.class }, [t('ul', { style: 'color:' + data.style.color + ';border:' + data.style.border }, data.list.map(function (text, i) {
    return t('li', { key: i }, [text]);
  }))]);
}
tree = getTree(data);
var vNode = tree.render();
document.body.appendChild(vNode);

function changeTree(data) {
  data.style.color = 'blue';
  // data.list.push('4')
  // data.list.shift()
  data.list.splice(1, 0, '4');
  return data;
}

setTimeout(function () {
  data = changeTree(data);
  var newTree = getTree(data);
  var patchs = diff(tree, newTree);
  patch(vNode, patchs);
  tree = newTree;
}, 1000);

Object.defineProperty(exports, '__esModule', { value: true });

})));
