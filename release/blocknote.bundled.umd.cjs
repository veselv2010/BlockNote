var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
(function(global2, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.blocknote = {}));
})(this, function(exports2) {
  "use strict";
  function OrderedMap(content) {
    this.content = content;
  }
  OrderedMap.prototype = {
    constructor: OrderedMap,
    find: function(key) {
      for (var i2 = 0; i2 < this.content.length; i2 += 2)
        if (this.content[i2] === key)
          return i2;
      return -1;
    },
    get: function(key) {
      var found2 = this.find(key);
      return found2 == -1 ? void 0 : this.content[found2 + 1];
    },
    update: function(key, value, newKey) {
      var self2 = newKey && newKey != key ? this.remove(newKey) : this;
      var found2 = self2.find(key), content = self2.content.slice();
      if (found2 == -1) {
        content.push(newKey || key, value);
      } else {
        content[found2 + 1] = value;
        if (newKey)
          content[found2] = newKey;
      }
      return new OrderedMap(content);
    },
    remove: function(key) {
      var found2 = this.find(key);
      if (found2 == -1)
        return this;
      var content = this.content.slice();
      content.splice(found2, 2);
      return new OrderedMap(content);
    },
    addToStart: function(key, value) {
      return new OrderedMap([key, value].concat(this.remove(key).content));
    },
    addToEnd: function(key, value) {
      var content = this.remove(key).content.slice();
      content.push(key, value);
      return new OrderedMap(content);
    },
    addBefore: function(place, key, value) {
      var without = this.remove(key), content = without.content.slice();
      var found2 = without.find(place);
      content.splice(found2 == -1 ? content.length : found2, 0, key, value);
      return new OrderedMap(content);
    },
    forEach: function(f) {
      for (var i2 = 0; i2 < this.content.length; i2 += 2)
        f(this.content[i2], this.content[i2 + 1]);
    },
    prepend: function(map) {
      map = OrderedMap.from(map);
      if (!map.size)
        return this;
      return new OrderedMap(map.content.concat(this.subtract(map).content));
    },
    append: function(map) {
      map = OrderedMap.from(map);
      if (!map.size)
        return this;
      return new OrderedMap(this.subtract(map).content.concat(map.content));
    },
    subtract: function(map) {
      var result = this;
      map = OrderedMap.from(map);
      for (var i2 = 0; i2 < map.content.length; i2 += 2)
        result = result.remove(map.content[i2]);
      return result;
    },
    toObject: function() {
      var result = {};
      this.forEach(function(key, value) {
        result[key] = value;
      });
      return result;
    },
    get size() {
      return this.content.length >> 1;
    }
  };
  OrderedMap.from = function(value) {
    if (value instanceof OrderedMap)
      return value;
    var content = [];
    if (value)
      for (var prop in value)
        content.push(prop, value[prop]);
    return new OrderedMap(content);
  };
  function findDiffStart(a, b, pos) {
    for (let i2 = 0; ; i2++) {
      if (i2 == a.childCount || i2 == b.childCount)
        return a.childCount == b.childCount ? null : pos;
      let childA = a.child(i2), childB = b.child(i2);
      if (childA == childB) {
        pos += childA.nodeSize;
        continue;
      }
      if (!childA.sameMarkup(childB))
        return pos;
      if (childA.isText && childA.text != childB.text) {
        for (let j = 0; childA.text[j] == childB.text[j]; j++)
          pos++;
        return pos;
      }
      if (childA.content.size || childB.content.size) {
        let inner = findDiffStart(childA.content, childB.content, pos + 1);
        if (inner != null)
          return inner;
      }
      pos += childA.nodeSize;
    }
  }
  function findDiffEnd(a, b, posA, posB) {
    for (let iA = a.childCount, iB = b.childCount; ; ) {
      if (iA == 0 || iB == 0)
        return iA == iB ? null : { a: posA, b: posB };
      let childA = a.child(--iA), childB = b.child(--iB), size = childA.nodeSize;
      if (childA == childB) {
        posA -= size;
        posB -= size;
        continue;
      }
      if (!childA.sameMarkup(childB))
        return { a: posA, b: posB };
      if (childA.isText && childA.text != childB.text) {
        let same = 0, minSize = Math.min(childA.text.length, childB.text.length);
        while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
          same++;
          posA--;
          posB--;
        }
        return { a: posA, b: posB };
      }
      if (childA.content.size || childB.content.size) {
        let inner = findDiffEnd(childA.content, childB.content, posA - 1, posB - 1);
        if (inner)
          return inner;
      }
      posA -= size;
      posB -= size;
    }
  }
  class Fragment {
    constructor(content, size) {
      this.content = content;
      this.size = size || 0;
      if (size == null)
        for (let i2 = 0; i2 < content.length; i2++)
          this.size += content[i2].nodeSize;
    }
    nodesBetween(from, to, f, nodeStart = 0, parent) {
      for (let i2 = 0, pos = 0; pos < to; i2++) {
        let child = this.content[i2], end = pos + child.nodeSize;
        if (end > from && f(child, nodeStart + pos, parent || null, i2) !== false && child.content.size) {
          let start = pos + 1;
          child.nodesBetween(Math.max(0, from - start), Math.min(child.content.size, to - start), f, nodeStart + start);
        }
        pos = end;
      }
    }
    descendants(f) {
      this.nodesBetween(0, this.size, f);
    }
    textBetween(from, to, blockSeparator, leafText) {
      let text2 = "", separated = true;
      this.nodesBetween(from, to, (node, pos) => {
        if (node.isText) {
          text2 += node.text.slice(Math.max(from, pos) - pos, to - pos);
          separated = !blockSeparator;
        } else if (node.isLeaf) {
          if (leafText) {
            text2 += typeof leafText === "function" ? leafText(node) : leafText;
          } else if (node.type.spec.leafText) {
            text2 += node.type.spec.leafText(node);
          }
          separated = !blockSeparator;
        } else if (!separated && node.isBlock) {
          text2 += blockSeparator;
          separated = true;
        }
      }, 0);
      return text2;
    }
    append(other) {
      if (!other.size)
        return this;
      if (!this.size)
        return other;
      let last = this.lastChild, first2 = other.firstChild, content = this.content.slice(), i2 = 0;
      if (last.isText && last.sameMarkup(first2)) {
        content[content.length - 1] = last.withText(last.text + first2.text);
        i2 = 1;
      }
      for (; i2 < other.content.length; i2++)
        content.push(other.content[i2]);
      return new Fragment(content, this.size + other.size);
    }
    cut(from, to = this.size) {
      if (from == 0 && to == this.size)
        return this;
      let result = [], size = 0;
      if (to > from)
        for (let i2 = 0, pos = 0; pos < to; i2++) {
          let child = this.content[i2], end = pos + child.nodeSize;
          if (end > from) {
            if (pos < from || end > to) {
              if (child.isText)
                child = child.cut(Math.max(0, from - pos), Math.min(child.text.length, to - pos));
              else
                child = child.cut(Math.max(0, from - pos - 1), Math.min(child.content.size, to - pos - 1));
            }
            result.push(child);
            size += child.nodeSize;
          }
          pos = end;
        }
      return new Fragment(result, size);
    }
    cutByIndex(from, to) {
      if (from == to)
        return Fragment.empty;
      if (from == 0 && to == this.content.length)
        return this;
      return new Fragment(this.content.slice(from, to));
    }
    replaceChild(index, node) {
      let current = this.content[index];
      if (current == node)
        return this;
      let copy2 = this.content.slice();
      let size = this.size + node.nodeSize - current.nodeSize;
      copy2[index] = node;
      return new Fragment(copy2, size);
    }
    addToStart(node) {
      return new Fragment([node].concat(this.content), this.size + node.nodeSize);
    }
    addToEnd(node) {
      return new Fragment(this.content.concat(node), this.size + node.nodeSize);
    }
    eq(other) {
      if (this.content.length != other.content.length)
        return false;
      for (let i2 = 0; i2 < this.content.length; i2++)
        if (!this.content[i2].eq(other.content[i2]))
          return false;
      return true;
    }
    get firstChild() {
      return this.content.length ? this.content[0] : null;
    }
    get lastChild() {
      return this.content.length ? this.content[this.content.length - 1] : null;
    }
    get childCount() {
      return this.content.length;
    }
    child(index) {
      let found2 = this.content[index];
      if (!found2)
        throw new RangeError("Index " + index + " out of range for " + this);
      return found2;
    }
    maybeChild(index) {
      return this.content[index] || null;
    }
    forEach(f) {
      for (let i2 = 0, p = 0; i2 < this.content.length; i2++) {
        let child = this.content[i2];
        f(child, p, i2);
        p += child.nodeSize;
      }
    }
    findDiffStart(other, pos = 0) {
      return findDiffStart(this, other, pos);
    }
    findDiffEnd(other, pos = this.size, otherPos = other.size) {
      return findDiffEnd(this, other, pos, otherPos);
    }
    findIndex(pos, round = -1) {
      if (pos == 0)
        return retIndex(0, pos);
      if (pos == this.size)
        return retIndex(this.content.length, pos);
      if (pos > this.size || pos < 0)
        throw new RangeError(`Position ${pos} outside of fragment (${this})`);
      for (let i2 = 0, curPos = 0; ; i2++) {
        let cur = this.child(i2), end = curPos + cur.nodeSize;
        if (end >= pos) {
          if (end == pos || round > 0)
            return retIndex(i2 + 1, end);
          return retIndex(i2, curPos);
        }
        curPos = end;
      }
    }
    toString() {
      return "<" + this.toStringInner() + ">";
    }
    toStringInner() {
      return this.content.join(", ");
    }
    toJSON() {
      return this.content.length ? this.content.map((n) => n.toJSON()) : null;
    }
    static fromJSON(schema, value) {
      if (!value)
        return Fragment.empty;
      if (!Array.isArray(value))
        throw new RangeError("Invalid input for Fragment.fromJSON");
      return new Fragment(value.map(schema.nodeFromJSON));
    }
    static fromArray(array) {
      if (!array.length)
        return Fragment.empty;
      let joined, size = 0;
      for (let i2 = 0; i2 < array.length; i2++) {
        let node = array[i2];
        size += node.nodeSize;
        if (i2 && node.isText && array[i2 - 1].sameMarkup(node)) {
          if (!joined)
            joined = array.slice(0, i2);
          joined[joined.length - 1] = node.withText(joined[joined.length - 1].text + node.text);
        } else if (joined) {
          joined.push(node);
        }
      }
      return new Fragment(joined || array, size);
    }
    static from(nodes) {
      if (!nodes)
        return Fragment.empty;
      if (nodes instanceof Fragment)
        return nodes;
      if (Array.isArray(nodes))
        return this.fromArray(nodes);
      if (nodes.attrs)
        return new Fragment([nodes], nodes.nodeSize);
      throw new RangeError("Can not convert " + nodes + " to a Fragment" + (nodes.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
    }
  }
  Fragment.empty = new Fragment([], 0);
  const found = { index: 0, offset: 0 };
  function retIndex(index, offset) {
    found.index = index;
    found.offset = offset;
    return found;
  }
  function compareDeep(a, b) {
    if (a === b)
      return true;
    if (!(a && typeof a == "object") || !(b && typeof b == "object"))
      return false;
    let array = Array.isArray(a);
    if (Array.isArray(b) != array)
      return false;
    if (array) {
      if (a.length != b.length)
        return false;
      for (let i2 = 0; i2 < a.length; i2++)
        if (!compareDeep(a[i2], b[i2]))
          return false;
    } else {
      for (let p in a)
        if (!(p in b) || !compareDeep(a[p], b[p]))
          return false;
      for (let p in b)
        if (!(p in a))
          return false;
    }
    return true;
  }
  class Mark$1 {
    constructor(type, attrs) {
      this.type = type;
      this.attrs = attrs;
    }
    addToSet(set) {
      let copy2, placed = false;
      for (let i2 = 0; i2 < set.length; i2++) {
        let other = set[i2];
        if (this.eq(other))
          return set;
        if (this.type.excludes(other.type)) {
          if (!copy2)
            copy2 = set.slice(0, i2);
        } else if (other.type.excludes(this.type)) {
          return set;
        } else {
          if (!placed && other.type.rank > this.type.rank) {
            if (!copy2)
              copy2 = set.slice(0, i2);
            copy2.push(this);
            placed = true;
          }
          if (copy2)
            copy2.push(other);
        }
      }
      if (!copy2)
        copy2 = set.slice();
      if (!placed)
        copy2.push(this);
      return copy2;
    }
    removeFromSet(set) {
      for (let i2 = 0; i2 < set.length; i2++)
        if (this.eq(set[i2]))
          return set.slice(0, i2).concat(set.slice(i2 + 1));
      return set;
    }
    isInSet(set) {
      for (let i2 = 0; i2 < set.length; i2++)
        if (this.eq(set[i2]))
          return true;
      return false;
    }
    eq(other) {
      return this == other || this.type == other.type && compareDeep(this.attrs, other.attrs);
    }
    toJSON() {
      let obj = { type: this.type.name };
      for (let _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }
      return obj;
    }
    static fromJSON(schema, json) {
      if (!json)
        throw new RangeError("Invalid input for Mark.fromJSON");
      let type = schema.marks[json.type];
      if (!type)
        throw new RangeError(`There is no mark type ${json.type} in this schema`);
      return type.create(json.attrs);
    }
    static sameSet(a, b) {
      if (a == b)
        return true;
      if (a.length != b.length)
        return false;
      for (let i2 = 0; i2 < a.length; i2++)
        if (!a[i2].eq(b[i2]))
          return false;
      return true;
    }
    static setFrom(marks) {
      if (!marks || Array.isArray(marks) && marks.length == 0)
        return Mark$1.none;
      if (marks instanceof Mark$1)
        return [marks];
      let copy2 = marks.slice();
      copy2.sort((a, b) => a.type.rank - b.type.rank);
      return copy2;
    }
  }
  Mark$1.none = [];
  class ReplaceError extends Error {
  }
  class Slice {
    constructor(content, openStart, openEnd) {
      this.content = content;
      this.openStart = openStart;
      this.openEnd = openEnd;
    }
    get size() {
      return this.content.size - this.openStart - this.openEnd;
    }
    insertAt(pos, fragment) {
      let content = insertInto(this.content, pos + this.openStart, fragment);
      return content && new Slice(content, this.openStart, this.openEnd);
    }
    removeBetween(from, to) {
      return new Slice(removeRange(this.content, from + this.openStart, to + this.openStart), this.openStart, this.openEnd);
    }
    eq(other) {
      return this.content.eq(other.content) && this.openStart == other.openStart && this.openEnd == other.openEnd;
    }
    toString() {
      return this.content + "(" + this.openStart + "," + this.openEnd + ")";
    }
    toJSON() {
      if (!this.content.size)
        return null;
      let json = { content: this.content.toJSON() };
      if (this.openStart > 0)
        json.openStart = this.openStart;
      if (this.openEnd > 0)
        json.openEnd = this.openEnd;
      return json;
    }
    static fromJSON(schema, json) {
      if (!json)
        return Slice.empty;
      let openStart = json.openStart || 0, openEnd = json.openEnd || 0;
      if (typeof openStart != "number" || typeof openEnd != "number")
        throw new RangeError("Invalid input for Slice.fromJSON");
      return new Slice(Fragment.fromJSON(schema, json.content), openStart, openEnd);
    }
    static maxOpen(fragment, openIsolating = true) {
      let openStart = 0, openEnd = 0;
      for (let n = fragment.firstChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.firstChild)
        openStart++;
      for (let n = fragment.lastChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.lastChild)
        openEnd++;
      return new Slice(fragment, openStart, openEnd);
    }
  }
  Slice.empty = new Slice(Fragment.empty, 0, 0);
  function removeRange(content, from, to) {
    let { index, offset } = content.findIndex(from), child = content.maybeChild(index);
    let { index: indexTo, offset: offsetTo } = content.findIndex(to);
    if (offset == from || child.isText) {
      if (offsetTo != to && !content.child(indexTo).isText)
        throw new RangeError("Removing non-flat range");
      return content.cut(0, from).append(content.cut(to));
    }
    if (index != indexTo)
      throw new RangeError("Removing non-flat range");
    return content.replaceChild(index, child.copy(removeRange(child.content, from - offset - 1, to - offset - 1)));
  }
  function insertInto(content, dist, insert, parent) {
    let { index, offset } = content.findIndex(dist), child = content.maybeChild(index);
    if (offset == dist || child.isText) {
      if (parent && !parent.canReplace(index, index, insert))
        return null;
      return content.cut(0, dist).append(insert).append(content.cut(dist));
    }
    let inner = insertInto(child.content, dist - offset - 1, insert);
    return inner && content.replaceChild(index, child.copy(inner));
  }
  function replace($from, $to, slice) {
    if (slice.openStart > $from.depth)
      throw new ReplaceError("Inserted content deeper than insertion position");
    if ($from.depth - slice.openStart != $to.depth - slice.openEnd)
      throw new ReplaceError("Inconsistent open depths");
    return replaceOuter($from, $to, slice, 0);
  }
  function replaceOuter($from, $to, slice, depth) {
    let index = $from.index(depth), node = $from.node(depth);
    if (index == $to.index(depth) && depth < $from.depth - slice.openStart) {
      let inner = replaceOuter($from, $to, slice, depth + 1);
      return node.copy(node.content.replaceChild(index, inner));
    } else if (!slice.content.size) {
      return close(node, replaceTwoWay($from, $to, depth));
    } else if (!slice.openStart && !slice.openEnd && $from.depth == depth && $to.depth == depth) {
      let parent = $from.parent, content = parent.content;
      return close(parent, content.cut(0, $from.parentOffset).append(slice.content).append(content.cut($to.parentOffset)));
    } else {
      let { start, end } = prepareSliceForReplace(slice, $from);
      return close(node, replaceThreeWay($from, start, end, $to, depth));
    }
  }
  function checkJoin(main, sub) {
    if (!sub.type.compatibleContent(main.type))
      throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main.type.name);
  }
  function joinable$1($before, $after, depth) {
    let node = $before.node(depth);
    checkJoin(node, $after.node(depth));
    return node;
  }
  function addNode(child, target) {
    let last = target.length - 1;
    if (last >= 0 && child.isText && child.sameMarkup(target[last]))
      target[last] = child.withText(target[last].text + child.text);
    else
      target.push(child);
  }
  function addRange($start, $end, depth, target) {
    let node = ($end || $start).node(depth);
    let startIndex = 0, endIndex = $end ? $end.index(depth) : node.childCount;
    if ($start) {
      startIndex = $start.index(depth);
      if ($start.depth > depth) {
        startIndex++;
      } else if ($start.textOffset) {
        addNode($start.nodeAfter, target);
        startIndex++;
      }
    }
    for (let i2 = startIndex; i2 < endIndex; i2++)
      addNode(node.child(i2), target);
    if ($end && $end.depth == depth && $end.textOffset)
      addNode($end.nodeBefore, target);
  }
  function close(node, content) {
    node.type.checkContent(content);
    return node.copy(content);
  }
  function replaceThreeWay($from, $start, $end, $to, depth) {
    let openStart = $from.depth > depth && joinable$1($from, $start, depth + 1);
    let openEnd = $to.depth > depth && joinable$1($end, $to, depth + 1);
    let content = [];
    addRange(null, $from, depth, content);
    if (openStart && openEnd && $start.index(depth) == $end.index(depth)) {
      checkJoin(openStart, openEnd);
      addNode(close(openStart, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
    } else {
      if (openStart)
        addNode(close(openStart, replaceTwoWay($from, $start, depth + 1)), content);
      addRange($start, $end, depth, content);
      if (openEnd)
        addNode(close(openEnd, replaceTwoWay($end, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content);
  }
  function replaceTwoWay($from, $to, depth) {
    let content = [];
    addRange(null, $from, depth, content);
    if ($from.depth > depth) {
      let type = joinable$1($from, $to, depth + 1);
      addNode(close(type, replaceTwoWay($from, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content);
  }
  function prepareSliceForReplace(slice, $along) {
    let extra = $along.depth - slice.openStart, parent = $along.node(extra);
    let node = parent.copy(slice.content);
    for (let i2 = extra - 1; i2 >= 0; i2--)
      node = $along.node(i2).copy(Fragment.from(node));
    return {
      start: node.resolveNoCache(slice.openStart + extra),
      end: node.resolveNoCache(node.content.size - slice.openEnd - extra)
    };
  }
  class ResolvedPos {
    constructor(pos, path, parentOffset) {
      this.pos = pos;
      this.path = path;
      this.parentOffset = parentOffset;
      this.depth = path.length / 3 - 1;
    }
    resolveDepth(val) {
      if (val == null)
        return this.depth;
      if (val < 0)
        return this.depth + val;
      return val;
    }
    get parent() {
      return this.node(this.depth);
    }
    get doc() {
      return this.node(0);
    }
    node(depth) {
      return this.path[this.resolveDepth(depth) * 3];
    }
    index(depth) {
      return this.path[this.resolveDepth(depth) * 3 + 1];
    }
    indexAfter(depth) {
      depth = this.resolveDepth(depth);
      return this.index(depth) + (depth == this.depth && !this.textOffset ? 0 : 1);
    }
    start(depth) {
      depth = this.resolveDepth(depth);
      return depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
    }
    end(depth) {
      depth = this.resolveDepth(depth);
      return this.start(depth) + this.node(depth).content.size;
    }
    before(depth) {
      depth = this.resolveDepth(depth);
      if (!depth)
        throw new RangeError("There is no position before the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1];
    }
    after(depth) {
      depth = this.resolveDepth(depth);
      if (!depth)
        throw new RangeError("There is no position after the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1] + this.path[depth * 3].nodeSize;
    }
    get textOffset() {
      return this.pos - this.path[this.path.length - 1];
    }
    get nodeAfter() {
      let parent = this.parent, index = this.index(this.depth);
      if (index == parent.childCount)
        return null;
      let dOff = this.pos - this.path[this.path.length - 1], child = parent.child(index);
      return dOff ? parent.child(index).cut(dOff) : child;
    }
    get nodeBefore() {
      let index = this.index(this.depth);
      let dOff = this.pos - this.path[this.path.length - 1];
      if (dOff)
        return this.parent.child(index).cut(0, dOff);
      return index == 0 ? null : this.parent.child(index - 1);
    }
    posAtIndex(index, depth) {
      depth = this.resolveDepth(depth);
      let node = this.path[depth * 3], pos = depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
      for (let i2 = 0; i2 < index; i2++)
        pos += node.child(i2).nodeSize;
      return pos;
    }
    marks() {
      let parent = this.parent, index = this.index();
      if (parent.content.size == 0)
        return Mark$1.none;
      if (this.textOffset)
        return parent.child(index).marks;
      let main = parent.maybeChild(index - 1), other = parent.maybeChild(index);
      if (!main) {
        let tmp = main;
        main = other;
        other = tmp;
      }
      let marks = main.marks;
      for (var i2 = 0; i2 < marks.length; i2++)
        if (marks[i2].type.spec.inclusive === false && (!other || !marks[i2].isInSet(other.marks)))
          marks = marks[i2--].removeFromSet(marks);
      return marks;
    }
    marksAcross($end) {
      let after = this.parent.maybeChild(this.index());
      if (!after || !after.isInline)
        return null;
      let marks = after.marks, next = $end.parent.maybeChild($end.index());
      for (var i2 = 0; i2 < marks.length; i2++)
        if (marks[i2].type.spec.inclusive === false && (!next || !marks[i2].isInSet(next.marks)))
          marks = marks[i2--].removeFromSet(marks);
      return marks;
    }
    sharedDepth(pos) {
      for (let depth = this.depth; depth > 0; depth--)
        if (this.start(depth) <= pos && this.end(depth) >= pos)
          return depth;
      return 0;
    }
    blockRange(other = this, pred) {
      if (other.pos < this.pos)
        return other.blockRange(this);
      for (let d = this.depth - (this.parent.inlineContent || this.pos == other.pos ? 1 : 0); d >= 0; d--)
        if (other.pos <= this.end(d) && (!pred || pred(this.node(d))))
          return new NodeRange(this, other, d);
      return null;
    }
    sameParent(other) {
      return this.pos - this.parentOffset == other.pos - other.parentOffset;
    }
    max(other) {
      return other.pos > this.pos ? other : this;
    }
    min(other) {
      return other.pos < this.pos ? other : this;
    }
    toString() {
      let str = "";
      for (let i2 = 1; i2 <= this.depth; i2++)
        str += (str ? "/" : "") + this.node(i2).type.name + "_" + this.index(i2 - 1);
      return str + ":" + this.parentOffset;
    }
    static resolve(doc2, pos) {
      if (!(pos >= 0 && pos <= doc2.content.size))
        throw new RangeError("Position " + pos + " out of range");
      let path = [];
      let start = 0, parentOffset = pos;
      for (let node = doc2; ; ) {
        let { index, offset } = node.content.findIndex(parentOffset);
        let rem = parentOffset - offset;
        path.push(node, index, start + offset);
        if (!rem)
          break;
        node = node.child(index);
        if (node.isText)
          break;
        parentOffset = rem - 1;
        start += offset + 1;
      }
      return new ResolvedPos(pos, path, parentOffset);
    }
    static resolveCached(doc2, pos) {
      for (let i2 = 0; i2 < resolveCache.length; i2++) {
        let cached = resolveCache[i2];
        if (cached.pos == pos && cached.doc == doc2)
          return cached;
      }
      let result = resolveCache[resolveCachePos] = ResolvedPos.resolve(doc2, pos);
      resolveCachePos = (resolveCachePos + 1) % resolveCacheSize;
      return result;
    }
  }
  let resolveCache = [], resolveCachePos = 0, resolveCacheSize = 12;
  class NodeRange {
    constructor($from, $to, depth) {
      this.$from = $from;
      this.$to = $to;
      this.depth = depth;
    }
    get start() {
      return this.$from.before(this.depth + 1);
    }
    get end() {
      return this.$to.after(this.depth + 1);
    }
    get parent() {
      return this.$from.node(this.depth);
    }
    get startIndex() {
      return this.$from.index(this.depth);
    }
    get endIndex() {
      return this.$to.indexAfter(this.depth);
    }
  }
  const emptyAttrs = /* @__PURE__ */ Object.create(null);
  class Node$1 {
    constructor(type, attrs, content, marks = Mark$1.none) {
      this.type = type;
      this.attrs = attrs;
      this.marks = marks;
      this.content = content || Fragment.empty;
    }
    get nodeSize() {
      return this.isLeaf ? 1 : 2 + this.content.size;
    }
    get childCount() {
      return this.content.childCount;
    }
    child(index) {
      return this.content.child(index);
    }
    maybeChild(index) {
      return this.content.maybeChild(index);
    }
    forEach(f) {
      this.content.forEach(f);
    }
    nodesBetween(from, to, f, startPos = 0) {
      this.content.nodesBetween(from, to, f, startPos, this);
    }
    descendants(f) {
      this.nodesBetween(0, this.content.size, f);
    }
    get textContent() {
      return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
    }
    textBetween(from, to, blockSeparator, leafText) {
      return this.content.textBetween(from, to, blockSeparator, leafText);
    }
    get firstChild() {
      return this.content.firstChild;
    }
    get lastChild() {
      return this.content.lastChild;
    }
    eq(other) {
      return this == other || this.sameMarkup(other) && this.content.eq(other.content);
    }
    sameMarkup(other) {
      return this.hasMarkup(other.type, other.attrs, other.marks);
    }
    hasMarkup(type, attrs, marks) {
      return this.type == type && compareDeep(this.attrs, attrs || type.defaultAttrs || emptyAttrs) && Mark$1.sameSet(this.marks, marks || Mark$1.none);
    }
    copy(content = null) {
      if (content == this.content)
        return this;
      return new Node$1(this.type, this.attrs, content, this.marks);
    }
    mark(marks) {
      return marks == this.marks ? this : new Node$1(this.type, this.attrs, this.content, marks);
    }
    cut(from, to = this.content.size) {
      if (from == 0 && to == this.content.size)
        return this;
      return this.copy(this.content.cut(from, to));
    }
    slice(from, to = this.content.size, includeParents = false) {
      if (from == to)
        return Slice.empty;
      let $from = this.resolve(from), $to = this.resolve(to);
      let depth = includeParents ? 0 : $from.sharedDepth(to);
      let start = $from.start(depth), node = $from.node(depth);
      let content = node.content.cut($from.pos - start, $to.pos - start);
      return new Slice(content, $from.depth - depth, $to.depth - depth);
    }
    replace(from, to, slice) {
      return replace(this.resolve(from), this.resolve(to), slice);
    }
    nodeAt(pos) {
      for (let node = this; ; ) {
        let { index, offset } = node.content.findIndex(pos);
        node = node.maybeChild(index);
        if (!node)
          return null;
        if (offset == pos || node.isText)
          return node;
        pos -= offset + 1;
      }
    }
    childAfter(pos) {
      let { index, offset } = this.content.findIndex(pos);
      return { node: this.content.maybeChild(index), index, offset };
    }
    childBefore(pos) {
      if (pos == 0)
        return { node: null, index: 0, offset: 0 };
      let { index, offset } = this.content.findIndex(pos);
      if (offset < pos)
        return { node: this.content.child(index), index, offset };
      let node = this.content.child(index - 1);
      return { node, index: index - 1, offset: offset - node.nodeSize };
    }
    resolve(pos) {
      return ResolvedPos.resolveCached(this, pos);
    }
    resolveNoCache(pos) {
      return ResolvedPos.resolve(this, pos);
    }
    rangeHasMark(from, to, type) {
      let found2 = false;
      if (to > from)
        this.nodesBetween(from, to, (node) => {
          if (type.isInSet(node.marks))
            found2 = true;
          return !found2;
        });
      return found2;
    }
    get isBlock() {
      return this.type.isBlock;
    }
    get isTextblock() {
      return this.type.isTextblock;
    }
    get inlineContent() {
      return this.type.inlineContent;
    }
    get isInline() {
      return this.type.isInline;
    }
    get isText() {
      return this.type.isText;
    }
    get isLeaf() {
      return this.type.isLeaf;
    }
    get isAtom() {
      return this.type.isAtom;
    }
    toString() {
      if (this.type.spec.toDebugString)
        return this.type.spec.toDebugString(this);
      let name = this.type.name;
      if (this.content.size)
        name += "(" + this.content.toStringInner() + ")";
      return wrapMarks(this.marks, name);
    }
    contentMatchAt(index) {
      let match = this.type.contentMatch.matchFragment(this.content, 0, index);
      if (!match)
        throw new Error("Called contentMatchAt on a node with invalid content");
      return match;
    }
    canReplace(from, to, replacement = Fragment.empty, start = 0, end = replacement.childCount) {
      let one = this.contentMatchAt(from).matchFragment(replacement, start, end);
      let two = one && one.matchFragment(this.content, to);
      if (!two || !two.validEnd)
        return false;
      for (let i2 = start; i2 < end; i2++)
        if (!this.type.allowsMarks(replacement.child(i2).marks))
          return false;
      return true;
    }
    canReplaceWith(from, to, type, marks) {
      if (marks && !this.type.allowsMarks(marks))
        return false;
      let start = this.contentMatchAt(from).matchType(type);
      let end = start && start.matchFragment(this.content, to);
      return end ? end.validEnd : false;
    }
    canAppend(other) {
      if (other.content.size)
        return this.canReplace(this.childCount, this.childCount, other.content);
      else
        return this.type.compatibleContent(other.type);
    }
    check() {
      this.type.checkContent(this.content);
      let copy2 = Mark$1.none;
      for (let i2 = 0; i2 < this.marks.length; i2++)
        copy2 = this.marks[i2].addToSet(copy2);
      if (!Mark$1.sameSet(copy2, this.marks))
        throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((m) => m.type.name)}`);
      this.content.forEach((node) => node.check());
    }
    toJSON() {
      let obj = { type: this.type.name };
      for (let _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }
      if (this.content.size)
        obj.content = this.content.toJSON();
      if (this.marks.length)
        obj.marks = this.marks.map((n) => n.toJSON());
      return obj;
    }
    static fromJSON(schema, json) {
      if (!json)
        throw new RangeError("Invalid input for Node.fromJSON");
      let marks = null;
      if (json.marks) {
        if (!Array.isArray(json.marks))
          throw new RangeError("Invalid mark data for Node.fromJSON");
        marks = json.marks.map(schema.markFromJSON);
      }
      if (json.type == "text") {
        if (typeof json.text != "string")
          throw new RangeError("Invalid text node in JSON");
        return schema.text(json.text, marks);
      }
      let content = Fragment.fromJSON(schema, json.content);
      return schema.nodeType(json.type).create(json.attrs, content, marks);
    }
  }
  Node$1.prototype.text = void 0;
  class TextNode extends Node$1 {
    constructor(type, attrs, content, marks) {
      super(type, attrs, null, marks);
      if (!content)
        throw new RangeError("Empty text nodes are not allowed");
      this.text = content;
    }
    toString() {
      if (this.type.spec.toDebugString)
        return this.type.spec.toDebugString(this);
      return wrapMarks(this.marks, JSON.stringify(this.text));
    }
    get textContent() {
      return this.text;
    }
    textBetween(from, to) {
      return this.text.slice(from, to);
    }
    get nodeSize() {
      return this.text.length;
    }
    mark(marks) {
      return marks == this.marks ? this : new TextNode(this.type, this.attrs, this.text, marks);
    }
    withText(text2) {
      if (text2 == this.text)
        return this;
      return new TextNode(this.type, this.attrs, text2, this.marks);
    }
    cut(from = 0, to = this.text.length) {
      if (from == 0 && to == this.text.length)
        return this;
      return this.withText(this.text.slice(from, to));
    }
    eq(other) {
      return this.sameMarkup(other) && this.text == other.text;
    }
    toJSON() {
      let base2 = super.toJSON();
      base2.text = this.text;
      return base2;
    }
  }
  function wrapMarks(marks, str) {
    for (let i2 = marks.length - 1; i2 >= 0; i2--)
      str = marks[i2].type.name + "(" + str + ")";
    return str;
  }
  class ContentMatch {
    constructor(validEnd) {
      this.validEnd = validEnd;
      this.next = [];
      this.wrapCache = [];
    }
    static parse(string, nodeTypes) {
      let stream = new TokenStream(string, nodeTypes);
      if (stream.next == null)
        return ContentMatch.empty;
      let expr = parseExpr(stream);
      if (stream.next)
        stream.err("Unexpected trailing text");
      let match = dfa(nfa(expr));
      checkForDeadEnds(match, stream);
      return match;
    }
    matchType(type) {
      for (let i2 = 0; i2 < this.next.length; i2++)
        if (this.next[i2].type == type)
          return this.next[i2].next;
      return null;
    }
    matchFragment(frag, start = 0, end = frag.childCount) {
      let cur = this;
      for (let i2 = start; cur && i2 < end; i2++)
        cur = cur.matchType(frag.child(i2).type);
      return cur;
    }
    get inlineContent() {
      return this.next.length != 0 && this.next[0].type.isInline;
    }
    get defaultType() {
      for (let i2 = 0; i2 < this.next.length; i2++) {
        let { type } = this.next[i2];
        if (!(type.isText || type.hasRequiredAttrs()))
          return type;
      }
      return null;
    }
    compatible(other) {
      for (let i2 = 0; i2 < this.next.length; i2++)
        for (let j = 0; j < other.next.length; j++)
          if (this.next[i2].type == other.next[j].type)
            return true;
      return false;
    }
    fillBefore(after, toEnd = false, startIndex = 0) {
      let seen = [this];
      function search(match, types) {
        let finished = match.matchFragment(after, startIndex);
        if (finished && (!toEnd || finished.validEnd))
          return Fragment.from(types.map((tp) => tp.createAndFill()));
        for (let i2 = 0; i2 < match.next.length; i2++) {
          let { type, next } = match.next[i2];
          if (!(type.isText || type.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
            seen.push(next);
            let found2 = search(next, types.concat(type));
            if (found2)
              return found2;
          }
        }
        return null;
      }
      return search(this, []);
    }
    findWrapping(target) {
      for (let i2 = 0; i2 < this.wrapCache.length; i2 += 2)
        if (this.wrapCache[i2] == target)
          return this.wrapCache[i2 + 1];
      let computed = this.computeWrapping(target);
      this.wrapCache.push(target, computed);
      return computed;
    }
    computeWrapping(target) {
      let seen = /* @__PURE__ */ Object.create(null), active = [{ match: this, type: null, via: null }];
      while (active.length) {
        let current = active.shift(), match = current.match;
        if (match.matchType(target)) {
          let result = [];
          for (let obj = current; obj.type; obj = obj.via)
            result.push(obj.type);
          return result.reverse();
        }
        for (let i2 = 0; i2 < match.next.length; i2++) {
          let { type, next } = match.next[i2];
          if (!type.isLeaf && !type.hasRequiredAttrs() && !(type.name in seen) && (!current.type || next.validEnd)) {
            active.push({ match: type.contentMatch, type, via: current });
            seen[type.name] = true;
          }
        }
      }
      return null;
    }
    get edgeCount() {
      return this.next.length;
    }
    edge(n) {
      if (n >= this.next.length)
        throw new RangeError(`There's no ${n}th edge in this content match`);
      return this.next[n];
    }
    toString() {
      let seen = [];
      function scan(m) {
        seen.push(m);
        for (let i2 = 0; i2 < m.next.length; i2++)
          if (seen.indexOf(m.next[i2].next) == -1)
            scan(m.next[i2].next);
      }
      scan(this);
      return seen.map((m, i2) => {
        let out = i2 + (m.validEnd ? "*" : " ") + " ";
        for (let i3 = 0; i3 < m.next.length; i3++)
          out += (i3 ? ", " : "") + m.next[i3].type.name + "->" + seen.indexOf(m.next[i3].next);
        return out;
      }).join("\n");
    }
  }
  ContentMatch.empty = new ContentMatch(true);
  class TokenStream {
    constructor(string, nodeTypes) {
      this.string = string;
      this.nodeTypes = nodeTypes;
      this.inline = null;
      this.pos = 0;
      this.tokens = string.split(/\s*(?=\b|\W|$)/);
      if (this.tokens[this.tokens.length - 1] == "")
        this.tokens.pop();
      if (this.tokens[0] == "")
        this.tokens.shift();
    }
    get next() {
      return this.tokens[this.pos];
    }
    eat(tok) {
      return this.next == tok && (this.pos++ || true);
    }
    err(str) {
      throw new SyntaxError(str + " (in content expression '" + this.string + "')");
    }
  }
  function parseExpr(stream) {
    let exprs = [];
    do {
      exprs.push(parseExprSeq(stream));
    } while (stream.eat("|"));
    return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
  }
  function parseExprSeq(stream) {
    let exprs = [];
    do {
      exprs.push(parseExprSubscript(stream));
    } while (stream.next && stream.next != ")" && stream.next != "|");
    return exprs.length == 1 ? exprs[0] : { type: "seq", exprs };
  }
  function parseExprSubscript(stream) {
    let expr = parseExprAtom(stream);
    for (; ; ) {
      if (stream.eat("+"))
        expr = { type: "plus", expr };
      else if (stream.eat("*"))
        expr = { type: "star", expr };
      else if (stream.eat("?"))
        expr = { type: "opt", expr };
      else if (stream.eat("{"))
        expr = parseExprRange(stream, expr);
      else
        break;
    }
    return expr;
  }
  function parseNum(stream) {
    if (/\D/.test(stream.next))
      stream.err("Expected number, got '" + stream.next + "'");
    let result = Number(stream.next);
    stream.pos++;
    return result;
  }
  function parseExprRange(stream, expr) {
    let min = parseNum(stream), max = min;
    if (stream.eat(",")) {
      if (stream.next != "}")
        max = parseNum(stream);
      else
        max = -1;
    }
    if (!stream.eat("}"))
      stream.err("Unclosed braced range");
    return { type: "range", min, max, expr };
  }
  function resolveName(stream, name) {
    let types = stream.nodeTypes, type = types[name];
    if (type)
      return [type];
    let result = [];
    for (let typeName in types) {
      let type2 = types[typeName];
      if (type2.groups.indexOf(name) > -1)
        result.push(type2);
    }
    if (result.length == 0)
      stream.err("No node type or group '" + name + "' found");
    return result;
  }
  function parseExprAtom(stream) {
    if (stream.eat("(")) {
      let expr = parseExpr(stream);
      if (!stream.eat(")"))
        stream.err("Missing closing paren");
      return expr;
    } else if (!/\W/.test(stream.next)) {
      let exprs = resolveName(stream, stream.next).map((type) => {
        if (stream.inline == null)
          stream.inline = type.isInline;
        else if (stream.inline != type.isInline)
          stream.err("Mixing inline and block content");
        return { type: "name", value: type };
      });
      stream.pos++;
      return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
    } else {
      stream.err("Unexpected token '" + stream.next + "'");
    }
  }
  function nfa(expr) {
    let nfa2 = [[]];
    connect(compile(expr, 0), node());
    return nfa2;
    function node() {
      return nfa2.push([]) - 1;
    }
    function edge(from, to, term) {
      let edge2 = { term, to };
      nfa2[from].push(edge2);
      return edge2;
    }
    function connect(edges, to) {
      edges.forEach((edge2) => edge2.to = to);
    }
    function compile(expr2, from) {
      if (expr2.type == "choice") {
        return expr2.exprs.reduce((out, expr3) => out.concat(compile(expr3, from)), []);
      } else if (expr2.type == "seq") {
        for (let i2 = 0; ; i2++) {
          let next = compile(expr2.exprs[i2], from);
          if (i2 == expr2.exprs.length - 1)
            return next;
          connect(next, from = node());
        }
      } else if (expr2.type == "star") {
        let loop = node();
        edge(from, loop);
        connect(compile(expr2.expr, loop), loop);
        return [edge(loop)];
      } else if (expr2.type == "plus") {
        let loop = node();
        connect(compile(expr2.expr, from), loop);
        connect(compile(expr2.expr, loop), loop);
        return [edge(loop)];
      } else if (expr2.type == "opt") {
        return [edge(from)].concat(compile(expr2.expr, from));
      } else if (expr2.type == "range") {
        let cur = from;
        for (let i2 = 0; i2 < expr2.min; i2++) {
          let next = node();
          connect(compile(expr2.expr, cur), next);
          cur = next;
        }
        if (expr2.max == -1) {
          connect(compile(expr2.expr, cur), cur);
        } else {
          for (let i2 = expr2.min; i2 < expr2.max; i2++) {
            let next = node();
            edge(cur, next);
            connect(compile(expr2.expr, cur), next);
            cur = next;
          }
        }
        return [edge(cur)];
      } else if (expr2.type == "name") {
        return [edge(from, void 0, expr2.value)];
      } else {
        throw new Error("Unknown expr type");
      }
    }
  }
  function cmp(a, b) {
    return b - a;
  }
  function nullFrom(nfa2, node) {
    let result = [];
    scan(node);
    return result.sort(cmp);
    function scan(node2) {
      let edges = nfa2[node2];
      if (edges.length == 1 && !edges[0].term)
        return scan(edges[0].to);
      result.push(node2);
      for (let i2 = 0; i2 < edges.length; i2++) {
        let { term, to } = edges[i2];
        if (!term && result.indexOf(to) == -1)
          scan(to);
      }
    }
  }
  function dfa(nfa2) {
    let labeled = /* @__PURE__ */ Object.create(null);
    return explore(nullFrom(nfa2, 0));
    function explore(states) {
      let out = [];
      states.forEach((node) => {
        nfa2[node].forEach(({ term, to }) => {
          if (!term)
            return;
          let set;
          for (let i2 = 0; i2 < out.length; i2++)
            if (out[i2][0] == term)
              set = out[i2][1];
          nullFrom(nfa2, to).forEach((node2) => {
            if (!set)
              out.push([term, set = []]);
            if (set.indexOf(node2) == -1)
              set.push(node2);
          });
        });
      });
      let state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa2.length - 1) > -1);
      for (let i2 = 0; i2 < out.length; i2++) {
        let states2 = out[i2][1].sort(cmp);
        state.next.push({ type: out[i2][0], next: labeled[states2.join(",")] || explore(states2) });
      }
      return state;
    }
  }
  function checkForDeadEnds(match, stream) {
    for (let i2 = 0, work = [match]; i2 < work.length; i2++) {
      let state = work[i2], dead = !state.validEnd, nodes = [];
      for (let j = 0; j < state.next.length; j++) {
        let { type, next } = state.next[j];
        nodes.push(type.name);
        if (dead && !(type.isText || type.hasRequiredAttrs()))
          dead = false;
        if (work.indexOf(next) == -1)
          work.push(next);
      }
      if (dead)
        stream.err("Only non-generatable nodes (" + nodes.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
    }
  }
  function defaultAttrs(attrs) {
    let defaults2 = /* @__PURE__ */ Object.create(null);
    for (let attrName in attrs) {
      let attr = attrs[attrName];
      if (!attr.hasDefault)
        return null;
      defaults2[attrName] = attr.default;
    }
    return defaults2;
  }
  function computeAttrs(attrs, value) {
    let built = /* @__PURE__ */ Object.create(null);
    for (let name in attrs) {
      let given = value && value[name];
      if (given === void 0) {
        let attr = attrs[name];
        if (attr.hasDefault)
          given = attr.default;
        else
          throw new RangeError("No value supplied for attribute " + name);
      }
      built[name] = given;
    }
    return built;
  }
  function initAttrs(attrs) {
    let result = /* @__PURE__ */ Object.create(null);
    if (attrs)
      for (let name in attrs)
        result[name] = new Attribute(attrs[name]);
    return result;
  }
  class NodeType$1 {
    constructor(name, schema, spec) {
      this.name = name;
      this.schema = schema;
      this.spec = spec;
      this.markSet = null;
      this.groups = spec.group ? spec.group.split(" ") : [];
      this.attrs = initAttrs(spec.attrs);
      this.defaultAttrs = defaultAttrs(this.attrs);
      this.contentMatch = null;
      this.inlineContent = null;
      this.isBlock = !(spec.inline || name == "text");
      this.isText = name == "text";
    }
    get isInline() {
      return !this.isBlock;
    }
    get isTextblock() {
      return this.isBlock && this.inlineContent;
    }
    get isLeaf() {
      return this.contentMatch == ContentMatch.empty;
    }
    get isAtom() {
      return this.isLeaf || !!this.spec.atom;
    }
    get whitespace() {
      return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
    }
    hasRequiredAttrs() {
      for (let n in this.attrs)
        if (this.attrs[n].isRequired)
          return true;
      return false;
    }
    compatibleContent(other) {
      return this == other || this.contentMatch.compatible(other.contentMatch);
    }
    computeAttrs(attrs) {
      if (!attrs && this.defaultAttrs)
        return this.defaultAttrs;
      else
        return computeAttrs(this.attrs, attrs);
    }
    create(attrs = null, content, marks) {
      if (this.isText)
        throw new Error("NodeType.create can't construct text nodes");
      return new Node$1(this, this.computeAttrs(attrs), Fragment.from(content), Mark$1.setFrom(marks));
    }
    createChecked(attrs = null, content, marks) {
      content = Fragment.from(content);
      this.checkContent(content);
      return new Node$1(this, this.computeAttrs(attrs), content, Mark$1.setFrom(marks));
    }
    createAndFill(attrs = null, content, marks) {
      attrs = this.computeAttrs(attrs);
      content = Fragment.from(content);
      if (content.size) {
        let before = this.contentMatch.fillBefore(content);
        if (!before)
          return null;
        content = before.append(content);
      }
      let matched = this.contentMatch.matchFragment(content);
      let after = matched && matched.fillBefore(Fragment.empty, true);
      if (!after)
        return null;
      return new Node$1(this, attrs, content.append(after), Mark$1.setFrom(marks));
    }
    validContent(content) {
      let result = this.contentMatch.matchFragment(content);
      if (!result || !result.validEnd)
        return false;
      for (let i2 = 0; i2 < content.childCount; i2++)
        if (!this.allowsMarks(content.child(i2).marks))
          return false;
      return true;
    }
    checkContent(content) {
      if (!this.validContent(content))
        throw new RangeError(`Invalid content for node ${this.name}: ${content.toString().slice(0, 50)}`);
    }
    allowsMarkType(markType) {
      return this.markSet == null || this.markSet.indexOf(markType) > -1;
    }
    allowsMarks(marks) {
      if (this.markSet == null)
        return true;
      for (let i2 = 0; i2 < marks.length; i2++)
        if (!this.allowsMarkType(marks[i2].type))
          return false;
      return true;
    }
    allowedMarks(marks) {
      if (this.markSet == null)
        return marks;
      let copy2;
      for (let i2 = 0; i2 < marks.length; i2++) {
        if (!this.allowsMarkType(marks[i2].type)) {
          if (!copy2)
            copy2 = marks.slice(0, i2);
        } else if (copy2) {
          copy2.push(marks[i2]);
        }
      }
      return !copy2 ? marks : copy2.length ? copy2 : Mark$1.none;
    }
    static compile(nodes, schema) {
      let result = /* @__PURE__ */ Object.create(null);
      nodes.forEach((name, spec) => result[name] = new NodeType$1(name, schema, spec));
      let topType = schema.spec.topNode || "doc";
      if (!result[topType])
        throw new RangeError("Schema is missing its top node type ('" + topType + "')");
      if (!result.text)
        throw new RangeError("Every schema needs a 'text' type");
      for (let _ in result.text.attrs)
        throw new RangeError("The text node type should not have attributes");
      return result;
    }
  }
  class Attribute {
    constructor(options) {
      this.hasDefault = Object.prototype.hasOwnProperty.call(options, "default");
      this.default = options.default;
    }
    get isRequired() {
      return !this.hasDefault;
    }
  }
  class MarkType {
    constructor(name, rank, schema, spec) {
      this.name = name;
      this.rank = rank;
      this.schema = schema;
      this.spec = spec;
      this.attrs = initAttrs(spec.attrs);
      this.excluded = null;
      let defaults2 = defaultAttrs(this.attrs);
      this.instance = defaults2 ? new Mark$1(this, defaults2) : null;
    }
    create(attrs = null) {
      if (!attrs && this.instance)
        return this.instance;
      return new Mark$1(this, computeAttrs(this.attrs, attrs));
    }
    static compile(marks, schema) {
      let result = /* @__PURE__ */ Object.create(null), rank = 0;
      marks.forEach((name, spec) => result[name] = new MarkType(name, rank++, schema, spec));
      return result;
    }
    removeFromSet(set) {
      for (var i2 = 0; i2 < set.length; i2++)
        if (set[i2].type == this) {
          set = set.slice(0, i2).concat(set.slice(i2 + 1));
          i2--;
        }
      return set;
    }
    isInSet(set) {
      for (let i2 = 0; i2 < set.length; i2++)
        if (set[i2].type == this)
          return set[i2];
    }
    excludes(other) {
      return this.excluded.indexOf(other) > -1;
    }
  }
  class Schema {
    constructor(spec) {
      this.cached = /* @__PURE__ */ Object.create(null);
      let instanceSpec = this.spec = {};
      for (let prop in spec)
        instanceSpec[prop] = spec[prop];
      instanceSpec.nodes = OrderedMap.from(spec.nodes), instanceSpec.marks = OrderedMap.from(spec.marks || {}), this.nodes = NodeType$1.compile(this.spec.nodes, this);
      this.marks = MarkType.compile(this.spec.marks, this);
      let contentExprCache = /* @__PURE__ */ Object.create(null);
      for (let prop in this.nodes) {
        if (prop in this.marks)
          throw new RangeError(prop + " can not be both a node and a mark");
        let type = this.nodes[prop], contentExpr = type.spec.content || "", markExpr = type.spec.marks;
        type.contentMatch = contentExprCache[contentExpr] || (contentExprCache[contentExpr] = ContentMatch.parse(contentExpr, this.nodes));
        type.inlineContent = type.contentMatch.inlineContent;
        type.markSet = markExpr == "_" ? null : markExpr ? gatherMarks(this, markExpr.split(" ")) : markExpr == "" || !type.inlineContent ? [] : null;
      }
      for (let prop in this.marks) {
        let type = this.marks[prop], excl = type.spec.excludes;
        type.excluded = excl == null ? [type] : excl == "" ? [] : gatherMarks(this, excl.split(" "));
      }
      this.nodeFromJSON = this.nodeFromJSON.bind(this);
      this.markFromJSON = this.markFromJSON.bind(this);
      this.topNodeType = this.nodes[this.spec.topNode || "doc"];
      this.cached.wrappings = /* @__PURE__ */ Object.create(null);
    }
    node(type, attrs = null, content, marks) {
      if (typeof type == "string")
        type = this.nodeType(type);
      else if (!(type instanceof NodeType$1))
        throw new RangeError("Invalid node type: " + type);
      else if (type.schema != this)
        throw new RangeError("Node type from different schema used (" + type.name + ")");
      return type.createChecked(attrs, content, marks);
    }
    text(text2, marks) {
      let type = this.nodes.text;
      return new TextNode(type, type.defaultAttrs, text2, Mark$1.setFrom(marks));
    }
    mark(type, attrs) {
      if (typeof type == "string")
        type = this.marks[type];
      return type.create(attrs);
    }
    nodeFromJSON(json) {
      return Node$1.fromJSON(this, json);
    }
    markFromJSON(json) {
      return Mark$1.fromJSON(this, json);
    }
    nodeType(name) {
      let found2 = this.nodes[name];
      if (!found2)
        throw new RangeError("Unknown node type: " + name);
      return found2;
    }
  }
  function gatherMarks(schema, marks) {
    let found2 = [];
    for (let i2 = 0; i2 < marks.length; i2++) {
      let name = marks[i2], mark = schema.marks[name], ok = mark;
      if (mark) {
        found2.push(mark);
      } else {
        for (let prop in schema.marks) {
          let mark2 = schema.marks[prop];
          if (name == "_" || mark2.spec.group && mark2.spec.group.split(" ").indexOf(name) > -1)
            found2.push(ok = mark2);
        }
      }
      if (!ok)
        throw new SyntaxError("Unknown mark type: '" + marks[i2] + "'");
    }
    return found2;
  }
  class DOMParser {
    constructor(schema, rules) {
      this.schema = schema;
      this.rules = rules;
      this.tags = [];
      this.styles = [];
      rules.forEach((rule) => {
        if (rule.tag)
          this.tags.push(rule);
        else if (rule.style)
          this.styles.push(rule);
      });
      this.normalizeLists = !this.tags.some((r) => {
        if (!/^(ul|ol)\b/.test(r.tag) || !r.node)
          return false;
        let node = schema.nodes[r.node];
        return node.contentMatch.matchType(node);
      });
    }
    parse(dom, options = {}) {
      let context = new ParseContext(this, options, false);
      context.addAll(dom, options.from, options.to);
      return context.finish();
    }
    parseSlice(dom, options = {}) {
      let context = new ParseContext(this, options, true);
      context.addAll(dom, options.from, options.to);
      return Slice.maxOpen(context.finish());
    }
    matchTag(dom, context, after) {
      for (let i2 = after ? this.tags.indexOf(after) + 1 : 0; i2 < this.tags.length; i2++) {
        let rule = this.tags[i2];
        if (matches(dom, rule.tag) && (rule.namespace === void 0 || dom.namespaceURI == rule.namespace) && (!rule.context || context.matchesContext(rule.context))) {
          if (rule.getAttrs) {
            let result = rule.getAttrs(dom);
            if (result === false)
              continue;
            rule.attrs = result || void 0;
          }
          return rule;
        }
      }
    }
    matchStyle(prop, value, context, after) {
      for (let i2 = after ? this.styles.indexOf(after) + 1 : 0; i2 < this.styles.length; i2++) {
        let rule = this.styles[i2], style2 = rule.style;
        if (style2.indexOf(prop) != 0 || rule.context && !context.matchesContext(rule.context) || style2.length > prop.length && (style2.charCodeAt(prop.length) != 61 || style2.slice(prop.length + 1) != value))
          continue;
        if (rule.getAttrs) {
          let result = rule.getAttrs(value);
          if (result === false)
            continue;
          rule.attrs = result || void 0;
        }
        return rule;
      }
    }
    static schemaRules(schema) {
      let result = [];
      function insert(rule) {
        let priority = rule.priority == null ? 50 : rule.priority, i2 = 0;
        for (; i2 < result.length; i2++) {
          let next = result[i2], nextPriority = next.priority == null ? 50 : next.priority;
          if (nextPriority < priority)
            break;
        }
        result.splice(i2, 0, rule);
      }
      for (let name in schema.marks) {
        let rules = schema.marks[name].spec.parseDOM;
        if (rules)
          rules.forEach((rule) => {
            insert(rule = copy(rule));
            rule.mark = name;
          });
      }
      for (let name in schema.nodes) {
        let rules = schema.nodes[name].spec.parseDOM;
        if (rules)
          rules.forEach((rule) => {
            insert(rule = copy(rule));
            rule.node = name;
          });
      }
      return result;
    }
    static fromSchema(schema) {
      return schema.cached.domParser || (schema.cached.domParser = new DOMParser(schema, DOMParser.schemaRules(schema)));
    }
  }
  const blockTags = {
    address: true,
    article: true,
    aside: true,
    blockquote: true,
    canvas: true,
    dd: true,
    div: true,
    dl: true,
    fieldset: true,
    figcaption: true,
    figure: true,
    footer: true,
    form: true,
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true,
    header: true,
    hgroup: true,
    hr: true,
    li: true,
    noscript: true,
    ol: true,
    output: true,
    p: true,
    pre: true,
    section: true,
    table: true,
    tfoot: true,
    ul: true
  };
  const ignoreTags = {
    head: true,
    noscript: true,
    object: true,
    script: true,
    style: true,
    title: true
  };
  const listTags = { ol: true, ul: true };
  const OPT_PRESERVE_WS = 1, OPT_PRESERVE_WS_FULL = 2, OPT_OPEN_LEFT = 4;
  function wsOptionsFor(type, preserveWhitespace, base2) {
    if (preserveWhitespace != null)
      return (preserveWhitespace ? OPT_PRESERVE_WS : 0) | (preserveWhitespace === "full" ? OPT_PRESERVE_WS_FULL : 0);
    return type && type.whitespace == "pre" ? OPT_PRESERVE_WS | OPT_PRESERVE_WS_FULL : base2 & ~OPT_OPEN_LEFT;
  }
  class NodeContext {
    constructor(type, attrs, marks, pendingMarks, solid, match, options) {
      this.type = type;
      this.attrs = attrs;
      this.marks = marks;
      this.pendingMarks = pendingMarks;
      this.solid = solid;
      this.options = options;
      this.content = [];
      this.activeMarks = Mark$1.none;
      this.stashMarks = [];
      this.match = match || (options & OPT_OPEN_LEFT ? null : type.contentMatch);
    }
    findWrapping(node) {
      if (!this.match) {
        if (!this.type)
          return [];
        let fill = this.type.contentMatch.fillBefore(Fragment.from(node));
        if (fill) {
          this.match = this.type.contentMatch.matchFragment(fill);
        } else {
          let start = this.type.contentMatch, wrap2;
          if (wrap2 = start.findWrapping(node.type)) {
            this.match = start;
            return wrap2;
          } else {
            return null;
          }
        }
      }
      return this.match.findWrapping(node.type);
    }
    finish(openEnd) {
      if (!(this.options & OPT_PRESERVE_WS)) {
        let last = this.content[this.content.length - 1], m;
        if (last && last.isText && (m = /[ \t\r\n\u000c]+$/.exec(last.text))) {
          let text2 = last;
          if (last.text.length == m[0].length)
            this.content.pop();
          else
            this.content[this.content.length - 1] = text2.withText(text2.text.slice(0, text2.text.length - m[0].length));
        }
      }
      let content = Fragment.from(this.content);
      if (!openEnd && this.match)
        content = content.append(this.match.fillBefore(Fragment.empty, true));
      return this.type ? this.type.create(this.attrs, content, this.marks) : content;
    }
    popFromStashMark(mark) {
      for (let i2 = this.stashMarks.length - 1; i2 >= 0; i2--)
        if (mark.eq(this.stashMarks[i2]))
          return this.stashMarks.splice(i2, 1)[0];
    }
    applyPending(nextType) {
      for (let i2 = 0, pending = this.pendingMarks; i2 < pending.length; i2++) {
        let mark = pending[i2];
        if ((this.type ? this.type.allowsMarkType(mark.type) : markMayApply(mark.type, nextType)) && !mark.isInSet(this.activeMarks)) {
          this.activeMarks = mark.addToSet(this.activeMarks);
          this.pendingMarks = mark.removeFromSet(this.pendingMarks);
        }
      }
    }
    inlineContext(node) {
      if (this.type)
        return this.type.inlineContent;
      if (this.content.length)
        return this.content[0].isInline;
      return node.parentNode && !blockTags.hasOwnProperty(node.parentNode.nodeName.toLowerCase());
    }
  }
  class ParseContext {
    constructor(parser, options, isOpen) {
      this.parser = parser;
      this.options = options;
      this.isOpen = isOpen;
      this.open = 0;
      let topNode = options.topNode, topContext;
      let topOptions = wsOptionsFor(null, options.preserveWhitespace, 0) | (isOpen ? OPT_OPEN_LEFT : 0);
      if (topNode)
        topContext = new NodeContext(topNode.type, topNode.attrs, Mark$1.none, Mark$1.none, true, options.topMatch || topNode.type.contentMatch, topOptions);
      else if (isOpen)
        topContext = new NodeContext(null, null, Mark$1.none, Mark$1.none, true, null, topOptions);
      else
        topContext = new NodeContext(parser.schema.topNodeType, null, Mark$1.none, Mark$1.none, true, null, topOptions);
      this.nodes = [topContext];
      this.find = options.findPositions;
      this.needsBlock = false;
    }
    get top() {
      return this.nodes[this.open];
    }
    addDOM(dom) {
      if (dom.nodeType == 3) {
        this.addTextNode(dom);
      } else if (dom.nodeType == 1) {
        let style2 = dom.getAttribute("style");
        let marks = style2 ? this.readStyles(parseStyles(style2)) : null, top = this.top;
        if (marks != null)
          for (let i2 = 0; i2 < marks.length; i2++)
            this.addPendingMark(marks[i2]);
        this.addElement(dom);
        if (marks != null)
          for (let i2 = 0; i2 < marks.length; i2++)
            this.removePendingMark(marks[i2], top);
      }
    }
    addTextNode(dom) {
      let value = dom.nodeValue;
      let top = this.top;
      if (top.options & OPT_PRESERVE_WS_FULL || top.inlineContext(dom) || /[^ \t\r\n\u000c]/.test(value)) {
        if (!(top.options & OPT_PRESERVE_WS)) {
          value = value.replace(/[ \t\r\n\u000c]+/g, " ");
          if (/^[ \t\r\n\u000c]/.test(value) && this.open == this.nodes.length - 1) {
            let nodeBefore = top.content[top.content.length - 1];
            let domNodeBefore = dom.previousSibling;
            if (!nodeBefore || domNodeBefore && domNodeBefore.nodeName == "BR" || nodeBefore.isText && /[ \t\r\n\u000c]$/.test(nodeBefore.text))
              value = value.slice(1);
          }
        } else if (!(top.options & OPT_PRESERVE_WS_FULL)) {
          value = value.replace(/\r?\n|\r/g, " ");
        } else {
          value = value.replace(/\r\n?/g, "\n");
        }
        if (value)
          this.insertNode(this.parser.schema.text(value));
        this.findInText(dom);
      } else {
        this.findInside(dom);
      }
    }
    addElement(dom, matchAfter) {
      let name = dom.nodeName.toLowerCase(), ruleID;
      if (listTags.hasOwnProperty(name) && this.parser.normalizeLists)
        normalizeList(dom);
      let rule = this.options.ruleFromNode && this.options.ruleFromNode(dom) || (ruleID = this.parser.matchTag(dom, this, matchAfter));
      if (rule ? rule.ignore : ignoreTags.hasOwnProperty(name)) {
        this.findInside(dom);
        this.ignoreFallback(dom);
      } else if (!rule || rule.skip || rule.closeParent) {
        if (rule && rule.closeParent)
          this.open = Math.max(0, this.open - 1);
        else if (rule && rule.skip.nodeType)
          dom = rule.skip;
        let sync, top = this.top, oldNeedsBlock = this.needsBlock;
        if (blockTags.hasOwnProperty(name)) {
          if (top.content.length && top.content[0].isInline && this.open) {
            this.open--;
            top = this.top;
          }
          sync = true;
          if (!top.type)
            this.needsBlock = true;
        } else if (!dom.firstChild) {
          this.leafFallback(dom);
          return;
        }
        this.addAll(dom);
        if (sync)
          this.sync(top);
        this.needsBlock = oldNeedsBlock;
      } else {
        this.addElementByRule(dom, rule, rule.consuming === false ? ruleID : void 0);
      }
    }
    leafFallback(dom) {
      if (dom.nodeName == "BR" && this.top.type && this.top.type.inlineContent)
        this.addTextNode(dom.ownerDocument.createTextNode("\n"));
    }
    ignoreFallback(dom) {
      if (dom.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent))
        this.findPlace(this.parser.schema.text("-"));
    }
    readStyles(styles2) {
      let marks = Mark$1.none;
      style:
        for (let i2 = 0; i2 < styles2.length; i2 += 2) {
          for (let after = void 0; ; ) {
            let rule = this.parser.matchStyle(styles2[i2], styles2[i2 + 1], this, after);
            if (!rule)
              continue style;
            if (rule.ignore)
              return null;
            marks = this.parser.schema.marks[rule.mark].create(rule.attrs).addToSet(marks);
            if (rule.consuming === false)
              after = rule;
            else
              break;
          }
        }
      return marks;
    }
    addElementByRule(dom, rule, continueAfter) {
      let sync, nodeType, mark;
      if (rule.node) {
        nodeType = this.parser.schema.nodes[rule.node];
        if (!nodeType.isLeaf) {
          sync = this.enter(nodeType, rule.attrs || null, rule.preserveWhitespace);
        } else if (!this.insertNode(nodeType.create(rule.attrs))) {
          this.leafFallback(dom);
        }
      } else {
        let markType = this.parser.schema.marks[rule.mark];
        mark = markType.create(rule.attrs);
        this.addPendingMark(mark);
      }
      let startIn = this.top;
      if (nodeType && nodeType.isLeaf) {
        this.findInside(dom);
      } else if (continueAfter) {
        this.addElement(dom, continueAfter);
      } else if (rule.getContent) {
        this.findInside(dom);
        rule.getContent(dom, this.parser.schema).forEach((node) => this.insertNode(node));
      } else {
        let contentDOM = dom;
        if (typeof rule.contentElement == "string")
          contentDOM = dom.querySelector(rule.contentElement);
        else if (typeof rule.contentElement == "function")
          contentDOM = rule.contentElement(dom);
        else if (rule.contentElement)
          contentDOM = rule.contentElement;
        this.findAround(dom, contentDOM, true);
        this.addAll(contentDOM);
      }
      if (sync && this.sync(startIn))
        this.open--;
      if (mark)
        this.removePendingMark(mark, startIn);
    }
    addAll(parent, startIndex, endIndex) {
      let index = startIndex || 0;
      for (let dom = startIndex ? parent.childNodes[startIndex] : parent.firstChild, end = endIndex == null ? null : parent.childNodes[endIndex]; dom != end; dom = dom.nextSibling, ++index) {
        this.findAtPoint(parent, index);
        this.addDOM(dom);
      }
      this.findAtPoint(parent, index);
    }
    findPlace(node) {
      let route, sync;
      for (let depth = this.open; depth >= 0; depth--) {
        let cx = this.nodes[depth];
        let found2 = cx.findWrapping(node);
        if (found2 && (!route || route.length > found2.length)) {
          route = found2;
          sync = cx;
          if (!found2.length)
            break;
        }
        if (cx.solid)
          break;
      }
      if (!route)
        return false;
      this.sync(sync);
      for (let i2 = 0; i2 < route.length; i2++)
        this.enterInner(route[i2], null, false);
      return true;
    }
    insertNode(node) {
      if (node.isInline && this.needsBlock && !this.top.type) {
        let block2 = this.textblockFromContext();
        if (block2)
          this.enterInner(block2);
      }
      if (this.findPlace(node)) {
        this.closeExtra();
        let top = this.top;
        top.applyPending(node.type);
        if (top.match)
          top.match = top.match.matchType(node.type);
        let marks = top.activeMarks;
        for (let i2 = 0; i2 < node.marks.length; i2++)
          if (!top.type || top.type.allowsMarkType(node.marks[i2].type))
            marks = node.marks[i2].addToSet(marks);
        top.content.push(node.mark(marks));
        return true;
      }
      return false;
    }
    enter(type, attrs, preserveWS) {
      let ok = this.findPlace(type.create(attrs));
      if (ok)
        this.enterInner(type, attrs, true, preserveWS);
      return ok;
    }
    enterInner(type, attrs = null, solid = false, preserveWS) {
      this.closeExtra();
      let top = this.top;
      top.applyPending(type);
      top.match = top.match && top.match.matchType(type);
      let options = wsOptionsFor(type, preserveWS, top.options);
      if (top.options & OPT_OPEN_LEFT && top.content.length == 0)
        options |= OPT_OPEN_LEFT;
      this.nodes.push(new NodeContext(type, attrs, top.activeMarks, top.pendingMarks, solid, null, options));
      this.open++;
    }
    closeExtra(openEnd = false) {
      let i2 = this.nodes.length - 1;
      if (i2 > this.open) {
        for (; i2 > this.open; i2--)
          this.nodes[i2 - 1].content.push(this.nodes[i2].finish(openEnd));
        this.nodes.length = this.open + 1;
      }
    }
    finish() {
      this.open = 0;
      this.closeExtra(this.isOpen);
      return this.nodes[0].finish(this.isOpen || this.options.topOpen);
    }
    sync(to) {
      for (let i2 = this.open; i2 >= 0; i2--)
        if (this.nodes[i2] == to) {
          this.open = i2;
          return true;
        }
      return false;
    }
    get currentPos() {
      this.closeExtra();
      let pos = 0;
      for (let i2 = this.open; i2 >= 0; i2--) {
        let content = this.nodes[i2].content;
        for (let j = content.length - 1; j >= 0; j--)
          pos += content[j].nodeSize;
        if (i2)
          pos++;
      }
      return pos;
    }
    findAtPoint(parent, offset) {
      if (this.find)
        for (let i2 = 0; i2 < this.find.length; i2++) {
          if (this.find[i2].node == parent && this.find[i2].offset == offset)
            this.find[i2].pos = this.currentPos;
        }
    }
    findInside(parent) {
      if (this.find)
        for (let i2 = 0; i2 < this.find.length; i2++) {
          if (this.find[i2].pos == null && parent.nodeType == 1 && parent.contains(this.find[i2].node))
            this.find[i2].pos = this.currentPos;
        }
    }
    findAround(parent, content, before) {
      if (parent != content && this.find)
        for (let i2 = 0; i2 < this.find.length; i2++) {
          if (this.find[i2].pos == null && parent.nodeType == 1 && parent.contains(this.find[i2].node)) {
            let pos = content.compareDocumentPosition(this.find[i2].node);
            if (pos & (before ? 2 : 4))
              this.find[i2].pos = this.currentPos;
          }
        }
    }
    findInText(textNode) {
      if (this.find)
        for (let i2 = 0; i2 < this.find.length; i2++) {
          if (this.find[i2].node == textNode)
            this.find[i2].pos = this.currentPos - (textNode.nodeValue.length - this.find[i2].offset);
        }
    }
    matchesContext(context) {
      if (context.indexOf("|") > -1)
        return context.split(/\s*\|\s*/).some(this.matchesContext, this);
      let parts = context.split("/");
      let option = this.options.context;
      let useRoot = !this.isOpen && (!option || option.parent.type == this.nodes[0].type);
      let minDepth = -(option ? option.depth + 1 : 0) + (useRoot ? 0 : 1);
      let match = (i2, depth) => {
        for (; i2 >= 0; i2--) {
          let part = parts[i2];
          if (part == "") {
            if (i2 == parts.length - 1 || i2 == 0)
              continue;
            for (; depth >= minDepth; depth--)
              if (match(i2 - 1, depth))
                return true;
            return false;
          } else {
            let next = depth > 0 || depth == 0 && useRoot ? this.nodes[depth].type : option && depth >= minDepth ? option.node(depth - minDepth).type : null;
            if (!next || next.name != part && next.groups.indexOf(part) == -1)
              return false;
            depth--;
          }
        }
        return true;
      };
      return match(parts.length - 1, this.open);
    }
    textblockFromContext() {
      let $context = this.options.context;
      if ($context)
        for (let d = $context.depth; d >= 0; d--) {
          let deflt = $context.node(d).contentMatchAt($context.indexAfter(d)).defaultType;
          if (deflt && deflt.isTextblock && deflt.defaultAttrs)
            return deflt;
        }
      for (let name in this.parser.schema.nodes) {
        let type = this.parser.schema.nodes[name];
        if (type.isTextblock && type.defaultAttrs)
          return type;
      }
    }
    addPendingMark(mark) {
      let found2 = findSameMarkInSet(mark, this.top.pendingMarks);
      if (found2)
        this.top.stashMarks.push(found2);
      this.top.pendingMarks = mark.addToSet(this.top.pendingMarks);
    }
    removePendingMark(mark, upto) {
      for (let depth = this.open; depth >= 0; depth--) {
        let level = this.nodes[depth];
        let found2 = level.pendingMarks.lastIndexOf(mark);
        if (found2 > -1) {
          level.pendingMarks = mark.removeFromSet(level.pendingMarks);
        } else {
          level.activeMarks = mark.removeFromSet(level.activeMarks);
          let stashMark = level.popFromStashMark(mark);
          if (stashMark && level.type && level.type.allowsMarkType(stashMark.type))
            level.activeMarks = stashMark.addToSet(level.activeMarks);
        }
        if (level == upto)
          break;
      }
    }
  }
  function normalizeList(dom) {
    for (let child = dom.firstChild, prevItem = null; child; child = child.nextSibling) {
      let name = child.nodeType == 1 ? child.nodeName.toLowerCase() : null;
      if (name && listTags.hasOwnProperty(name) && prevItem) {
        prevItem.appendChild(child);
        child = prevItem;
      } else if (name == "li") {
        prevItem = child;
      } else if (name) {
        prevItem = null;
      }
    }
  }
  function matches(dom, selector) {
    return (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector);
  }
  function parseStyles(style2) {
    let re = /\s*([\w-]+)\s*:\s*([^;]+)/g, m, result = [];
    while (m = re.exec(style2))
      result.push(m[1], m[2].trim());
    return result;
  }
  function copy(obj) {
    let copy2 = {};
    for (let prop in obj)
      copy2[prop] = obj[prop];
    return copy2;
  }
  function markMayApply(markType, nodeType) {
    let nodes = nodeType.schema.nodes;
    for (let name in nodes) {
      let parent = nodes[name];
      if (!parent.allowsMarkType(markType))
        continue;
      let seen = [], scan = (match) => {
        seen.push(match);
        for (let i2 = 0; i2 < match.edgeCount; i2++) {
          let { type, next } = match.edge(i2);
          if (type == nodeType)
            return true;
          if (seen.indexOf(next) < 0 && scan(next))
            return true;
        }
      };
      if (scan(parent.contentMatch))
        return true;
    }
  }
  function findSameMarkInSet(mark, set) {
    for (let i2 = 0; i2 < set.length; i2++) {
      if (mark.eq(set[i2]))
        return set[i2];
    }
  }
  class DOMSerializer {
    constructor(nodes, marks) {
      this.nodes = nodes;
      this.marks = marks;
    }
    serializeFragment(fragment, options = {}, target) {
      if (!target)
        target = doc$1(options).createDocumentFragment();
      let top = target, active = [];
      fragment.forEach((node) => {
        if (active.length || node.marks.length) {
          let keep = 0, rendered = 0;
          while (keep < active.length && rendered < node.marks.length) {
            let next = node.marks[rendered];
            if (!this.marks[next.type.name]) {
              rendered++;
              continue;
            }
            if (!next.eq(active[keep][0]) || next.type.spec.spanning === false)
              break;
            keep++;
            rendered++;
          }
          while (keep < active.length)
            top = active.pop()[1];
          while (rendered < node.marks.length) {
            let add = node.marks[rendered++];
            let markDOM = this.serializeMark(add, node.isInline, options);
            if (markDOM) {
              active.push([add, top]);
              top.appendChild(markDOM.dom);
              top = markDOM.contentDOM || markDOM.dom;
            }
          }
        }
        top.appendChild(this.serializeNodeInner(node, options));
      });
      return target;
    }
    serializeNodeInner(node, options) {
      let { dom, contentDOM } = DOMSerializer.renderSpec(doc$1(options), this.nodes[node.type.name](node));
      if (contentDOM) {
        if (node.isLeaf)
          throw new RangeError("Content hole not allowed in a leaf node spec");
        this.serializeFragment(node.content, options, contentDOM);
      }
      return dom;
    }
    serializeNode(node, options = {}) {
      let dom = this.serializeNodeInner(node, options);
      for (let i2 = node.marks.length - 1; i2 >= 0; i2--) {
        let wrap2 = this.serializeMark(node.marks[i2], node.isInline, options);
        if (wrap2) {
          (wrap2.contentDOM || wrap2.dom).appendChild(dom);
          dom = wrap2.dom;
        }
      }
      return dom;
    }
    serializeMark(mark, inline, options = {}) {
      let toDOM = this.marks[mark.type.name];
      return toDOM && DOMSerializer.renderSpec(doc$1(options), toDOM(mark, inline));
    }
    static renderSpec(doc2, structure, xmlNS = null) {
      if (typeof structure == "string")
        return { dom: doc2.createTextNode(structure) };
      if (structure.nodeType != null)
        return { dom: structure };
      if (structure.dom && structure.dom.nodeType != null)
        return structure;
      let tagName = structure[0], space = tagName.indexOf(" ");
      if (space > 0) {
        xmlNS = tagName.slice(0, space);
        tagName = tagName.slice(space + 1);
      }
      let contentDOM;
      let dom = xmlNS ? doc2.createElementNS(xmlNS, tagName) : doc2.createElement(tagName);
      let attrs = structure[1], start = 1;
      if (attrs && typeof attrs == "object" && attrs.nodeType == null && !Array.isArray(attrs)) {
        start = 2;
        for (let name in attrs)
          if (attrs[name] != null) {
            let space2 = name.indexOf(" ");
            if (space2 > 0)
              dom.setAttributeNS(name.slice(0, space2), name.slice(space2 + 1), attrs[name]);
            else
              dom.setAttribute(name, attrs[name]);
          }
      }
      for (let i2 = start; i2 < structure.length; i2++) {
        let child = structure[i2];
        if (child === 0) {
          if (i2 < structure.length - 1 || i2 > start)
            throw new RangeError("Content hole must be the only child of its parent node");
          return { dom, contentDOM: dom };
        } else {
          let { dom: inner, contentDOM: innerContent } = DOMSerializer.renderSpec(doc2, child, xmlNS);
          dom.appendChild(inner);
          if (innerContent) {
            if (contentDOM)
              throw new RangeError("Multiple content holes");
            contentDOM = innerContent;
          }
        }
      }
      return { dom, contentDOM };
    }
    static fromSchema(schema) {
      return schema.cached.domSerializer || (schema.cached.domSerializer = new DOMSerializer(this.nodesFromSchema(schema), this.marksFromSchema(schema)));
    }
    static nodesFromSchema(schema) {
      let result = gatherToDOM(schema.nodes);
      if (!result.text)
        result.text = (node) => node.text;
      return result;
    }
    static marksFromSchema(schema) {
      return gatherToDOM(schema.marks);
    }
  }
  function gatherToDOM(obj) {
    let result = {};
    for (let name in obj) {
      let toDOM = obj[name].spec.toDOM;
      if (toDOM)
        result[name] = toDOM;
    }
    return result;
  }
  function doc$1(options) {
    return options.document || window.document;
  }
  const lower16 = 65535;
  const factor16 = Math.pow(2, 16);
  function makeRecover(index, offset) {
    return index + offset * factor16;
  }
  function recoverIndex(value) {
    return value & lower16;
  }
  function recoverOffset(value) {
    return (value - (value & lower16)) / factor16;
  }
  const DEL_BEFORE = 1, DEL_AFTER = 2, DEL_ACROSS = 4, DEL_SIDE = 8;
  class MapResult {
    constructor(pos, delInfo, recover) {
      this.pos = pos;
      this.delInfo = delInfo;
      this.recover = recover;
    }
    get deleted() {
      return (this.delInfo & DEL_SIDE) > 0;
    }
    get deletedBefore() {
      return (this.delInfo & (DEL_BEFORE | DEL_ACROSS)) > 0;
    }
    get deletedAfter() {
      return (this.delInfo & (DEL_AFTER | DEL_ACROSS)) > 0;
    }
    get deletedAcross() {
      return (this.delInfo & DEL_ACROSS) > 0;
    }
  }
  class StepMap {
    constructor(ranges, inverted = false) {
      this.ranges = ranges;
      this.inverted = inverted;
      if (!ranges.length && StepMap.empty)
        return StepMap.empty;
    }
    recover(value) {
      let diff = 0, index = recoverIndex(value);
      if (!this.inverted)
        for (let i2 = 0; i2 < index; i2++)
          diff += this.ranges[i2 * 3 + 2] - this.ranges[i2 * 3 + 1];
      return this.ranges[index * 3] + diff + recoverOffset(value);
    }
    mapResult(pos, assoc = 1) {
      return this._map(pos, assoc, false);
    }
    map(pos, assoc = 1) {
      return this._map(pos, assoc, true);
    }
    _map(pos, assoc, simple) {
      let diff = 0, oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i2 = 0; i2 < this.ranges.length; i2 += 3) {
        let start = this.ranges[i2] - (this.inverted ? diff : 0);
        if (start > pos)
          break;
        let oldSize = this.ranges[i2 + oldIndex], newSize = this.ranges[i2 + newIndex], end = start + oldSize;
        if (pos <= end) {
          let side = !oldSize ? assoc : pos == start ? -1 : pos == end ? 1 : assoc;
          let result = start + diff + (side < 0 ? 0 : newSize);
          if (simple)
            return result;
          let recover = pos == (assoc < 0 ? start : end) ? null : makeRecover(i2 / 3, pos - start);
          let del = pos == start ? DEL_AFTER : pos == end ? DEL_BEFORE : DEL_ACROSS;
          if (assoc < 0 ? pos != start : pos != end)
            del |= DEL_SIDE;
          return new MapResult(result, del, recover);
        }
        diff += newSize - oldSize;
      }
      return simple ? pos + diff : new MapResult(pos + diff, 0, null);
    }
    touches(pos, recover) {
      let diff = 0, index = recoverIndex(recover);
      let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i2 = 0; i2 < this.ranges.length; i2 += 3) {
        let start = this.ranges[i2] - (this.inverted ? diff : 0);
        if (start > pos)
          break;
        let oldSize = this.ranges[i2 + oldIndex], end = start + oldSize;
        if (pos <= end && i2 == index * 3)
          return true;
        diff += this.ranges[i2 + newIndex] - oldSize;
      }
      return false;
    }
    forEach(f) {
      let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i2 = 0, diff = 0; i2 < this.ranges.length; i2 += 3) {
        let start = this.ranges[i2], oldStart = start - (this.inverted ? diff : 0), newStart = start + (this.inverted ? 0 : diff);
        let oldSize = this.ranges[i2 + oldIndex], newSize = this.ranges[i2 + newIndex];
        f(oldStart, oldStart + oldSize, newStart, newStart + newSize);
        diff += newSize - oldSize;
      }
    }
    invert() {
      return new StepMap(this.ranges, !this.inverted);
    }
    toString() {
      return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
    }
    static offset(n) {
      return n == 0 ? StepMap.empty : new StepMap(n < 0 ? [0, -n, 0] : [0, 0, n]);
    }
  }
  StepMap.empty = new StepMap([]);
  class Mapping {
    constructor(maps = [], mirror, from = 0, to = maps.length) {
      this.maps = maps;
      this.mirror = mirror;
      this.from = from;
      this.to = to;
    }
    slice(from = 0, to = this.maps.length) {
      return new Mapping(this.maps, this.mirror, from, to);
    }
    copy() {
      return new Mapping(this.maps.slice(), this.mirror && this.mirror.slice(), this.from, this.to);
    }
    appendMap(map, mirrors) {
      this.to = this.maps.push(map);
      if (mirrors != null)
        this.setMirror(this.maps.length - 1, mirrors);
    }
    appendMapping(mapping) {
      for (let i2 = 0, startSize = this.maps.length; i2 < mapping.maps.length; i2++) {
        let mirr = mapping.getMirror(i2);
        this.appendMap(mapping.maps[i2], mirr != null && mirr < i2 ? startSize + mirr : void 0);
      }
    }
    getMirror(n) {
      if (this.mirror) {
        for (let i2 = 0; i2 < this.mirror.length; i2++)
          if (this.mirror[i2] == n)
            return this.mirror[i2 + (i2 % 2 ? -1 : 1)];
      }
    }
    setMirror(n, m) {
      if (!this.mirror)
        this.mirror = [];
      this.mirror.push(n, m);
    }
    appendMappingInverted(mapping) {
      for (let i2 = mapping.maps.length - 1, totalSize = this.maps.length + mapping.maps.length; i2 >= 0; i2--) {
        let mirr = mapping.getMirror(i2);
        this.appendMap(mapping.maps[i2].invert(), mirr != null && mirr > i2 ? totalSize - mirr - 1 : void 0);
      }
    }
    invert() {
      let inverse = new Mapping();
      inverse.appendMappingInverted(this);
      return inverse;
    }
    map(pos, assoc = 1) {
      if (this.mirror)
        return this._map(pos, assoc, true);
      for (let i2 = this.from; i2 < this.to; i2++)
        pos = this.maps[i2].map(pos, assoc);
      return pos;
    }
    mapResult(pos, assoc = 1) {
      return this._map(pos, assoc, false);
    }
    _map(pos, assoc, simple) {
      let delInfo = 0;
      for (let i2 = this.from; i2 < this.to; i2++) {
        let map = this.maps[i2], result = map.mapResult(pos, assoc);
        if (result.recover != null) {
          let corr = this.getMirror(i2);
          if (corr != null && corr > i2 && corr < this.to) {
            i2 = corr;
            pos = this.maps[corr].recover(result.recover);
            continue;
          }
        }
        delInfo |= result.delInfo;
        pos = result.pos;
      }
      return simple ? pos : new MapResult(pos, delInfo, null);
    }
  }
  const stepsByID = /* @__PURE__ */ Object.create(null);
  class Step {
    getMap() {
      return StepMap.empty;
    }
    merge(other) {
      return null;
    }
    static fromJSON(schema, json) {
      if (!json || !json.stepType)
        throw new RangeError("Invalid input for Step.fromJSON");
      let type = stepsByID[json.stepType];
      if (!type)
        throw new RangeError(`No step type ${json.stepType} defined`);
      return type.fromJSON(schema, json);
    }
    static jsonID(id, stepClass) {
      if (id in stepsByID)
        throw new RangeError("Duplicate use of step JSON ID " + id);
      stepsByID[id] = stepClass;
      stepClass.prototype.jsonID = id;
      return stepClass;
    }
  }
  class StepResult {
    constructor(doc2, failed) {
      this.doc = doc2;
      this.failed = failed;
    }
    static ok(doc2) {
      return new StepResult(doc2, null);
    }
    static fail(message) {
      return new StepResult(null, message);
    }
    static fromReplace(doc2, from, to, slice) {
      try {
        return StepResult.ok(doc2.replace(from, to, slice));
      } catch (e) {
        if (e instanceof ReplaceError)
          return StepResult.fail(e.message);
        throw e;
      }
    }
  }
  function mapFragment(fragment, f, parent) {
    let mapped = [];
    for (let i2 = 0; i2 < fragment.childCount; i2++) {
      let child = fragment.child(i2);
      if (child.content.size)
        child = child.copy(mapFragment(child.content, f, child));
      if (child.isInline)
        child = f(child, parent, i2);
      mapped.push(child);
    }
    return Fragment.fromArray(mapped);
  }
  class AddMarkStep extends Step {
    constructor(from, to, mark) {
      super();
      this.from = from;
      this.to = to;
      this.mark = mark;
    }
    apply(doc2) {
      let oldSlice = doc2.slice(this.from, this.to), $from = doc2.resolve(this.from);
      let parent = $from.node($from.sharedDepth(this.to));
      let slice = new Slice(mapFragment(oldSlice.content, (node, parent2) => {
        if (!node.isAtom || !parent2.type.allowsMarkType(this.mark.type))
          return node;
        return node.mark(this.mark.addToSet(node.marks));
      }, parent), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc2, this.from, this.to, slice);
    }
    invert() {
      return new RemoveMarkStep(this.from, this.to, this.mark);
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos)
        return null;
      return new AddMarkStep(from.pos, to.pos, this.mark);
    }
    merge(other) {
      if (other instanceof AddMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
        return new AddMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
    toJSON() {
      return {
        stepType: "addMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
    static fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for AddMarkStep.fromJSON");
      return new AddMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
    }
  }
  Step.jsonID("addMark", AddMarkStep);
  class RemoveMarkStep extends Step {
    constructor(from, to, mark) {
      super();
      this.from = from;
      this.to = to;
      this.mark = mark;
    }
    apply(doc2) {
      let oldSlice = doc2.slice(this.from, this.to);
      let slice = new Slice(mapFragment(oldSlice.content, (node) => {
        return node.mark(this.mark.removeFromSet(node.marks));
      }, doc2), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc2, this.from, this.to, slice);
    }
    invert() {
      return new AddMarkStep(this.from, this.to, this.mark);
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos)
        return null;
      return new RemoveMarkStep(from.pos, to.pos, this.mark);
    }
    merge(other) {
      if (other instanceof RemoveMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
        return new RemoveMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
    toJSON() {
      return {
        stepType: "removeMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
    static fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
      return new RemoveMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
    }
  }
  Step.jsonID("removeMark", RemoveMarkStep);
  class AddNodeMarkStep extends Step {
    constructor(pos, mark) {
      super();
      this.pos = pos;
      this.mark = mark;
    }
    apply(doc2) {
      let node = doc2.nodeAt(this.pos);
      if (!node)
        return StepResult.fail("No node at mark step's position");
      let updated = node.type.create(node.attrs, null, this.mark.addToSet(node.marks));
      return StepResult.fromReplace(doc2, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
    }
    invert(doc2) {
      let node = doc2.nodeAt(this.pos);
      if (node) {
        let newSet = this.mark.addToSet(node.marks);
        if (newSet.length == node.marks.length) {
          for (let i2 = 0; i2 < node.marks.length; i2++)
            if (!node.marks[i2].isInSet(newSet))
              return new AddNodeMarkStep(this.pos, node.marks[i2]);
          return new AddNodeMarkStep(this.pos, this.mark);
        }
      }
      return new RemoveNodeMarkStep(this.pos, this.mark);
    }
    map(mapping) {
      let pos = mapping.mapResult(this.pos, 1);
      return pos.deletedAfter ? null : new AddNodeMarkStep(pos.pos, this.mark);
    }
    toJSON() {
      return { stepType: "addNodeMark", pos: this.pos, mark: this.mark.toJSON() };
    }
    static fromJSON(schema, json) {
      if (typeof json.pos != "number")
        throw new RangeError("Invalid input for AddNodeMarkStep.fromJSON");
      return new AddNodeMarkStep(json.pos, schema.markFromJSON(json.mark));
    }
  }
  Step.jsonID("addNodeMark", AddNodeMarkStep);
  class RemoveNodeMarkStep extends Step {
    constructor(pos, mark) {
      super();
      this.pos = pos;
      this.mark = mark;
    }
    apply(doc2) {
      let node = doc2.nodeAt(this.pos);
      if (!node)
        return StepResult.fail("No node at mark step's position");
      let updated = node.type.create(node.attrs, null, this.mark.removeFromSet(node.marks));
      return StepResult.fromReplace(doc2, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
    }
    invert(doc2) {
      let node = doc2.nodeAt(this.pos);
      if (!node || !this.mark.isInSet(node.marks))
        return this;
      return new AddNodeMarkStep(this.pos, this.mark);
    }
    map(mapping) {
      let pos = mapping.mapResult(this.pos, 1);
      return pos.deletedAfter ? null : new RemoveNodeMarkStep(pos.pos, this.mark);
    }
    toJSON() {
      return { stepType: "removeNodeMark", pos: this.pos, mark: this.mark.toJSON() };
    }
    static fromJSON(schema, json) {
      if (typeof json.pos != "number")
        throw new RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
      return new RemoveNodeMarkStep(json.pos, schema.markFromJSON(json.mark));
    }
  }
  Step.jsonID("removeNodeMark", RemoveNodeMarkStep);
  class ReplaceStep extends Step {
    constructor(from, to, slice, structure = false) {
      super();
      this.from = from;
      this.to = to;
      this.slice = slice;
      this.structure = structure;
    }
    apply(doc2) {
      if (this.structure && contentBetween(doc2, this.from, this.to))
        return StepResult.fail("Structure replace would overwrite content");
      return StepResult.fromReplace(doc2, this.from, this.to, this.slice);
    }
    getMap() {
      return new StepMap([this.from, this.to - this.from, this.slice.size]);
    }
    invert(doc2) {
      return new ReplaceStep(this.from, this.from + this.slice.size, doc2.slice(this.from, this.to));
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deletedAcross && to.deletedAcross)
        return null;
      return new ReplaceStep(from.pos, Math.max(from.pos, to.pos), this.slice);
    }
    merge(other) {
      if (!(other instanceof ReplaceStep) || other.structure || this.structure)
        return null;
      if (this.from + this.slice.size == other.from && !this.slice.openEnd && !other.slice.openStart) {
        let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(this.slice.content.append(other.slice.content), this.slice.openStart, other.slice.openEnd);
        return new ReplaceStep(this.from, this.to + (other.to - other.from), slice, this.structure);
      } else if (other.to == this.from && !this.slice.openStart && !other.slice.openEnd) {
        let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(other.slice.content.append(this.slice.content), other.slice.openStart, this.slice.openEnd);
        return new ReplaceStep(other.from, this.to, slice, this.structure);
      } else {
        return null;
      }
    }
    toJSON() {
      let json = { stepType: "replace", from: this.from, to: this.to };
      if (this.slice.size)
        json.slice = this.slice.toJSON();
      if (this.structure)
        json.structure = true;
      return json;
    }
    static fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for ReplaceStep.fromJSON");
      return new ReplaceStep(json.from, json.to, Slice.fromJSON(schema, json.slice), !!json.structure);
    }
  }
  Step.jsonID("replace", ReplaceStep);
  class ReplaceAroundStep extends Step {
    constructor(from, to, gapFrom, gapTo, slice, insert, structure = false) {
      super();
      this.from = from;
      this.to = to;
      this.gapFrom = gapFrom;
      this.gapTo = gapTo;
      this.slice = slice;
      this.insert = insert;
      this.structure = structure;
    }
    apply(doc2) {
      if (this.structure && (contentBetween(doc2, this.from, this.gapFrom) || contentBetween(doc2, this.gapTo, this.to)))
        return StepResult.fail("Structure gap-replace would overwrite content");
      let gap = doc2.slice(this.gapFrom, this.gapTo);
      if (gap.openStart || gap.openEnd)
        return StepResult.fail("Gap is not a flat range");
      let inserted = this.slice.insertAt(this.insert, gap.content);
      if (!inserted)
        return StepResult.fail("Content does not fit in gap");
      return StepResult.fromReplace(doc2, this.from, this.to, inserted);
    }
    getMap() {
      return new StepMap([
        this.from,
        this.gapFrom - this.from,
        this.insert,
        this.gapTo,
        this.to - this.gapTo,
        this.slice.size - this.insert
      ]);
    }
    invert(doc2) {
      let gap = this.gapTo - this.gapFrom;
      return new ReplaceAroundStep(this.from, this.from + this.slice.size + gap, this.from + this.insert, this.from + this.insert + gap, doc2.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      let gapFrom = mapping.map(this.gapFrom, -1), gapTo = mapping.map(this.gapTo, 1);
      if (from.deletedAcross && to.deletedAcross || gapFrom < from.pos || gapTo > to.pos)
        return null;
      return new ReplaceAroundStep(from.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure);
    }
    toJSON() {
      let json = {
        stepType: "replaceAround",
        from: this.from,
        to: this.to,
        gapFrom: this.gapFrom,
        gapTo: this.gapTo,
        insert: this.insert
      };
      if (this.slice.size)
        json.slice = this.slice.toJSON();
      if (this.structure)
        json.structure = true;
      return json;
    }
    static fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number" || typeof json.gapFrom != "number" || typeof json.gapTo != "number" || typeof json.insert != "number")
        throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
      return new ReplaceAroundStep(json.from, json.to, json.gapFrom, json.gapTo, Slice.fromJSON(schema, json.slice), json.insert, !!json.structure);
    }
  }
  Step.jsonID("replaceAround", ReplaceAroundStep);
  function contentBetween(doc2, from, to) {
    let $from = doc2.resolve(from), dist = to - from, depth = $from.depth;
    while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
      depth--;
      dist--;
    }
    if (dist > 0) {
      let next = $from.node(depth).maybeChild($from.indexAfter(depth));
      while (dist > 0) {
        if (!next || next.isLeaf)
          return true;
        next = next.firstChild;
        dist--;
      }
    }
    return false;
  }
  function addMark(tr, from, to, mark) {
    let removed = [], added = [];
    let removing, adding;
    tr.doc.nodesBetween(from, to, (node, pos, parent) => {
      if (!node.isInline)
        return;
      let marks = node.marks;
      if (!mark.isInSet(marks) && parent.type.allowsMarkType(mark.type)) {
        let start = Math.max(pos, from), end = Math.min(pos + node.nodeSize, to);
        let newSet = mark.addToSet(marks);
        for (let i2 = 0; i2 < marks.length; i2++) {
          if (!marks[i2].isInSet(newSet)) {
            if (removing && removing.to == start && removing.mark.eq(marks[i2]))
              removing.to = end;
            else
              removed.push(removing = new RemoveMarkStep(start, end, marks[i2]));
          }
        }
        if (adding && adding.to == start)
          adding.to = end;
        else
          added.push(adding = new AddMarkStep(start, end, mark));
      }
    });
    removed.forEach((s) => tr.step(s));
    added.forEach((s) => tr.step(s));
  }
  function removeMark(tr, from, to, mark) {
    let matched = [], step = 0;
    tr.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isInline)
        return;
      step++;
      let toRemove = null;
      if (mark instanceof MarkType) {
        let set = node.marks, found2;
        while (found2 = mark.isInSet(set)) {
          (toRemove || (toRemove = [])).push(found2);
          set = found2.removeFromSet(set);
        }
      } else if (mark) {
        if (mark.isInSet(node.marks))
          toRemove = [mark];
      } else {
        toRemove = node.marks;
      }
      if (toRemove && toRemove.length) {
        let end = Math.min(pos + node.nodeSize, to);
        for (let i2 = 0; i2 < toRemove.length; i2++) {
          let style2 = toRemove[i2], found2;
          for (let j = 0; j < matched.length; j++) {
            let m = matched[j];
            if (m.step == step - 1 && style2.eq(matched[j].style))
              found2 = m;
          }
          if (found2) {
            found2.to = end;
            found2.step = step;
          } else {
            matched.push({ style: style2, from: Math.max(pos, from), to: end, step });
          }
        }
      }
    });
    matched.forEach((m) => tr.step(new RemoveMarkStep(m.from, m.to, m.style)));
  }
  function clearIncompatible(tr, pos, parentType, match = parentType.contentMatch) {
    let node = tr.doc.nodeAt(pos);
    let delSteps = [], cur = pos + 1;
    for (let i2 = 0; i2 < node.childCount; i2++) {
      let child = node.child(i2), end = cur + child.nodeSize;
      let allowed = match.matchType(child.type);
      if (!allowed) {
        delSteps.push(new ReplaceStep(cur, end, Slice.empty));
      } else {
        match = allowed;
        for (let j = 0; j < child.marks.length; j++)
          if (!parentType.allowsMarkType(child.marks[j].type))
            tr.step(new RemoveMarkStep(cur, end, child.marks[j]));
      }
      cur = end;
    }
    if (!match.validEnd) {
      let fill = match.fillBefore(Fragment.empty, true);
      tr.replace(cur, cur, new Slice(fill, 0, 0));
    }
    for (let i2 = delSteps.length - 1; i2 >= 0; i2--)
      tr.step(delSteps[i2]);
  }
  function canCut(node, start, end) {
    return (start == 0 || node.canReplace(start, node.childCount)) && (end == node.childCount || node.canReplace(0, end));
  }
  function liftTarget(range) {
    let parent = range.parent;
    let content = parent.content.cutByIndex(range.startIndex, range.endIndex);
    for (let depth = range.depth; ; --depth) {
      let node = range.$from.node(depth);
      let index = range.$from.index(depth), endIndex = range.$to.indexAfter(depth);
      if (depth < range.depth && node.canReplace(index, endIndex, content))
        return depth;
      if (depth == 0 || node.type.spec.isolating || !canCut(node, index, endIndex))
        break;
    }
    return null;
  }
  function lift$2(tr, range, target) {
    let { $from, $to, depth } = range;
    let gapStart = $from.before(depth + 1), gapEnd = $to.after(depth + 1);
    let start = gapStart, end = gapEnd;
    let before = Fragment.empty, openStart = 0;
    for (let d = depth, splitting = false; d > target; d--)
      if (splitting || $from.index(d) > 0) {
        splitting = true;
        before = Fragment.from($from.node(d).copy(before));
        openStart++;
      } else {
        start--;
      }
    let after = Fragment.empty, openEnd = 0;
    for (let d = depth, splitting = false; d > target; d--)
      if (splitting || $to.after(d + 1) < $to.end(d)) {
        splitting = true;
        after = Fragment.from($to.node(d).copy(after));
        openEnd++;
      } else {
        end++;
      }
    tr.step(new ReplaceAroundStep(start, end, gapStart, gapEnd, new Slice(before.append(after), openStart, openEnd), before.size - openStart, true));
  }
  function findWrapping(range, nodeType, attrs = null, innerRange = range) {
    let around = findWrappingOutside(range, nodeType);
    let inner = around && findWrappingInside(innerRange, nodeType);
    if (!inner)
      return null;
    return around.map(withAttrs).concat({ type: nodeType, attrs }).concat(inner.map(withAttrs));
  }
  function withAttrs(type) {
    return { type, attrs: null };
  }
  function findWrappingOutside(range, type) {
    let { parent, startIndex, endIndex } = range;
    let around = parent.contentMatchAt(startIndex).findWrapping(type);
    if (!around)
      return null;
    let outer = around.length ? around[0] : type;
    return parent.canReplaceWith(startIndex, endIndex, outer) ? around : null;
  }
  function findWrappingInside(range, type) {
    let { parent, startIndex, endIndex } = range;
    let inner = parent.child(startIndex);
    let inside = type.contentMatch.findWrapping(inner.type);
    if (!inside)
      return null;
    let lastType = inside.length ? inside[inside.length - 1] : type;
    let innerMatch = lastType.contentMatch;
    for (let i2 = startIndex; innerMatch && i2 < endIndex; i2++)
      innerMatch = innerMatch.matchType(parent.child(i2).type);
    if (!innerMatch || !innerMatch.validEnd)
      return null;
    return inside;
  }
  function wrap(tr, range, wrappers) {
    let content = Fragment.empty;
    for (let i2 = wrappers.length - 1; i2 >= 0; i2--) {
      if (content.size) {
        let match = wrappers[i2].type.contentMatch.matchFragment(content);
        if (!match || !match.validEnd)
          throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
      }
      content = Fragment.from(wrappers[i2].type.create(wrappers[i2].attrs, content));
    }
    let start = range.start, end = range.end;
    tr.step(new ReplaceAroundStep(start, end, start, end, new Slice(content, 0, 0), wrappers.length, true));
  }
  function setBlockType$1(tr, from, to, type, attrs) {
    if (!type.isTextblock)
      throw new RangeError("Type given to setBlockType should be a textblock");
    let mapFrom = tr.steps.length;
    tr.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isTextblock && !node.hasMarkup(type, attrs) && canChangeType(tr.doc, tr.mapping.slice(mapFrom).map(pos), type)) {
        tr.clearIncompatible(tr.mapping.slice(mapFrom).map(pos, 1), type);
        let mapping = tr.mapping.slice(mapFrom);
        let startM = mapping.map(pos, 1), endM = mapping.map(pos + node.nodeSize, 1);
        tr.step(new ReplaceAroundStep(startM, endM, startM + 1, endM - 1, new Slice(Fragment.from(type.create(attrs, null, node.marks)), 0, 0), 1, true));
        return false;
      }
    });
  }
  function canChangeType(doc2, pos, type) {
    let $pos = doc2.resolve(pos), index = $pos.index();
    return $pos.parent.canReplaceWith(index, index + 1, type);
  }
  function setNodeMarkup(tr, pos, type, attrs, marks) {
    let node = tr.doc.nodeAt(pos);
    if (!node)
      throw new RangeError("No node at given position");
    if (!type)
      type = node.type;
    let newNode = type.create(attrs, null, marks || node.marks);
    if (node.isLeaf)
      return tr.replaceWith(pos, pos + node.nodeSize, newNode);
    if (!type.validContent(node.content))
      throw new RangeError("Invalid content for node type " + type.name);
    tr.step(new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1, pos + node.nodeSize - 1, new Slice(Fragment.from(newNode), 0, 0), 1, true));
  }
  function canSplit(doc2, pos, depth = 1, typesAfter) {
    let $pos = doc2.resolve(pos), base2 = $pos.depth - depth;
    let innerType = typesAfter && typesAfter[typesAfter.length - 1] || $pos.parent;
    if (base2 < 0 || $pos.parent.type.spec.isolating || !$pos.parent.canReplace($pos.index(), $pos.parent.childCount) || !innerType.type.validContent($pos.parent.content.cutByIndex($pos.index(), $pos.parent.childCount)))
      return false;
    for (let d = $pos.depth - 1, i2 = depth - 2; d > base2; d--, i2--) {
      let node = $pos.node(d), index2 = $pos.index(d);
      if (node.type.spec.isolating)
        return false;
      let rest = node.content.cutByIndex(index2, node.childCount);
      let after = typesAfter && typesAfter[i2] || node;
      if (after != node)
        rest = rest.replaceChild(0, after.type.create(after.attrs));
      if (!node.canReplace(index2 + 1, node.childCount) || !after.type.validContent(rest))
        return false;
    }
    let index = $pos.indexAfter(base2);
    let baseType = typesAfter && typesAfter[0];
    return $pos.node(base2).canReplaceWith(index, index, baseType ? baseType.type : $pos.node(base2 + 1).type);
  }
  function split(tr, pos, depth = 1, typesAfter) {
    let $pos = tr.doc.resolve(pos), before = Fragment.empty, after = Fragment.empty;
    for (let d = $pos.depth, e = $pos.depth - depth, i2 = depth - 1; d > e; d--, i2--) {
      before = Fragment.from($pos.node(d).copy(before));
      let typeAfter = typesAfter && typesAfter[i2];
      after = Fragment.from(typeAfter ? typeAfter.type.create(typeAfter.attrs, after) : $pos.node(d).copy(after));
    }
    tr.step(new ReplaceStep(pos, pos, new Slice(before.append(after), depth, depth), true));
  }
  function canJoin(doc2, pos) {
    let $pos = doc2.resolve(pos), index = $pos.index();
    return joinable($pos.nodeBefore, $pos.nodeAfter) && $pos.parent.canReplace(index, index + 1);
  }
  function joinable(a, b) {
    return !!(a && b && !a.isLeaf && a.canAppend(b));
  }
  function joinPoint(doc2, pos, dir = -1) {
    let $pos = doc2.resolve(pos);
    for (let d = $pos.depth; ; d--) {
      let before, after, index = $pos.index(d);
      if (d == $pos.depth) {
        before = $pos.nodeBefore;
        after = $pos.nodeAfter;
      } else if (dir > 0) {
        before = $pos.node(d + 1);
        index++;
        after = $pos.node(d).maybeChild(index);
      } else {
        before = $pos.node(d).maybeChild(index - 1);
        after = $pos.node(d + 1);
      }
      if (before && !before.isTextblock && joinable(before, after) && $pos.node(d).canReplace(index, index + 1))
        return pos;
      if (d == 0)
        break;
      pos = dir < 0 ? $pos.before(d) : $pos.after(d);
    }
  }
  function join(tr, pos, depth) {
    let step = new ReplaceStep(pos - depth, pos + depth, Slice.empty, true);
    tr.step(step);
  }
  function insertPoint(doc2, pos, nodeType) {
    let $pos = doc2.resolve(pos);
    if ($pos.parent.canReplaceWith($pos.index(), $pos.index(), nodeType))
      return pos;
    if ($pos.parentOffset == 0)
      for (let d = $pos.depth - 1; d >= 0; d--) {
        let index = $pos.index(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType))
          return $pos.before(d + 1);
        if (index > 0)
          return null;
      }
    if ($pos.parentOffset == $pos.parent.content.size)
      for (let d = $pos.depth - 1; d >= 0; d--) {
        let index = $pos.indexAfter(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType))
          return $pos.after(d + 1);
        if (index < $pos.node(d).childCount)
          return null;
      }
    return null;
  }
  function dropPoint(doc2, pos, slice) {
    let $pos = doc2.resolve(pos);
    if (!slice.content.size)
      return pos;
    let content = slice.content;
    for (let i2 = 0; i2 < slice.openStart; i2++)
      content = content.firstChild.content;
    for (let pass = 1; pass <= (slice.openStart == 0 && slice.size ? 2 : 1); pass++) {
      for (let d = $pos.depth; d >= 0; d--) {
        let bias = d == $pos.depth ? 0 : $pos.pos <= ($pos.start(d + 1) + $pos.end(d + 1)) / 2 ? -1 : 1;
        let insertPos = $pos.index(d) + (bias > 0 ? 1 : 0);
        let parent = $pos.node(d), fits = false;
        if (pass == 1) {
          fits = parent.canReplace(insertPos, insertPos, content);
        } else {
          let wrapping = parent.contentMatchAt(insertPos).findWrapping(content.firstChild.type);
          fits = wrapping && parent.canReplaceWith(insertPos, insertPos, wrapping[0]);
        }
        if (fits)
          return bias == 0 ? $pos.pos : bias < 0 ? $pos.before(d + 1) : $pos.after(d + 1);
      }
    }
    return null;
  }
  function replaceStep(doc2, from, to = from, slice = Slice.empty) {
    if (from == to && !slice.size)
      return null;
    let $from = doc2.resolve(from), $to = doc2.resolve(to);
    if (fitsTrivially($from, $to, slice))
      return new ReplaceStep(from, to, slice);
    return new Fitter($from, $to, slice).fit();
  }
  function fitsTrivially($from, $to, slice) {
    return !slice.openStart && !slice.openEnd && $from.start() == $to.start() && $from.parent.canReplace($from.index(), $to.index(), slice.content);
  }
  class Fitter {
    constructor($from, $to, unplaced) {
      this.$from = $from;
      this.$to = $to;
      this.unplaced = unplaced;
      this.frontier = [];
      this.placed = Fragment.empty;
      for (let i2 = 0; i2 <= $from.depth; i2++) {
        let node = $from.node(i2);
        this.frontier.push({
          type: node.type,
          match: node.contentMatchAt($from.indexAfter(i2))
        });
      }
      for (let i2 = $from.depth; i2 > 0; i2--)
        this.placed = Fragment.from($from.node(i2).copy(this.placed));
    }
    get depth() {
      return this.frontier.length - 1;
    }
    fit() {
      while (this.unplaced.size) {
        let fit = this.findFittable();
        if (fit)
          this.placeNodes(fit);
        else
          this.openMore() || this.dropNode();
      }
      let moveInline = this.mustMoveInline(), placedSize = this.placed.size - this.depth - this.$from.depth;
      let $from = this.$from, $to = this.close(moveInline < 0 ? this.$to : $from.doc.resolve(moveInline));
      if (!$to)
        return null;
      let content = this.placed, openStart = $from.depth, openEnd = $to.depth;
      while (openStart && openEnd && content.childCount == 1) {
        content = content.firstChild.content;
        openStart--;
        openEnd--;
      }
      let slice = new Slice(content, openStart, openEnd);
      if (moveInline > -1)
        return new ReplaceAroundStep($from.pos, moveInline, this.$to.pos, this.$to.end(), slice, placedSize);
      if (slice.size || $from.pos != this.$to.pos)
        return new ReplaceStep($from.pos, $to.pos, slice);
      return null;
    }
    findFittable() {
      let startDepth = this.unplaced.openStart;
      for (let cur = this.unplaced.content, d = 0, openEnd = this.unplaced.openEnd; d < startDepth; d++) {
        let node = cur.firstChild;
        if (cur.childCount > 1)
          openEnd = 0;
        if (node.type.spec.isolating && openEnd <= d) {
          startDepth = d;
          break;
        }
        cur = node.content;
      }
      for (let pass = 1; pass <= 2; pass++) {
        for (let sliceDepth = pass == 1 ? startDepth : this.unplaced.openStart; sliceDepth >= 0; sliceDepth--) {
          let fragment, parent = null;
          if (sliceDepth) {
            parent = contentAt(this.unplaced.content, sliceDepth - 1).firstChild;
            fragment = parent.content;
          } else {
            fragment = this.unplaced.content;
          }
          let first2 = fragment.firstChild;
          for (let frontierDepth = this.depth; frontierDepth >= 0; frontierDepth--) {
            let { type, match } = this.frontier[frontierDepth], wrap2, inject = null;
            if (pass == 1 && (first2 ? match.matchType(first2.type) || (inject = match.fillBefore(Fragment.from(first2), false)) : parent && type.compatibleContent(parent.type)))
              return { sliceDepth, frontierDepth, parent, inject };
            else if (pass == 2 && first2 && (wrap2 = match.findWrapping(first2.type)))
              return { sliceDepth, frontierDepth, parent, wrap: wrap2 };
            if (parent && match.matchType(parent.type))
              break;
          }
        }
      }
    }
    openMore() {
      let { content, openStart, openEnd } = this.unplaced;
      let inner = contentAt(content, openStart);
      if (!inner.childCount || inner.firstChild.isLeaf)
        return false;
      this.unplaced = new Slice(content, openStart + 1, Math.max(openEnd, inner.size + openStart >= content.size - openEnd ? openStart + 1 : 0));
      return true;
    }
    dropNode() {
      let { content, openStart, openEnd } = this.unplaced;
      let inner = contentAt(content, openStart);
      if (inner.childCount <= 1 && openStart > 0) {
        let openAtEnd = content.size - openStart <= openStart + inner.size;
        this.unplaced = new Slice(dropFromFragment(content, openStart - 1, 1), openStart - 1, openAtEnd ? openStart - 1 : openEnd);
      } else {
        this.unplaced = new Slice(dropFromFragment(content, openStart, 1), openStart, openEnd);
      }
    }
    placeNodes({ sliceDepth, frontierDepth, parent, inject, wrap: wrap2 }) {
      while (this.depth > frontierDepth)
        this.closeFrontierNode();
      if (wrap2)
        for (let i2 = 0; i2 < wrap2.length; i2++)
          this.openFrontierNode(wrap2[i2]);
      let slice = this.unplaced, fragment = parent ? parent.content : slice.content;
      let openStart = slice.openStart - sliceDepth;
      let taken = 0, add = [];
      let { match, type } = this.frontier[frontierDepth];
      if (inject) {
        for (let i2 = 0; i2 < inject.childCount; i2++)
          add.push(inject.child(i2));
        match = match.matchFragment(inject);
      }
      let openEndCount = fragment.size + sliceDepth - (slice.content.size - slice.openEnd);
      while (taken < fragment.childCount) {
        let next = fragment.child(taken), matches2 = match.matchType(next.type);
        if (!matches2)
          break;
        taken++;
        if (taken > 1 || openStart == 0 || next.content.size) {
          match = matches2;
          add.push(closeNodeStart(next.mark(type.allowedMarks(next.marks)), taken == 1 ? openStart : 0, taken == fragment.childCount ? openEndCount : -1));
        }
      }
      let toEnd = taken == fragment.childCount;
      if (!toEnd)
        openEndCount = -1;
      this.placed = addToFragment(this.placed, frontierDepth, Fragment.from(add));
      this.frontier[frontierDepth].match = match;
      if (toEnd && openEndCount < 0 && parent && parent.type == this.frontier[this.depth].type && this.frontier.length > 1)
        this.closeFrontierNode();
      for (let i2 = 0, cur = fragment; i2 < openEndCount; i2++) {
        let node = cur.lastChild;
        this.frontier.push({ type: node.type, match: node.contentMatchAt(node.childCount) });
        cur = node.content;
      }
      this.unplaced = !toEnd ? new Slice(dropFromFragment(slice.content, sliceDepth, taken), slice.openStart, slice.openEnd) : sliceDepth == 0 ? Slice.empty : new Slice(dropFromFragment(slice.content, sliceDepth - 1, 1), sliceDepth - 1, openEndCount < 0 ? slice.openEnd : sliceDepth - 1);
    }
    mustMoveInline() {
      if (!this.$to.parent.isTextblock)
        return -1;
      let top = this.frontier[this.depth], level;
      if (!top.type.isTextblock || !contentAfterFits(this.$to, this.$to.depth, top.type, top.match, false) || this.$to.depth == this.depth && (level = this.findCloseLevel(this.$to)) && level.depth == this.depth)
        return -1;
      let { depth } = this.$to, after = this.$to.after(depth);
      while (depth > 1 && after == this.$to.end(--depth))
        ++after;
      return after;
    }
    findCloseLevel($to) {
      scan:
        for (let i2 = Math.min(this.depth, $to.depth); i2 >= 0; i2--) {
          let { match, type } = this.frontier[i2];
          let dropInner = i2 < $to.depth && $to.end(i2 + 1) == $to.pos + ($to.depth - (i2 + 1));
          let fit = contentAfterFits($to, i2, type, match, dropInner);
          if (!fit)
            continue;
          for (let d = i2 - 1; d >= 0; d--) {
            let { match: match2, type: type2 } = this.frontier[d];
            let matches2 = contentAfterFits($to, d, type2, match2, true);
            if (!matches2 || matches2.childCount)
              continue scan;
          }
          return { depth: i2, fit, move: dropInner ? $to.doc.resolve($to.after(i2 + 1)) : $to };
        }
    }
    close($to) {
      let close2 = this.findCloseLevel($to);
      if (!close2)
        return null;
      while (this.depth > close2.depth)
        this.closeFrontierNode();
      if (close2.fit.childCount)
        this.placed = addToFragment(this.placed, close2.depth, close2.fit);
      $to = close2.move;
      for (let d = close2.depth + 1; d <= $to.depth; d++) {
        let node = $to.node(d), add = node.type.contentMatch.fillBefore(node.content, true, $to.index(d));
        this.openFrontierNode(node.type, node.attrs, add);
      }
      return $to;
    }
    openFrontierNode(type, attrs = null, content) {
      let top = this.frontier[this.depth];
      top.match = top.match.matchType(type);
      this.placed = addToFragment(this.placed, this.depth, Fragment.from(type.create(attrs, content)));
      this.frontier.push({ type, match: type.contentMatch });
    }
    closeFrontierNode() {
      let open = this.frontier.pop();
      let add = open.match.fillBefore(Fragment.empty, true);
      if (add.childCount)
        this.placed = addToFragment(this.placed, this.frontier.length, add);
    }
  }
  function dropFromFragment(fragment, depth, count) {
    if (depth == 0)
      return fragment.cutByIndex(count, fragment.childCount);
    return fragment.replaceChild(0, fragment.firstChild.copy(dropFromFragment(fragment.firstChild.content, depth - 1, count)));
  }
  function addToFragment(fragment, depth, content) {
    if (depth == 0)
      return fragment.append(content);
    return fragment.replaceChild(fragment.childCount - 1, fragment.lastChild.copy(addToFragment(fragment.lastChild.content, depth - 1, content)));
  }
  function contentAt(fragment, depth) {
    for (let i2 = 0; i2 < depth; i2++)
      fragment = fragment.firstChild.content;
    return fragment;
  }
  function closeNodeStart(node, openStart, openEnd) {
    if (openStart <= 0)
      return node;
    let frag = node.content;
    if (openStart > 1)
      frag = frag.replaceChild(0, closeNodeStart(frag.firstChild, openStart - 1, frag.childCount == 1 ? openEnd - 1 : 0));
    if (openStart > 0) {
      frag = node.type.contentMatch.fillBefore(frag).append(frag);
      if (openEnd <= 0)
        frag = frag.append(node.type.contentMatch.matchFragment(frag).fillBefore(Fragment.empty, true));
    }
    return node.copy(frag);
  }
  function contentAfterFits($to, depth, type, match, open) {
    let node = $to.node(depth), index = open ? $to.indexAfter(depth) : $to.index(depth);
    if (index == node.childCount && !type.compatibleContent(node.type))
      return null;
    let fit = match.fillBefore(node.content, true, index);
    return fit && !invalidMarks(type, node.content, index) ? fit : null;
  }
  function invalidMarks(type, fragment, start) {
    for (let i2 = start; i2 < fragment.childCount; i2++)
      if (!type.allowsMarks(fragment.child(i2).marks))
        return true;
    return false;
  }
  function definesContent(type) {
    return type.spec.defining || type.spec.definingForContent;
  }
  function replaceRange(tr, from, to, slice) {
    if (!slice.size)
      return tr.deleteRange(from, to);
    let $from = tr.doc.resolve(from), $to = tr.doc.resolve(to);
    if (fitsTrivially($from, $to, slice))
      return tr.step(new ReplaceStep(from, to, slice));
    let targetDepths = coveredDepths($from, tr.doc.resolve(to));
    if (targetDepths[targetDepths.length - 1] == 0)
      targetDepths.pop();
    let preferredTarget = -($from.depth + 1);
    targetDepths.unshift(preferredTarget);
    for (let d = $from.depth, pos = $from.pos - 1; d > 0; d--, pos--) {
      let spec = $from.node(d).type.spec;
      if (spec.defining || spec.definingAsContext || spec.isolating)
        break;
      if (targetDepths.indexOf(d) > -1)
        preferredTarget = d;
      else if ($from.before(d) == pos)
        targetDepths.splice(1, 0, -d);
    }
    let preferredTargetIndex = targetDepths.indexOf(preferredTarget);
    let leftNodes = [], preferredDepth = slice.openStart;
    for (let content = slice.content, i2 = 0; ; i2++) {
      let node = content.firstChild;
      leftNodes.push(node);
      if (i2 == slice.openStart)
        break;
      content = node.content;
    }
    for (let d = preferredDepth - 1; d >= 0; d--) {
      let type = leftNodes[d].type, def = definesContent(type);
      if (def && $from.node(preferredTargetIndex).type != type)
        preferredDepth = d;
      else if (def || !type.isTextblock)
        break;
    }
    for (let j = slice.openStart; j >= 0; j--) {
      let openDepth = (j + preferredDepth + 1) % (slice.openStart + 1);
      let insert = leftNodes[openDepth];
      if (!insert)
        continue;
      for (let i2 = 0; i2 < targetDepths.length; i2++) {
        let targetDepth = targetDepths[(i2 + preferredTargetIndex) % targetDepths.length], expand = true;
        if (targetDepth < 0) {
          expand = false;
          targetDepth = -targetDepth;
        }
        let parent = $from.node(targetDepth - 1), index = $from.index(targetDepth - 1);
        if (parent.canReplaceWith(index, index, insert.type, insert.marks))
          return tr.replace($from.before(targetDepth), expand ? $to.after(targetDepth) : to, new Slice(closeFragment(slice.content, 0, slice.openStart, openDepth), openDepth, slice.openEnd));
      }
    }
    let startSteps = tr.steps.length;
    for (let i2 = targetDepths.length - 1; i2 >= 0; i2--) {
      tr.replace(from, to, slice);
      if (tr.steps.length > startSteps)
        break;
      let depth = targetDepths[i2];
      if (depth < 0)
        continue;
      from = $from.before(depth);
      to = $to.after(depth);
    }
  }
  function closeFragment(fragment, depth, oldOpen, newOpen, parent) {
    if (depth < oldOpen) {
      let first2 = fragment.firstChild;
      fragment = fragment.replaceChild(0, first2.copy(closeFragment(first2.content, depth + 1, oldOpen, newOpen, first2)));
    }
    if (depth > newOpen) {
      let match = parent.contentMatchAt(0);
      let start = match.fillBefore(fragment).append(fragment);
      fragment = start.append(match.matchFragment(start).fillBefore(Fragment.empty, true));
    }
    return fragment;
  }
  function replaceRangeWith(tr, from, to, node) {
    if (!node.isInline && from == to && tr.doc.resolve(from).parent.content.size) {
      let point = insertPoint(tr.doc, from, node.type);
      if (point != null)
        from = to = point;
    }
    tr.replaceRange(from, to, new Slice(Fragment.from(node), 0, 0));
  }
  function deleteRange$1(tr, from, to) {
    let $from = tr.doc.resolve(from), $to = tr.doc.resolve(to);
    let covered = coveredDepths($from, $to);
    for (let i2 = 0; i2 < covered.length; i2++) {
      let depth = covered[i2], last = i2 == covered.length - 1;
      if (last && depth == 0 || $from.node(depth).type.contentMatch.validEnd)
        return tr.delete($from.start(depth), $to.end(depth));
      if (depth > 0 && (last || $from.node(depth - 1).canReplace($from.index(depth - 1), $to.indexAfter(depth - 1))))
        return tr.delete($from.before(depth), $to.after(depth));
    }
    for (let d = 1; d <= $from.depth && d <= $to.depth; d++) {
      if (from - $from.start(d) == $from.depth - d && to > $from.end(d) && $to.end(d) - to != $to.depth - d)
        return tr.delete($from.before(d), to);
    }
    tr.delete(from, to);
  }
  function coveredDepths($from, $to) {
    let result = [], minDepth = Math.min($from.depth, $to.depth);
    for (let d = minDepth; d >= 0; d--) {
      let start = $from.start(d);
      if (start < $from.pos - ($from.depth - d) || $to.end(d) > $to.pos + ($to.depth - d) || $from.node(d).type.spec.isolating || $to.node(d).type.spec.isolating)
        break;
      if (start == $to.start(d) || d == $from.depth && d == $to.depth && $from.parent.inlineContent && $to.parent.inlineContent && d && $to.start(d - 1) == start - 1)
        result.push(d);
    }
    return result;
  }
  class AttrStep extends Step {
    constructor(pos, attr, value) {
      super();
      this.pos = pos;
      this.attr = attr;
      this.value = value;
    }
    apply(doc2) {
      let node = doc2.nodeAt(this.pos);
      if (!node)
        return StepResult.fail("No node at attribute step's position");
      let attrs = /* @__PURE__ */ Object.create(null);
      for (let name in node.attrs)
        attrs[name] = node.attrs[name];
      attrs[this.attr] = this.value;
      let updated = node.type.create(attrs, null, node.marks);
      return StepResult.fromReplace(doc2, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
    }
    getMap() {
      return StepMap.empty;
    }
    invert(doc2) {
      return new AttrStep(this.pos, this.attr, doc2.nodeAt(this.pos).attrs[this.attr]);
    }
    map(mapping) {
      let pos = mapping.mapResult(this.pos, 1);
      return pos.deletedAfter ? null : new AttrStep(pos.pos, this.attr, this.value);
    }
    toJSON() {
      return { stepType: "attr", pos: this.pos, attr: this.attr, value: this.value };
    }
    static fromJSON(schema, json) {
      if (typeof json.pos != "number" || typeof json.attr != "string")
        throw new RangeError("Invalid input for AttrStep.fromJSON");
      return new AttrStep(json.pos, json.attr, json.value);
    }
  }
  Step.jsonID("attr", AttrStep);
  let TransformError = class extends Error {
  };
  TransformError = function TransformError2(message) {
    let err = Error.call(this, message);
    err.__proto__ = TransformError2.prototype;
    return err;
  };
  TransformError.prototype = Object.create(Error.prototype);
  TransformError.prototype.constructor = TransformError;
  TransformError.prototype.name = "TransformError";
  class Transform {
    constructor(doc2) {
      this.doc = doc2;
      this.steps = [];
      this.docs = [];
      this.mapping = new Mapping();
    }
    get before() {
      return this.docs.length ? this.docs[0] : this.doc;
    }
    step(step) {
      let result = this.maybeStep(step);
      if (result.failed)
        throw new TransformError(result.failed);
      return this;
    }
    maybeStep(step) {
      let result = step.apply(this.doc);
      if (!result.failed)
        this.addStep(step, result.doc);
      return result;
    }
    get docChanged() {
      return this.steps.length > 0;
    }
    addStep(step, doc2) {
      this.docs.push(this.doc);
      this.steps.push(step);
      this.mapping.appendMap(step.getMap());
      this.doc = doc2;
    }
    replace(from, to = from, slice = Slice.empty) {
      let step = replaceStep(this.doc, from, to, slice);
      if (step)
        this.step(step);
      return this;
    }
    replaceWith(from, to, content) {
      return this.replace(from, to, new Slice(Fragment.from(content), 0, 0));
    }
    delete(from, to) {
      return this.replace(from, to, Slice.empty);
    }
    insert(pos, content) {
      return this.replaceWith(pos, pos, content);
    }
    replaceRange(from, to, slice) {
      replaceRange(this, from, to, slice);
      return this;
    }
    replaceRangeWith(from, to, node) {
      replaceRangeWith(this, from, to, node);
      return this;
    }
    deleteRange(from, to) {
      deleteRange$1(this, from, to);
      return this;
    }
    lift(range, target) {
      lift$2(this, range, target);
      return this;
    }
    join(pos, depth = 1) {
      join(this, pos, depth);
      return this;
    }
    wrap(range, wrappers) {
      wrap(this, range, wrappers);
      return this;
    }
    setBlockType(from, to = from, type, attrs = null) {
      setBlockType$1(this, from, to, type, attrs);
      return this;
    }
    setNodeMarkup(pos, type, attrs = null, marks) {
      setNodeMarkup(this, pos, type, attrs, marks);
      return this;
    }
    setNodeAttribute(pos, attr, value) {
      this.step(new AttrStep(pos, attr, value));
      return this;
    }
    addNodeMark(pos, mark) {
      this.step(new AddNodeMarkStep(pos, mark));
      return this;
    }
    removeNodeMark(pos, mark) {
      if (!(mark instanceof Mark$1)) {
        let node = this.doc.nodeAt(pos);
        if (!node)
          throw new RangeError("No node at position " + pos);
        mark = mark.isInSet(node.marks);
        if (!mark)
          return this;
      }
      this.step(new RemoveNodeMarkStep(pos, mark));
      return this;
    }
    split(pos, depth = 1, typesAfter) {
      split(this, pos, depth, typesAfter);
      return this;
    }
    addMark(from, to, mark) {
      addMark(this, from, to, mark);
      return this;
    }
    removeMark(from, to, mark) {
      removeMark(this, from, to, mark);
      return this;
    }
    clearIncompatible(pos, parentType, match) {
      clearIncompatible(this, pos, parentType, match);
      return this;
    }
  }
  const classesById = /* @__PURE__ */ Object.create(null);
  class Selection {
    constructor($anchor, $head, ranges) {
      this.$anchor = $anchor;
      this.$head = $head;
      this.ranges = ranges || [new SelectionRange($anchor.min($head), $anchor.max($head))];
    }
    get anchor() {
      return this.$anchor.pos;
    }
    get head() {
      return this.$head.pos;
    }
    get from() {
      return this.$from.pos;
    }
    get to() {
      return this.$to.pos;
    }
    get $from() {
      return this.ranges[0].$from;
    }
    get $to() {
      return this.ranges[0].$to;
    }
    get empty() {
      let ranges = this.ranges;
      for (let i2 = 0; i2 < ranges.length; i2++)
        if (ranges[i2].$from.pos != ranges[i2].$to.pos)
          return false;
      return true;
    }
    content() {
      return this.$from.doc.slice(this.from, this.to, true);
    }
    replace(tr, content = Slice.empty) {
      let lastNode = content.content.lastChild, lastParent = null;
      for (let i2 = 0; i2 < content.openEnd; i2++) {
        lastParent = lastNode;
        lastNode = lastNode.lastChild;
      }
      let mapFrom = tr.steps.length, ranges = this.ranges;
      for (let i2 = 0; i2 < ranges.length; i2++) {
        let { $from, $to } = ranges[i2], mapping = tr.mapping.slice(mapFrom);
        tr.replaceRange(mapping.map($from.pos), mapping.map($to.pos), i2 ? Slice.empty : content);
        if (i2 == 0)
          selectionToInsertionEnd$1(tr, mapFrom, (lastNode ? lastNode.isInline : lastParent && lastParent.isTextblock) ? -1 : 1);
      }
    }
    replaceWith(tr, node) {
      let mapFrom = tr.steps.length, ranges = this.ranges;
      for (let i2 = 0; i2 < ranges.length; i2++) {
        let { $from, $to } = ranges[i2], mapping = tr.mapping.slice(mapFrom);
        let from = mapping.map($from.pos), to = mapping.map($to.pos);
        if (i2) {
          tr.deleteRange(from, to);
        } else {
          tr.replaceRangeWith(from, to, node);
          selectionToInsertionEnd$1(tr, mapFrom, node.isInline ? -1 : 1);
        }
      }
    }
    static findFrom($pos, dir, textOnly = false) {
      let inner = $pos.parent.inlineContent ? new TextSelection($pos) : findSelectionIn($pos.node(0), $pos.parent, $pos.pos, $pos.index(), dir, textOnly);
      if (inner)
        return inner;
      for (let depth = $pos.depth - 1; depth >= 0; depth--) {
        let found2 = dir < 0 ? findSelectionIn($pos.node(0), $pos.node(depth), $pos.before(depth + 1), $pos.index(depth), dir, textOnly) : findSelectionIn($pos.node(0), $pos.node(depth), $pos.after(depth + 1), $pos.index(depth) + 1, dir, textOnly);
        if (found2)
          return found2;
      }
      return null;
    }
    static near($pos, bias = 1) {
      return this.findFrom($pos, bias) || this.findFrom($pos, -bias) || new AllSelection($pos.node(0));
    }
    static atStart(doc2) {
      return findSelectionIn(doc2, doc2, 0, 0, 1) || new AllSelection(doc2);
    }
    static atEnd(doc2) {
      return findSelectionIn(doc2, doc2, doc2.content.size, doc2.childCount, -1) || new AllSelection(doc2);
    }
    static fromJSON(doc2, json) {
      if (!json || !json.type)
        throw new RangeError("Invalid input for Selection.fromJSON");
      let cls = classesById[json.type];
      if (!cls)
        throw new RangeError(`No selection type ${json.type} defined`);
      return cls.fromJSON(doc2, json);
    }
    static jsonID(id, selectionClass) {
      if (id in classesById)
        throw new RangeError("Duplicate use of selection JSON ID " + id);
      classesById[id] = selectionClass;
      selectionClass.prototype.jsonID = id;
      return selectionClass;
    }
    getBookmark() {
      return TextSelection.between(this.$anchor, this.$head).getBookmark();
    }
  }
  Selection.prototype.visible = true;
  class SelectionRange {
    constructor($from, $to) {
      this.$from = $from;
      this.$to = $to;
    }
  }
  let warnedAboutTextSelection = false;
  function checkTextSelection($pos) {
    if (!warnedAboutTextSelection && !$pos.parent.inlineContent) {
      warnedAboutTextSelection = true;
      console["warn"]("TextSelection endpoint not pointing into a node with inline content (" + $pos.parent.type.name + ")");
    }
  }
  class TextSelection extends Selection {
    constructor($anchor, $head = $anchor) {
      checkTextSelection($anchor);
      checkTextSelection($head);
      super($anchor, $head);
    }
    get $cursor() {
      return this.$anchor.pos == this.$head.pos ? this.$head : null;
    }
    map(doc2, mapping) {
      let $head = doc2.resolve(mapping.map(this.head));
      if (!$head.parent.inlineContent)
        return Selection.near($head);
      let $anchor = doc2.resolve(mapping.map(this.anchor));
      return new TextSelection($anchor.parent.inlineContent ? $anchor : $head, $head);
    }
    replace(tr, content = Slice.empty) {
      super.replace(tr, content);
      if (content == Slice.empty) {
        let marks = this.$from.marksAcross(this.$to);
        if (marks)
          tr.ensureMarks(marks);
      }
    }
    eq(other) {
      return other instanceof TextSelection && other.anchor == this.anchor && other.head == this.head;
    }
    getBookmark() {
      return new TextBookmark(this.anchor, this.head);
    }
    toJSON() {
      return { type: "text", anchor: this.anchor, head: this.head };
    }
    static fromJSON(doc2, json) {
      if (typeof json.anchor != "number" || typeof json.head != "number")
        throw new RangeError("Invalid input for TextSelection.fromJSON");
      return new TextSelection(doc2.resolve(json.anchor), doc2.resolve(json.head));
    }
    static create(doc2, anchor, head = anchor) {
      let $anchor = doc2.resolve(anchor);
      return new this($anchor, head == anchor ? $anchor : doc2.resolve(head));
    }
    static between($anchor, $head, bias) {
      let dPos = $anchor.pos - $head.pos;
      if (!bias || dPos)
        bias = dPos >= 0 ? 1 : -1;
      if (!$head.parent.inlineContent) {
        let found2 = Selection.findFrom($head, bias, true) || Selection.findFrom($head, -bias, true);
        if (found2)
          $head = found2.$head;
        else
          return Selection.near($head, bias);
      }
      if (!$anchor.parent.inlineContent) {
        if (dPos == 0) {
          $anchor = $head;
        } else {
          $anchor = (Selection.findFrom($anchor, -bias, true) || Selection.findFrom($anchor, bias, true)).$anchor;
          if ($anchor.pos < $head.pos != dPos < 0)
            $anchor = $head;
        }
      }
      return new TextSelection($anchor, $head);
    }
  }
  Selection.jsonID("text", TextSelection);
  class TextBookmark {
    constructor(anchor, head) {
      this.anchor = anchor;
      this.head = head;
    }
    map(mapping) {
      return new TextBookmark(mapping.map(this.anchor), mapping.map(this.head));
    }
    resolve(doc2) {
      return TextSelection.between(doc2.resolve(this.anchor), doc2.resolve(this.head));
    }
  }
  class NodeSelection extends Selection {
    constructor($pos) {
      let node = $pos.nodeAfter;
      let $end = $pos.node(0).resolve($pos.pos + node.nodeSize);
      super($pos, $end);
      this.node = node;
    }
    map(doc2, mapping) {
      let { deleted, pos } = mapping.mapResult(this.anchor);
      let $pos = doc2.resolve(pos);
      if (deleted)
        return Selection.near($pos);
      return new NodeSelection($pos);
    }
    content() {
      return new Slice(Fragment.from(this.node), 0, 0);
    }
    eq(other) {
      return other instanceof NodeSelection && other.anchor == this.anchor;
    }
    toJSON() {
      return { type: "node", anchor: this.anchor };
    }
    getBookmark() {
      return new NodeBookmark(this.anchor);
    }
    static fromJSON(doc2, json) {
      if (typeof json.anchor != "number")
        throw new RangeError("Invalid input for NodeSelection.fromJSON");
      return new NodeSelection(doc2.resolve(json.anchor));
    }
    static create(doc2, from) {
      return new NodeSelection(doc2.resolve(from));
    }
    static isSelectable(node) {
      return !node.isText && node.type.spec.selectable !== false;
    }
  }
  NodeSelection.prototype.visible = false;
  Selection.jsonID("node", NodeSelection);
  class NodeBookmark {
    constructor(anchor) {
      this.anchor = anchor;
    }
    map(mapping) {
      let { deleted, pos } = mapping.mapResult(this.anchor);
      return deleted ? new TextBookmark(pos, pos) : new NodeBookmark(pos);
    }
    resolve(doc2) {
      let $pos = doc2.resolve(this.anchor), node = $pos.nodeAfter;
      if (node && NodeSelection.isSelectable(node))
        return new NodeSelection($pos);
      return Selection.near($pos);
    }
  }
  class AllSelection extends Selection {
    constructor(doc2) {
      super(doc2.resolve(0), doc2.resolve(doc2.content.size));
    }
    replace(tr, content = Slice.empty) {
      if (content == Slice.empty) {
        tr.delete(0, tr.doc.content.size);
        let sel = Selection.atStart(tr.doc);
        if (!sel.eq(tr.selection))
          tr.setSelection(sel);
      } else {
        super.replace(tr, content);
      }
    }
    toJSON() {
      return { type: "all" };
    }
    static fromJSON(doc2) {
      return new AllSelection(doc2);
    }
    map(doc2) {
      return new AllSelection(doc2);
    }
    eq(other) {
      return other instanceof AllSelection;
    }
    getBookmark() {
      return AllBookmark;
    }
  }
  Selection.jsonID("all", AllSelection);
  const AllBookmark = {
    map() {
      return this;
    },
    resolve(doc2) {
      return new AllSelection(doc2);
    }
  };
  function findSelectionIn(doc2, node, pos, index, dir, text2 = false) {
    if (node.inlineContent)
      return TextSelection.create(doc2, pos);
    for (let i2 = index - (dir > 0 ? 0 : 1); dir > 0 ? i2 < node.childCount : i2 >= 0; i2 += dir) {
      let child = node.child(i2);
      if (!child.isAtom) {
        let inner = findSelectionIn(doc2, child, pos + dir, dir < 0 ? child.childCount : 0, dir, text2);
        if (inner)
          return inner;
      } else if (!text2 && NodeSelection.isSelectable(child)) {
        return NodeSelection.create(doc2, pos - (dir < 0 ? child.nodeSize : 0));
      }
      pos += child.nodeSize * dir;
    }
    return null;
  }
  function selectionToInsertionEnd$1(tr, startLen, bias) {
    let last = tr.steps.length - 1;
    if (last < startLen)
      return;
    let step = tr.steps[last];
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep))
      return;
    let map = tr.mapping.maps[last], end;
    map.forEach((_from, _to, _newFrom, newTo) => {
      if (end == null)
        end = newTo;
    });
    tr.setSelection(Selection.near(tr.doc.resolve(end), bias));
  }
  const UPDATED_SEL = 1, UPDATED_MARKS = 2, UPDATED_SCROLL = 4;
  class Transaction extends Transform {
    constructor(state) {
      super(state.doc);
      this.curSelectionFor = 0;
      this.updated = 0;
      this.meta = /* @__PURE__ */ Object.create(null);
      this.time = Date.now();
      this.curSelection = state.selection;
      this.storedMarks = state.storedMarks;
    }
    get selection() {
      if (this.curSelectionFor < this.steps.length) {
        this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor));
        this.curSelectionFor = this.steps.length;
      }
      return this.curSelection;
    }
    setSelection(selection) {
      if (selection.$from.doc != this.doc)
        throw new RangeError("Selection passed to setSelection must point at the current document");
      this.curSelection = selection;
      this.curSelectionFor = this.steps.length;
      this.updated = (this.updated | UPDATED_SEL) & ~UPDATED_MARKS;
      this.storedMarks = null;
      return this;
    }
    get selectionSet() {
      return (this.updated & UPDATED_SEL) > 0;
    }
    setStoredMarks(marks) {
      this.storedMarks = marks;
      this.updated |= UPDATED_MARKS;
      return this;
    }
    ensureMarks(marks) {
      if (!Mark$1.sameSet(this.storedMarks || this.selection.$from.marks(), marks))
        this.setStoredMarks(marks);
      return this;
    }
    addStoredMark(mark) {
      return this.ensureMarks(mark.addToSet(this.storedMarks || this.selection.$head.marks()));
    }
    removeStoredMark(mark) {
      return this.ensureMarks(mark.removeFromSet(this.storedMarks || this.selection.$head.marks()));
    }
    get storedMarksSet() {
      return (this.updated & UPDATED_MARKS) > 0;
    }
    addStep(step, doc2) {
      super.addStep(step, doc2);
      this.updated = this.updated & ~UPDATED_MARKS;
      this.storedMarks = null;
    }
    setTime(time) {
      this.time = time;
      return this;
    }
    replaceSelection(slice) {
      this.selection.replace(this, slice);
      return this;
    }
    replaceSelectionWith(node, inheritMarks = true) {
      let selection = this.selection;
      if (inheritMarks)
        node = node.mark(this.storedMarks || (selection.empty ? selection.$from.marks() : selection.$from.marksAcross(selection.$to) || Mark$1.none));
      selection.replaceWith(this, node);
      return this;
    }
    deleteSelection() {
      this.selection.replace(this);
      return this;
    }
    insertText(text2, from, to) {
      let schema = this.doc.type.schema;
      if (from == null) {
        if (!text2)
          return this.deleteSelection();
        return this.replaceSelectionWith(schema.text(text2), true);
      } else {
        if (to == null)
          to = from;
        to = to == null ? from : to;
        if (!text2)
          return this.deleteRange(from, to);
        let marks = this.storedMarks;
        if (!marks) {
          let $from = this.doc.resolve(from);
          marks = to == from ? $from.marks() : $from.marksAcross(this.doc.resolve(to));
        }
        this.replaceRangeWith(from, to, schema.text(text2, marks));
        if (!this.selection.empty)
          this.setSelection(Selection.near(this.selection.$to));
        return this;
      }
    }
    setMeta(key, value) {
      this.meta[typeof key == "string" ? key : key.key] = value;
      return this;
    }
    getMeta(key) {
      return this.meta[typeof key == "string" ? key : key.key];
    }
    get isGeneric() {
      for (let _ in this.meta)
        return false;
      return true;
    }
    scrollIntoView() {
      this.updated |= UPDATED_SCROLL;
      return this;
    }
    get scrolledIntoView() {
      return (this.updated & UPDATED_SCROLL) > 0;
    }
  }
  function bind(f, self2) {
    return !self2 || !f ? f : f.bind(self2);
  }
  class FieldDesc {
    constructor(name, desc, self2) {
      this.name = name;
      this.init = bind(desc.init, self2);
      this.apply = bind(desc.apply, self2);
    }
  }
  const baseFields = [
    new FieldDesc("doc", {
      init(config) {
        return config.doc || config.schema.topNodeType.createAndFill();
      },
      apply(tr) {
        return tr.doc;
      }
    }),
    new FieldDesc("selection", {
      init(config, instance) {
        return config.selection || Selection.atStart(instance.doc);
      },
      apply(tr) {
        return tr.selection;
      }
    }),
    new FieldDesc("storedMarks", {
      init(config) {
        return config.storedMarks || null;
      },
      apply(tr, _marks, _old, state) {
        return state.selection.$cursor ? tr.storedMarks : null;
      }
    }),
    new FieldDesc("scrollToSelection", {
      init() {
        return 0;
      },
      apply(tr, prev) {
        return tr.scrolledIntoView ? prev + 1 : prev;
      }
    })
  ];
  class Configuration {
    constructor(schema, plugins) {
      this.schema = schema;
      this.plugins = [];
      this.pluginsByKey = /* @__PURE__ */ Object.create(null);
      this.fields = baseFields.slice();
      if (plugins)
        plugins.forEach((plugin) => {
          if (this.pluginsByKey[plugin.key])
            throw new RangeError("Adding different instances of a keyed plugin (" + plugin.key + ")");
          this.plugins.push(plugin);
          this.pluginsByKey[plugin.key] = plugin;
          if (plugin.spec.state)
            this.fields.push(new FieldDesc(plugin.key, plugin.spec.state, plugin));
        });
    }
  }
  class EditorState {
    constructor(config) {
      this.config = config;
    }
    get schema() {
      return this.config.schema;
    }
    get plugins() {
      return this.config.plugins;
    }
    apply(tr) {
      return this.applyTransaction(tr).state;
    }
    filterTransaction(tr, ignore = -1) {
      for (let i2 = 0; i2 < this.config.plugins.length; i2++)
        if (i2 != ignore) {
          let plugin = this.config.plugins[i2];
          if (plugin.spec.filterTransaction && !plugin.spec.filterTransaction.call(plugin, tr, this))
            return false;
        }
      return true;
    }
    applyTransaction(rootTr) {
      if (!this.filterTransaction(rootTr))
        return { state: this, transactions: [] };
      let trs = [rootTr], newState = this.applyInner(rootTr), seen = null;
      for (; ; ) {
        let haveNew = false;
        for (let i2 = 0; i2 < this.config.plugins.length; i2++) {
          let plugin = this.config.plugins[i2];
          if (plugin.spec.appendTransaction) {
            let n = seen ? seen[i2].n : 0, oldState = seen ? seen[i2].state : this;
            let tr = n < trs.length && plugin.spec.appendTransaction.call(plugin, n ? trs.slice(n) : trs, oldState, newState);
            if (tr && newState.filterTransaction(tr, i2)) {
              tr.setMeta("appendedTransaction", rootTr);
              if (!seen) {
                seen = [];
                for (let j = 0; j < this.config.plugins.length; j++)
                  seen.push(j < i2 ? { state: newState, n: trs.length } : { state: this, n: 0 });
              }
              trs.push(tr);
              newState = newState.applyInner(tr);
              haveNew = true;
            }
            if (seen)
              seen[i2] = { state: newState, n: trs.length };
          }
        }
        if (!haveNew)
          return { state: newState, transactions: trs };
      }
    }
    applyInner(tr) {
      if (!tr.before.eq(this.doc))
        throw new RangeError("Applying a mismatched transaction");
      let newInstance = new EditorState(this.config), fields = this.config.fields;
      for (let i2 = 0; i2 < fields.length; i2++) {
        let field = fields[i2];
        newInstance[field.name] = field.apply(tr, this[field.name], this, newInstance);
      }
      return newInstance;
    }
    get tr() {
      return new Transaction(this);
    }
    static create(config) {
      let $config = new Configuration(config.doc ? config.doc.type.schema : config.schema, config.plugins);
      let instance = new EditorState($config);
      for (let i2 = 0; i2 < $config.fields.length; i2++)
        instance[$config.fields[i2].name] = $config.fields[i2].init(config, instance);
      return instance;
    }
    reconfigure(config) {
      let $config = new Configuration(this.schema, config.plugins);
      let fields = $config.fields, instance = new EditorState($config);
      for (let i2 = 0; i2 < fields.length; i2++) {
        let name = fields[i2].name;
        instance[name] = this.hasOwnProperty(name) ? this[name] : fields[i2].init(config, instance);
      }
      return instance;
    }
    toJSON(pluginFields) {
      let result = { doc: this.doc.toJSON(), selection: this.selection.toJSON() };
      if (this.storedMarks)
        result.storedMarks = this.storedMarks.map((m) => m.toJSON());
      if (pluginFields && typeof pluginFields == "object")
        for (let prop in pluginFields) {
          if (prop == "doc" || prop == "selection")
            throw new RangeError("The JSON fields `doc` and `selection` are reserved");
          let plugin = pluginFields[prop], state = plugin.spec.state;
          if (state && state.toJSON)
            result[prop] = state.toJSON.call(plugin, this[plugin.key]);
        }
      return result;
    }
    static fromJSON(config, json, pluginFields) {
      if (!json)
        throw new RangeError("Invalid input for EditorState.fromJSON");
      if (!config.schema)
        throw new RangeError("Required config field 'schema' missing");
      let $config = new Configuration(config.schema, config.plugins);
      let instance = new EditorState($config);
      $config.fields.forEach((field) => {
        if (field.name == "doc") {
          instance.doc = Node$1.fromJSON(config.schema, json.doc);
        } else if (field.name == "selection") {
          instance.selection = Selection.fromJSON(instance.doc, json.selection);
        } else if (field.name == "storedMarks") {
          if (json.storedMarks)
            instance.storedMarks = json.storedMarks.map(config.schema.markFromJSON);
        } else {
          if (pluginFields)
            for (let prop in pluginFields) {
              let plugin = pluginFields[prop], state = plugin.spec.state;
              if (plugin.key == field.name && state && state.fromJSON && Object.prototype.hasOwnProperty.call(json, prop)) {
                instance[field.name] = state.fromJSON.call(plugin, config, json[prop], instance);
                return;
              }
            }
          instance[field.name] = field.init(config, instance);
        }
      });
      return instance;
    }
  }
  function bindProps(obj, self2, target) {
    for (let prop in obj) {
      let val = obj[prop];
      if (val instanceof Function)
        val = val.bind(self2);
      else if (prop == "handleDOMEvents")
        val = bindProps(val, self2, {});
      target[prop] = val;
    }
    return target;
  }
  class Plugin {
    constructor(spec) {
      this.spec = spec;
      this.props = {};
      if (spec.props)
        bindProps(spec.props, this, this.props);
      this.key = spec.key ? spec.key.key : createKey("plugin");
    }
    getState(state) {
      return state[this.key];
    }
  }
  const keys = /* @__PURE__ */ Object.create(null);
  function createKey(name) {
    if (name in keys)
      return name + "$" + ++keys[name];
    keys[name] = 0;
    return name + "$";
  }
  class PluginKey {
    constructor(name = "key") {
      this.key = createKey(name);
    }
    get(state) {
      return state.config.pluginsByKey[this.key];
    }
    getState(state) {
      return state[this.key];
    }
  }
  const domIndex = function(node) {
    for (var index = 0; ; index++) {
      node = node.previousSibling;
      if (!node)
        return index;
    }
  };
  const parentNode = function(node) {
    let parent = node.assignedSlot || node.parentNode;
    return parent && parent.nodeType == 11 ? parent.host : parent;
  };
  let reusedRange = null;
  const textRange = function(node, from, to) {
    let range = reusedRange || (reusedRange = document.createRange());
    range.setEnd(node, to == null ? node.nodeValue.length : to);
    range.setStart(node, from || 0);
    return range;
  };
  const isEquivalentPosition = function(node, off, targetNode, targetOff) {
    return targetNode && (scanFor(node, off, targetNode, targetOff, -1) || scanFor(node, off, targetNode, targetOff, 1));
  };
  const atomElements = /^(img|br|input|textarea|hr)$/i;
  function scanFor(node, off, targetNode, targetOff, dir) {
    for (; ; ) {
      if (node == targetNode && off == targetOff)
        return true;
      if (off == (dir < 0 ? 0 : nodeSize(node))) {
        let parent = node.parentNode;
        if (!parent || parent.nodeType != 1 || hasBlockDesc(node) || atomElements.test(node.nodeName) || node.contentEditable == "false")
          return false;
        off = domIndex(node) + (dir < 0 ? 0 : 1);
        node = parent;
      } else if (node.nodeType == 1) {
        node = node.childNodes[off + (dir < 0 ? -1 : 0)];
        if (node.contentEditable == "false")
          return false;
        off = dir < 0 ? nodeSize(node) : 0;
      } else {
        return false;
      }
    }
  }
  function nodeSize(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
  }
  function isOnEdge(node, offset, parent) {
    for (let atStart = offset == 0, atEnd = offset == nodeSize(node); atStart || atEnd; ) {
      if (node == parent)
        return true;
      let index = domIndex(node);
      node = node.parentNode;
      if (!node)
        return false;
      atStart = atStart && index == 0;
      atEnd = atEnd && index == nodeSize(node);
    }
  }
  function hasBlockDesc(dom) {
    let desc;
    for (let cur = dom; cur; cur = cur.parentNode)
      if (desc = cur.pmViewDesc)
        break;
    return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom);
  }
  const selectionCollapsed = function(domSel) {
    return domSel.focusNode && isEquivalentPosition(domSel.focusNode, domSel.focusOffset, domSel.anchorNode, domSel.anchorOffset);
  };
  function keyEvent(keyCode, key) {
    let event = document.createEvent("Event");
    event.initEvent("keydown", true, true);
    event.keyCode = keyCode;
    event.key = event.code = key;
    return event;
  }
  function deepActiveElement(doc2) {
    let elt = doc2.activeElement;
    while (elt && elt.shadowRoot)
      elt = elt.shadowRoot.activeElement;
    return elt;
  }
  const nav = typeof navigator != "undefined" ? navigator : null;
  const doc = typeof document != "undefined" ? document : null;
  const agent = nav && nav.userAgent || "";
  const ie_edge = /Edge\/(\d+)/.exec(agent);
  const ie_upto10 = /MSIE \d/.exec(agent);
  const ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(agent);
  const ie$1 = !!(ie_upto10 || ie_11up || ie_edge);
  const ie_version = ie_upto10 ? document.documentMode : ie_11up ? +ie_11up[1] : ie_edge ? +ie_edge[1] : 0;
  const gecko = !ie$1 && /gecko\/(\d+)/i.test(agent);
  gecko && +(/Firefox\/(\d+)/.exec(agent) || [0, 0])[1];
  const _chrome = !ie$1 && /Chrome\/(\d+)/.exec(agent);
  const chrome$1 = !!_chrome;
  const chrome_version = _chrome ? +_chrome[1] : 0;
  const safari = !ie$1 && !!nav && /Apple Computer/.test(nav.vendor);
  const ios = safari && (/Mobile\/\w+/.test(agent) || !!nav && nav.maxTouchPoints > 2);
  const mac$2 = ios || (nav ? /Mac/.test(nav.platform) : false);
  const android = /Android \d/.test(agent);
  const webkit = !!doc && "webkitFontSmoothing" in doc.documentElement.style;
  const webkit_version = webkit ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
  function windowRect(doc2) {
    return {
      left: 0,
      right: doc2.documentElement.clientWidth,
      top: 0,
      bottom: doc2.documentElement.clientHeight
    };
  }
  function getSide(value, side) {
    return typeof value == "number" ? value : value[side];
  }
  function clientRect(node) {
    let rect = node.getBoundingClientRect();
    let scaleX = rect.width / node.offsetWidth || 1;
    let scaleY = rect.height / node.offsetHeight || 1;
    return {
      left: rect.left,
      right: rect.left + node.clientWidth * scaleX,
      top: rect.top,
      bottom: rect.top + node.clientHeight * scaleY
    };
  }
  function scrollRectIntoView(view, rect, startDOM) {
    let scrollThreshold = view.someProp("scrollThreshold") || 0, scrollMargin = view.someProp("scrollMargin") || 5;
    let doc2 = view.dom.ownerDocument;
    for (let parent = startDOM || view.dom; ; parent = parentNode(parent)) {
      if (!parent)
        break;
      if (parent.nodeType != 1)
        continue;
      let elt = parent;
      let atTop = elt == doc2.body;
      let bounding = atTop ? windowRect(doc2) : clientRect(elt);
      let moveX = 0, moveY = 0;
      if (rect.top < bounding.top + getSide(scrollThreshold, "top"))
        moveY = -(bounding.top - rect.top + getSide(scrollMargin, "top"));
      else if (rect.bottom > bounding.bottom - getSide(scrollThreshold, "bottom"))
        moveY = rect.bottom - bounding.bottom + getSide(scrollMargin, "bottom");
      if (rect.left < bounding.left + getSide(scrollThreshold, "left"))
        moveX = -(bounding.left - rect.left + getSide(scrollMargin, "left"));
      else if (rect.right > bounding.right - getSide(scrollThreshold, "right"))
        moveX = rect.right - bounding.right + getSide(scrollMargin, "right");
      if (moveX || moveY) {
        if (atTop) {
          doc2.defaultView.scrollBy(moveX, moveY);
        } else {
          let startX = elt.scrollLeft, startY = elt.scrollTop;
          if (moveY)
            elt.scrollTop += moveY;
          if (moveX)
            elt.scrollLeft += moveX;
          let dX = elt.scrollLeft - startX, dY = elt.scrollTop - startY;
          rect = { left: rect.left - dX, top: rect.top - dY, right: rect.right - dX, bottom: rect.bottom - dY };
        }
      }
      if (atTop)
        break;
    }
  }
  function storeScrollPos(view) {
    let rect = view.dom.getBoundingClientRect(), startY = Math.max(0, rect.top);
    let refDOM, refTop;
    for (let x = (rect.left + rect.right) / 2, y = startY + 1; y < Math.min(innerHeight, rect.bottom); y += 5) {
      let dom = view.root.elementFromPoint(x, y);
      if (!dom || dom == view.dom || !view.dom.contains(dom))
        continue;
      let localRect = dom.getBoundingClientRect();
      if (localRect.top >= startY - 20) {
        refDOM = dom;
        refTop = localRect.top;
        break;
      }
    }
    return { refDOM, refTop, stack: scrollStack(view.dom) };
  }
  function scrollStack(dom) {
    let stack = [], doc2 = dom.ownerDocument;
    for (let cur = dom; cur; cur = parentNode(cur)) {
      stack.push({ dom: cur, top: cur.scrollTop, left: cur.scrollLeft });
      if (dom == doc2)
        break;
    }
    return stack;
  }
  function resetScrollPos({ refDOM, refTop, stack }) {
    let newRefTop = refDOM ? refDOM.getBoundingClientRect().top : 0;
    restoreScrollStack(stack, newRefTop == 0 ? 0 : newRefTop - refTop);
  }
  function restoreScrollStack(stack, dTop) {
    for (let i2 = 0; i2 < stack.length; i2++) {
      let { dom, top, left } = stack[i2];
      if (dom.scrollTop != top + dTop)
        dom.scrollTop = top + dTop;
      if (dom.scrollLeft != left)
        dom.scrollLeft = left;
    }
  }
  let preventScrollSupported = null;
  function focusPreventScroll(dom) {
    if (dom.setActive)
      return dom.setActive();
    if (preventScrollSupported)
      return dom.focus(preventScrollSupported);
    let stored = scrollStack(dom);
    dom.focus(preventScrollSupported == null ? {
      get preventScroll() {
        preventScrollSupported = { preventScroll: true };
        return true;
      }
    } : void 0);
    if (!preventScrollSupported) {
      preventScrollSupported = false;
      restoreScrollStack(stored, 0);
    }
  }
  function findOffsetInNode(node, coords) {
    let closest, dxClosest = 2e8, coordsClosest, offset = 0;
    let rowBot = coords.top, rowTop = coords.top;
    for (let child = node.firstChild, childIndex = 0; child; child = child.nextSibling, childIndex++) {
      let rects;
      if (child.nodeType == 1)
        rects = child.getClientRects();
      else if (child.nodeType == 3)
        rects = textRange(child).getClientRects();
      else
        continue;
      for (let i2 = 0; i2 < rects.length; i2++) {
        let rect = rects[i2];
        if (rect.top <= rowBot && rect.bottom >= rowTop) {
          rowBot = Math.max(rect.bottom, rowBot);
          rowTop = Math.min(rect.top, rowTop);
          let dx = rect.left > coords.left ? rect.left - coords.left : rect.right < coords.left ? coords.left - rect.right : 0;
          if (dx < dxClosest) {
            closest = child;
            dxClosest = dx;
            coordsClosest = dx && closest.nodeType == 3 ? {
              left: rect.right < coords.left ? rect.right : rect.left,
              top: coords.top
            } : coords;
            if (child.nodeType == 1 && dx)
              offset = childIndex + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0);
            continue;
          }
        }
        if (!closest && (coords.left >= rect.right && coords.top >= rect.top || coords.left >= rect.left && coords.top >= rect.bottom))
          offset = childIndex + 1;
      }
    }
    if (closest && closest.nodeType == 3)
      return findOffsetInText(closest, coordsClosest);
    if (!closest || dxClosest && closest.nodeType == 1)
      return { node, offset };
    return findOffsetInNode(closest, coordsClosest);
  }
  function findOffsetInText(node, coords) {
    let len = node.nodeValue.length;
    let range = document.createRange();
    for (let i2 = 0; i2 < len; i2++) {
      range.setEnd(node, i2 + 1);
      range.setStart(node, i2);
      let rect = singleRect(range, 1);
      if (rect.top == rect.bottom)
        continue;
      if (inRect(coords, rect))
        return { node, offset: i2 + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0) };
    }
    return { node, offset: 0 };
  }
  function inRect(coords, rect) {
    return coords.left >= rect.left - 1 && coords.left <= rect.right + 1 && coords.top >= rect.top - 1 && coords.top <= rect.bottom + 1;
  }
  function targetKludge(dom, coords) {
    let parent = dom.parentNode;
    if (parent && /^li$/i.test(parent.nodeName) && coords.left < dom.getBoundingClientRect().left)
      return parent;
    return dom;
  }
  function posFromElement(view, elt, coords) {
    let { node, offset } = findOffsetInNode(elt, coords), bias = -1;
    if (node.nodeType == 1 && !node.firstChild) {
      let rect = node.getBoundingClientRect();
      bias = rect.left != rect.right && coords.left > (rect.left + rect.right) / 2 ? 1 : -1;
    }
    return view.docView.posFromDOM(node, offset, bias);
  }
  function posFromCaret(view, node, offset, coords) {
    let outside = -1;
    for (let cur = node; ; ) {
      if (cur == view.dom)
        break;
      let desc = view.docView.nearestDesc(cur, true);
      if (!desc)
        return null;
      if (desc.node.isBlock && desc.parent) {
        let rect = desc.dom.getBoundingClientRect();
        if (rect.left > coords.left || rect.top > coords.top)
          outside = desc.posBefore;
        else if (rect.right < coords.left || rect.bottom < coords.top)
          outside = desc.posAfter;
        else
          break;
      }
      cur = desc.dom.parentNode;
    }
    return outside > -1 ? outside : view.docView.posFromDOM(node, offset, 1);
  }
  function elementFromPoint(element, coords, box) {
    let len = element.childNodes.length;
    if (len && box.top < box.bottom) {
      for (let startI = Math.max(0, Math.min(len - 1, Math.floor(len * (coords.top - box.top) / (box.bottom - box.top)) - 2)), i2 = startI; ; ) {
        let child = element.childNodes[i2];
        if (child.nodeType == 1) {
          let rects = child.getClientRects();
          for (let j = 0; j < rects.length; j++) {
            let rect = rects[j];
            if (inRect(coords, rect))
              return elementFromPoint(child, coords, rect);
          }
        }
        if ((i2 = (i2 + 1) % len) == startI)
          break;
      }
    }
    return element;
  }
  function posAtCoords(view, coords) {
    let doc2 = view.dom.ownerDocument, node, offset = 0;
    if (doc2.caretPositionFromPoint) {
      try {
        let pos2 = doc2.caretPositionFromPoint(coords.left, coords.top);
        if (pos2)
          ({ offsetNode: node, offset } = pos2);
      } catch (_) {
      }
    }
    if (!node && doc2.caretRangeFromPoint) {
      let range = doc2.caretRangeFromPoint(coords.left, coords.top);
      if (range)
        ({ startContainer: node, startOffset: offset } = range);
    }
    let elt = (view.root.elementFromPoint ? view.root : doc2).elementFromPoint(coords.left, coords.top);
    let pos;
    if (!elt || !view.dom.contains(elt.nodeType != 1 ? elt.parentNode : elt)) {
      let box = view.dom.getBoundingClientRect();
      if (!inRect(coords, box))
        return null;
      elt = elementFromPoint(view.dom, coords, box);
      if (!elt)
        return null;
    }
    if (safari) {
      for (let p = elt; node && p; p = parentNode(p))
        if (p.draggable)
          node = void 0;
    }
    elt = targetKludge(elt, coords);
    if (node) {
      if (gecko && node.nodeType == 1) {
        offset = Math.min(offset, node.childNodes.length);
        if (offset < node.childNodes.length) {
          let next = node.childNodes[offset], box;
          if (next.nodeName == "IMG" && (box = next.getBoundingClientRect()).right <= coords.left && box.bottom > coords.top)
            offset++;
        }
      }
      if (node == view.dom && offset == node.childNodes.length - 1 && node.lastChild.nodeType == 1 && coords.top > node.lastChild.getBoundingClientRect().bottom)
        pos = view.state.doc.content.size;
      else if (offset == 0 || node.nodeType != 1 || node.childNodes[offset - 1].nodeName != "BR")
        pos = posFromCaret(view, node, offset, coords);
    }
    if (pos == null)
      pos = posFromElement(view, elt, coords);
    let desc = view.docView.nearestDesc(elt, true);
    return { pos, inside: desc ? desc.posAtStart - desc.border : -1 };
  }
  function singleRect(target, bias) {
    let rects = target.getClientRects();
    return !rects.length ? target.getBoundingClientRect() : rects[bias < 0 ? 0 : rects.length - 1];
  }
  const BIDI = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
  function coordsAtPos(view, pos, side) {
    let { node, offset, atom } = view.docView.domFromPos(pos, side < 0 ? -1 : 1);
    let supportEmptyRange = webkit || gecko;
    if (node.nodeType == 3) {
      if (supportEmptyRange && (BIDI.test(node.nodeValue) || (side < 0 ? !offset : offset == node.nodeValue.length))) {
        let rect = singleRect(textRange(node, offset, offset), side);
        if (gecko && offset && /\s/.test(node.nodeValue[offset - 1]) && offset < node.nodeValue.length) {
          let rectBefore = singleRect(textRange(node, offset - 1, offset - 1), -1);
          if (rectBefore.top == rect.top) {
            let rectAfter = singleRect(textRange(node, offset, offset + 1), -1);
            if (rectAfter.top != rect.top)
              return flattenV(rectAfter, rectAfter.left < rectBefore.left);
          }
        }
        return rect;
      } else {
        let from = offset, to = offset, takeSide = side < 0 ? 1 : -1;
        if (side < 0 && !offset) {
          to++;
          takeSide = -1;
        } else if (side >= 0 && offset == node.nodeValue.length) {
          from--;
          takeSide = 1;
        } else if (side < 0) {
          from--;
        } else {
          to++;
        }
        return flattenV(singleRect(textRange(node, from, to), 1), takeSide < 0);
      }
    }
    let $dom = view.state.doc.resolve(pos - (atom || 0));
    if (!$dom.parent.inlineContent) {
      if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
        let before = node.childNodes[offset - 1];
        if (before.nodeType == 1)
          return flattenH(before.getBoundingClientRect(), false);
      }
      if (atom == null && offset < nodeSize(node)) {
        let after = node.childNodes[offset];
        if (after.nodeType == 1)
          return flattenH(after.getBoundingClientRect(), true);
      }
      return flattenH(node.getBoundingClientRect(), side >= 0);
    }
    if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
      let before = node.childNodes[offset - 1];
      let target = before.nodeType == 3 ? textRange(before, nodeSize(before) - (supportEmptyRange ? 0 : 1)) : before.nodeType == 1 && (before.nodeName != "BR" || !before.nextSibling) ? before : null;
      if (target)
        return flattenV(singleRect(target, 1), false);
    }
    if (atom == null && offset < nodeSize(node)) {
      let after = node.childNodes[offset];
      while (after.pmViewDesc && after.pmViewDesc.ignoreForCoords)
        after = after.nextSibling;
      let target = !after ? null : after.nodeType == 3 ? textRange(after, 0, supportEmptyRange ? 0 : 1) : after.nodeType == 1 ? after : null;
      if (target)
        return flattenV(singleRect(target, -1), true);
    }
    return flattenV(singleRect(node.nodeType == 3 ? textRange(node) : node, -side), side >= 0);
  }
  function flattenV(rect, left) {
    if (rect.width == 0)
      return rect;
    let x = left ? rect.left : rect.right;
    return { top: rect.top, bottom: rect.bottom, left: x, right: x };
  }
  function flattenH(rect, top) {
    if (rect.height == 0)
      return rect;
    let y = top ? rect.top : rect.bottom;
    return { top: y, bottom: y, left: rect.left, right: rect.right };
  }
  function withFlushedState(view, state, f) {
    let viewState = view.state, active = view.root.activeElement;
    if (viewState != state)
      view.updateState(state);
    if (active != view.dom)
      view.focus();
    try {
      return f();
    } finally {
      if (viewState != state)
        view.updateState(viewState);
      if (active != view.dom && active)
        active.focus();
    }
  }
  function endOfTextblockVertical(view, state, dir) {
    let sel = state.selection;
    let $pos = dir == "up" ? sel.$from : sel.$to;
    return withFlushedState(view, state, () => {
      let { node: dom } = view.docView.domFromPos($pos.pos, dir == "up" ? -1 : 1);
      for (; ; ) {
        let nearest = view.docView.nearestDesc(dom, true);
        if (!nearest)
          break;
        if (nearest.node.isBlock) {
          dom = nearest.contentDOM || nearest.dom;
          break;
        }
        dom = nearest.dom.parentNode;
      }
      let coords = coordsAtPos(view, $pos.pos, 1);
      for (let child = dom.firstChild; child; child = child.nextSibling) {
        let boxes;
        if (child.nodeType == 1)
          boxes = child.getClientRects();
        else if (child.nodeType == 3)
          boxes = textRange(child, 0, child.nodeValue.length).getClientRects();
        else
          continue;
        for (let i2 = 0; i2 < boxes.length; i2++) {
          let box = boxes[i2];
          if (box.bottom > box.top + 1 && (dir == "up" ? coords.top - box.top > (box.bottom - coords.top) * 2 : box.bottom - coords.bottom > (coords.bottom - box.top) * 2))
            return false;
        }
      }
      return true;
    });
  }
  const maybeRTL = /[\u0590-\u08ac]/;
  function endOfTextblockHorizontal(view, state, dir) {
    let { $head } = state.selection;
    if (!$head.parent.isTextblock)
      return false;
    let offset = $head.parentOffset, atStart = !offset, atEnd = offset == $head.parent.content.size;
    let sel = view.domSelection();
    if (!maybeRTL.test($head.parent.textContent) || !sel.modify)
      return dir == "left" || dir == "backward" ? atStart : atEnd;
    return withFlushedState(view, state, () => {
      let { focusNode: oldNode, focusOffset: oldOff, anchorNode, anchorOffset } = view.domSelectionRange();
      let oldBidiLevel = sel.caretBidiLevel;
      sel.modify("move", dir, "character");
      let parentDOM = $head.depth ? view.docView.domAfterPos($head.before()) : view.dom;
      let { focusNode: newNode, focusOffset: newOff } = view.domSelectionRange();
      let result = newNode && !parentDOM.contains(newNode.nodeType == 1 ? newNode : newNode.parentNode) || oldNode == newNode && oldOff == newOff;
      try {
        sel.collapse(anchorNode, anchorOffset);
        if (oldNode && (oldNode != anchorNode || oldOff != anchorOffset) && sel.extend)
          sel.extend(oldNode, oldOff);
      } catch (_) {
      }
      if (oldBidiLevel != null)
        sel.caretBidiLevel = oldBidiLevel;
      return result;
    });
  }
  let cachedState = null;
  let cachedDir = null;
  let cachedResult = false;
  function endOfTextblock(view, state, dir) {
    if (cachedState == state && cachedDir == dir)
      return cachedResult;
    cachedState = state;
    cachedDir = dir;
    return cachedResult = dir == "up" || dir == "down" ? endOfTextblockVertical(view, state, dir) : endOfTextblockHorizontal(view, state, dir);
  }
  const NOT_DIRTY = 0, CHILD_DIRTY = 1, CONTENT_DIRTY = 2, NODE_DIRTY = 3;
  class ViewDesc {
    constructor(parent, children, dom, contentDOM) {
      this.parent = parent;
      this.children = children;
      this.dom = dom;
      this.contentDOM = contentDOM;
      this.dirty = NOT_DIRTY;
      dom.pmViewDesc = this;
    }
    matchesWidget(widget) {
      return false;
    }
    matchesMark(mark) {
      return false;
    }
    matchesNode(node, outerDeco, innerDeco) {
      return false;
    }
    matchesHack(nodeName) {
      return false;
    }
    parseRule() {
      return null;
    }
    stopEvent(event) {
      return false;
    }
    get size() {
      let size = 0;
      for (let i2 = 0; i2 < this.children.length; i2++)
        size += this.children[i2].size;
      return size;
    }
    get border() {
      return 0;
    }
    destroy() {
      this.parent = void 0;
      if (this.dom.pmViewDesc == this)
        this.dom.pmViewDesc = void 0;
      for (let i2 = 0; i2 < this.children.length; i2++)
        this.children[i2].destroy();
    }
    posBeforeChild(child) {
      for (let i2 = 0, pos = this.posAtStart; ; i2++) {
        let cur = this.children[i2];
        if (cur == child)
          return pos;
        pos += cur.size;
      }
    }
    get posBefore() {
      return this.parent.posBeforeChild(this);
    }
    get posAtStart() {
      return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
    }
    get posAfter() {
      return this.posBefore + this.size;
    }
    get posAtEnd() {
      return this.posAtStart + this.size - 2 * this.border;
    }
    localPosFromDOM(dom, offset, bias) {
      if (this.contentDOM && this.contentDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)) {
        if (bias < 0) {
          let domBefore, desc;
          if (dom == this.contentDOM) {
            domBefore = dom.childNodes[offset - 1];
          } else {
            while (dom.parentNode != this.contentDOM)
              dom = dom.parentNode;
            domBefore = dom.previousSibling;
          }
          while (domBefore && !((desc = domBefore.pmViewDesc) && desc.parent == this))
            domBefore = domBefore.previousSibling;
          return domBefore ? this.posBeforeChild(desc) + desc.size : this.posAtStart;
        } else {
          let domAfter, desc;
          if (dom == this.contentDOM) {
            domAfter = dom.childNodes[offset];
          } else {
            while (dom.parentNode != this.contentDOM)
              dom = dom.parentNode;
            domAfter = dom.nextSibling;
          }
          while (domAfter && !((desc = domAfter.pmViewDesc) && desc.parent == this))
            domAfter = domAfter.nextSibling;
          return domAfter ? this.posBeforeChild(desc) : this.posAtEnd;
        }
      }
      let atEnd;
      if (dom == this.dom && this.contentDOM) {
        atEnd = offset > domIndex(this.contentDOM);
      } else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) {
        atEnd = dom.compareDocumentPosition(this.contentDOM) & 2;
      } else if (this.dom.firstChild) {
        if (offset == 0)
          for (let search = dom; ; search = search.parentNode) {
            if (search == this.dom) {
              atEnd = false;
              break;
            }
            if (search.previousSibling)
              break;
          }
        if (atEnd == null && offset == dom.childNodes.length)
          for (let search = dom; ; search = search.parentNode) {
            if (search == this.dom) {
              atEnd = true;
              break;
            }
            if (search.nextSibling)
              break;
          }
      }
      return (atEnd == null ? bias > 0 : atEnd) ? this.posAtEnd : this.posAtStart;
    }
    nearestDesc(dom, onlyNodes = false) {
      for (let first2 = true, cur = dom; cur; cur = cur.parentNode) {
        let desc = this.getDesc(cur), nodeDOM;
        if (desc && (!onlyNodes || desc.node)) {
          if (first2 && (nodeDOM = desc.nodeDOM) && !(nodeDOM.nodeType == 1 ? nodeDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode) : nodeDOM == dom))
            first2 = false;
          else
            return desc;
        }
      }
    }
    getDesc(dom) {
      let desc = dom.pmViewDesc;
      for (let cur = desc; cur; cur = cur.parent)
        if (cur == this)
          return desc;
    }
    posFromDOM(dom, offset, bias) {
      for (let scan = dom; scan; scan = scan.parentNode) {
        let desc = this.getDesc(scan);
        if (desc)
          return desc.localPosFromDOM(dom, offset, bias);
      }
      return -1;
    }
    descAt(pos) {
      for (let i2 = 0, offset = 0; i2 < this.children.length; i2++) {
        let child = this.children[i2], end = offset + child.size;
        if (offset == pos && end != offset) {
          while (!child.border && child.children.length)
            child = child.children[0];
          return child;
        }
        if (pos < end)
          return child.descAt(pos - offset - child.border);
        offset = end;
      }
    }
    domFromPos(pos, side) {
      if (!this.contentDOM)
        return { node: this.dom, offset: 0, atom: pos + 1 };
      let i2 = 0, offset = 0;
      for (let curPos = 0; i2 < this.children.length; i2++) {
        let child = this.children[i2], end = curPos + child.size;
        if (end > pos || child instanceof TrailingHackViewDesc) {
          offset = pos - curPos;
          break;
        }
        curPos = end;
      }
      if (offset)
        return this.children[i2].domFromPos(offset - this.children[i2].border, side);
      for (let prev; i2 && !(prev = this.children[i2 - 1]).size && prev instanceof WidgetViewDesc && prev.side >= 0; i2--) {
      }
      if (side <= 0) {
        let prev, enter2 = true;
        for (; ; i2--, enter2 = false) {
          prev = i2 ? this.children[i2 - 1] : null;
          if (!prev || prev.dom.parentNode == this.contentDOM)
            break;
        }
        if (prev && side && enter2 && !prev.border && !prev.domAtom)
          return prev.domFromPos(prev.size, side);
        return { node: this.contentDOM, offset: prev ? domIndex(prev.dom) + 1 : 0 };
      } else {
        let next, enter2 = true;
        for (; ; i2++, enter2 = false) {
          next = i2 < this.children.length ? this.children[i2] : null;
          if (!next || next.dom.parentNode == this.contentDOM)
            break;
        }
        if (next && enter2 && !next.border && !next.domAtom)
          return next.domFromPos(0, side);
        return { node: this.contentDOM, offset: next ? domIndex(next.dom) : this.contentDOM.childNodes.length };
      }
    }
    parseRange(from, to, base2 = 0) {
      if (this.children.length == 0)
        return { node: this.contentDOM, from, to, fromOffset: 0, toOffset: this.contentDOM.childNodes.length };
      let fromOffset = -1, toOffset = -1;
      for (let offset = base2, i2 = 0; ; i2++) {
        let child = this.children[i2], end = offset + child.size;
        if (fromOffset == -1 && from <= end) {
          let childBase = offset + child.border;
          if (from >= childBase && to <= end - child.border && child.node && child.contentDOM && this.contentDOM.contains(child.contentDOM))
            return child.parseRange(from, to, childBase);
          from = offset;
          for (let j = i2; j > 0; j--) {
            let prev = this.children[j - 1];
            if (prev.size && prev.dom.parentNode == this.contentDOM && !prev.emptyChildAt(1)) {
              fromOffset = domIndex(prev.dom) + 1;
              break;
            }
            from -= prev.size;
          }
          if (fromOffset == -1)
            fromOffset = 0;
        }
        if (fromOffset > -1 && (end > to || i2 == this.children.length - 1)) {
          to = end;
          for (let j = i2 + 1; j < this.children.length; j++) {
            let next = this.children[j];
            if (next.size && next.dom.parentNode == this.contentDOM && !next.emptyChildAt(-1)) {
              toOffset = domIndex(next.dom);
              break;
            }
            to += next.size;
          }
          if (toOffset == -1)
            toOffset = this.contentDOM.childNodes.length;
          break;
        }
        offset = end;
      }
      return { node: this.contentDOM, from, to, fromOffset, toOffset };
    }
    emptyChildAt(side) {
      if (this.border || !this.contentDOM || !this.children.length)
        return false;
      let child = this.children[side < 0 ? 0 : this.children.length - 1];
      return child.size == 0 || child.emptyChildAt(side);
    }
    domAfterPos(pos) {
      let { node, offset } = this.domFromPos(pos, 0);
      if (node.nodeType != 1 || offset == node.childNodes.length)
        throw new RangeError("No node after pos " + pos);
      return node.childNodes[offset];
    }
    setSelection(anchor, head, root, force = false) {
      let from = Math.min(anchor, head), to = Math.max(anchor, head);
      for (let i2 = 0, offset = 0; i2 < this.children.length; i2++) {
        let child = this.children[i2], end = offset + child.size;
        if (from > offset && to < end)
          return child.setSelection(anchor - offset - child.border, head - offset - child.border, root, force);
        offset = end;
      }
      let anchorDOM = this.domFromPos(anchor, anchor ? -1 : 1);
      let headDOM = head == anchor ? anchorDOM : this.domFromPos(head, head ? -1 : 1);
      let domSel = root.getSelection();
      let brKludge = false;
      if ((gecko || safari) && anchor == head) {
        let { node, offset } = anchorDOM;
        if (node.nodeType == 3) {
          brKludge = !!(offset && node.nodeValue[offset - 1] == "\n");
          if (brKludge && offset == node.nodeValue.length) {
            for (let scan = node, after; scan; scan = scan.parentNode) {
              if (after = scan.nextSibling) {
                if (after.nodeName == "BR")
                  anchorDOM = headDOM = { node: after.parentNode, offset: domIndex(after) + 1 };
                break;
              }
              let desc = scan.pmViewDesc;
              if (desc && desc.node && desc.node.isBlock)
                break;
            }
          }
        } else {
          let prev = node.childNodes[offset - 1];
          brKludge = prev && (prev.nodeName == "BR" || prev.contentEditable == "false");
        }
      }
      if (gecko && domSel.focusNode && domSel.focusNode != headDOM.node && domSel.focusNode.nodeType == 1) {
        let after = domSel.focusNode.childNodes[domSel.focusOffset];
        if (after && after.contentEditable == "false")
          force = true;
      }
      if (!(force || brKludge && safari) && isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset) && isEquivalentPosition(headDOM.node, headDOM.offset, domSel.focusNode, domSel.focusOffset))
        return;
      let domSelExtended = false;
      if ((domSel.extend || anchor == head) && !brKludge) {
        domSel.collapse(anchorDOM.node, anchorDOM.offset);
        try {
          if (anchor != head)
            domSel.extend(headDOM.node, headDOM.offset);
          domSelExtended = true;
        } catch (_) {
        }
      }
      if (!domSelExtended) {
        if (anchor > head) {
          let tmp = anchorDOM;
          anchorDOM = headDOM;
          headDOM = tmp;
        }
        let range = document.createRange();
        range.setEnd(headDOM.node, headDOM.offset);
        range.setStart(anchorDOM.node, anchorDOM.offset);
        domSel.removeAllRanges();
        domSel.addRange(range);
      }
    }
    ignoreMutation(mutation) {
      return !this.contentDOM && mutation.type != "selection";
    }
    get contentLost() {
      return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
    }
    markDirty(from, to) {
      for (let offset = 0, i2 = 0; i2 < this.children.length; i2++) {
        let child = this.children[i2], end = offset + child.size;
        if (offset == end ? from <= end && to >= offset : from < end && to > offset) {
          let startInside = offset + child.border, endInside = end - child.border;
          if (from >= startInside && to <= endInside) {
            this.dirty = from == offset || to == end ? CONTENT_DIRTY : CHILD_DIRTY;
            if (from == startInside && to == endInside && (child.contentLost || child.dom.parentNode != this.contentDOM))
              child.dirty = NODE_DIRTY;
            else
              child.markDirty(from - startInside, to - startInside);
            return;
          } else {
            child.dirty = child.dom == child.contentDOM && child.dom.parentNode == this.contentDOM && !child.children.length ? CONTENT_DIRTY : NODE_DIRTY;
          }
        }
        offset = end;
      }
      this.dirty = CONTENT_DIRTY;
    }
    markParentsDirty() {
      let level = 1;
      for (let node = this.parent; node; node = node.parent, level++) {
        let dirty = level == 1 ? CONTENT_DIRTY : CHILD_DIRTY;
        if (node.dirty < dirty)
          node.dirty = dirty;
      }
    }
    get domAtom() {
      return false;
    }
    get ignoreForCoords() {
      return false;
    }
  }
  class WidgetViewDesc extends ViewDesc {
    constructor(parent, widget, view, pos) {
      let self2, dom = widget.type.toDOM;
      if (typeof dom == "function")
        dom = dom(view, () => {
          if (!self2)
            return pos;
          if (self2.parent)
            return self2.parent.posBeforeChild(self2);
        });
      if (!widget.type.spec.raw) {
        if (dom.nodeType != 1) {
          let wrap2 = document.createElement("span");
          wrap2.appendChild(dom);
          dom = wrap2;
        }
        dom.contentEditable = "false";
        dom.classList.add("ProseMirror-widget");
      }
      super(parent, [], dom, null);
      this.widget = widget;
      this.widget = widget;
      self2 = this;
    }
    matchesWidget(widget) {
      return this.dirty == NOT_DIRTY && widget.type.eq(this.widget.type);
    }
    parseRule() {
      return { ignore: true };
    }
    stopEvent(event) {
      let stop = this.widget.spec.stopEvent;
      return stop ? stop(event) : false;
    }
    ignoreMutation(mutation) {
      return mutation.type != "selection" || this.widget.spec.ignoreSelection;
    }
    destroy() {
      this.widget.type.destroy(this.dom);
      super.destroy();
    }
    get domAtom() {
      return true;
    }
    get side() {
      return this.widget.type.side;
    }
  }
  class CompositionViewDesc extends ViewDesc {
    constructor(parent, dom, textDOM, text2) {
      super(parent, [], dom, null);
      this.textDOM = textDOM;
      this.text = text2;
    }
    get size() {
      return this.text.length;
    }
    localPosFromDOM(dom, offset) {
      if (dom != this.textDOM)
        return this.posAtStart + (offset ? this.size : 0);
      return this.posAtStart + offset;
    }
    domFromPos(pos) {
      return { node: this.textDOM, offset: pos };
    }
    ignoreMutation(mut) {
      return mut.type === "characterData" && mut.target.nodeValue == mut.oldValue;
    }
  }
  class MarkViewDesc extends ViewDesc {
    constructor(parent, mark, dom, contentDOM) {
      super(parent, [], dom, contentDOM);
      this.mark = mark;
    }
    static create(parent, mark, inline, view) {
      let custom = view.nodeViews[mark.type.name];
      let spec = custom && custom(mark, view, inline);
      if (!spec || !spec.dom)
        spec = DOMSerializer.renderSpec(document, mark.type.spec.toDOM(mark, inline));
      return new MarkViewDesc(parent, mark, spec.dom, spec.contentDOM || spec.dom);
    }
    parseRule() {
      if (this.dirty & NODE_DIRTY || this.mark.type.spec.reparseInView)
        return null;
      return { mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM || void 0 };
    }
    matchesMark(mark) {
      return this.dirty != NODE_DIRTY && this.mark.eq(mark);
    }
    markDirty(from, to) {
      super.markDirty(from, to);
      if (this.dirty != NOT_DIRTY) {
        let parent = this.parent;
        while (!parent.node)
          parent = parent.parent;
        if (parent.dirty < this.dirty)
          parent.dirty = this.dirty;
        this.dirty = NOT_DIRTY;
      }
    }
    slice(from, to, view) {
      let copy2 = MarkViewDesc.create(this.parent, this.mark, true, view);
      let nodes = this.children, size = this.size;
      if (to < size)
        nodes = replaceNodes(nodes, to, size, view);
      if (from > 0)
        nodes = replaceNodes(nodes, 0, from, view);
      for (let i2 = 0; i2 < nodes.length; i2++)
        nodes[i2].parent = copy2;
      copy2.children = nodes;
      return copy2;
    }
  }
  class NodeViewDesc extends ViewDesc {
    constructor(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos) {
      super(parent, [], dom, contentDOM);
      this.node = node;
      this.outerDeco = outerDeco;
      this.innerDeco = innerDeco;
      this.nodeDOM = nodeDOM;
      if (contentDOM)
        this.updateChildren(view, pos);
    }
    static create(parent, node, outerDeco, innerDeco, view, pos) {
      let custom = view.nodeViews[node.type.name], descObj;
      let spec = custom && custom(node, view, () => {
        if (!descObj)
          return pos;
        if (descObj.parent)
          return descObj.parent.posBeforeChild(descObj);
      }, outerDeco, innerDeco);
      let dom = spec && spec.dom, contentDOM = spec && spec.contentDOM;
      if (node.isText) {
        if (!dom)
          dom = document.createTextNode(node.text);
        else if (dom.nodeType != 3)
          throw new RangeError("Text must be rendered as a DOM text node");
      } else if (!dom) {
        ({ dom, contentDOM } = DOMSerializer.renderSpec(document, node.type.spec.toDOM(node)));
      }
      if (!contentDOM && !node.isText && dom.nodeName != "BR") {
        if (!dom.hasAttribute("contenteditable"))
          dom.contentEditable = "false";
        if (node.type.spec.draggable)
          dom.draggable = true;
      }
      let nodeDOM = dom;
      dom = applyOuterDeco(dom, outerDeco, node);
      if (spec)
        return descObj = new CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, spec, view, pos + 1);
      else if (node.isText)
        return new TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view);
      else
        return new NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, view, pos + 1);
    }
    parseRule() {
      if (this.node.type.spec.reparseInView)
        return null;
      let rule = { node: this.node.type.name, attrs: this.node.attrs };
      if (this.node.type.whitespace == "pre")
        rule.preserveWhitespace = "full";
      if (!this.contentDOM) {
        rule.getContent = () => this.node.content;
      } else if (!this.contentLost) {
        rule.contentElement = this.contentDOM;
      } else {
        for (let i2 = this.children.length - 1; i2 >= 0; i2--) {
          let child = this.children[i2];
          if (this.dom.contains(child.dom.parentNode)) {
            rule.contentElement = child.dom.parentNode;
            break;
          }
        }
        if (!rule.contentElement)
          rule.getContent = () => Fragment.empty;
      }
      return rule;
    }
    matchesNode(node, outerDeco, innerDeco) {
      return this.dirty == NOT_DIRTY && node.eq(this.node) && sameOuterDeco(outerDeco, this.outerDeco) && innerDeco.eq(this.innerDeco);
    }
    get size() {
      return this.node.nodeSize;
    }
    get border() {
      return this.node.isLeaf ? 0 : 1;
    }
    updateChildren(view, pos) {
      let inline = this.node.inlineContent, off = pos;
      let composition = view.composing ? this.localCompositionInfo(view, pos) : null;
      let localComposition = composition && composition.pos > -1 ? composition : null;
      let compositionInChild = composition && composition.pos < 0;
      let updater = new ViewTreeUpdater(this, localComposition && localComposition.node, view);
      iterDeco(this.node, this.innerDeco, (widget, i2, insideNode) => {
        if (widget.spec.marks)
          updater.syncToMarks(widget.spec.marks, inline, view);
        else if (widget.type.side >= 0 && !insideNode)
          updater.syncToMarks(i2 == this.node.childCount ? Mark$1.none : this.node.child(i2).marks, inline, view);
        updater.placeWidget(widget, view, off);
      }, (child, outerDeco, innerDeco, i2) => {
        updater.syncToMarks(child.marks, inline, view);
        let compIndex;
        if (updater.findNodeMatch(child, outerDeco, innerDeco, i2))
          ;
        else if (compositionInChild && view.state.selection.from > off && view.state.selection.to < off + child.nodeSize && (compIndex = updater.findIndexWithChild(composition.node)) > -1 && updater.updateNodeAt(child, outerDeco, innerDeco, compIndex, view))
          ;
        else if (updater.updateNextNode(child, outerDeco, innerDeco, view, i2))
          ;
        else {
          updater.addNode(child, outerDeco, innerDeco, view, off);
        }
        off += child.nodeSize;
      });
      updater.syncToMarks([], inline, view);
      if (this.node.isTextblock)
        updater.addTextblockHacks();
      updater.destroyRest();
      if (updater.changed || this.dirty == CONTENT_DIRTY) {
        if (localComposition)
          this.protectLocalComposition(view, localComposition);
        renderDescs(this.contentDOM, this.children, view);
        if (ios)
          iosHacks(this.dom);
      }
    }
    localCompositionInfo(view, pos) {
      let { from, to } = view.state.selection;
      if (!(view.state.selection instanceof TextSelection) || from < pos || to > pos + this.node.content.size)
        return null;
      let sel = view.domSelectionRange();
      let textNode = nearbyTextNode(sel.focusNode, sel.focusOffset);
      if (!textNode || !this.dom.contains(textNode.parentNode))
        return null;
      if (this.node.inlineContent) {
        let text2 = textNode.nodeValue;
        let textPos = findTextInFragment(this.node.content, text2, from - pos, to - pos);
        return textPos < 0 ? null : { node: textNode, pos: textPos, text: text2 };
      } else {
        return { node: textNode, pos: -1, text: "" };
      }
    }
    protectLocalComposition(view, { node, pos, text: text2 }) {
      if (this.getDesc(node))
        return;
      let topNode = node;
      for (; ; topNode = topNode.parentNode) {
        if (topNode.parentNode == this.contentDOM)
          break;
        while (topNode.previousSibling)
          topNode.parentNode.removeChild(topNode.previousSibling);
        while (topNode.nextSibling)
          topNode.parentNode.removeChild(topNode.nextSibling);
        if (topNode.pmViewDesc)
          topNode.pmViewDesc = void 0;
      }
      let desc = new CompositionViewDesc(this, topNode, node, text2);
      view.input.compositionNodes.push(desc);
      this.children = replaceNodes(this.children, pos, pos + text2.length, view, desc);
    }
    update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY || !node.sameMarkup(this.node))
        return false;
      this.updateInner(node, outerDeco, innerDeco, view);
      return true;
    }
    updateInner(node, outerDeco, innerDeco, view) {
      this.updateOuterDeco(outerDeco);
      this.node = node;
      this.innerDeco = innerDeco;
      if (this.contentDOM)
        this.updateChildren(view, this.posAtStart);
      this.dirty = NOT_DIRTY;
    }
    updateOuterDeco(outerDeco) {
      if (sameOuterDeco(outerDeco, this.outerDeco))
        return;
      let needsWrap = this.nodeDOM.nodeType != 1;
      let oldDOM = this.dom;
      this.dom = patchOuterDeco(this.dom, this.nodeDOM, computeOuterDeco(this.outerDeco, this.node, needsWrap), computeOuterDeco(outerDeco, this.node, needsWrap));
      if (this.dom != oldDOM) {
        oldDOM.pmViewDesc = void 0;
        this.dom.pmViewDesc = this;
      }
      this.outerDeco = outerDeco;
    }
    selectNode() {
      if (this.nodeDOM.nodeType == 1)
        this.nodeDOM.classList.add("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable)
        this.dom.draggable = true;
    }
    deselectNode() {
      if (this.nodeDOM.nodeType == 1)
        this.nodeDOM.classList.remove("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable)
        this.dom.removeAttribute("draggable");
    }
    get domAtom() {
      return this.node.isAtom;
    }
  }
  function docViewDesc(doc2, outerDeco, innerDeco, dom, view) {
    applyOuterDeco(dom, outerDeco, doc2);
    return new NodeViewDesc(void 0, doc2, outerDeco, innerDeco, dom, dom, dom, view, 0);
  }
  class TextViewDesc extends NodeViewDesc {
    constructor(parent, node, outerDeco, innerDeco, dom, nodeDOM, view) {
      super(parent, node, outerDeco, innerDeco, dom, null, nodeDOM, view, 0);
    }
    parseRule() {
      let skip = this.nodeDOM.parentNode;
      while (skip && skip != this.dom && !skip.pmIsDeco)
        skip = skip.parentNode;
      return { skip: skip || true };
    }
    update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY || this.dirty != NOT_DIRTY && !this.inParent() || !node.sameMarkup(this.node))
        return false;
      this.updateOuterDeco(outerDeco);
      if ((this.dirty != NOT_DIRTY || node.text != this.node.text) && node.text != this.nodeDOM.nodeValue) {
        this.nodeDOM.nodeValue = node.text;
        if (view.trackWrites == this.nodeDOM)
          view.trackWrites = null;
      }
      this.node = node;
      this.dirty = NOT_DIRTY;
      return true;
    }
    inParent() {
      let parentDOM = this.parent.contentDOM;
      for (let n = this.nodeDOM; n; n = n.parentNode)
        if (n == parentDOM)
          return true;
      return false;
    }
    domFromPos(pos) {
      return { node: this.nodeDOM, offset: pos };
    }
    localPosFromDOM(dom, offset, bias) {
      if (dom == this.nodeDOM)
        return this.posAtStart + Math.min(offset, this.node.text.length);
      return super.localPosFromDOM(dom, offset, bias);
    }
    ignoreMutation(mutation) {
      return mutation.type != "characterData" && mutation.type != "selection";
    }
    slice(from, to, view) {
      let node = this.node.cut(from, to), dom = document.createTextNode(node.text);
      return new TextViewDesc(this.parent, node, this.outerDeco, this.innerDeco, dom, dom, view);
    }
    markDirty(from, to) {
      super.markDirty(from, to);
      if (this.dom != this.nodeDOM && (from == 0 || to == this.nodeDOM.nodeValue.length))
        this.dirty = NODE_DIRTY;
    }
    get domAtom() {
      return false;
    }
  }
  class TrailingHackViewDesc extends ViewDesc {
    parseRule() {
      return { ignore: true };
    }
    matchesHack(nodeName) {
      return this.dirty == NOT_DIRTY && this.dom.nodeName == nodeName;
    }
    get domAtom() {
      return true;
    }
    get ignoreForCoords() {
      return this.dom.nodeName == "IMG";
    }
  }
  class CustomNodeViewDesc extends NodeViewDesc {
    constructor(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, spec, view, pos) {
      super(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos);
      this.spec = spec;
    }
    update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY)
        return false;
      if (this.spec.update) {
        let result = this.spec.update(node, outerDeco, innerDeco);
        if (result)
          this.updateInner(node, outerDeco, innerDeco, view);
        return result;
      } else if (!this.contentDOM && !node.isLeaf) {
        return false;
      } else {
        return super.update(node, outerDeco, innerDeco, view);
      }
    }
    selectNode() {
      this.spec.selectNode ? this.spec.selectNode() : super.selectNode();
    }
    deselectNode() {
      this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode();
    }
    setSelection(anchor, head, root, force) {
      this.spec.setSelection ? this.spec.setSelection(anchor, head, root) : super.setSelection(anchor, head, root, force);
    }
    destroy() {
      if (this.spec.destroy)
        this.spec.destroy();
      super.destroy();
    }
    stopEvent(event) {
      return this.spec.stopEvent ? this.spec.stopEvent(event) : false;
    }
    ignoreMutation(mutation) {
      return this.spec.ignoreMutation ? this.spec.ignoreMutation(mutation) : super.ignoreMutation(mutation);
    }
  }
  function renderDescs(parentDOM, descs, view) {
    let dom = parentDOM.firstChild, written = false;
    for (let i2 = 0; i2 < descs.length; i2++) {
      let desc = descs[i2], childDOM = desc.dom;
      if (childDOM.parentNode == parentDOM) {
        while (childDOM != dom) {
          dom = rm(dom);
          written = true;
        }
        dom = dom.nextSibling;
      } else {
        written = true;
        parentDOM.insertBefore(childDOM, dom);
      }
      if (desc instanceof MarkViewDesc) {
        let pos = dom ? dom.previousSibling : parentDOM.lastChild;
        renderDescs(desc.contentDOM, desc.children, view);
        dom = pos ? pos.nextSibling : parentDOM.firstChild;
      }
    }
    while (dom) {
      dom = rm(dom);
      written = true;
    }
    if (written && view.trackWrites == parentDOM)
      view.trackWrites = null;
  }
  const OuterDecoLevel = function(nodeName) {
    if (nodeName)
      this.nodeName = nodeName;
  };
  OuterDecoLevel.prototype = /* @__PURE__ */ Object.create(null);
  const noDeco = [new OuterDecoLevel()];
  function computeOuterDeco(outerDeco, node, needsWrap) {
    if (outerDeco.length == 0)
      return noDeco;
    let top = needsWrap ? noDeco[0] : new OuterDecoLevel(), result = [top];
    for (let i2 = 0; i2 < outerDeco.length; i2++) {
      let attrs = outerDeco[i2].type.attrs;
      if (!attrs)
        continue;
      if (attrs.nodeName)
        result.push(top = new OuterDecoLevel(attrs.nodeName));
      for (let name in attrs) {
        let val = attrs[name];
        if (val == null)
          continue;
        if (needsWrap && result.length == 1)
          result.push(top = new OuterDecoLevel(node.isInline ? "span" : "div"));
        if (name == "class")
          top.class = (top.class ? top.class + " " : "") + val;
        else if (name == "style")
          top.style = (top.style ? top.style + ";" : "") + val;
        else if (name != "nodeName")
          top[name] = val;
      }
    }
    return result;
  }
  function patchOuterDeco(outerDOM, nodeDOM, prevComputed, curComputed) {
    if (prevComputed == noDeco && curComputed == noDeco)
      return nodeDOM;
    let curDOM = nodeDOM;
    for (let i2 = 0; i2 < curComputed.length; i2++) {
      let deco = curComputed[i2], prev = prevComputed[i2];
      if (i2) {
        let parent;
        if (prev && prev.nodeName == deco.nodeName && curDOM != outerDOM && (parent = curDOM.parentNode) && parent.nodeName.toLowerCase() == deco.nodeName) {
          curDOM = parent;
        } else {
          parent = document.createElement(deco.nodeName);
          parent.pmIsDeco = true;
          parent.appendChild(curDOM);
          prev = noDeco[0];
          curDOM = parent;
        }
      }
      patchAttributes(curDOM, prev || noDeco[0], deco);
    }
    return curDOM;
  }
  function patchAttributes(dom, prev, cur) {
    for (let name in prev)
      if (name != "class" && name != "style" && name != "nodeName" && !(name in cur))
        dom.removeAttribute(name);
    for (let name in cur)
      if (name != "class" && name != "style" && name != "nodeName" && cur[name] != prev[name])
        dom.setAttribute(name, cur[name]);
    if (prev.class != cur.class) {
      let prevList = prev.class ? prev.class.split(" ").filter(Boolean) : [];
      let curList = cur.class ? cur.class.split(" ").filter(Boolean) : [];
      for (let i2 = 0; i2 < prevList.length; i2++)
        if (curList.indexOf(prevList[i2]) == -1)
          dom.classList.remove(prevList[i2]);
      for (let i2 = 0; i2 < curList.length; i2++)
        if (prevList.indexOf(curList[i2]) == -1)
          dom.classList.add(curList[i2]);
      if (dom.classList.length == 0)
        dom.removeAttribute("class");
    }
    if (prev.style != cur.style) {
      if (prev.style) {
        let prop = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, m;
        while (m = prop.exec(prev.style))
          dom.style.removeProperty(m[1]);
      }
      if (cur.style)
        dom.style.cssText += cur.style;
    }
  }
  function applyOuterDeco(dom, deco, node) {
    return patchOuterDeco(dom, dom, noDeco, computeOuterDeco(deco, node, dom.nodeType != 1));
  }
  function sameOuterDeco(a, b) {
    if (a.length != b.length)
      return false;
    for (let i2 = 0; i2 < a.length; i2++)
      if (!a[i2].type.eq(b[i2].type))
        return false;
    return true;
  }
  function rm(dom) {
    let next = dom.nextSibling;
    dom.parentNode.removeChild(dom);
    return next;
  }
  class ViewTreeUpdater {
    constructor(top, lock, view) {
      this.lock = lock;
      this.view = view;
      this.index = 0;
      this.stack = [];
      this.changed = false;
      this.top = top;
      this.preMatch = preMatch(top.node.content, top);
    }
    destroyBetween(start, end) {
      if (start == end)
        return;
      for (let i2 = start; i2 < end; i2++)
        this.top.children[i2].destroy();
      this.top.children.splice(start, end - start);
      this.changed = true;
    }
    destroyRest() {
      this.destroyBetween(this.index, this.top.children.length);
    }
    syncToMarks(marks, inline, view) {
      let keep = 0, depth = this.stack.length >> 1;
      let maxKeep = Math.min(depth, marks.length);
      while (keep < maxKeep && (keep == depth - 1 ? this.top : this.stack[keep + 1 << 1]).matchesMark(marks[keep]) && marks[keep].type.spec.spanning !== false)
        keep++;
      while (keep < depth) {
        this.destroyRest();
        this.top.dirty = NOT_DIRTY;
        this.index = this.stack.pop();
        this.top = this.stack.pop();
        depth--;
      }
      while (depth < marks.length) {
        this.stack.push(this.top, this.index + 1);
        let found2 = -1;
        for (let i2 = this.index; i2 < Math.min(this.index + 3, this.top.children.length); i2++) {
          let next = this.top.children[i2];
          if (next.matchesMark(marks[depth]) && !this.isLocked(next.dom)) {
            found2 = i2;
            break;
          }
        }
        if (found2 > -1) {
          if (found2 > this.index) {
            this.changed = true;
            this.destroyBetween(this.index, found2);
          }
          this.top = this.top.children[this.index];
        } else {
          let markDesc = MarkViewDesc.create(this.top, marks[depth], inline, view);
          this.top.children.splice(this.index, 0, markDesc);
          this.top = markDesc;
          this.changed = true;
        }
        this.index = 0;
        depth++;
      }
    }
    findNodeMatch(node, outerDeco, innerDeco, index) {
      let found2 = -1, targetDesc;
      if (index >= this.preMatch.index && (targetDesc = this.preMatch.matches[index - this.preMatch.index]).parent == this.top && targetDesc.matchesNode(node, outerDeco, innerDeco)) {
        found2 = this.top.children.indexOf(targetDesc, this.index);
      } else {
        for (let i2 = this.index, e = Math.min(this.top.children.length, i2 + 5); i2 < e; i2++) {
          let child = this.top.children[i2];
          if (child.matchesNode(node, outerDeco, innerDeco) && !this.preMatch.matched.has(child)) {
            found2 = i2;
            break;
          }
        }
      }
      if (found2 < 0)
        return false;
      this.destroyBetween(this.index, found2);
      this.index++;
      return true;
    }
    updateNodeAt(node, outerDeco, innerDeco, index, view) {
      let child = this.top.children[index];
      if (child.dirty == NODE_DIRTY && child.dom == child.contentDOM)
        child.dirty = CONTENT_DIRTY;
      if (!child.update(node, outerDeco, innerDeco, view))
        return false;
      this.destroyBetween(this.index, index);
      this.index++;
      return true;
    }
    findIndexWithChild(domNode) {
      for (; ; ) {
        let parent = domNode.parentNode;
        if (!parent)
          return -1;
        if (parent == this.top.contentDOM) {
          let desc = domNode.pmViewDesc;
          if (desc)
            for (let i2 = this.index; i2 < this.top.children.length; i2++) {
              if (this.top.children[i2] == desc)
                return i2;
            }
          return -1;
        }
        domNode = parent;
      }
    }
    updateNextNode(node, outerDeco, innerDeco, view, index) {
      for (let i2 = this.index; i2 < this.top.children.length; i2++) {
        let next = this.top.children[i2];
        if (next instanceof NodeViewDesc) {
          let preMatch2 = this.preMatch.matched.get(next);
          if (preMatch2 != null && preMatch2 != index)
            return false;
          let nextDOM = next.dom;
          let locked = this.isLocked(nextDOM) && !(node.isText && next.node && next.node.isText && next.nodeDOM.nodeValue == node.text && next.dirty != NODE_DIRTY && sameOuterDeco(outerDeco, next.outerDeco));
          if (!locked && next.update(node, outerDeco, innerDeco, view)) {
            this.destroyBetween(this.index, i2);
            if (next.dom != nextDOM)
              this.changed = true;
            this.index++;
            return true;
          }
          break;
        }
      }
      return false;
    }
    addNode(node, outerDeco, innerDeco, view, pos) {
      this.top.children.splice(this.index++, 0, NodeViewDesc.create(this.top, node, outerDeco, innerDeco, view, pos));
      this.changed = true;
    }
    placeWidget(widget, view, pos) {
      let next = this.index < this.top.children.length ? this.top.children[this.index] : null;
      if (next && next.matchesWidget(widget) && (widget == next.widget || !next.widget.type.toDOM.parentNode)) {
        this.index++;
      } else {
        let desc = new WidgetViewDesc(this.top, widget, view, pos);
        this.top.children.splice(this.index++, 0, desc);
        this.changed = true;
      }
    }
    addTextblockHacks() {
      let lastChild = this.top.children[this.index - 1], parent = this.top;
      while (lastChild instanceof MarkViewDesc) {
        parent = lastChild;
        lastChild = parent.children[parent.children.length - 1];
      }
      if (!lastChild || !(lastChild instanceof TextViewDesc) || /\n$/.test(lastChild.node.text) || this.view.requiresGeckoHackNode && /\s$/.test(lastChild.node.text)) {
        if ((safari || chrome$1) && lastChild && lastChild.dom.contentEditable == "false")
          this.addHackNode("IMG", parent);
        this.addHackNode("BR", this.top);
      }
    }
    addHackNode(nodeName, parent) {
      if (parent == this.top && this.index < parent.children.length && parent.children[this.index].matchesHack(nodeName)) {
        this.index++;
      } else {
        let dom = document.createElement(nodeName);
        if (nodeName == "IMG") {
          dom.className = "ProseMirror-separator";
          dom.alt = "";
        }
        if (nodeName == "BR")
          dom.className = "ProseMirror-trailingBreak";
        let hack = new TrailingHackViewDesc(this.top, [], dom, null);
        if (parent != this.top)
          parent.children.push(hack);
        else
          parent.children.splice(this.index++, 0, hack);
        this.changed = true;
      }
    }
    isLocked(node) {
      return this.lock && (node == this.lock || node.nodeType == 1 && node.contains(this.lock.parentNode));
    }
  }
  function preMatch(frag, parentDesc) {
    let curDesc = parentDesc, descI = curDesc.children.length;
    let fI = frag.childCount, matched = /* @__PURE__ */ new Map(), matches2 = [];
    outer:
      while (fI > 0) {
        let desc;
        for (; ; ) {
          if (descI) {
            let next = curDesc.children[descI - 1];
            if (next instanceof MarkViewDesc) {
              curDesc = next;
              descI = next.children.length;
            } else {
              desc = next;
              descI--;
              break;
            }
          } else if (curDesc == parentDesc) {
            break outer;
          } else {
            descI = curDesc.parent.children.indexOf(curDesc);
            curDesc = curDesc.parent;
          }
        }
        let node = desc.node;
        if (!node)
          continue;
        if (node != frag.child(fI - 1))
          break;
        --fI;
        matched.set(desc, fI);
        matches2.push(desc);
      }
    return { index: fI, matched, matches: matches2.reverse() };
  }
  function compareSide(a, b) {
    return a.type.side - b.type.side;
  }
  function iterDeco(parent, deco, onWidget, onNode) {
    let locals = deco.locals(parent), offset = 0;
    if (locals.length == 0) {
      for (let i2 = 0; i2 < parent.childCount; i2++) {
        let child = parent.child(i2);
        onNode(child, locals, deco.forChild(offset, child), i2);
        offset += child.nodeSize;
      }
      return;
    }
    let decoIndex = 0, active = [], restNode = null;
    for (let parentIndex = 0; ; ) {
      if (decoIndex < locals.length && locals[decoIndex].to == offset) {
        let widget = locals[decoIndex++], widgets;
        while (decoIndex < locals.length && locals[decoIndex].to == offset)
          (widgets || (widgets = [widget])).push(locals[decoIndex++]);
        if (widgets) {
          widgets.sort(compareSide);
          for (let i2 = 0; i2 < widgets.length; i2++)
            onWidget(widgets[i2], parentIndex, !!restNode);
        } else {
          onWidget(widget, parentIndex, !!restNode);
        }
      }
      let child, index;
      if (restNode) {
        index = -1;
        child = restNode;
        restNode = null;
      } else if (parentIndex < parent.childCount) {
        index = parentIndex;
        child = parent.child(parentIndex++);
      } else {
        break;
      }
      for (let i2 = 0; i2 < active.length; i2++)
        if (active[i2].to <= offset)
          active.splice(i2--, 1);
      while (decoIndex < locals.length && locals[decoIndex].from <= offset && locals[decoIndex].to > offset)
        active.push(locals[decoIndex++]);
      let end = offset + child.nodeSize;
      if (child.isText) {
        let cutAt = end;
        if (decoIndex < locals.length && locals[decoIndex].from < cutAt)
          cutAt = locals[decoIndex].from;
        for (let i2 = 0; i2 < active.length; i2++)
          if (active[i2].to < cutAt)
            cutAt = active[i2].to;
        if (cutAt < end) {
          restNode = child.cut(cutAt - offset);
          child = child.cut(0, cutAt - offset);
          end = cutAt;
          index = -1;
        }
      }
      let outerDeco = child.isInline && !child.isLeaf ? active.filter((d) => !d.inline) : active.slice();
      onNode(child, outerDeco, deco.forChild(offset, child), index);
      offset = end;
    }
  }
  function iosHacks(dom) {
    if (dom.nodeName == "UL" || dom.nodeName == "OL") {
      let oldCSS = dom.style.cssText;
      dom.style.cssText = oldCSS + "; list-style: square !important";
      window.getComputedStyle(dom).listStyle;
      dom.style.cssText = oldCSS;
    }
  }
  function nearbyTextNode(node, offset) {
    for (; ; ) {
      if (node.nodeType == 3)
        return node;
      if (node.nodeType == 1 && offset > 0) {
        if (node.childNodes.length > offset && node.childNodes[offset].nodeType == 3)
          return node.childNodes[offset];
        node = node.childNodes[offset - 1];
        offset = nodeSize(node);
      } else if (node.nodeType == 1 && offset < node.childNodes.length) {
        node = node.childNodes[offset];
        offset = 0;
      } else {
        return null;
      }
    }
  }
  function findTextInFragment(frag, text2, from, to) {
    for (let i2 = 0, pos = 0; i2 < frag.childCount && pos <= to; ) {
      let child = frag.child(i2++), childStart = pos;
      pos += child.nodeSize;
      if (!child.isText)
        continue;
      let str = child.text;
      while (i2 < frag.childCount) {
        let next = frag.child(i2++);
        pos += next.nodeSize;
        if (!next.isText)
          break;
        str += next.text;
      }
      if (pos >= from) {
        let found2 = childStart < to ? str.lastIndexOf(text2, to - childStart - 1) : -1;
        if (found2 >= 0 && found2 + text2.length + childStart >= from)
          return childStart + found2;
        if (from == to && str.length >= to + text2.length - childStart && str.slice(to - childStart, to - childStart + text2.length) == text2)
          return to;
      }
    }
    return -1;
  }
  function replaceNodes(nodes, from, to, view, replacement) {
    let result = [];
    for (let i2 = 0, off = 0; i2 < nodes.length; i2++) {
      let child = nodes[i2], start = off, end = off += child.size;
      if (start >= to || end <= from) {
        result.push(child);
      } else {
        if (start < from)
          result.push(child.slice(0, from - start, view));
        if (replacement) {
          result.push(replacement);
          replacement = void 0;
        }
        if (end > to)
          result.push(child.slice(to - start, child.size, view));
      }
    }
    return result;
  }
  function selectionFromDOM(view, origin = null) {
    let domSel = view.domSelectionRange(), doc2 = view.state.doc;
    if (!domSel.focusNode)
      return null;
    let nearestDesc = view.docView.nearestDesc(domSel.focusNode), inWidget = nearestDesc && nearestDesc.size == 0;
    let head = view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset, 1);
    if (head < 0)
      return null;
    let $head = doc2.resolve(head), $anchor, selection;
    if (selectionCollapsed(domSel)) {
      $anchor = $head;
      while (nearestDesc && !nearestDesc.node)
        nearestDesc = nearestDesc.parent;
      let nearestDescNode = nearestDesc.node;
      if (nearestDesc && nearestDescNode.isAtom && NodeSelection.isSelectable(nearestDescNode) && nearestDesc.parent && !(nearestDescNode.isInline && isOnEdge(domSel.focusNode, domSel.focusOffset, nearestDesc.dom))) {
        let pos = nearestDesc.posBefore;
        selection = new NodeSelection(head == pos ? $head : doc2.resolve(pos));
      }
    } else {
      let anchor = view.docView.posFromDOM(domSel.anchorNode, domSel.anchorOffset, 1);
      if (anchor < 0)
        return null;
      $anchor = doc2.resolve(anchor);
    }
    if (!selection) {
      let bias = origin == "pointer" || view.state.selection.head < $head.pos && !inWidget ? 1 : -1;
      selection = selectionBetween(view, $anchor, $head, bias);
    }
    return selection;
  }
  function editorOwnsSelection(view) {
    return view.editable ? view.hasFocus() : hasSelection(view) && document.activeElement && document.activeElement.contains(view.dom);
  }
  function selectionToDOM(view, force = false) {
    let sel = view.state.selection;
    syncNodeSelection(view, sel);
    if (!editorOwnsSelection(view))
      return;
    if (!force && view.input.mouseDown && view.input.mouseDown.allowDefault && chrome$1) {
      let domSel = view.domSelectionRange(), curSel = view.domObserver.currentSelection;
      if (domSel.anchorNode && curSel.anchorNode && isEquivalentPosition(domSel.anchorNode, domSel.anchorOffset, curSel.anchorNode, curSel.anchorOffset)) {
        view.input.mouseDown.delayedSelectionSync = true;
        view.domObserver.setCurSelection();
        return;
      }
    }
    view.domObserver.disconnectSelection();
    if (view.cursorWrapper) {
      selectCursorWrapper(view);
    } else {
      let { anchor, head } = sel, resetEditableFrom, resetEditableTo;
      if (brokenSelectBetweenUneditable && !(sel instanceof TextSelection)) {
        if (!sel.$from.parent.inlineContent)
          resetEditableFrom = temporarilyEditableNear(view, sel.from);
        if (!sel.empty && !sel.$from.parent.inlineContent)
          resetEditableTo = temporarilyEditableNear(view, sel.to);
      }
      view.docView.setSelection(anchor, head, view.root, force);
      if (brokenSelectBetweenUneditable) {
        if (resetEditableFrom)
          resetEditable(resetEditableFrom);
        if (resetEditableTo)
          resetEditable(resetEditableTo);
      }
      if (sel.visible) {
        view.dom.classList.remove("ProseMirror-hideselection");
      } else {
        view.dom.classList.add("ProseMirror-hideselection");
        if ("onselectionchange" in document)
          removeClassOnSelectionChange(view);
      }
    }
    view.domObserver.setCurSelection();
    view.domObserver.connectSelection();
  }
  const brokenSelectBetweenUneditable = safari || chrome$1 && chrome_version < 63;
  function temporarilyEditableNear(view, pos) {
    let { node, offset } = view.docView.domFromPos(pos, 0);
    let after = offset < node.childNodes.length ? node.childNodes[offset] : null;
    let before = offset ? node.childNodes[offset - 1] : null;
    if (safari && after && after.contentEditable == "false")
      return setEditable(after);
    if ((!after || after.contentEditable == "false") && (!before || before.contentEditable == "false")) {
      if (after)
        return setEditable(after);
      else if (before)
        return setEditable(before);
    }
  }
  function setEditable(element) {
    element.contentEditable = "true";
    if (safari && element.draggable) {
      element.draggable = false;
      element.wasDraggable = true;
    }
    return element;
  }
  function resetEditable(element) {
    element.contentEditable = "false";
    if (element.wasDraggable) {
      element.draggable = true;
      element.wasDraggable = null;
    }
  }
  function removeClassOnSelectionChange(view) {
    let doc2 = view.dom.ownerDocument;
    doc2.removeEventListener("selectionchange", view.input.hideSelectionGuard);
    let domSel = view.domSelectionRange();
    let node = domSel.anchorNode, offset = domSel.anchorOffset;
    doc2.addEventListener("selectionchange", view.input.hideSelectionGuard = () => {
      if (domSel.anchorNode != node || domSel.anchorOffset != offset) {
        doc2.removeEventListener("selectionchange", view.input.hideSelectionGuard);
        setTimeout(() => {
          if (!editorOwnsSelection(view) || view.state.selection.visible)
            view.dom.classList.remove("ProseMirror-hideselection");
        }, 20);
      }
    });
  }
  function selectCursorWrapper(view) {
    let domSel = view.domSelection(), range = document.createRange();
    let node = view.cursorWrapper.dom, img = node.nodeName == "IMG";
    if (img)
      range.setEnd(node.parentNode, domIndex(node) + 1);
    else
      range.setEnd(node, 0);
    range.collapse(false);
    domSel.removeAllRanges();
    domSel.addRange(range);
    if (!img && !view.state.selection.visible && ie$1 && ie_version <= 11) {
      node.disabled = true;
      node.disabled = false;
    }
  }
  function syncNodeSelection(view, sel) {
    if (sel instanceof NodeSelection) {
      let desc = view.docView.descAt(sel.from);
      if (desc != view.lastSelectedViewDesc) {
        clearNodeSelection(view);
        if (desc)
          desc.selectNode();
        view.lastSelectedViewDesc = desc;
      }
    } else {
      clearNodeSelection(view);
    }
  }
  function clearNodeSelection(view) {
    if (view.lastSelectedViewDesc) {
      if (view.lastSelectedViewDesc.parent)
        view.lastSelectedViewDesc.deselectNode();
      view.lastSelectedViewDesc = void 0;
    }
  }
  function selectionBetween(view, $anchor, $head, bias) {
    return view.someProp("createSelectionBetween", (f) => f(view, $anchor, $head)) || TextSelection.between($anchor, $head, bias);
  }
  function hasFocusAndSelection(view) {
    if (view.editable && !view.hasFocus())
      return false;
    return hasSelection(view);
  }
  function hasSelection(view) {
    let sel = view.domSelectionRange();
    if (!sel.anchorNode)
      return false;
    try {
      return view.dom.contains(sel.anchorNode.nodeType == 3 ? sel.anchorNode.parentNode : sel.anchorNode) && (view.editable || view.dom.contains(sel.focusNode.nodeType == 3 ? sel.focusNode.parentNode : sel.focusNode));
    } catch (_) {
      return false;
    }
  }
  function anchorInRightPlace(view) {
    let anchorDOM = view.docView.domFromPos(view.state.selection.anchor, 0);
    let domSel = view.domSelectionRange();
    return isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset);
  }
  function moveSelectionBlock(state, dir) {
    let { $anchor, $head } = state.selection;
    let $side = dir > 0 ? $anchor.max($head) : $anchor.min($head);
    let $start = !$side.parent.inlineContent ? $side : $side.depth ? state.doc.resolve(dir > 0 ? $side.after() : $side.before()) : null;
    return $start && Selection.findFrom($start, dir);
  }
  function apply(view, sel) {
    view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
    return true;
  }
  function selectHorizontally(view, dir, mods) {
    let sel = view.state.selection;
    if (sel instanceof TextSelection) {
      if (!sel.empty || mods.indexOf("s") > -1) {
        return false;
      } else if (view.endOfTextblock(dir > 0 ? "right" : "left")) {
        let next = moveSelectionBlock(view.state, dir);
        if (next && next instanceof NodeSelection)
          return apply(view, next);
        return false;
      } else if (!(mac$2 && mods.indexOf("m") > -1)) {
        let $head = sel.$head, node = $head.textOffset ? null : dir < 0 ? $head.nodeBefore : $head.nodeAfter, desc;
        if (!node || node.isText)
          return false;
        let nodePos = dir < 0 ? $head.pos - node.nodeSize : $head.pos;
        if (!(node.isAtom || (desc = view.docView.descAt(nodePos)) && !desc.contentDOM))
          return false;
        if (NodeSelection.isSelectable(node)) {
          return apply(view, new NodeSelection(dir < 0 ? view.state.doc.resolve($head.pos - node.nodeSize) : $head));
        } else if (webkit) {
          return apply(view, new TextSelection(view.state.doc.resolve(dir < 0 ? nodePos : nodePos + node.nodeSize)));
        } else {
          return false;
        }
      }
    } else if (sel instanceof NodeSelection && sel.node.isInline) {
      return apply(view, new TextSelection(dir > 0 ? sel.$to : sel.$from));
    } else {
      let next = moveSelectionBlock(view.state, dir);
      if (next)
        return apply(view, next);
      return false;
    }
  }
  function nodeLen(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
  }
  function isIgnorable(dom) {
    let desc = dom.pmViewDesc;
    return desc && desc.size == 0 && (dom.nextSibling || dom.nodeName != "BR");
  }
  function skipIgnoredNodesLeft(view) {
    let sel = view.domSelectionRange();
    let node = sel.focusNode, offset = sel.focusOffset;
    if (!node)
      return;
    let moveNode, moveOffset, force = false;
    if (gecko && node.nodeType == 1 && offset < nodeLen(node) && isIgnorable(node.childNodes[offset]))
      force = true;
    for (; ; ) {
      if (offset > 0) {
        if (node.nodeType != 1) {
          break;
        } else {
          let before = node.childNodes[offset - 1];
          if (isIgnorable(before)) {
            moveNode = node;
            moveOffset = --offset;
          } else if (before.nodeType == 3) {
            node = before;
            offset = node.nodeValue.length;
          } else
            break;
        }
      } else if (isBlockNode(node)) {
        break;
      } else {
        let prev = node.previousSibling;
        while (prev && isIgnorable(prev)) {
          moveNode = node.parentNode;
          moveOffset = domIndex(prev);
          prev = prev.previousSibling;
        }
        if (!prev) {
          node = node.parentNode;
          if (node == view.dom)
            break;
          offset = 0;
        } else {
          node = prev;
          offset = nodeLen(node);
        }
      }
    }
    if (force)
      setSelFocus(view, node, offset);
    else if (moveNode)
      setSelFocus(view, moveNode, moveOffset);
  }
  function skipIgnoredNodesRight(view) {
    let sel = view.domSelectionRange();
    let node = sel.focusNode, offset = sel.focusOffset;
    if (!node)
      return;
    let len = nodeLen(node);
    let moveNode, moveOffset;
    for (; ; ) {
      if (offset < len) {
        if (node.nodeType != 1)
          break;
        let after = node.childNodes[offset];
        if (isIgnorable(after)) {
          moveNode = node;
          moveOffset = ++offset;
        } else
          break;
      } else if (isBlockNode(node)) {
        break;
      } else {
        let next = node.nextSibling;
        while (next && isIgnorable(next)) {
          moveNode = next.parentNode;
          moveOffset = domIndex(next) + 1;
          next = next.nextSibling;
        }
        if (!next) {
          node = node.parentNode;
          if (node == view.dom)
            break;
          offset = len = 0;
        } else {
          node = next;
          offset = 0;
          len = nodeLen(node);
        }
      }
    }
    if (moveNode)
      setSelFocus(view, moveNode, moveOffset);
  }
  function isBlockNode(dom) {
    let desc = dom.pmViewDesc;
    return desc && desc.node && desc.node.isBlock;
  }
  function setSelFocus(view, node, offset) {
    let sel = view.domSelection();
    if (selectionCollapsed(sel)) {
      let range = document.createRange();
      range.setEnd(node, offset);
      range.setStart(node, offset);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (sel.extend) {
      sel.extend(node, offset);
    }
    view.domObserver.setCurSelection();
    let { state } = view;
    setTimeout(() => {
      if (view.state == state)
        selectionToDOM(view);
    }, 50);
  }
  function selectVertically(view, dir, mods) {
    let sel = view.state.selection;
    if (sel instanceof TextSelection && !sel.empty || mods.indexOf("s") > -1)
      return false;
    if (mac$2 && mods.indexOf("m") > -1)
      return false;
    let { $from, $to } = sel;
    if (!$from.parent.inlineContent || view.endOfTextblock(dir < 0 ? "up" : "down")) {
      let next = moveSelectionBlock(view.state, dir);
      if (next && next instanceof NodeSelection)
        return apply(view, next);
    }
    if (!$from.parent.inlineContent) {
      let side = dir < 0 ? $from : $to;
      let beyond = sel instanceof AllSelection ? Selection.near(side, dir) : Selection.findFrom(side, dir);
      return beyond ? apply(view, beyond) : false;
    }
    return false;
  }
  function stopNativeHorizontalDelete(view, dir) {
    if (!(view.state.selection instanceof TextSelection))
      return true;
    let { $head, $anchor, empty: empty2 } = view.state.selection;
    if (!$head.sameParent($anchor))
      return true;
    if (!empty2)
      return false;
    if (view.endOfTextblock(dir > 0 ? "forward" : "backward"))
      return true;
    let nextNode = !$head.textOffset && (dir < 0 ? $head.nodeBefore : $head.nodeAfter);
    if (nextNode && !nextNode.isText) {
      let tr = view.state.tr;
      if (dir < 0)
        tr.delete($head.pos - nextNode.nodeSize, $head.pos);
      else
        tr.delete($head.pos, $head.pos + nextNode.nodeSize);
      view.dispatch(tr);
      return true;
    }
    return false;
  }
  function switchEditable(view, node, state) {
    view.domObserver.stop();
    node.contentEditable = state;
    view.domObserver.start();
  }
  function safariDownArrowBug(view) {
    if (!safari || view.state.selection.$head.parentOffset > 0)
      return false;
    let { focusNode, focusOffset } = view.domSelectionRange();
    if (focusNode && focusNode.nodeType == 1 && focusOffset == 0 && focusNode.firstChild && focusNode.firstChild.contentEditable == "false") {
      let child = focusNode.firstChild;
      switchEditable(view, child, "true");
      setTimeout(() => switchEditable(view, child, "false"), 20);
    }
    return false;
  }
  function getMods(event) {
    let result = "";
    if (event.ctrlKey)
      result += "c";
    if (event.metaKey)
      result += "m";
    if (event.altKey)
      result += "a";
    if (event.shiftKey)
      result += "s";
    return result;
  }
  function captureKeyDown(view, event) {
    let code2 = event.keyCode, mods = getMods(event);
    if (code2 == 8 || mac$2 && code2 == 72 && mods == "c") {
      return stopNativeHorizontalDelete(view, -1) || skipIgnoredNodesLeft(view);
    } else if (code2 == 46 || mac$2 && code2 == 68 && mods == "c") {
      return stopNativeHorizontalDelete(view, 1) || skipIgnoredNodesRight(view);
    } else if (code2 == 13 || code2 == 27) {
      return true;
    } else if (code2 == 37 || mac$2 && code2 == 66 && mods == "c") {
      return selectHorizontally(view, -1, mods) || skipIgnoredNodesLeft(view);
    } else if (code2 == 39 || mac$2 && code2 == 70 && mods == "c") {
      return selectHorizontally(view, 1, mods) || skipIgnoredNodesRight(view);
    } else if (code2 == 38 || mac$2 && code2 == 80 && mods == "c") {
      return selectVertically(view, -1, mods) || skipIgnoredNodesLeft(view);
    } else if (code2 == 40 || mac$2 && code2 == 78 && mods == "c") {
      return safariDownArrowBug(view) || selectVertically(view, 1, mods) || skipIgnoredNodesRight(view);
    } else if (mods == (mac$2 ? "m" : "c") && (code2 == 66 || code2 == 73 || code2 == 89 || code2 == 90)) {
      return true;
    }
    return false;
  }
  function serializeForClipboard$1(view, slice) {
    view.someProp("transformCopied", (f) => {
      slice = f(slice, view);
    });
    let context = [], { content, openStart, openEnd } = slice;
    while (openStart > 1 && openEnd > 1 && content.childCount == 1 && content.firstChild.childCount == 1) {
      openStart--;
      openEnd--;
      let node = content.firstChild;
      context.push(node.type.name, node.attrs != node.type.defaultAttrs ? node.attrs : null);
      content = node.content;
    }
    let serializer = view.someProp("clipboardSerializer") || DOMSerializer.fromSchema(view.state.schema);
    let doc2 = detachedDoc(), wrap2 = doc2.createElement("div");
    wrap2.appendChild(serializer.serializeFragment(content, { document: doc2 }));
    let firstChild = wrap2.firstChild, needsWrap, wrappers = 0;
    while (firstChild && firstChild.nodeType == 1 && (needsWrap = wrapMap[firstChild.nodeName.toLowerCase()])) {
      for (let i2 = needsWrap.length - 1; i2 >= 0; i2--) {
        let wrapper = doc2.createElement(needsWrap[i2]);
        while (wrap2.firstChild)
          wrapper.appendChild(wrap2.firstChild);
        wrap2.appendChild(wrapper);
        wrappers++;
      }
      firstChild = wrap2.firstChild;
    }
    if (firstChild && firstChild.nodeType == 1)
      firstChild.setAttribute("data-pm-slice", `${openStart} ${openEnd}${wrappers ? ` -${wrappers}` : ""} ${JSON.stringify(context)}`);
    let text2 = view.someProp("clipboardTextSerializer", (f) => f(slice, view)) || slice.content.textBetween(0, slice.content.size, "\n\n");
    return { dom: wrap2, text: text2 };
  }
  function parseFromClipboard(view, text2, html, plainText, $context) {
    let inCode = $context.parent.type.spec.code;
    let dom, slice;
    if (!html && !text2)
      return null;
    let asText = text2 && (plainText || inCode || !html);
    if (asText) {
      view.someProp("transformPastedText", (f) => {
        text2 = f(text2, inCode || plainText, view);
      });
      if (inCode)
        return text2 ? new Slice(Fragment.from(view.state.schema.text(text2.replace(/\r\n?/g, "\n"))), 0, 0) : Slice.empty;
      let parsed = view.someProp("clipboardTextParser", (f) => f(text2, $context, plainText, view));
      if (parsed) {
        slice = parsed;
      } else {
        let marks = $context.marks();
        let { schema } = view.state, serializer = DOMSerializer.fromSchema(schema);
        dom = document.createElement("div");
        text2.split(/(?:\r\n?|\n)+/).forEach((block2) => {
          let p = dom.appendChild(document.createElement("p"));
          if (block2)
            p.appendChild(serializer.serializeNode(schema.text(block2, marks)));
        });
      }
    } else {
      view.someProp("transformPastedHTML", (f) => {
        html = f(html, view);
      });
      dom = readHTML(html);
      if (webkit)
        restoreReplacedSpaces(dom);
    }
    let contextNode = dom && dom.querySelector("[data-pm-slice]");
    let sliceData = contextNode && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(contextNode.getAttribute("data-pm-slice") || "");
    if (sliceData && sliceData[3])
      for (let i2 = +sliceData[3]; i2 > 0; i2--) {
        let child = dom.firstChild;
        while (child && child.nodeType != 1)
          child = child.nextSibling;
        if (!child)
          break;
        dom = child;
      }
    if (!slice) {
      let parser = view.someProp("clipboardParser") || view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
      slice = parser.parseSlice(dom, {
        preserveWhitespace: !!(asText || sliceData),
        context: $context,
        ruleFromNode(dom2) {
          if (dom2.nodeName == "BR" && !dom2.nextSibling && dom2.parentNode && !inlineParents.test(dom2.parentNode.nodeName))
            return { ignore: true };
          return null;
        }
      });
    }
    if (sliceData) {
      slice = addContext(closeSlice(slice, +sliceData[1], +sliceData[2]), sliceData[4]);
    } else {
      slice = Slice.maxOpen(normalizeSiblings(slice.content, $context), true);
      if (slice.openStart || slice.openEnd) {
        let openStart = 0, openEnd = 0;
        for (let node = slice.content.firstChild; openStart < slice.openStart && !node.type.spec.isolating; openStart++, node = node.firstChild) {
        }
        for (let node = slice.content.lastChild; openEnd < slice.openEnd && !node.type.spec.isolating; openEnd++, node = node.lastChild) {
        }
        slice = closeSlice(slice, openStart, openEnd);
      }
    }
    view.someProp("transformPasted", (f) => {
      slice = f(slice, view);
    });
    return slice;
  }
  const inlineParents = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
  function normalizeSiblings(fragment, $context) {
    if (fragment.childCount < 2)
      return fragment;
    for (let d = $context.depth; d >= 0; d--) {
      let parent = $context.node(d);
      let match = parent.contentMatchAt($context.index(d));
      let lastWrap, result = [];
      fragment.forEach((node) => {
        if (!result)
          return;
        let wrap2 = match.findWrapping(node.type), inLast;
        if (!wrap2)
          return result = null;
        if (inLast = result.length && lastWrap.length && addToSibling(wrap2, lastWrap, node, result[result.length - 1], 0)) {
          result[result.length - 1] = inLast;
        } else {
          if (result.length)
            result[result.length - 1] = closeRight(result[result.length - 1], lastWrap.length);
          let wrapped = withWrappers(node, wrap2);
          result.push(wrapped);
          match = match.matchType(wrapped.type);
          lastWrap = wrap2;
        }
      });
      if (result)
        return Fragment.from(result);
    }
    return fragment;
  }
  function withWrappers(node, wrap2, from = 0) {
    for (let i2 = wrap2.length - 1; i2 >= from; i2--)
      node = wrap2[i2].create(null, Fragment.from(node));
    return node;
  }
  function addToSibling(wrap2, lastWrap, node, sibling, depth) {
    if (depth < wrap2.length && depth < lastWrap.length && wrap2[depth] == lastWrap[depth]) {
      let inner = addToSibling(wrap2, lastWrap, node, sibling.lastChild, depth + 1);
      if (inner)
        return sibling.copy(sibling.content.replaceChild(sibling.childCount - 1, inner));
      let match = sibling.contentMatchAt(sibling.childCount);
      if (match.matchType(depth == wrap2.length - 1 ? node.type : wrap2[depth + 1]))
        return sibling.copy(sibling.content.append(Fragment.from(withWrappers(node, wrap2, depth + 1))));
    }
  }
  function closeRight(node, depth) {
    if (depth == 0)
      return node;
    let fragment = node.content.replaceChild(node.childCount - 1, closeRight(node.lastChild, depth - 1));
    let fill = node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true);
    return node.copy(fragment.append(fill));
  }
  function closeRange(fragment, side, from, to, depth, openEnd) {
    let node = side < 0 ? fragment.firstChild : fragment.lastChild, inner = node.content;
    if (depth < to - 1)
      inner = closeRange(inner, side, from, to, depth + 1, openEnd);
    if (depth >= from)
      inner = side < 0 ? node.contentMatchAt(0).fillBefore(inner, fragment.childCount > 1 || openEnd <= depth).append(inner) : inner.append(node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true));
    return fragment.replaceChild(side < 0 ? 0 : fragment.childCount - 1, node.copy(inner));
  }
  function closeSlice(slice, openStart, openEnd) {
    if (openStart < slice.openStart)
      slice = new Slice(closeRange(slice.content, -1, openStart, slice.openStart, 0, slice.openEnd), openStart, slice.openEnd);
    if (openEnd < slice.openEnd)
      slice = new Slice(closeRange(slice.content, 1, openEnd, slice.openEnd, 0, 0), slice.openStart, openEnd);
    return slice;
  }
  const wrapMap = {
    thead: ["table"],
    tbody: ["table"],
    tfoot: ["table"],
    caption: ["table"],
    colgroup: ["table"],
    col: ["table", "colgroup"],
    tr: ["table", "tbody"],
    td: ["table", "tbody", "tr"],
    th: ["table", "tbody", "tr"]
  };
  let _detachedDoc = null;
  function detachedDoc() {
    return _detachedDoc || (_detachedDoc = document.implementation.createHTMLDocument("title"));
  }
  function readHTML(html) {
    let metas = /^(\s*<meta [^>]*>)*/.exec(html);
    if (metas)
      html = html.slice(metas[0].length);
    let elt = detachedDoc().createElement("div");
    let firstTag = /<([a-z][^>\s]+)/i.exec(html), wrap2;
    if (wrap2 = firstTag && wrapMap[firstTag[1].toLowerCase()])
      html = wrap2.map((n) => "<" + n + ">").join("") + html + wrap2.map((n) => "</" + n + ">").reverse().join("");
    elt.innerHTML = html;
    if (wrap2)
      for (let i2 = 0; i2 < wrap2.length; i2++)
        elt = elt.querySelector(wrap2[i2]) || elt;
    return elt;
  }
  function restoreReplacedSpaces(dom) {
    let nodes = dom.querySelectorAll(chrome$1 ? "span:not([class]):not([style])" : "span.Apple-converted-space");
    for (let i2 = 0; i2 < nodes.length; i2++) {
      let node = nodes[i2];
      if (node.childNodes.length == 1 && node.textContent == "\xA0" && node.parentNode)
        node.parentNode.replaceChild(dom.ownerDocument.createTextNode(" "), node);
    }
  }
  function addContext(slice, context) {
    if (!slice.size)
      return slice;
    let schema = slice.content.firstChild.type.schema, array;
    try {
      array = JSON.parse(context);
    } catch (e) {
      return slice;
    }
    let { content, openStart, openEnd } = slice;
    for (let i2 = array.length - 2; i2 >= 0; i2 -= 2) {
      let type = schema.nodes[array[i2]];
      if (!type || type.hasRequiredAttrs())
        break;
      content = Fragment.from(type.create(array[i2 + 1], content));
      openStart++;
      openEnd++;
    }
    return new Slice(content, openStart, openEnd);
  }
  const handlers = {};
  const editHandlers = {};
  const passiveHandlers = { touchstart: true, touchmove: true };
  class InputState {
    constructor() {
      this.shiftKey = false;
      this.mouseDown = null;
      this.lastKeyCode = null;
      this.lastKeyCodeTime = 0;
      this.lastClick = { time: 0, x: 0, y: 0, type: "" };
      this.lastSelectionOrigin = null;
      this.lastSelectionTime = 0;
      this.lastIOSEnter = 0;
      this.lastIOSEnterFallbackTimeout = -1;
      this.lastFocus = 0;
      this.lastTouch = 0;
      this.lastAndroidDelete = 0;
      this.composing = false;
      this.composingTimeout = -1;
      this.compositionNodes = [];
      this.compositionEndedAt = -2e8;
      this.domChangeCount = 0;
      this.eventHandlers = /* @__PURE__ */ Object.create(null);
      this.hideSelectionGuard = null;
    }
  }
  function initInput(view) {
    for (let event in handlers) {
      let handler = handlers[event];
      view.dom.addEventListener(event, view.input.eventHandlers[event] = (event2) => {
        if (eventBelongsToView(view, event2) && !runCustomHandler(view, event2) && (view.editable || !(event2.type in editHandlers)))
          handler(view, event2);
      }, passiveHandlers[event] ? { passive: true } : void 0);
    }
    if (safari)
      view.dom.addEventListener("input", () => null);
    ensureListeners(view);
  }
  function setSelectionOrigin(view, origin) {
    view.input.lastSelectionOrigin = origin;
    view.input.lastSelectionTime = Date.now();
  }
  function destroyInput(view) {
    view.domObserver.stop();
    for (let type in view.input.eventHandlers)
      view.dom.removeEventListener(type, view.input.eventHandlers[type]);
    clearTimeout(view.input.composingTimeout);
    clearTimeout(view.input.lastIOSEnterFallbackTimeout);
  }
  function ensureListeners(view) {
    view.someProp("handleDOMEvents", (currentHandlers) => {
      for (let type in currentHandlers)
        if (!view.input.eventHandlers[type])
          view.dom.addEventListener(type, view.input.eventHandlers[type] = (event) => runCustomHandler(view, event));
    });
  }
  function runCustomHandler(view, event) {
    return view.someProp("handleDOMEvents", (handlers2) => {
      let handler = handlers2[event.type];
      return handler ? handler(view, event) || event.defaultPrevented : false;
    });
  }
  function eventBelongsToView(view, event) {
    if (!event.bubbles)
      return true;
    if (event.defaultPrevented)
      return false;
    for (let node = event.target; node != view.dom; node = node.parentNode)
      if (!node || node.nodeType == 11 || node.pmViewDesc && node.pmViewDesc.stopEvent(event))
        return false;
    return true;
  }
  function dispatchEvent(view, event) {
    if (!runCustomHandler(view, event) && handlers[event.type] && (view.editable || !(event.type in editHandlers)))
      handlers[event.type](view, event);
  }
  editHandlers.keydown = (view, _event) => {
    let event = _event;
    view.input.shiftKey = event.keyCode == 16 || event.shiftKey;
    if (inOrNearComposition(view, event))
      return;
    view.input.lastKeyCode = event.keyCode;
    view.input.lastKeyCodeTime = Date.now();
    if (android && chrome$1 && event.keyCode == 13)
      return;
    if (event.keyCode != 229)
      view.domObserver.forceFlush();
    if (ios && event.keyCode == 13 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      let now = Date.now();
      view.input.lastIOSEnter = now;
      view.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
        if (view.input.lastIOSEnter == now) {
          view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter")));
          view.input.lastIOSEnter = 0;
        }
      }, 200);
    } else if (view.someProp("handleKeyDown", (f) => f(view, event)) || captureKeyDown(view, event)) {
      event.preventDefault();
    } else {
      setSelectionOrigin(view, "key");
    }
  };
  editHandlers.keyup = (view, event) => {
    if (event.keyCode == 16)
      view.input.shiftKey = false;
  };
  editHandlers.keypress = (view, _event) => {
    let event = _event;
    if (inOrNearComposition(view, event) || !event.charCode || event.ctrlKey && !event.altKey || mac$2 && event.metaKey)
      return;
    if (view.someProp("handleKeyPress", (f) => f(view, event))) {
      event.preventDefault();
      return;
    }
    let sel = view.state.selection;
    if (!(sel instanceof TextSelection) || !sel.$from.sameParent(sel.$to)) {
      let text2 = String.fromCharCode(event.charCode);
      if (!/[\r\n]/.test(text2) && !view.someProp("handleTextInput", (f) => f(view, sel.$from.pos, sel.$to.pos, text2)))
        view.dispatch(view.state.tr.insertText(text2).scrollIntoView());
      event.preventDefault();
    }
  };
  function eventCoords(event) {
    return { left: event.clientX, top: event.clientY };
  }
  function isNear(event, click) {
    let dx = click.x - event.clientX, dy = click.y - event.clientY;
    return dx * dx + dy * dy < 100;
  }
  function runHandlerOnContext(view, propName, pos, inside, event) {
    if (inside == -1)
      return false;
    let $pos = view.state.doc.resolve(inside);
    for (let i2 = $pos.depth + 1; i2 > 0; i2--) {
      if (view.someProp(propName, (f) => i2 > $pos.depth ? f(view, pos, $pos.nodeAfter, $pos.before(i2), event, true) : f(view, pos, $pos.node(i2), $pos.before(i2), event, false)))
        return true;
    }
    return false;
  }
  function updateSelection(view, selection, origin) {
    if (!view.focused)
      view.focus();
    let tr = view.state.tr.setSelection(selection);
    if (origin == "pointer")
      tr.setMeta("pointer", true);
    view.dispatch(tr);
  }
  function selectClickedLeaf(view, inside) {
    if (inside == -1)
      return false;
    let $pos = view.state.doc.resolve(inside), node = $pos.nodeAfter;
    if (node && node.isAtom && NodeSelection.isSelectable(node)) {
      updateSelection(view, new NodeSelection($pos), "pointer");
      return true;
    }
    return false;
  }
  function selectClickedNode(view, inside) {
    if (inside == -1)
      return false;
    let sel = view.state.selection, selectedNode, selectAt;
    if (sel instanceof NodeSelection)
      selectedNode = sel.node;
    let $pos = view.state.doc.resolve(inside);
    for (let i2 = $pos.depth + 1; i2 > 0; i2--) {
      let node = i2 > $pos.depth ? $pos.nodeAfter : $pos.node(i2);
      if (NodeSelection.isSelectable(node)) {
        if (selectedNode && sel.$from.depth > 0 && i2 >= sel.$from.depth && $pos.before(sel.$from.depth + 1) == sel.$from.pos)
          selectAt = $pos.before(sel.$from.depth);
        else
          selectAt = $pos.before(i2);
        break;
      }
    }
    if (selectAt != null) {
      updateSelection(view, NodeSelection.create(view.state.doc, selectAt), "pointer");
      return true;
    } else {
      return false;
    }
  }
  function handleSingleClick(view, pos, inside, event, selectNode) {
    return runHandlerOnContext(view, "handleClickOn", pos, inside, event) || view.someProp("handleClick", (f) => f(view, pos, event)) || (selectNode ? selectClickedNode(view, inside) : selectClickedLeaf(view, inside));
  }
  function handleDoubleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleDoubleClickOn", pos, inside, event) || view.someProp("handleDoubleClick", (f) => f(view, pos, event));
  }
  function handleTripleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleTripleClickOn", pos, inside, event) || view.someProp("handleTripleClick", (f) => f(view, pos, event)) || defaultTripleClick(view, inside, event);
  }
  function defaultTripleClick(view, inside, event) {
    if (event.button != 0)
      return false;
    let doc2 = view.state.doc;
    if (inside == -1) {
      if (doc2.inlineContent) {
        updateSelection(view, TextSelection.create(doc2, 0, doc2.content.size), "pointer");
        return true;
      }
      return false;
    }
    let $pos = doc2.resolve(inside);
    for (let i2 = $pos.depth + 1; i2 > 0; i2--) {
      let node = i2 > $pos.depth ? $pos.nodeAfter : $pos.node(i2);
      let nodePos = $pos.before(i2);
      if (node.inlineContent)
        updateSelection(view, TextSelection.create(doc2, nodePos + 1, nodePos + 1 + node.content.size), "pointer");
      else if (NodeSelection.isSelectable(node))
        updateSelection(view, NodeSelection.create(doc2, nodePos), "pointer");
      else
        continue;
      return true;
    }
  }
  function forceDOMFlush(view) {
    return endComposition(view);
  }
  const selectNodeModifier = mac$2 ? "metaKey" : "ctrlKey";
  handlers.mousedown = (view, _event) => {
    let event = _event;
    view.input.shiftKey = event.shiftKey;
    let flushed = forceDOMFlush(view);
    let now = Date.now(), type = "singleClick";
    if (now - view.input.lastClick.time < 500 && isNear(event, view.input.lastClick) && !event[selectNodeModifier]) {
      if (view.input.lastClick.type == "singleClick")
        type = "doubleClick";
      else if (view.input.lastClick.type == "doubleClick")
        type = "tripleClick";
    }
    view.input.lastClick = { time: now, x: event.clientX, y: event.clientY, type };
    let pos = view.posAtCoords(eventCoords(event));
    if (!pos)
      return;
    if (type == "singleClick") {
      if (view.input.mouseDown)
        view.input.mouseDown.done();
      view.input.mouseDown = new MouseDown(view, pos, event, !!flushed);
    } else if ((type == "doubleClick" ? handleDoubleClick : handleTripleClick)(view, pos.pos, pos.inside, event)) {
      event.preventDefault();
    } else {
      setSelectionOrigin(view, "pointer");
    }
  };
  class MouseDown {
    constructor(view, pos, event, flushed) {
      this.view = view;
      this.pos = pos;
      this.event = event;
      this.flushed = flushed;
      this.delayedSelectionSync = false;
      this.mightDrag = null;
      this.startDoc = view.state.doc;
      this.selectNode = !!event[selectNodeModifier];
      this.allowDefault = event.shiftKey;
      let targetNode, targetPos;
      if (pos.inside > -1) {
        targetNode = view.state.doc.nodeAt(pos.inside);
        targetPos = pos.inside;
      } else {
        let $pos = view.state.doc.resolve(pos.pos);
        targetNode = $pos.parent;
        targetPos = $pos.depth ? $pos.before() : 0;
      }
      const target = flushed ? null : event.target;
      const targetDesc = target ? view.docView.nearestDesc(target, true) : null;
      this.target = targetDesc ? targetDesc.dom : null;
      let { selection } = view.state;
      if (event.button == 0 && targetNode.type.spec.draggable && targetNode.type.spec.selectable !== false || selection instanceof NodeSelection && selection.from <= targetPos && selection.to > targetPos)
        this.mightDrag = {
          node: targetNode,
          pos: targetPos,
          addAttr: !!(this.target && !this.target.draggable),
          setUneditable: !!(this.target && gecko && !this.target.hasAttribute("contentEditable"))
        };
      if (this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable)) {
        this.view.domObserver.stop();
        if (this.mightDrag.addAttr)
          this.target.draggable = true;
        if (this.mightDrag.setUneditable)
          setTimeout(() => {
            if (this.view.input.mouseDown == this)
              this.target.setAttribute("contentEditable", "false");
          }, 20);
        this.view.domObserver.start();
      }
      view.root.addEventListener("mouseup", this.up = this.up.bind(this));
      view.root.addEventListener("mousemove", this.move = this.move.bind(this));
      setSelectionOrigin(view, "pointer");
    }
    done() {
      this.view.root.removeEventListener("mouseup", this.up);
      this.view.root.removeEventListener("mousemove", this.move);
      if (this.mightDrag && this.target) {
        this.view.domObserver.stop();
        if (this.mightDrag.addAttr)
          this.target.removeAttribute("draggable");
        if (this.mightDrag.setUneditable)
          this.target.removeAttribute("contentEditable");
        this.view.domObserver.start();
      }
      if (this.delayedSelectionSync)
        setTimeout(() => selectionToDOM(this.view));
      this.view.input.mouseDown = null;
    }
    up(event) {
      this.done();
      if (!this.view.dom.contains(event.target))
        return;
      let pos = this.pos;
      if (this.view.state.doc != this.startDoc)
        pos = this.view.posAtCoords(eventCoords(event));
      this.updateAllowDefault(event);
      if (this.allowDefault || !pos) {
        setSelectionOrigin(this.view, "pointer");
      } else if (handleSingleClick(this.view, pos.pos, pos.inside, event, this.selectNode)) {
        event.preventDefault();
      } else if (event.button == 0 && (this.flushed || safari && this.mightDrag && !this.mightDrag.node.isAtom || chrome$1 && !this.view.state.selection.visible && Math.min(Math.abs(pos.pos - this.view.state.selection.from), Math.abs(pos.pos - this.view.state.selection.to)) <= 2)) {
        updateSelection(this.view, Selection.near(this.view.state.doc.resolve(pos.pos)), "pointer");
        event.preventDefault();
      } else {
        setSelectionOrigin(this.view, "pointer");
      }
    }
    move(event) {
      this.updateAllowDefault(event);
      setSelectionOrigin(this.view, "pointer");
      if (event.buttons == 0)
        this.done();
    }
    updateAllowDefault(event) {
      if (!this.allowDefault && (Math.abs(this.event.x - event.clientX) > 4 || Math.abs(this.event.y - event.clientY) > 4))
        this.allowDefault = true;
    }
  }
  handlers.touchstart = (view) => {
    view.input.lastTouch = Date.now();
    forceDOMFlush(view);
    setSelectionOrigin(view, "pointer");
  };
  handlers.touchmove = (view) => {
    view.input.lastTouch = Date.now();
    setSelectionOrigin(view, "pointer");
  };
  handlers.contextmenu = (view) => forceDOMFlush(view);
  function inOrNearComposition(view, event) {
    if (view.composing)
      return true;
    if (safari && Math.abs(event.timeStamp - view.input.compositionEndedAt) < 500) {
      view.input.compositionEndedAt = -2e8;
      return true;
    }
    return false;
  }
  const timeoutComposition = android ? 5e3 : -1;
  editHandlers.compositionstart = editHandlers.compositionupdate = (view) => {
    if (!view.composing) {
      view.domObserver.flush();
      let { state } = view, $pos = state.selection.$from;
      if (state.selection.empty && (state.storedMarks || !$pos.textOffset && $pos.parentOffset && $pos.nodeBefore.marks.some((m) => m.type.spec.inclusive === false))) {
        view.markCursor = view.state.storedMarks || $pos.marks();
        endComposition(view, true);
        view.markCursor = null;
      } else {
        endComposition(view);
        if (gecko && state.selection.empty && $pos.parentOffset && !$pos.textOffset && $pos.nodeBefore.marks.length) {
          let sel = view.domSelectionRange();
          for (let node = sel.focusNode, offset = sel.focusOffset; node && node.nodeType == 1 && offset != 0; ) {
            let before = offset < 0 ? node.lastChild : node.childNodes[offset - 1];
            if (!before)
              break;
            if (before.nodeType == 3) {
              view.domSelection().collapse(before, before.nodeValue.length);
              break;
            } else {
              node = before;
              offset = -1;
            }
          }
        }
      }
      view.input.composing = true;
    }
    scheduleComposeEnd(view, timeoutComposition);
  };
  editHandlers.compositionend = (view, event) => {
    if (view.composing) {
      view.input.composing = false;
      view.input.compositionEndedAt = event.timeStamp;
      scheduleComposeEnd(view, 20);
    }
  };
  function scheduleComposeEnd(view, delay) {
    clearTimeout(view.input.composingTimeout);
    if (delay > -1)
      view.input.composingTimeout = setTimeout(() => endComposition(view), delay);
  }
  function clearComposition(view) {
    if (view.composing) {
      view.input.composing = false;
      view.input.compositionEndedAt = timestampFromCustomEvent();
    }
    while (view.input.compositionNodes.length > 0)
      view.input.compositionNodes.pop().markParentsDirty();
  }
  function timestampFromCustomEvent() {
    let event = document.createEvent("Event");
    event.initEvent("event", true, true);
    return event.timeStamp;
  }
  function endComposition(view, forceUpdate = false) {
    if (android && view.domObserver.flushingSoon >= 0)
      return;
    view.domObserver.forceFlush();
    clearComposition(view);
    if (forceUpdate || view.docView && view.docView.dirty) {
      let sel = selectionFromDOM(view);
      if (sel && !sel.eq(view.state.selection))
        view.dispatch(view.state.tr.setSelection(sel));
      else
        view.updateState(view.state);
      return true;
    }
    return false;
  }
  function captureCopy(view, dom) {
    if (!view.dom.parentNode)
      return;
    let wrap2 = view.dom.parentNode.appendChild(document.createElement("div"));
    wrap2.appendChild(dom);
    wrap2.style.cssText = "position: fixed; left: -10000px; top: 10px";
    let sel = getSelection(), range = document.createRange();
    range.selectNodeContents(dom);
    view.dom.blur();
    sel.removeAllRanges();
    sel.addRange(range);
    setTimeout(() => {
      if (wrap2.parentNode)
        wrap2.parentNode.removeChild(wrap2);
      view.focus();
    }, 50);
  }
  const brokenClipboardAPI = ie$1 && ie_version < 15 || ios && webkit_version < 604;
  handlers.copy = editHandlers.cut = (view, _event) => {
    let event = _event;
    let sel = view.state.selection, cut = event.type == "cut";
    if (sel.empty)
      return;
    let data = brokenClipboardAPI ? null : event.clipboardData;
    let slice = sel.content(), { dom, text: text2 } = serializeForClipboard$1(view, slice);
    if (data) {
      event.preventDefault();
      data.clearData();
      data.setData("text/html", dom.innerHTML);
      data.setData("text/plain", text2);
    } else {
      captureCopy(view, dom);
    }
    if (cut)
      view.dispatch(view.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
  };
  function sliceSingleNode(slice) {
    return slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1 ? slice.content.firstChild : null;
  }
  function capturePaste(view, event) {
    if (!view.dom.parentNode)
      return;
    let plainText = view.input.shiftKey || view.state.selection.$from.parent.type.spec.code;
    let target = view.dom.parentNode.appendChild(document.createElement(plainText ? "textarea" : "div"));
    if (!plainText)
      target.contentEditable = "true";
    target.style.cssText = "position: fixed; left: -10000px; top: 10px";
    target.focus();
    setTimeout(() => {
      view.focus();
      if (target.parentNode)
        target.parentNode.removeChild(target);
      if (plainText)
        doPaste(view, target.value, null, view.input.shiftKey, event);
      else
        doPaste(view, target.textContent, target.innerHTML, view.input.shiftKey, event);
    }, 50);
  }
  function doPaste(view, text2, html, preferPlain, event) {
    let slice = parseFromClipboard(view, text2, html, preferPlain, view.state.selection.$from);
    if (view.someProp("handlePaste", (f) => f(view, event, slice || Slice.empty)))
      return true;
    if (!slice)
      return false;
    let singleNode = sliceSingleNode(slice);
    let tr = singleNode ? view.state.tr.replaceSelectionWith(singleNode, view.input.shiftKey) : view.state.tr.replaceSelection(slice);
    view.dispatch(tr.scrollIntoView().setMeta("paste", true).setMeta("uiEvent", "paste"));
    return true;
  }
  editHandlers.paste = (view, _event) => {
    let event = _event;
    if (view.composing && !android)
      return;
    let data = brokenClipboardAPI ? null : event.clipboardData;
    if (data && doPaste(view, data.getData("text/plain"), data.getData("text/html"), view.input.shiftKey, event))
      event.preventDefault();
    else
      capturePaste(view, event);
  };
  class Dragging {
    constructor(slice, move) {
      this.slice = slice;
      this.move = move;
    }
  }
  const dragCopyModifier = mac$2 ? "altKey" : "ctrlKey";
  handlers.dragstart = (view, _event) => {
    let event = _event;
    let mouseDown = view.input.mouseDown;
    if (mouseDown)
      mouseDown.done();
    if (!event.dataTransfer)
      return;
    let sel = view.state.selection;
    let pos = sel.empty ? null : view.posAtCoords(eventCoords(event));
    if (pos && pos.pos >= sel.from && pos.pos <= (sel instanceof NodeSelection ? sel.to - 1 : sel.to))
      ;
    else if (mouseDown && mouseDown.mightDrag) {
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, mouseDown.mightDrag.pos)));
    } else if (event.target && event.target.nodeType == 1) {
      let desc = view.docView.nearestDesc(event.target, true);
      if (desc && desc.node.type.spec.draggable && desc != view.docView)
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, desc.posBefore)));
    }
    let slice = view.state.selection.content(), { dom, text: text2 } = serializeForClipboard$1(view, slice);
    event.dataTransfer.clearData();
    event.dataTransfer.setData(brokenClipboardAPI ? "Text" : "text/html", dom.innerHTML);
    event.dataTransfer.effectAllowed = "copyMove";
    if (!brokenClipboardAPI)
      event.dataTransfer.setData("text/plain", text2);
    view.dragging = new Dragging(slice, !event[dragCopyModifier]);
  };
  handlers.dragend = (view) => {
    let dragging = view.dragging;
    window.setTimeout(() => {
      if (view.dragging == dragging)
        view.dragging = null;
    }, 50);
  };
  editHandlers.dragover = editHandlers.dragenter = (_, e) => e.preventDefault();
  editHandlers.drop = (view, _event) => {
    let event = _event;
    let dragging = view.dragging;
    view.dragging = null;
    if (!event.dataTransfer)
      return;
    let eventPos = view.posAtCoords(eventCoords(event));
    if (!eventPos)
      return;
    let $mouse = view.state.doc.resolve(eventPos.pos);
    let slice = dragging && dragging.slice;
    if (slice) {
      view.someProp("transformPasted", (f) => {
        slice = f(slice, view);
      });
    } else {
      slice = parseFromClipboard(view, event.dataTransfer.getData(brokenClipboardAPI ? "Text" : "text/plain"), brokenClipboardAPI ? null : event.dataTransfer.getData("text/html"), false, $mouse);
    }
    let move = !!(dragging && !event[dragCopyModifier]);
    if (view.someProp("handleDrop", (f) => f(view, event, slice || Slice.empty, move))) {
      event.preventDefault();
      return;
    }
    if (!slice)
      return;
    event.preventDefault();
    let insertPos = slice ? dropPoint(view.state.doc, $mouse.pos, slice) : $mouse.pos;
    if (insertPos == null)
      insertPos = $mouse.pos;
    let tr = view.state.tr;
    if (move)
      tr.deleteSelection();
    let pos = tr.mapping.map(insertPos);
    let isNode = slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1;
    let beforeInsert = tr.doc;
    if (isNode)
      tr.replaceRangeWith(pos, pos, slice.content.firstChild);
    else
      tr.replaceRange(pos, pos, slice);
    if (tr.doc.eq(beforeInsert))
      return;
    let $pos = tr.doc.resolve(pos);
    if (isNode && NodeSelection.isSelectable(slice.content.firstChild) && $pos.nodeAfter && $pos.nodeAfter.sameMarkup(slice.content.firstChild)) {
      tr.setSelection(new NodeSelection($pos));
    } else {
      let end = tr.mapping.map(insertPos);
      tr.mapping.maps[tr.mapping.maps.length - 1].forEach((_from, _to, _newFrom, newTo) => end = newTo);
      tr.setSelection(selectionBetween(view, $pos, tr.doc.resolve(end)));
    }
    view.focus();
    view.dispatch(tr.setMeta("uiEvent", "drop"));
  };
  handlers.focus = (view) => {
    view.input.lastFocus = Date.now();
    if (!view.focused) {
      view.domObserver.stop();
      view.dom.classList.add("ProseMirror-focused");
      view.domObserver.start();
      view.focused = true;
      setTimeout(() => {
        if (view.docView && view.hasFocus() && !view.domObserver.currentSelection.eq(view.domSelectionRange()))
          selectionToDOM(view);
      }, 20);
    }
  };
  handlers.blur = (view, _event) => {
    let event = _event;
    if (view.focused) {
      view.domObserver.stop();
      view.dom.classList.remove("ProseMirror-focused");
      view.domObserver.start();
      if (event.relatedTarget && view.dom.contains(event.relatedTarget))
        view.domObserver.currentSelection.clear();
      view.focused = false;
    }
  };
  handlers.beforeinput = (view, _event) => {
    let event = _event;
    if (chrome$1 && android && event.inputType == "deleteContentBackward") {
      view.domObserver.flushSoon();
      let { domChangeCount } = view.input;
      setTimeout(() => {
        if (view.input.domChangeCount != domChangeCount)
          return;
        view.dom.blur();
        view.focus();
        if (view.someProp("handleKeyDown", (f) => f(view, keyEvent(8, "Backspace"))))
          return;
        let { $cursor } = view.state.selection;
        if ($cursor && $cursor.pos > 0)
          view.dispatch(view.state.tr.delete($cursor.pos - 1, $cursor.pos).scrollIntoView());
      }, 50);
    }
  };
  for (let prop in editHandlers)
    handlers[prop] = editHandlers[prop];
  function compareObjs(a, b) {
    if (a == b)
      return true;
    for (let p in a)
      if (a[p] !== b[p])
        return false;
    for (let p in b)
      if (!(p in a))
        return false;
    return true;
  }
  class WidgetType {
    constructor(toDOM, spec) {
      this.toDOM = toDOM;
      this.spec = spec || noSpec;
      this.side = this.spec.side || 0;
    }
    map(mapping, span, offset, oldOffset) {
      let { pos, deleted } = mapping.mapResult(span.from + oldOffset, this.side < 0 ? -1 : 1);
      return deleted ? null : new Decoration(pos - offset, pos - offset, this);
    }
    valid() {
      return true;
    }
    eq(other) {
      return this == other || other instanceof WidgetType && (this.spec.key && this.spec.key == other.spec.key || this.toDOM == other.toDOM && compareObjs(this.spec, other.spec));
    }
    destroy(node) {
      if (this.spec.destroy)
        this.spec.destroy(node);
    }
  }
  class InlineType {
    constructor(attrs, spec) {
      this.attrs = attrs;
      this.spec = spec || noSpec;
    }
    map(mapping, span, offset, oldOffset) {
      let from = mapping.map(span.from + oldOffset, this.spec.inclusiveStart ? -1 : 1) - offset;
      let to = mapping.map(span.to + oldOffset, this.spec.inclusiveEnd ? 1 : -1) - offset;
      return from >= to ? null : new Decoration(from, to, this);
    }
    valid(_, span) {
      return span.from < span.to;
    }
    eq(other) {
      return this == other || other instanceof InlineType && compareObjs(this.attrs, other.attrs) && compareObjs(this.spec, other.spec);
    }
    static is(span) {
      return span.type instanceof InlineType;
    }
    destroy() {
    }
  }
  class NodeType {
    constructor(attrs, spec) {
      this.attrs = attrs;
      this.spec = spec || noSpec;
    }
    map(mapping, span, offset, oldOffset) {
      let from = mapping.mapResult(span.from + oldOffset, 1);
      if (from.deleted)
        return null;
      let to = mapping.mapResult(span.to + oldOffset, -1);
      if (to.deleted || to.pos <= from.pos)
        return null;
      return new Decoration(from.pos - offset, to.pos - offset, this);
    }
    valid(node, span) {
      let { index, offset } = node.content.findIndex(span.from), child;
      return offset == span.from && !(child = node.child(index)).isText && offset + child.nodeSize == span.to;
    }
    eq(other) {
      return this == other || other instanceof NodeType && compareObjs(this.attrs, other.attrs) && compareObjs(this.spec, other.spec);
    }
    destroy() {
    }
  }
  class Decoration {
    constructor(from, to, type) {
      this.from = from;
      this.to = to;
      this.type = type;
    }
    copy(from, to) {
      return new Decoration(from, to, this.type);
    }
    eq(other, offset = 0) {
      return this.type.eq(other.type) && this.from + offset == other.from && this.to + offset == other.to;
    }
    map(mapping, offset, oldOffset) {
      return this.type.map(mapping, this, offset, oldOffset);
    }
    static widget(pos, toDOM, spec) {
      return new Decoration(pos, pos, new WidgetType(toDOM, spec));
    }
    static inline(from, to, attrs, spec) {
      return new Decoration(from, to, new InlineType(attrs, spec));
    }
    static node(from, to, attrs, spec) {
      return new Decoration(from, to, new NodeType(attrs, spec));
    }
    get spec() {
      return this.type.spec;
    }
    get inline() {
      return this.type instanceof InlineType;
    }
  }
  const none = [], noSpec = {};
  class DecorationSet {
    constructor(local, children) {
      this.local = local.length ? local : none;
      this.children = children.length ? children : none;
    }
    static create(doc2, decorations) {
      return decorations.length ? buildTree(decorations, doc2, 0, noSpec) : empty;
    }
    find(start, end, predicate) {
      let result = [];
      this.findInner(start == null ? 0 : start, end == null ? 1e9 : end, result, 0, predicate);
      return result;
    }
    findInner(start, end, result, offset, predicate) {
      for (let i2 = 0; i2 < this.local.length; i2++) {
        let span = this.local[i2];
        if (span.from <= end && span.to >= start && (!predicate || predicate(span.spec)))
          result.push(span.copy(span.from + offset, span.to + offset));
      }
      for (let i2 = 0; i2 < this.children.length; i2 += 3) {
        if (this.children[i2] < end && this.children[i2 + 1] > start) {
          let childOff = this.children[i2] + 1;
          this.children[i2 + 2].findInner(start - childOff, end - childOff, result, offset + childOff, predicate);
        }
      }
    }
    map(mapping, doc2, options) {
      if (this == empty || mapping.maps.length == 0)
        return this;
      return this.mapInner(mapping, doc2, 0, 0, options || noSpec);
    }
    mapInner(mapping, node, offset, oldOffset, options) {
      let newLocal;
      for (let i2 = 0; i2 < this.local.length; i2++) {
        let mapped = this.local[i2].map(mapping, offset, oldOffset);
        if (mapped && mapped.type.valid(node, mapped))
          (newLocal || (newLocal = [])).push(mapped);
        else if (options.onRemove)
          options.onRemove(this.local[i2].spec);
      }
      if (this.children.length)
        return mapChildren(this.children, newLocal || [], mapping, node, offset, oldOffset, options);
      else
        return newLocal ? new DecorationSet(newLocal.sort(byPos), none) : empty;
    }
    add(doc2, decorations) {
      if (!decorations.length)
        return this;
      if (this == empty)
        return DecorationSet.create(doc2, decorations);
      return this.addInner(doc2, decorations, 0);
    }
    addInner(doc2, decorations, offset) {
      let children, childIndex = 0;
      doc2.forEach((childNode, childOffset) => {
        let baseOffset = childOffset + offset, found2;
        if (!(found2 = takeSpansForNode(decorations, childNode, baseOffset)))
          return;
        if (!children)
          children = this.children.slice();
        while (childIndex < children.length && children[childIndex] < childOffset)
          childIndex += 3;
        if (children[childIndex] == childOffset)
          children[childIndex + 2] = children[childIndex + 2].addInner(childNode, found2, baseOffset + 1);
        else
          children.splice(childIndex, 0, childOffset, childOffset + childNode.nodeSize, buildTree(found2, childNode, baseOffset + 1, noSpec));
        childIndex += 3;
      });
      let local = moveSpans(childIndex ? withoutNulls(decorations) : decorations, -offset);
      for (let i2 = 0; i2 < local.length; i2++)
        if (!local[i2].type.valid(doc2, local[i2]))
          local.splice(i2--, 1);
      return new DecorationSet(local.length ? this.local.concat(local).sort(byPos) : this.local, children || this.children);
    }
    remove(decorations) {
      if (decorations.length == 0 || this == empty)
        return this;
      return this.removeInner(decorations, 0);
    }
    removeInner(decorations, offset) {
      let children = this.children, local = this.local;
      for (let i2 = 0; i2 < children.length; i2 += 3) {
        let found2;
        let from = children[i2] + offset, to = children[i2 + 1] + offset;
        for (let j = 0, span; j < decorations.length; j++)
          if (span = decorations[j]) {
            if (span.from > from && span.to < to) {
              decorations[j] = null;
              (found2 || (found2 = [])).push(span);
            }
          }
        if (!found2)
          continue;
        if (children == this.children)
          children = this.children.slice();
        let removed = children[i2 + 2].removeInner(found2, from + 1);
        if (removed != empty) {
          children[i2 + 2] = removed;
        } else {
          children.splice(i2, 3);
          i2 -= 3;
        }
      }
      if (local.length) {
        for (let i2 = 0, span; i2 < decorations.length; i2++)
          if (span = decorations[i2]) {
            for (let j = 0; j < local.length; j++)
              if (local[j].eq(span, offset)) {
                if (local == this.local)
                  local = this.local.slice();
                local.splice(j--, 1);
              }
          }
      }
      if (children == this.children && local == this.local)
        return this;
      return local.length || children.length ? new DecorationSet(local, children) : empty;
    }
    forChild(offset, node) {
      if (this == empty)
        return this;
      if (node.isLeaf)
        return DecorationSet.empty;
      let child, local;
      for (let i2 = 0; i2 < this.children.length; i2 += 3)
        if (this.children[i2] >= offset) {
          if (this.children[i2] == offset)
            child = this.children[i2 + 2];
          break;
        }
      let start = offset + 1, end = start + node.content.size;
      for (let i2 = 0; i2 < this.local.length; i2++) {
        let dec = this.local[i2];
        if (dec.from < end && dec.to > start && dec.type instanceof InlineType) {
          let from = Math.max(start, dec.from) - start, to = Math.min(end, dec.to) - start;
          if (from < to)
            (local || (local = [])).push(dec.copy(from, to));
        }
      }
      if (local) {
        let localSet = new DecorationSet(local.sort(byPos), none);
        return child ? new DecorationGroup([localSet, child]) : localSet;
      }
      return child || empty;
    }
    eq(other) {
      if (this == other)
        return true;
      if (!(other instanceof DecorationSet) || this.local.length != other.local.length || this.children.length != other.children.length)
        return false;
      for (let i2 = 0; i2 < this.local.length; i2++)
        if (!this.local[i2].eq(other.local[i2]))
          return false;
      for (let i2 = 0; i2 < this.children.length; i2 += 3)
        if (this.children[i2] != other.children[i2] || this.children[i2 + 1] != other.children[i2 + 1] || !this.children[i2 + 2].eq(other.children[i2 + 2]))
          return false;
      return true;
    }
    locals(node) {
      return removeOverlap(this.localsInner(node));
    }
    localsInner(node) {
      if (this == empty)
        return none;
      if (node.inlineContent || !this.local.some(InlineType.is))
        return this.local;
      let result = [];
      for (let i2 = 0; i2 < this.local.length; i2++) {
        if (!(this.local[i2].type instanceof InlineType))
          result.push(this.local[i2]);
      }
      return result;
    }
  }
  DecorationSet.empty = new DecorationSet([], []);
  DecorationSet.removeOverlap = removeOverlap;
  const empty = DecorationSet.empty;
  class DecorationGroup {
    constructor(members) {
      this.members = members;
    }
    map(mapping, doc2) {
      const mappedDecos = this.members.map((member) => member.map(mapping, doc2, noSpec));
      return DecorationGroup.from(mappedDecos);
    }
    forChild(offset, child) {
      if (child.isLeaf)
        return DecorationSet.empty;
      let found2 = [];
      for (let i2 = 0; i2 < this.members.length; i2++) {
        let result = this.members[i2].forChild(offset, child);
        if (result == empty)
          continue;
        if (result instanceof DecorationGroup)
          found2 = found2.concat(result.members);
        else
          found2.push(result);
      }
      return DecorationGroup.from(found2);
    }
    eq(other) {
      if (!(other instanceof DecorationGroup) || other.members.length != this.members.length)
        return false;
      for (let i2 = 0; i2 < this.members.length; i2++)
        if (!this.members[i2].eq(other.members[i2]))
          return false;
      return true;
    }
    locals(node) {
      let result, sorted = true;
      for (let i2 = 0; i2 < this.members.length; i2++) {
        let locals = this.members[i2].localsInner(node);
        if (!locals.length)
          continue;
        if (!result) {
          result = locals;
        } else {
          if (sorted) {
            result = result.slice();
            sorted = false;
          }
          for (let j = 0; j < locals.length; j++)
            result.push(locals[j]);
        }
      }
      return result ? removeOverlap(sorted ? result : result.sort(byPos)) : none;
    }
    static from(members) {
      switch (members.length) {
        case 0:
          return empty;
        case 1:
          return members[0];
        default:
          return new DecorationGroup(members.every((m) => m instanceof DecorationSet) ? members : members.reduce((r, m) => r.concat(m instanceof DecorationSet ? m : m.members), []));
      }
    }
  }
  function mapChildren(oldChildren, newLocal, mapping, node, offset, oldOffset, options) {
    let children = oldChildren.slice();
    for (let i2 = 0, baseOffset = oldOffset; i2 < mapping.maps.length; i2++) {
      let moved = 0;
      mapping.maps[i2].forEach((oldStart, oldEnd, newStart, newEnd) => {
        let dSize = newEnd - newStart - (oldEnd - oldStart);
        for (let i3 = 0; i3 < children.length; i3 += 3) {
          let end = children[i3 + 1];
          if (end < 0 || oldStart > end + baseOffset - moved)
            continue;
          let start = children[i3] + baseOffset - moved;
          if (oldEnd >= start) {
            children[i3 + 1] = oldStart <= start ? -2 : -1;
          } else if (newStart >= offset && dSize) {
            children[i3] += dSize;
            children[i3 + 1] += dSize;
          }
        }
        moved += dSize;
      });
      baseOffset = mapping.maps[i2].map(baseOffset, -1);
    }
    let mustRebuild = false;
    for (let i2 = 0; i2 < children.length; i2 += 3)
      if (children[i2 + 1] < 0) {
        if (children[i2 + 1] == -2) {
          mustRebuild = true;
          children[i2 + 1] = -1;
          continue;
        }
        let from = mapping.map(oldChildren[i2] + oldOffset), fromLocal = from - offset;
        if (fromLocal < 0 || fromLocal >= node.content.size) {
          mustRebuild = true;
          continue;
        }
        let to = mapping.map(oldChildren[i2 + 1] + oldOffset, -1), toLocal = to - offset;
        let { index, offset: childOffset } = node.content.findIndex(fromLocal);
        let childNode = node.maybeChild(index);
        if (childNode && childOffset == fromLocal && childOffset + childNode.nodeSize == toLocal) {
          let mapped = children[i2 + 2].mapInner(mapping, childNode, from + 1, oldChildren[i2] + oldOffset + 1, options);
          if (mapped != empty) {
            children[i2] = fromLocal;
            children[i2 + 1] = toLocal;
            children[i2 + 2] = mapped;
          } else {
            children[i2 + 1] = -2;
            mustRebuild = true;
          }
        } else {
          mustRebuild = true;
        }
      }
    if (mustRebuild) {
      let decorations = mapAndGatherRemainingDecorations(children, oldChildren, newLocal, mapping, offset, oldOffset, options);
      let built = buildTree(decorations, node, 0, options);
      newLocal = built.local;
      for (let i2 = 0; i2 < children.length; i2 += 3)
        if (children[i2 + 1] < 0) {
          children.splice(i2, 3);
          i2 -= 3;
        }
      for (let i2 = 0, j = 0; i2 < built.children.length; i2 += 3) {
        let from = built.children[i2];
        while (j < children.length && children[j] < from)
          j += 3;
        children.splice(j, 0, built.children[i2], built.children[i2 + 1], built.children[i2 + 2]);
      }
    }
    return new DecorationSet(newLocal.sort(byPos), children);
  }
  function moveSpans(spans, offset) {
    if (!offset || !spans.length)
      return spans;
    let result = [];
    for (let i2 = 0; i2 < spans.length; i2++) {
      let span = spans[i2];
      result.push(new Decoration(span.from + offset, span.to + offset, span.type));
    }
    return result;
  }
  function mapAndGatherRemainingDecorations(children, oldChildren, decorations, mapping, offset, oldOffset, options) {
    function gather(set, oldOffset2) {
      for (let i2 = 0; i2 < set.local.length; i2++) {
        let mapped = set.local[i2].map(mapping, offset, oldOffset2);
        if (mapped)
          decorations.push(mapped);
        else if (options.onRemove)
          options.onRemove(set.local[i2].spec);
      }
      for (let i2 = 0; i2 < set.children.length; i2 += 3)
        gather(set.children[i2 + 2], set.children[i2] + oldOffset2 + 1);
    }
    for (let i2 = 0; i2 < children.length; i2 += 3)
      if (children[i2 + 1] == -1)
        gather(children[i2 + 2], oldChildren[i2] + oldOffset + 1);
    return decorations;
  }
  function takeSpansForNode(spans, node, offset) {
    if (node.isLeaf)
      return null;
    let end = offset + node.nodeSize, found2 = null;
    for (let i2 = 0, span; i2 < spans.length; i2++) {
      if ((span = spans[i2]) && span.from > offset && span.to < end) {
        (found2 || (found2 = [])).push(span);
        spans[i2] = null;
      }
    }
    return found2;
  }
  function withoutNulls(array) {
    let result = [];
    for (let i2 = 0; i2 < array.length; i2++)
      if (array[i2] != null)
        result.push(array[i2]);
    return result;
  }
  function buildTree(spans, node, offset, options) {
    let children = [], hasNulls = false;
    node.forEach((childNode, localStart) => {
      let found2 = takeSpansForNode(spans, childNode, localStart + offset);
      if (found2) {
        hasNulls = true;
        let subtree = buildTree(found2, childNode, offset + localStart + 1, options);
        if (subtree != empty)
          children.push(localStart, localStart + childNode.nodeSize, subtree);
      }
    });
    let locals = moveSpans(hasNulls ? withoutNulls(spans) : spans, -offset).sort(byPos);
    for (let i2 = 0; i2 < locals.length; i2++)
      if (!locals[i2].type.valid(node, locals[i2])) {
        if (options.onRemove)
          options.onRemove(locals[i2].spec);
        locals.splice(i2--, 1);
      }
    return locals.length || children.length ? new DecorationSet(locals, children) : empty;
  }
  function byPos(a, b) {
    return a.from - b.from || a.to - b.to;
  }
  function removeOverlap(spans) {
    let working = spans;
    for (let i2 = 0; i2 < working.length - 1; i2++) {
      let span = working[i2];
      if (span.from != span.to)
        for (let j = i2 + 1; j < working.length; j++) {
          let next = working[j];
          if (next.from == span.from) {
            if (next.to != span.to) {
              if (working == spans)
                working = spans.slice();
              working[j] = next.copy(next.from, span.to);
              insertAhead(working, j + 1, next.copy(span.to, next.to));
            }
            continue;
          } else {
            if (next.from < span.to) {
              if (working == spans)
                working = spans.slice();
              working[i2] = span.copy(span.from, next.from);
              insertAhead(working, j, span.copy(next.from, span.to));
            }
            break;
          }
        }
    }
    return working;
  }
  function insertAhead(array, i2, deco) {
    while (i2 < array.length && byPos(deco, array[i2]) > 0)
      i2++;
    array.splice(i2, 0, deco);
  }
  function viewDecorations(view) {
    let found2 = [];
    view.someProp("decorations", (f) => {
      let result = f(view.state);
      if (result && result != empty)
        found2.push(result);
    });
    if (view.cursorWrapper)
      found2.push(DecorationSet.create(view.state.doc, [view.cursorWrapper.deco]));
    return DecorationGroup.from(found2);
  }
  const observeOptions = {
    childList: true,
    characterData: true,
    characterDataOldValue: true,
    attributes: true,
    attributeOldValue: true,
    subtree: true
  };
  const useCharData = ie$1 && ie_version <= 11;
  class SelectionState {
    constructor() {
      this.anchorNode = null;
      this.anchorOffset = 0;
      this.focusNode = null;
      this.focusOffset = 0;
    }
    set(sel) {
      this.anchorNode = sel.anchorNode;
      this.anchorOffset = sel.anchorOffset;
      this.focusNode = sel.focusNode;
      this.focusOffset = sel.focusOffset;
    }
    clear() {
      this.anchorNode = this.focusNode = null;
    }
    eq(sel) {
      return sel.anchorNode == this.anchorNode && sel.anchorOffset == this.anchorOffset && sel.focusNode == this.focusNode && sel.focusOffset == this.focusOffset;
    }
  }
  class DOMObserver {
    constructor(view, handleDOMChange) {
      this.view = view;
      this.handleDOMChange = handleDOMChange;
      this.queue = [];
      this.flushingSoon = -1;
      this.observer = null;
      this.currentSelection = new SelectionState();
      this.onCharData = null;
      this.suppressingSelectionUpdates = false;
      this.observer = window.MutationObserver && new window.MutationObserver((mutations) => {
        for (let i2 = 0; i2 < mutations.length; i2++)
          this.queue.push(mutations[i2]);
        if (ie$1 && ie_version <= 11 && mutations.some((m) => m.type == "childList" && m.removedNodes.length || m.type == "characterData" && m.oldValue.length > m.target.nodeValue.length))
          this.flushSoon();
        else
          this.flush();
      });
      if (useCharData) {
        this.onCharData = (e) => {
          this.queue.push({ target: e.target, type: "characterData", oldValue: e.prevValue });
          this.flushSoon();
        };
      }
      this.onSelectionChange = this.onSelectionChange.bind(this);
    }
    flushSoon() {
      if (this.flushingSoon < 0)
        this.flushingSoon = window.setTimeout(() => {
          this.flushingSoon = -1;
          this.flush();
        }, 20);
    }
    forceFlush() {
      if (this.flushingSoon > -1) {
        window.clearTimeout(this.flushingSoon);
        this.flushingSoon = -1;
        this.flush();
      }
    }
    start() {
      if (this.observer) {
        this.observer.takeRecords();
        this.observer.observe(this.view.dom, observeOptions);
      }
      if (this.onCharData)
        this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData);
      this.connectSelection();
    }
    stop() {
      if (this.observer) {
        let take = this.observer.takeRecords();
        if (take.length) {
          for (let i2 = 0; i2 < take.length; i2++)
            this.queue.push(take[i2]);
          window.setTimeout(() => this.flush(), 20);
        }
        this.observer.disconnect();
      }
      if (this.onCharData)
        this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData);
      this.disconnectSelection();
    }
    connectSelection() {
      this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
    }
    disconnectSelection() {
      this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
    }
    suppressSelectionUpdates() {
      this.suppressingSelectionUpdates = true;
      setTimeout(() => this.suppressingSelectionUpdates = false, 50);
    }
    onSelectionChange() {
      if (!hasFocusAndSelection(this.view))
        return;
      if (this.suppressingSelectionUpdates)
        return selectionToDOM(this.view);
      if (ie$1 && ie_version <= 11 && !this.view.state.selection.empty) {
        let sel = this.view.domSelectionRange();
        if (sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset))
          return this.flushSoon();
      }
      this.flush();
    }
    setCurSelection() {
      this.currentSelection.set(this.view.domSelectionRange());
    }
    ignoreSelectionChange(sel) {
      if (!sel.focusNode)
        return true;
      let ancestors = /* @__PURE__ */ new Set(), container;
      for (let scan = sel.focusNode; scan; scan = parentNode(scan))
        ancestors.add(scan);
      for (let scan = sel.anchorNode; scan; scan = parentNode(scan))
        if (ancestors.has(scan)) {
          container = scan;
          break;
        }
      let desc = container && this.view.docView.nearestDesc(container);
      if (desc && desc.ignoreMutation({
        type: "selection",
        target: container.nodeType == 3 ? container.parentNode : container
      })) {
        this.setCurSelection();
        return true;
      }
    }
    flush() {
      let { view } = this;
      if (!view.docView || this.flushingSoon > -1)
        return;
      let mutations = this.observer ? this.observer.takeRecords() : [];
      if (this.queue.length) {
        mutations = this.queue.concat(mutations);
        this.queue.length = 0;
      }
      let sel = view.domSelectionRange();
      let newSel = !this.suppressingSelectionUpdates && !this.currentSelection.eq(sel) && hasFocusAndSelection(view) && !this.ignoreSelectionChange(sel);
      let from = -1, to = -1, typeOver = false, added = [];
      if (view.editable) {
        for (let i2 = 0; i2 < mutations.length; i2++) {
          let result = this.registerMutation(mutations[i2], added);
          if (result) {
            from = from < 0 ? result.from : Math.min(result.from, from);
            to = to < 0 ? result.to : Math.max(result.to, to);
            if (result.typeOver)
              typeOver = true;
          }
        }
      }
      if (gecko && added.length > 1) {
        let brs = added.filter((n) => n.nodeName == "BR");
        if (brs.length == 2) {
          let a = brs[0], b = brs[1];
          if (a.parentNode && a.parentNode.parentNode == b.parentNode)
            b.remove();
          else
            a.remove();
        }
      }
      let readSel = null;
      if (from < 0 && newSel && view.input.lastFocus > Date.now() - 200 && view.input.lastTouch < Date.now() - 300 && selectionCollapsed(sel) && (readSel = selectionFromDOM(view)) && readSel.eq(Selection.near(view.state.doc.resolve(0), 1))) {
        view.input.lastFocus = 0;
        selectionToDOM(view);
        this.currentSelection.set(sel);
        view.scrollToSelection();
      } else if (from > -1 || newSel) {
        if (from > -1) {
          view.docView.markDirty(from, to);
          checkCSS(view);
        }
        this.handleDOMChange(from, to, typeOver, added);
        if (view.docView && view.docView.dirty)
          view.updateState(view.state);
        else if (!this.currentSelection.eq(sel))
          selectionToDOM(view);
        this.currentSelection.set(sel);
      }
    }
    registerMutation(mut, added) {
      if (added.indexOf(mut.target) > -1)
        return null;
      let desc = this.view.docView.nearestDesc(mut.target);
      if (mut.type == "attributes" && (desc == this.view.docView || mut.attributeName == "contenteditable" || mut.attributeName == "style" && !mut.oldValue && !mut.target.getAttribute("style")))
        return null;
      if (!desc || desc.ignoreMutation(mut))
        return null;
      if (mut.type == "childList") {
        for (let i2 = 0; i2 < mut.addedNodes.length; i2++)
          added.push(mut.addedNodes[i2]);
        if (desc.contentDOM && desc.contentDOM != desc.dom && !desc.contentDOM.contains(mut.target))
          return { from: desc.posBefore, to: desc.posAfter };
        let prev = mut.previousSibling, next = mut.nextSibling;
        if (ie$1 && ie_version <= 11 && mut.addedNodes.length) {
          for (let i2 = 0; i2 < mut.addedNodes.length; i2++) {
            let { previousSibling, nextSibling } = mut.addedNodes[i2];
            if (!previousSibling || Array.prototype.indexOf.call(mut.addedNodes, previousSibling) < 0)
              prev = previousSibling;
            if (!nextSibling || Array.prototype.indexOf.call(mut.addedNodes, nextSibling) < 0)
              next = nextSibling;
          }
        }
        let fromOffset = prev && prev.parentNode == mut.target ? domIndex(prev) + 1 : 0;
        let from = desc.localPosFromDOM(mut.target, fromOffset, -1);
        let toOffset = next && next.parentNode == mut.target ? domIndex(next) : mut.target.childNodes.length;
        let to = desc.localPosFromDOM(mut.target, toOffset, 1);
        return { from, to };
      } else if (mut.type == "attributes") {
        return { from: desc.posAtStart - desc.border, to: desc.posAtEnd + desc.border };
      } else {
        return {
          from: desc.posAtStart,
          to: desc.posAtEnd,
          typeOver: mut.target.nodeValue == mut.oldValue
        };
      }
    }
  }
  let cssChecked = /* @__PURE__ */ new WeakMap();
  let cssCheckWarned = false;
  function checkCSS(view) {
    if (cssChecked.has(view))
      return;
    cssChecked.set(view, null);
    if (["normal", "nowrap", "pre-line"].indexOf(getComputedStyle(view.dom).whiteSpace) !== -1) {
      view.requiresGeckoHackNode = gecko;
      if (cssCheckWarned)
        return;
      console["warn"]("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package.");
      cssCheckWarned = true;
    }
  }
  function safariShadowSelectionRange(view) {
    let found2;
    function read(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      found2 = event.getTargetRanges()[0];
    }
    view.dom.addEventListener("beforeinput", read, true);
    document.execCommand("indent");
    view.dom.removeEventListener("beforeinput", read, true);
    let anchorNode = found2.startContainer, anchorOffset = found2.startOffset;
    let focusNode = found2.endContainer, focusOffset = found2.endOffset;
    let currentAnchor = view.domAtPos(view.state.selection.anchor);
    if (isEquivalentPosition(currentAnchor.node, currentAnchor.offset, focusNode, focusOffset))
      [anchorNode, anchorOffset, focusNode, focusOffset] = [focusNode, focusOffset, anchorNode, anchorOffset];
    return { anchorNode, anchorOffset, focusNode, focusOffset };
  }
  function parseBetween(view, from_, to_) {
    let { node: parent, fromOffset, toOffset, from, to } = view.docView.parseRange(from_, to_);
    let domSel = view.domSelectionRange();
    let find2;
    let anchor = domSel.anchorNode;
    if (anchor && view.dom.contains(anchor.nodeType == 1 ? anchor : anchor.parentNode)) {
      find2 = [{ node: anchor, offset: domSel.anchorOffset }];
      if (!selectionCollapsed(domSel))
        find2.push({ node: domSel.focusNode, offset: domSel.focusOffset });
    }
    if (chrome$1 && view.input.lastKeyCode === 8) {
      for (let off = toOffset; off > fromOffset; off--) {
        let node = parent.childNodes[off - 1], desc = node.pmViewDesc;
        if (node.nodeName == "BR" && !desc) {
          toOffset = off;
          break;
        }
        if (!desc || desc.size)
          break;
      }
    }
    let startDoc = view.state.doc;
    let parser = view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
    let $from = startDoc.resolve(from);
    let sel = null, doc2 = parser.parse(parent, {
      topNode: $from.parent,
      topMatch: $from.parent.contentMatchAt($from.index()),
      topOpen: true,
      from: fromOffset,
      to: toOffset,
      preserveWhitespace: $from.parent.type.whitespace == "pre" ? "full" : true,
      findPositions: find2,
      ruleFromNode,
      context: $from
    });
    if (find2 && find2[0].pos != null) {
      let anchor2 = find2[0].pos, head = find2[1] && find2[1].pos;
      if (head == null)
        head = anchor2;
      sel = { anchor: anchor2 + from, head: head + from };
    }
    return { doc: doc2, sel, from, to };
  }
  function ruleFromNode(dom) {
    let desc = dom.pmViewDesc;
    if (desc) {
      return desc.parseRule();
    } else if (dom.nodeName == "BR" && dom.parentNode) {
      if (safari && /^(ul|ol)$/i.test(dom.parentNode.nodeName)) {
        let skip = document.createElement("div");
        skip.appendChild(document.createElement("li"));
        return { skip };
      } else if (dom.parentNode.lastChild == dom || safari && /^(tr|table)$/i.test(dom.parentNode.nodeName)) {
        return { ignore: true };
      }
    } else if (dom.nodeName == "IMG" && dom.getAttribute("mark-placeholder")) {
      return { ignore: true };
    }
    return null;
  }
  function readDOMChange(view, from, to, typeOver, addedNodes) {
    if (from < 0) {
      let origin = view.input.lastSelectionTime > Date.now() - 50 ? view.input.lastSelectionOrigin : null;
      let newSel = selectionFromDOM(view, origin);
      if (newSel && !view.state.selection.eq(newSel)) {
        if (chrome$1 && android && view.input.lastKeyCode === 13 && Date.now() - 100 < view.input.lastKeyCodeTime && view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter"))))
          return;
        let tr2 = view.state.tr.setSelection(newSel);
        if (origin == "pointer")
          tr2.setMeta("pointer", true);
        else if (origin == "key")
          tr2.scrollIntoView();
        view.dispatch(tr2);
      }
      return;
    }
    let $before = view.state.doc.resolve(from);
    let shared = $before.sharedDepth(to);
    from = $before.before(shared + 1);
    to = view.state.doc.resolve(to).after(shared + 1);
    let sel = view.state.selection;
    let parse = parseBetween(view, from, to);
    let doc2 = view.state.doc, compare = doc2.slice(parse.from, parse.to);
    let preferredPos, preferredSide;
    if (view.input.lastKeyCode === 8 && Date.now() - 100 < view.input.lastKeyCodeTime) {
      preferredPos = view.state.selection.to;
      preferredSide = "end";
    } else {
      preferredPos = view.state.selection.from;
      preferredSide = "start";
    }
    view.input.lastKeyCode = null;
    let change = findDiff(compare.content, parse.doc.content, parse.from, preferredPos, preferredSide);
    if ((ios && view.input.lastIOSEnter > Date.now() - 225 || android) && addedNodes.some((n) => n.nodeName == "DIV" || n.nodeName == "P" || n.nodeName == "LI") && (!change || change.endA >= change.endB) && view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter")))) {
      view.input.lastIOSEnter = 0;
      return;
    }
    if (!change) {
      if (typeOver && sel instanceof TextSelection && !sel.empty && sel.$head.sameParent(sel.$anchor) && !view.composing && !(parse.sel && parse.sel.anchor != parse.sel.head)) {
        change = { start: sel.from, endA: sel.to, endB: sel.to };
      } else {
        if (parse.sel) {
          let sel2 = resolveSelection(view, view.state.doc, parse.sel);
          if (sel2 && !sel2.eq(view.state.selection))
            view.dispatch(view.state.tr.setSelection(sel2));
        }
        return;
      }
    }
    if (chrome$1 && view.cursorWrapper && parse.sel && parse.sel.anchor == view.cursorWrapper.deco.from && parse.sel.head == parse.sel.anchor) {
      let size = change.endB - change.start;
      parse.sel = { anchor: parse.sel.anchor + size, head: parse.sel.anchor + size };
    }
    view.input.domChangeCount++;
    if (view.state.selection.from < view.state.selection.to && change.start == change.endB && view.state.selection instanceof TextSelection) {
      if (change.start > view.state.selection.from && change.start <= view.state.selection.from + 2 && view.state.selection.from >= parse.from) {
        change.start = view.state.selection.from;
      } else if (change.endA < view.state.selection.to && change.endA >= view.state.selection.to - 2 && view.state.selection.to <= parse.to) {
        change.endB += view.state.selection.to - change.endA;
        change.endA = view.state.selection.to;
      }
    }
    if (ie$1 && ie_version <= 11 && change.endB == change.start + 1 && change.endA == change.start && change.start > parse.from && parse.doc.textBetween(change.start - parse.from - 1, change.start - parse.from + 1) == " \xA0") {
      change.start--;
      change.endA--;
      change.endB--;
    }
    let $from = parse.doc.resolveNoCache(change.start - parse.from);
    let $to = parse.doc.resolveNoCache(change.endB - parse.from);
    let $fromA = doc2.resolve(change.start);
    let inlineChange = $from.sameParent($to) && $from.parent.inlineContent && $fromA.end() >= change.endA;
    let nextSel;
    if ((ios && view.input.lastIOSEnter > Date.now() - 225 && (!inlineChange || addedNodes.some((n) => n.nodeName == "DIV" || n.nodeName == "P")) || !inlineChange && $from.pos < parse.doc.content.size && (nextSel = Selection.findFrom(parse.doc.resolve($from.pos + 1), 1, true)) && nextSel.head == $to.pos) && view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter")))) {
      view.input.lastIOSEnter = 0;
      return;
    }
    if (view.state.selection.anchor > change.start && looksLikeJoin(doc2, change.start, change.endA, $from, $to) && view.someProp("handleKeyDown", (f) => f(view, keyEvent(8, "Backspace")))) {
      if (android && chrome$1)
        view.domObserver.suppressSelectionUpdates();
      return;
    }
    if (chrome$1 && android && change.endB == change.start)
      view.input.lastAndroidDelete = Date.now();
    if (android && !inlineChange && $from.start() != $to.start() && $to.parentOffset == 0 && $from.depth == $to.depth && parse.sel && parse.sel.anchor == parse.sel.head && parse.sel.head == change.endA) {
      change.endB -= 2;
      $to = parse.doc.resolveNoCache(change.endB - parse.from);
      setTimeout(() => {
        view.someProp("handleKeyDown", function(f) {
          return f(view, keyEvent(13, "Enter"));
        });
      }, 20);
    }
    let chFrom = change.start, chTo = change.endA;
    let tr, storedMarks, markChange;
    if (inlineChange) {
      if ($from.pos == $to.pos) {
        if (ie$1 && ie_version <= 11 && $from.parentOffset == 0) {
          view.domObserver.suppressSelectionUpdates();
          setTimeout(() => selectionToDOM(view), 20);
        }
        tr = view.state.tr.delete(chFrom, chTo);
        storedMarks = doc2.resolve(change.start).marksAcross(doc2.resolve(change.endA));
      } else if (change.endA == change.endB && (markChange = isMarkChange($from.parent.content.cut($from.parentOffset, $to.parentOffset), $fromA.parent.content.cut($fromA.parentOffset, change.endA - $fromA.start())))) {
        tr = view.state.tr;
        if (markChange.type == "add")
          tr.addMark(chFrom, chTo, markChange.mark);
        else
          tr.removeMark(chFrom, chTo, markChange.mark);
      } else if ($from.parent.child($from.index()).isText && $from.index() == $to.index() - ($to.textOffset ? 0 : 1)) {
        let text2 = $from.parent.textBetween($from.parentOffset, $to.parentOffset);
        if (view.someProp("handleTextInput", (f) => f(view, chFrom, chTo, text2)))
          return;
        tr = view.state.tr.insertText(text2, chFrom, chTo);
      }
    }
    if (!tr)
      tr = view.state.tr.replace(chFrom, chTo, parse.doc.slice(change.start - parse.from, change.endB - parse.from));
    if (parse.sel) {
      let sel2 = resolveSelection(view, tr.doc, parse.sel);
      if (sel2 && !(chrome$1 && android && view.composing && sel2.empty && (change.start != change.endB || view.input.lastAndroidDelete < Date.now() - 100) && (sel2.head == chFrom || sel2.head == tr.mapping.map(chTo) - 1) || ie$1 && sel2.empty && sel2.head == chFrom))
        tr.setSelection(sel2);
    }
    if (storedMarks)
      tr.ensureMarks(storedMarks);
    view.dispatch(tr.scrollIntoView());
  }
  function resolveSelection(view, doc2, parsedSel) {
    if (Math.max(parsedSel.anchor, parsedSel.head) > doc2.content.size)
      return null;
    return selectionBetween(view, doc2.resolve(parsedSel.anchor), doc2.resolve(parsedSel.head));
  }
  function isMarkChange(cur, prev) {
    let curMarks = cur.firstChild.marks, prevMarks = prev.firstChild.marks;
    let added = curMarks, removed = prevMarks, type, mark, update;
    for (let i2 = 0; i2 < prevMarks.length; i2++)
      added = prevMarks[i2].removeFromSet(added);
    for (let i2 = 0; i2 < curMarks.length; i2++)
      removed = curMarks[i2].removeFromSet(removed);
    if (added.length == 1 && removed.length == 0) {
      mark = added[0];
      type = "add";
      update = (node) => node.mark(mark.addToSet(node.marks));
    } else if (added.length == 0 && removed.length == 1) {
      mark = removed[0];
      type = "remove";
      update = (node) => node.mark(mark.removeFromSet(node.marks));
    } else {
      return null;
    }
    let updated = [];
    for (let i2 = 0; i2 < prev.childCount; i2++)
      updated.push(update(prev.child(i2)));
    if (Fragment.from(updated).eq(cur))
      return { mark, type };
  }
  function looksLikeJoin(old, start, end, $newStart, $newEnd) {
    if (!$newStart.parent.isTextblock || end - start <= $newEnd.pos - $newStart.pos || skipClosingAndOpening($newStart, true, false) < $newEnd.pos)
      return false;
    let $start = old.resolve(start);
    if ($start.parentOffset < $start.parent.content.size || !$start.parent.isTextblock)
      return false;
    let $next = old.resolve(skipClosingAndOpening($start, true, true));
    if (!$next.parent.isTextblock || $next.pos > end || skipClosingAndOpening($next, true, false) < end)
      return false;
    return $newStart.parent.content.cut($newStart.parentOffset).eq($next.parent.content);
  }
  function skipClosingAndOpening($pos, fromEnd, mayOpen) {
    let depth = $pos.depth, end = fromEnd ? $pos.end() : $pos.pos;
    while (depth > 0 && (fromEnd || $pos.indexAfter(depth) == $pos.node(depth).childCount)) {
      depth--;
      end++;
      fromEnd = false;
    }
    if (mayOpen) {
      let next = $pos.node(depth).maybeChild($pos.indexAfter(depth));
      while (next && !next.isLeaf) {
        next = next.firstChild;
        end++;
      }
    }
    return end;
  }
  function findDiff(a, b, pos, preferredPos, preferredSide) {
    let start = a.findDiffStart(b, pos);
    if (start == null)
      return null;
    let { a: endA, b: endB } = a.findDiffEnd(b, pos + a.size, pos + b.size);
    if (preferredSide == "end") {
      let adjust = Math.max(0, start - Math.min(endA, endB));
      preferredPos -= endA + adjust - start;
    }
    if (endA < start && a.size < b.size) {
      let move = preferredPos <= start && preferredPos >= endA ? start - preferredPos : 0;
      start -= move;
      endB = start + (endB - endA);
      endA = start;
    } else if (endB < start) {
      let move = preferredPos <= start && preferredPos >= endB ? start - preferredPos : 0;
      start -= move;
      endA = start + (endA - endB);
      endB = start;
    }
    return { start, endA, endB };
  }
  const __serializeForClipboard = serializeForClipboard$1;
  class EditorView {
    constructor(place, props) {
      this._root = null;
      this.focused = false;
      this.trackWrites = null;
      this.mounted = false;
      this.markCursor = null;
      this.cursorWrapper = null;
      this.lastSelectedViewDesc = void 0;
      this.input = new InputState();
      this.prevDirectPlugins = [];
      this.pluginViews = [];
      this.requiresGeckoHackNode = false;
      this.dragging = null;
      this._props = props;
      this.state = props.state;
      this.directPlugins = props.plugins || [];
      this.directPlugins.forEach(checkStateComponent);
      this.dispatch = this.dispatch.bind(this);
      this.dom = place && place.mount || document.createElement("div");
      if (place) {
        if (place.appendChild)
          place.appendChild(this.dom);
        else if (typeof place == "function")
          place(this.dom);
        else if (place.mount)
          this.mounted = true;
      }
      this.editable = getEditable(this);
      updateCursorWrapper(this);
      this.nodeViews = buildNodeViews(this);
      this.docView = docViewDesc(this.state.doc, computeDocDeco(this), viewDecorations(this), this.dom, this);
      this.domObserver = new DOMObserver(this, (from, to, typeOver, added) => readDOMChange(this, from, to, typeOver, added));
      this.domObserver.start();
      initInput(this);
      this.updatePluginViews();
    }
    get composing() {
      return this.input.composing;
    }
    get props() {
      if (this._props.state != this.state) {
        let prev = this._props;
        this._props = {};
        for (let name in prev)
          this._props[name] = prev[name];
        this._props.state = this.state;
      }
      return this._props;
    }
    update(props) {
      if (props.handleDOMEvents != this._props.handleDOMEvents)
        ensureListeners(this);
      let prevProps = this._props;
      this._props = props;
      if (props.plugins) {
        props.plugins.forEach(checkStateComponent);
        this.directPlugins = props.plugins;
      }
      this.updateStateInner(props.state, prevProps);
    }
    setProps(props) {
      let updated = {};
      for (let name in this._props)
        updated[name] = this._props[name];
      updated.state = this.state;
      for (let name in props)
        updated[name] = props[name];
      this.update(updated);
    }
    updateState(state) {
      this.updateStateInner(state, this._props);
    }
    updateStateInner(state, prevProps) {
      let prev = this.state, redraw = false, updateSel = false;
      if (state.storedMarks && this.composing) {
        clearComposition(this);
        updateSel = true;
      }
      this.state = state;
      let pluginsChanged = prev.plugins != state.plugins || this._props.plugins != prevProps.plugins;
      if (pluginsChanged || this._props.plugins != prevProps.plugins || this._props.nodeViews != prevProps.nodeViews) {
        let nodeViews = buildNodeViews(this);
        if (changedNodeViews(nodeViews, this.nodeViews)) {
          this.nodeViews = nodeViews;
          redraw = true;
        }
      }
      if (pluginsChanged || prevProps.handleDOMEvents != this._props.handleDOMEvents) {
        ensureListeners(this);
      }
      this.editable = getEditable(this);
      updateCursorWrapper(this);
      let innerDeco = viewDecorations(this), outerDeco = computeDocDeco(this);
      let scroll = prev.plugins != state.plugins && !prev.doc.eq(state.doc) ? "reset" : state.scrollToSelection > prev.scrollToSelection ? "to selection" : "preserve";
      let updateDoc = redraw || !this.docView.matchesNode(state.doc, outerDeco, innerDeco);
      if (updateDoc || !state.selection.eq(prev.selection))
        updateSel = true;
      let oldScrollPos = scroll == "preserve" && updateSel && this.dom.style.overflowAnchor == null && storeScrollPos(this);
      if (updateSel) {
        this.domObserver.stop();
        let forceSelUpdate = updateDoc && (ie$1 || chrome$1) && !this.composing && !prev.selection.empty && !state.selection.empty && selectionContextChanged(prev.selection, state.selection);
        if (updateDoc) {
          let chromeKludge = chrome$1 ? this.trackWrites = this.domSelectionRange().focusNode : null;
          if (redraw || !this.docView.update(state.doc, outerDeco, innerDeco, this)) {
            this.docView.updateOuterDeco([]);
            this.docView.destroy();
            this.docView = docViewDesc(state.doc, outerDeco, innerDeco, this.dom, this);
          }
          if (chromeKludge && !this.trackWrites)
            forceSelUpdate = true;
        }
        if (forceSelUpdate || !(this.input.mouseDown && this.domObserver.currentSelection.eq(this.domSelectionRange()) && anchorInRightPlace(this))) {
          selectionToDOM(this, forceSelUpdate);
        } else {
          syncNodeSelection(this, state.selection);
          this.domObserver.setCurSelection();
        }
        this.domObserver.start();
      }
      this.updatePluginViews(prev);
      if (scroll == "reset") {
        this.dom.scrollTop = 0;
      } else if (scroll == "to selection") {
        this.scrollToSelection();
      } else if (oldScrollPos) {
        resetScrollPos(oldScrollPos);
      }
    }
    scrollToSelection() {
      let startDOM = this.domSelectionRange().focusNode;
      if (this.someProp("handleScrollToSelection", (f) => f(this)))
        ;
      else if (this.state.selection instanceof NodeSelection) {
        let target = this.docView.domAfterPos(this.state.selection.from);
        if (target.nodeType == 1)
          scrollRectIntoView(this, target.getBoundingClientRect(), startDOM);
      } else {
        scrollRectIntoView(this, this.coordsAtPos(this.state.selection.head, 1), startDOM);
      }
    }
    destroyPluginViews() {
      let view;
      while (view = this.pluginViews.pop())
        if (view.destroy)
          view.destroy();
    }
    updatePluginViews(prevState) {
      if (!prevState || prevState.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
        this.prevDirectPlugins = this.directPlugins;
        this.destroyPluginViews();
        for (let i2 = 0; i2 < this.directPlugins.length; i2++) {
          let plugin = this.directPlugins[i2];
          if (plugin.spec.view)
            this.pluginViews.push(plugin.spec.view(this));
        }
        for (let i2 = 0; i2 < this.state.plugins.length; i2++) {
          let plugin = this.state.plugins[i2];
          if (plugin.spec.view)
            this.pluginViews.push(plugin.spec.view(this));
        }
      } else {
        for (let i2 = 0; i2 < this.pluginViews.length; i2++) {
          let pluginView = this.pluginViews[i2];
          if (pluginView.update)
            pluginView.update(this, prevState);
        }
      }
    }
    someProp(propName, f) {
      let prop = this._props && this._props[propName], value;
      if (prop != null && (value = f ? f(prop) : prop))
        return value;
      for (let i2 = 0; i2 < this.directPlugins.length; i2++) {
        let prop2 = this.directPlugins[i2].props[propName];
        if (prop2 != null && (value = f ? f(prop2) : prop2))
          return value;
      }
      let plugins = this.state.plugins;
      if (plugins)
        for (let i2 = 0; i2 < plugins.length; i2++) {
          let prop2 = plugins[i2].props[propName];
          if (prop2 != null && (value = f ? f(prop2) : prop2))
            return value;
        }
    }
    hasFocus() {
      if (ie$1) {
        let node = this.root.activeElement;
        if (node == this.dom)
          return true;
        if (!node || !this.dom.contains(node))
          return false;
        while (node && this.dom != node && this.dom.contains(node)) {
          if (node.contentEditable == "false")
            return false;
          node = node.parentElement;
        }
        return true;
      }
      return this.root.activeElement == this.dom;
    }
    focus() {
      this.domObserver.stop();
      if (this.editable)
        focusPreventScroll(this.dom);
      selectionToDOM(this);
      this.domObserver.start();
    }
    get root() {
      let cached = this._root;
      if (cached == null)
        for (let search = this.dom.parentNode; search; search = search.parentNode) {
          if (search.nodeType == 9 || search.nodeType == 11 && search.host) {
            if (!search.getSelection)
              Object.getPrototypeOf(search).getSelection = () => search.ownerDocument.getSelection();
            return this._root = search;
          }
        }
      return cached || document;
    }
    posAtCoords(coords) {
      return posAtCoords(this, coords);
    }
    coordsAtPos(pos, side = 1) {
      return coordsAtPos(this, pos, side);
    }
    domAtPos(pos, side = 0) {
      return this.docView.domFromPos(pos, side);
    }
    nodeDOM(pos) {
      let desc = this.docView.descAt(pos);
      return desc ? desc.nodeDOM : null;
    }
    posAtDOM(node, offset, bias = -1) {
      let pos = this.docView.posFromDOM(node, offset, bias);
      if (pos == null)
        throw new RangeError("DOM position not inside the editor");
      return pos;
    }
    endOfTextblock(dir, state) {
      return endOfTextblock(this, state || this.state, dir);
    }
    pasteHTML(html, event) {
      return doPaste(this, "", html, false, event || new ClipboardEvent("paste"));
    }
    pasteText(text2, event) {
      return doPaste(this, text2, null, true, event || new ClipboardEvent("paste"));
    }
    destroy() {
      if (!this.docView)
        return;
      destroyInput(this);
      this.destroyPluginViews();
      if (this.mounted) {
        this.docView.update(this.state.doc, [], viewDecorations(this), this);
        this.dom.textContent = "";
      } else if (this.dom.parentNode) {
        this.dom.parentNode.removeChild(this.dom);
      }
      this.docView.destroy();
      this.docView = null;
    }
    get isDestroyed() {
      return this.docView == null;
    }
    dispatchEvent(event) {
      return dispatchEvent(this, event);
    }
    dispatch(tr) {
      let dispatchTransaction = this._props.dispatchTransaction;
      if (dispatchTransaction)
        dispatchTransaction.call(this, tr);
      else
        this.updateState(this.state.apply(tr));
    }
    domSelectionRange() {
      return safari && this.root.nodeType === 11 && deepActiveElement(this.dom.ownerDocument) == this.dom ? safariShadowSelectionRange(this) : this.domSelection();
    }
    domSelection() {
      return this.root.getSelection();
    }
  }
  function computeDocDeco(view) {
    let attrs = /* @__PURE__ */ Object.create(null);
    attrs.class = "ProseMirror";
    attrs.contenteditable = String(view.editable);
    attrs.translate = "no";
    view.someProp("attributes", (value) => {
      if (typeof value == "function")
        value = value(view.state);
      if (value)
        for (let attr in value) {
          if (attr == "class")
            attrs.class += " " + value[attr];
          if (attr == "style") {
            attrs.style = (attrs.style ? attrs.style + ";" : "") + value[attr];
          } else if (!attrs[attr] && attr != "contenteditable" && attr != "nodeName")
            attrs[attr] = String(value[attr]);
        }
    });
    return [Decoration.node(0, view.state.doc.content.size, attrs)];
  }
  function updateCursorWrapper(view) {
    if (view.markCursor) {
      let dom = document.createElement("img");
      dom.className = "ProseMirror-separator";
      dom.setAttribute("mark-placeholder", "true");
      dom.setAttribute("alt", "");
      view.cursorWrapper = { dom, deco: Decoration.widget(view.state.selection.head, dom, { raw: true, marks: view.markCursor }) };
    } else {
      view.cursorWrapper = null;
    }
  }
  function getEditable(view) {
    return !view.someProp("editable", (value) => value(view.state) === false);
  }
  function selectionContextChanged(sel1, sel2) {
    let depth = Math.min(sel1.$anchor.sharedDepth(sel1.head), sel2.$anchor.sharedDepth(sel2.head));
    return sel1.$anchor.start(depth) != sel2.$anchor.start(depth);
  }
  function buildNodeViews(view) {
    let result = /* @__PURE__ */ Object.create(null);
    function add(obj) {
      for (let prop in obj)
        if (!Object.prototype.hasOwnProperty.call(result, prop))
          result[prop] = obj[prop];
    }
    view.someProp("nodeViews", add);
    view.someProp("markViews", add);
    return result;
  }
  function changedNodeViews(a, b) {
    let nA = 0, nB = 0;
    for (let prop in a) {
      if (a[prop] != b[prop])
        return true;
      nA++;
    }
    for (let _ in b)
      nB++;
    return nA != nB;
  }
  function checkStateComponent(plugin) {
    if (plugin.spec.state || plugin.spec.filterTransaction || plugin.spec.appendTransaction)
      throw new RangeError("Plugins passed directly to the view must not have a state component");
  }
  var base = {
    8: "Backspace",
    9: "Tab",
    10: "Enter",
    12: "NumLock",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    44: "PrintScreen",
    45: "Insert",
    46: "Delete",
    59: ";",
    61: "=",
    91: "Meta",
    92: "Meta",
    106: "*",
    107: "+",
    108: ",",
    109: "-",
    110: ".",
    111: "/",
    144: "NumLock",
    145: "ScrollLock",
    160: "Shift",
    161: "Shift",
    162: "Control",
    163: "Control",
    164: "Alt",
    165: "Alt",
    173: "-",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'"
  };
  var shift = {
    48: ")",
    49: "!",
    50: "@",
    51: "#",
    52: "$",
    53: "%",
    54: "^",
    55: "&",
    56: "*",
    57: "(",
    59: ":",
    61: "+",
    173: "_",
    186: ":",
    187: "+",
    188: "<",
    189: "_",
    190: ">",
    191: "?",
    192: "~",
    219: "{",
    220: "|",
    221: "}",
    222: '"'
  };
  var chrome = typeof navigator != "undefined" && /Chrome\/(\d+)/.exec(navigator.userAgent);
  typeof navigator != "undefined" && /Gecko\/\d+/.test(navigator.userAgent);
  var mac$1 = typeof navigator != "undefined" && /Mac/.test(navigator.platform);
  var ie = typeof navigator != "undefined" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
  var brokenModifierNames = mac$1 || chrome && +chrome[1] < 57;
  for (var i$1 = 0; i$1 < 10; i$1++)
    base[48 + i$1] = base[96 + i$1] = String(i$1);
  for (var i$1 = 1; i$1 <= 24; i$1++)
    base[i$1 + 111] = "F" + i$1;
  for (var i$1 = 65; i$1 <= 90; i$1++) {
    base[i$1] = String.fromCharCode(i$1 + 32);
    shift[i$1] = String.fromCharCode(i$1);
  }
  for (var code in base)
    if (!shift.hasOwnProperty(code))
      shift[code] = base[code];
  function keyName(event) {
    var ignoreKey = brokenModifierNames && (event.ctrlKey || event.altKey || event.metaKey) || ie && event.shiftKey && event.key && event.key.length == 1 || event.key == "Unidentified";
    var name = !ignoreKey && event.key || (event.shiftKey ? shift : base)[event.keyCode] || event.key || "Unidentified";
    if (name == "Esc")
      name = "Escape";
    if (name == "Del")
      name = "Delete";
    if (name == "Left")
      name = "ArrowLeft";
    if (name == "Up")
      name = "ArrowUp";
    if (name == "Right")
      name = "ArrowRight";
    if (name == "Down")
      name = "ArrowDown";
    return name;
  }
  const mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;
  function normalizeKeyName$1(name) {
    let parts = name.split(/-(?!$)/), result = parts[parts.length - 1];
    if (result == "Space")
      result = " ";
    let alt, ctrl, shift2, meta;
    for (let i2 = 0; i2 < parts.length - 1; i2++) {
      let mod = parts[i2];
      if (/^(cmd|meta|m)$/i.test(mod))
        meta = true;
      else if (/^a(lt)?$/i.test(mod))
        alt = true;
      else if (/^(c|ctrl|control)$/i.test(mod))
        ctrl = true;
      else if (/^s(hift)?$/i.test(mod))
        shift2 = true;
      else if (/^mod$/i.test(mod)) {
        if (mac)
          meta = true;
        else
          ctrl = true;
      } else
        throw new Error("Unrecognized modifier name: " + mod);
    }
    if (alt)
      result = "Alt-" + result;
    if (ctrl)
      result = "Ctrl-" + result;
    if (meta)
      result = "Meta-" + result;
    if (shift2)
      result = "Shift-" + result;
    return result;
  }
  function normalize(map) {
    let copy2 = /* @__PURE__ */ Object.create(null);
    for (let prop in map)
      copy2[normalizeKeyName$1(prop)] = map[prop];
    return copy2;
  }
  function modifiers(name, event, shift2) {
    if (event.altKey)
      name = "Alt-" + name;
    if (event.ctrlKey)
      name = "Ctrl-" + name;
    if (event.metaKey)
      name = "Meta-" + name;
    if (shift2 !== false && event.shiftKey)
      name = "Shift-" + name;
    return name;
  }
  function keymap(bindings) {
    return new Plugin({ props: { handleKeyDown: keydownHandler(bindings) } });
  }
  function keydownHandler(bindings) {
    let map = normalize(bindings);
    return function(view, event) {
      let name = keyName(event), isChar = name.length == 1 && name != " ", baseName;
      let direct = map[modifiers(name, event, !isChar)];
      if (direct && direct(view.state, view.dispatch, view))
        return true;
      if (isChar && (event.shiftKey || event.altKey || event.metaKey || name.charCodeAt(0) > 127) && (baseName = base[event.keyCode]) && baseName != name) {
        let fromCode = map[modifiers(baseName, event, true)];
        if (fromCode && fromCode(view.state, view.dispatch, view))
          return true;
      } else if (isChar && event.shiftKey) {
        let withShift = map[modifiers(name, event, true)];
        if (withShift && withShift(view.state, view.dispatch, view))
          return true;
      }
      return false;
    };
  }
  const deleteSelection$1 = (state, dispatch) => {
    if (state.selection.empty)
      return false;
    if (dispatch)
      dispatch(state.tr.deleteSelection().scrollIntoView());
    return true;
  };
  function atBlockStart(state, view) {
    let { $cursor } = state.selection;
    if (!$cursor || (view ? !view.endOfTextblock("backward", state) : $cursor.parentOffset > 0))
      return null;
    return $cursor;
  }
  const joinBackward$1 = (state, dispatch, view) => {
    let $cursor = atBlockStart(state, view);
    if (!$cursor)
      return false;
    let $cut = findCutBefore($cursor);
    if (!$cut) {
      let range = $cursor.blockRange(), target = range && liftTarget(range);
      if (target == null)
        return false;
      if (dispatch)
        dispatch(state.tr.lift(range, target).scrollIntoView());
      return true;
    }
    let before = $cut.nodeBefore;
    if (!before.type.spec.isolating && deleteBarrier(state, $cut, dispatch))
      return true;
    if ($cursor.parent.content.size == 0 && (textblockAt(before, "end") || NodeSelection.isSelectable(before))) {
      let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
      if (delStep && delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          let tr = state.tr.step(delStep);
          tr.setSelection(textblockAt(before, "end") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1) : NodeSelection.create(tr.doc, $cut.pos - before.nodeSize));
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
    }
    if (before.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch)
        dispatch(state.tr.delete($cut.pos - before.nodeSize, $cut.pos).scrollIntoView());
      return true;
    }
    return false;
  };
  function textblockAt(node, side, only = false) {
    for (let scan = node; scan; scan = side == "start" ? scan.firstChild : scan.lastChild) {
      if (scan.isTextblock)
        return true;
      if (only && scan.childCount != 1)
        return false;
    }
    return false;
  }
  const selectNodeBackward$1 = (state, dispatch, view) => {
    let { $head, empty: empty2 } = state.selection, $cut = $head;
    if (!empty2)
      return false;
    if ($head.parent.isTextblock) {
      if (view ? !view.endOfTextblock("backward", state) : $head.parentOffset > 0)
        return false;
      $cut = findCutBefore($head);
    }
    let node = $cut && $cut.nodeBefore;
    if (!node || !NodeSelection.isSelectable(node))
      return false;
    if (dispatch)
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos - node.nodeSize)).scrollIntoView());
    return true;
  };
  function findCutBefore($pos) {
    if (!$pos.parent.type.spec.isolating)
      for (let i2 = $pos.depth - 1; i2 >= 0; i2--) {
        if ($pos.index(i2) > 0)
          return $pos.doc.resolve($pos.before(i2 + 1));
        if ($pos.node(i2).type.spec.isolating)
          break;
      }
    return null;
  }
  function atBlockEnd(state, view) {
    let { $cursor } = state.selection;
    if (!$cursor || (view ? !view.endOfTextblock("forward", state) : $cursor.parentOffset < $cursor.parent.content.size))
      return null;
    return $cursor;
  }
  const joinForward$1 = (state, dispatch, view) => {
    let $cursor = atBlockEnd(state, view);
    if (!$cursor)
      return false;
    let $cut = findCutAfter($cursor);
    if (!$cut)
      return false;
    let after = $cut.nodeAfter;
    if (deleteBarrier(state, $cut, dispatch))
      return true;
    if ($cursor.parent.content.size == 0 && (textblockAt(after, "start") || NodeSelection.isSelectable(after))) {
      let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
      if (delStep && delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          let tr = state.tr.step(delStep);
          tr.setSelection(textblockAt(after, "start") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1) : NodeSelection.create(tr.doc, tr.mapping.map($cut.pos)));
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
    }
    if (after.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch)
        dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView());
      return true;
    }
    return false;
  };
  const selectNodeForward$1 = (state, dispatch, view) => {
    let { $head, empty: empty2 } = state.selection, $cut = $head;
    if (!empty2)
      return false;
    if ($head.parent.isTextblock) {
      if (view ? !view.endOfTextblock("forward", state) : $head.parentOffset < $head.parent.content.size)
        return false;
      $cut = findCutAfter($head);
    }
    let node = $cut && $cut.nodeAfter;
    if (!node || !NodeSelection.isSelectable(node))
      return false;
    if (dispatch)
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos)).scrollIntoView());
    return true;
  };
  function findCutAfter($pos) {
    if (!$pos.parent.type.spec.isolating)
      for (let i2 = $pos.depth - 1; i2 >= 0; i2--) {
        let parent = $pos.node(i2);
        if ($pos.index(i2) + 1 < parent.childCount)
          return $pos.doc.resolve($pos.after(i2 + 1));
        if (parent.type.spec.isolating)
          break;
      }
    return null;
  }
  const joinUp$1 = (state, dispatch) => {
    let sel = state.selection, nodeSel = sel instanceof NodeSelection, point;
    if (nodeSel) {
      if (sel.node.isTextblock || !canJoin(state.doc, sel.from))
        return false;
      point = sel.from;
    } else {
      point = joinPoint(state.doc, sel.from, -1);
      if (point == null)
        return false;
    }
    if (dispatch) {
      let tr = state.tr.join(point);
      if (nodeSel)
        tr.setSelection(NodeSelection.create(tr.doc, point - state.doc.resolve(point).nodeBefore.nodeSize));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
  const joinDown$1 = (state, dispatch) => {
    let sel = state.selection, point;
    if (sel instanceof NodeSelection) {
      if (sel.node.isTextblock || !canJoin(state.doc, sel.to))
        return false;
      point = sel.to;
    } else {
      point = joinPoint(state.doc, sel.to, 1);
      if (point == null)
        return false;
    }
    if (dispatch)
      dispatch(state.tr.join(point).scrollIntoView());
    return true;
  };
  const lift$1 = (state, dispatch) => {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to), target = range && liftTarget(range);
    if (target == null)
      return false;
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  };
  const newlineInCode$1 = (state, dispatch) => {
    let { $head, $anchor } = state.selection;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
      return false;
    if (dispatch)
      dispatch(state.tr.insertText("\n").scrollIntoView());
    return true;
  };
  function defaultBlockAt$1(match) {
    for (let i2 = 0; i2 < match.edgeCount; i2++) {
      let { type } = match.edge(i2);
      if (type.isTextblock && !type.hasRequiredAttrs())
        return type;
    }
    return null;
  }
  const exitCode$1 = (state, dispatch) => {
    let { $head, $anchor } = state.selection;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
      return false;
    let above = $head.node(-1), after = $head.indexAfter(-1), type = defaultBlockAt$1(above.contentMatchAt(after));
    if (!type || !above.canReplaceWith(after, after, type))
      return false;
    if (dispatch) {
      let pos = $head.after(), tr = state.tr.replaceWith(pos, pos, type.createAndFill());
      tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
  const createParagraphNear$1 = (state, dispatch) => {
    let sel = state.selection, { $from, $to } = sel;
    if (sel instanceof AllSelection || $from.parent.inlineContent || $to.parent.inlineContent)
      return false;
    let type = defaultBlockAt$1($to.parent.contentMatchAt($to.indexAfter()));
    if (!type || !type.isTextblock)
      return false;
    if (dispatch) {
      let side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
      let tr = state.tr.insert(side, type.createAndFill());
      tr.setSelection(TextSelection.create(tr.doc, side + 1));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
  const liftEmptyBlock$1 = (state, dispatch) => {
    let { $cursor } = state.selection;
    if (!$cursor || $cursor.parent.content.size)
      return false;
    if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
      let before = $cursor.before();
      if (canSplit(state.doc, before)) {
        if (dispatch)
          dispatch(state.tr.split(before).scrollIntoView());
        return true;
      }
    }
    let range = $cursor.blockRange(), target = range && liftTarget(range);
    if (target == null)
      return false;
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  };
  const selectParentNode$1 = (state, dispatch) => {
    let { $from, to } = state.selection, pos;
    let same = $from.sharedDepth(to);
    if (same == 0)
      return false;
    pos = $from.before(same);
    if (dispatch)
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
    return true;
  };
  function joinMaybeClear(state, $pos, dispatch) {
    let before = $pos.nodeBefore, after = $pos.nodeAfter, index = $pos.index();
    if (!before || !after || !before.type.compatibleContent(after.type))
      return false;
    if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
      if (dispatch)
        dispatch(state.tr.delete($pos.pos - before.nodeSize, $pos.pos).scrollIntoView());
      return true;
    }
    if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos)))
      return false;
    if (dispatch)
      dispatch(state.tr.clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount)).join($pos.pos).scrollIntoView());
    return true;
  }
  function deleteBarrier(state, $cut, dispatch) {
    let before = $cut.nodeBefore, after = $cut.nodeAfter, conn, match;
    if (before.type.spec.isolating || after.type.spec.isolating)
      return false;
    if (joinMaybeClear(state, $cut, dispatch))
      return true;
    let canDelAfter = $cut.parent.canReplace($cut.index(), $cut.index() + 1);
    if (canDelAfter && (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) && match.matchType(conn[0] || after.type).validEnd) {
      if (dispatch) {
        let end = $cut.pos + after.nodeSize, wrap2 = Fragment.empty;
        for (let i2 = conn.length - 1; i2 >= 0; i2--)
          wrap2 = Fragment.from(conn[i2].create(null, wrap2));
        wrap2 = Fragment.from(before.copy(wrap2));
        let tr = state.tr.step(new ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new Slice(wrap2, 1, 0), conn.length, true));
        let joinAt = end + 2 * conn.length;
        if (canJoin(tr.doc, joinAt))
          tr.join(joinAt);
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
    let selAfter = Selection.findFrom($cut, 1);
    let range = selAfter && selAfter.$from.blockRange(selAfter.$to), target = range && liftTarget(range);
    if (target != null && target >= $cut.depth) {
      if (dispatch)
        dispatch(state.tr.lift(range, target).scrollIntoView());
      return true;
    }
    if (canDelAfter && textblockAt(after, "start", true) && textblockAt(before, "end")) {
      let at = before, wrap2 = [];
      for (; ; ) {
        wrap2.push(at);
        if (at.isTextblock)
          break;
        at = at.lastChild;
      }
      let afterText = after, afterDepth = 1;
      for (; !afterText.isTextblock; afterText = afterText.firstChild)
        afterDepth++;
      if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
        if (dispatch) {
          let end = Fragment.empty;
          for (let i2 = wrap2.length - 1; i2 >= 0; i2--)
            end = Fragment.from(wrap2[i2].copy(end));
          let tr = state.tr.step(new ReplaceAroundStep($cut.pos - wrap2.length, $cut.pos + after.nodeSize, $cut.pos + afterDepth, $cut.pos + after.nodeSize - afterDepth, new Slice(end, wrap2.length, 0), 0, true));
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
    }
    return false;
  }
  function selectTextblockSide(side) {
    return function(state, dispatch) {
      let sel = state.selection, $pos = side < 0 ? sel.$from : sel.$to;
      let depth = $pos.depth;
      while ($pos.node(depth).isInline) {
        if (!depth)
          return false;
        depth--;
      }
      if (!$pos.node(depth).isTextblock)
        return false;
      if (dispatch)
        dispatch(state.tr.setSelection(TextSelection.create(state.doc, side < 0 ? $pos.start(depth) : $pos.end(depth))));
      return true;
    };
  }
  const selectTextblockStart$1 = selectTextblockSide(-1);
  const selectTextblockEnd$1 = selectTextblockSide(1);
  function wrapIn$1(nodeType, attrs = null) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to), wrapping = range && findWrapping(range, nodeType, attrs);
      if (!wrapping)
        return false;
      if (dispatch)
        dispatch(state.tr.wrap(range, wrapping).scrollIntoView());
      return true;
    };
  }
  function setBlockType(nodeType, attrs = null) {
    return function(state, dispatch) {
      let applicable = false;
      for (let i2 = 0; i2 < state.selection.ranges.length && !applicable; i2++) {
        let { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i2];
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (applicable)
            return false;
          if (!node.isTextblock || node.hasMarkup(nodeType, attrs))
            return;
          if (node.type == nodeType) {
            applicable = true;
          } else {
            let $pos = state.doc.resolve(pos), index = $pos.index();
            applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
          }
        });
      }
      if (!applicable)
        return false;
      if (dispatch) {
        let tr = state.tr;
        for (let i2 = 0; i2 < state.selection.ranges.length; i2++) {
          let { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i2];
          tr.setBlockType(from, to, nodeType, attrs);
        }
        dispatch(tr.scrollIntoView());
      }
      return true;
    };
  }
  typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os != "undefined" && os.platform ? os.platform() == "darwin" : false;
  function wrapInList$1(listType, attrs = null) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to), doJoin = false, outerRange = range;
      if (!range)
        return false;
      if (range.depth >= 2 && $from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
        if ($from.index(range.depth - 1) == 0)
          return false;
        let $insert = state.doc.resolve(range.start - 2);
        outerRange = new NodeRange($insert, $insert, range.depth);
        if (range.endIndex < range.parent.childCount)
          range = new NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth);
        doJoin = true;
      }
      let wrap2 = findWrapping(outerRange, listType, attrs, range);
      if (!wrap2)
        return false;
      if (dispatch)
        dispatch(doWrapInList(state.tr, range, wrap2, doJoin, listType).scrollIntoView());
      return true;
    };
  }
  function doWrapInList(tr, range, wrappers, joinBefore, listType) {
    let content = Fragment.empty;
    for (let i2 = wrappers.length - 1; i2 >= 0; i2--)
      content = Fragment.from(wrappers[i2].type.create(wrappers[i2].attrs, content));
    tr.step(new ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end, new Slice(content, 0, 0), wrappers.length, true));
    let found2 = 0;
    for (let i2 = 0; i2 < wrappers.length; i2++)
      if (wrappers[i2].type == listType)
        found2 = i2 + 1;
    let splitDepth = wrappers.length - found2;
    let splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0), parent = range.parent;
    for (let i2 = range.startIndex, e = range.endIndex, first2 = true; i2 < e; i2++, first2 = false) {
      if (!first2 && canSplit(tr.doc, splitPos, splitDepth)) {
        tr.split(splitPos, splitDepth);
        splitPos += 2 * splitDepth;
      }
      splitPos += parent.child(i2).nodeSize;
    }
    return tr;
  }
  function liftListItem$1(itemType) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
      if (!range)
        return false;
      if (!dispatch)
        return true;
      if ($from.node(range.depth - 1).type == itemType)
        return liftToOuterList(state, dispatch, itemType, range);
      else
        return liftOutOfList(state, dispatch, range);
    };
  }
  function liftToOuterList(state, dispatch, itemType, range) {
    let tr = state.tr, end = range.end, endOfList = range.$to.end(range.depth);
    if (end < endOfList) {
      tr.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList, new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
      range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
    }
    const target = liftTarget(range);
    if (target == null)
      return false;
    tr.lift(range, target);
    let after = tr.mapping.map(end, -1) - 1;
    if (canJoin(tr.doc, after))
      tr.join(after);
    dispatch(tr.scrollIntoView());
    return true;
  }
  function liftOutOfList(state, dispatch, range) {
    let tr = state.tr, list = range.parent;
    for (let pos = range.end, i2 = range.endIndex - 1, e = range.startIndex; i2 > e; i2--) {
      pos -= list.child(i2).nodeSize;
      tr.delete(pos - 1, pos + 1);
    }
    let $start = tr.doc.resolve(range.start), item = $start.nodeAfter;
    if (tr.mapping.map(range.end) != range.start + $start.nodeAfter.nodeSize)
      return false;
    let atStart = range.startIndex == 0, atEnd = range.endIndex == list.childCount;
    let parent = $start.node(-1), indexBefore = $start.index(-1);
    if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1, item.content.append(atEnd ? Fragment.empty : Fragment.from(list))))
      return false;
    let start = $start.pos, end = start + item.nodeSize;
    tr.step(new ReplaceAroundStep(start - (atStart ? 1 : 0), end + (atEnd ? 1 : 0), start + 1, end - 1, new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))).append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))), atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));
    dispatch(tr.scrollIntoView());
    return true;
  }
  function sinkListItem$1(itemType) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
      if (!range)
        return false;
      let startIndex = range.startIndex;
      if (startIndex == 0)
        return false;
      let parent = range.parent, nodeBefore = parent.child(startIndex - 1);
      if (nodeBefore.type != itemType)
        return false;
      if (dispatch) {
        let nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
        let inner = Fragment.from(nestedBefore ? itemType.create() : null);
        let slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))), nestedBefore ? 3 : 1, 0);
        let before = range.start, after = range.end;
        dispatch(state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice, 1, true)).scrollIntoView());
      }
      return true;
    };
  }
  function createChainableState(config) {
    const { state, transaction } = config;
    let { selection } = transaction;
    let { doc: doc2 } = transaction;
    let { storedMarks } = transaction;
    return {
      ...state,
      apply: state.apply.bind(state),
      applyTransaction: state.applyTransaction.bind(state),
      filterTransaction: state.filterTransaction,
      plugins: state.plugins,
      schema: state.schema,
      reconfigure: state.reconfigure.bind(state),
      toJSON: state.toJSON.bind(state),
      get storedMarks() {
        return storedMarks;
      },
      get selection() {
        return selection;
      },
      get doc() {
        return doc2;
      },
      get tr() {
        selection = transaction.selection;
        doc2 = transaction.doc;
        storedMarks = transaction.storedMarks;
        return transaction;
      }
    };
  }
  class CommandManager {
    constructor(props) {
      this.editor = props.editor;
      this.rawCommands = this.editor.extensionManager.commands;
      this.customState = props.state;
    }
    get hasCustomState() {
      return !!this.customState;
    }
    get state() {
      return this.customState || this.editor.state;
    }
    get commands() {
      const { rawCommands, editor, state } = this;
      const { view } = editor;
      const { tr } = state;
      const props = this.buildProps(tr);
      return Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
        const method = (...args) => {
          const callback = command2(...args)(props);
          if (!tr.getMeta("preventDispatch") && !this.hasCustomState) {
            view.dispatch(tr);
          }
          return callback;
        };
        return [name, method];
      }));
    }
    get chain() {
      return () => this.createChain();
    }
    get can() {
      return () => this.createCan();
    }
    createChain(startTr, shouldDispatch = true) {
      const { rawCommands, editor, state } = this;
      const { view } = editor;
      const callbacks = [];
      const hasStartTransaction = !!startTr;
      const tr = startTr || state.tr;
      const run2 = () => {
        if (!hasStartTransaction && shouldDispatch && !tr.getMeta("preventDispatch") && !this.hasCustomState) {
          view.dispatch(tr);
        }
        return callbacks.every((callback) => callback === true);
      };
      const chain = {
        ...Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
          const chainedCommand = (...args) => {
            const props = this.buildProps(tr, shouldDispatch);
            const callback = command2(...args)(props);
            callbacks.push(callback);
            return chain;
          };
          return [name, chainedCommand];
        })),
        run: run2
      };
      return chain;
    }
    createCan(startTr) {
      const { rawCommands, state } = this;
      const dispatch = false;
      const tr = startTr || state.tr;
      const props = this.buildProps(tr, dispatch);
      const formattedCommands = Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
        return [name, (...args) => command2(...args)({ ...props, dispatch: void 0 })];
      }));
      return {
        ...formattedCommands,
        chain: () => this.createChain(tr, dispatch)
      };
    }
    buildProps(tr, shouldDispatch = true) {
      const { rawCommands, editor, state } = this;
      const { view } = editor;
      if (state.storedMarks) {
        tr.setStoredMarks(state.storedMarks);
      }
      const props = {
        tr,
        editor,
        view,
        state: createChainableState({
          state,
          transaction: tr
        }),
        dispatch: shouldDispatch ? () => void 0 : void 0,
        chain: () => this.createChain(tr),
        can: () => this.createCan(tr),
        get commands() {
          return Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
            return [name, (...args) => command2(...args)(props)];
          }));
        }
      };
      return props;
    }
  }
  class EventEmitter {
    constructor() {
      this.callbacks = {};
    }
    on(event, fn) {
      if (!this.callbacks[event]) {
        this.callbacks[event] = [];
      }
      this.callbacks[event].push(fn);
      return this;
    }
    emit(event, ...args) {
      const callbacks = this.callbacks[event];
      if (callbacks) {
        callbacks.forEach((callback) => callback.apply(this, args));
      }
      return this;
    }
    off(event, fn) {
      const callbacks = this.callbacks[event];
      if (callbacks) {
        if (fn) {
          this.callbacks[event] = callbacks.filter((callback) => callback !== fn);
        } else {
          delete this.callbacks[event];
        }
      }
      return this;
    }
    removeAllListeners() {
      this.callbacks = {};
    }
  }
  function getExtensionField(extension, field, context) {
    if (extension.config[field] === void 0 && extension.parent) {
      return getExtensionField(extension.parent, field, context);
    }
    if (typeof extension.config[field] === "function") {
      const value = extension.config[field].bind({
        ...context,
        parent: extension.parent ? getExtensionField(extension.parent, field, context) : null
      });
      return value;
    }
    return extension.config[field];
  }
  function splitExtensions(extensions2) {
    const baseExtensions = extensions2.filter((extension) => extension.type === "extension");
    const nodeExtensions = extensions2.filter((extension) => extension.type === "node");
    const markExtensions = extensions2.filter((extension) => extension.type === "mark");
    return {
      baseExtensions,
      nodeExtensions,
      markExtensions
    };
  }
  function getAttributesFromExtensions(extensions2) {
    const extensionAttributes = [];
    const { nodeExtensions, markExtensions } = splitExtensions(extensions2);
    const nodeAndMarkExtensions = [...nodeExtensions, ...markExtensions];
    const defaultAttribute = {
      default: null,
      rendered: true,
      renderHTML: null,
      parseHTML: null,
      keepOnSplit: true,
      isRequired: false
    };
    extensions2.forEach((extension) => {
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage
      };
      const addGlobalAttributes = getExtensionField(extension, "addGlobalAttributes", context);
      if (!addGlobalAttributes) {
        return;
      }
      const globalAttributes = addGlobalAttributes();
      globalAttributes.forEach((globalAttribute) => {
        globalAttribute.types.forEach((type) => {
          Object.entries(globalAttribute.attributes).forEach(([name, attribute]) => {
            extensionAttributes.push({
              type,
              name,
              attribute: {
                ...defaultAttribute,
                ...attribute
              }
            });
          });
        });
      });
    });
    nodeAndMarkExtensions.forEach((extension) => {
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage
      };
      const addAttributes = getExtensionField(extension, "addAttributes", context);
      if (!addAttributes) {
        return;
      }
      const attributes = addAttributes();
      Object.entries(attributes).forEach(([name, attribute]) => {
        const mergedAttr = {
          ...defaultAttribute,
          ...attribute
        };
        if ((attribute === null || attribute === void 0 ? void 0 : attribute.isRequired) && (attribute === null || attribute === void 0 ? void 0 : attribute.default) === void 0) {
          delete mergedAttr.default;
        }
        extensionAttributes.push({
          type: extension.name,
          name,
          attribute: mergedAttr
        });
      });
    });
    return extensionAttributes;
  }
  function getNodeType(nameOrType, schema) {
    if (typeof nameOrType === "string") {
      if (!schema.nodes[nameOrType]) {
        throw Error(`There is no node type named '${nameOrType}'. Maybe you forgot to add the extension?`);
      }
      return schema.nodes[nameOrType];
    }
    return nameOrType;
  }
  function mergeAttributes(...objects) {
    return objects.filter((item) => !!item).reduce((items, item) => {
      const mergedAttributes = { ...items };
      Object.entries(item).forEach(([key, value]) => {
        const exists = mergedAttributes[key];
        if (!exists) {
          mergedAttributes[key] = value;
          return;
        }
        if (key === "class") {
          mergedAttributes[key] = [mergedAttributes[key], value].join(" ");
        } else if (key === "style") {
          mergedAttributes[key] = [mergedAttributes[key], value].join("; ");
        } else {
          mergedAttributes[key] = value;
        }
      });
      return mergedAttributes;
    }, {});
  }
  function getRenderedAttributes(nodeOrMark, extensionAttributes) {
    return extensionAttributes.filter((item) => item.attribute.rendered).map((item) => {
      if (!item.attribute.renderHTML) {
        return {
          [item.name]: nodeOrMark.attrs[item.name]
        };
      }
      return item.attribute.renderHTML(nodeOrMark.attrs) || {};
    }).reduce((attributes, attribute) => mergeAttributes(attributes, attribute), {});
  }
  function isFunction(value) {
    return typeof value === "function";
  }
  function callOrReturn(value, context = void 0, ...props) {
    if (isFunction(value)) {
      if (context) {
        return value.bind(context)(...props);
      }
      return value(...props);
    }
    return value;
  }
  function isEmptyObject(value = {}) {
    return Object.keys(value).length === 0 && value.constructor === Object;
  }
  function fromString(value) {
    if (typeof value !== "string") {
      return value;
    }
    if (value.match(/^[+-]?(?:\d*\.)?\d+$/)) {
      return Number(value);
    }
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    return value;
  }
  function injectExtensionAttributesToParseRule(parseRule, extensionAttributes) {
    if (parseRule.style) {
      return parseRule;
    }
    return {
      ...parseRule,
      getAttrs: (node) => {
        const oldAttributes = parseRule.getAttrs ? parseRule.getAttrs(node) : parseRule.attrs;
        if (oldAttributes === false) {
          return false;
        }
        const newAttributes = extensionAttributes.reduce((items, item) => {
          const value = item.attribute.parseHTML ? item.attribute.parseHTML(node) : fromString(node.getAttribute(item.name));
          if (value === null || value === void 0) {
            return items;
          }
          return {
            ...items,
            [item.name]: value
          };
        }, {});
        return { ...oldAttributes, ...newAttributes };
      }
    };
  }
  function cleanUpSchemaItem(data) {
    return Object.fromEntries(Object.entries(data).filter(([key, value]) => {
      if (key === "attrs" && isEmptyObject(value)) {
        return false;
      }
      return value !== null && value !== void 0;
    }));
  }
  function getSchemaByResolvedExtensions(extensions2) {
    var _a;
    const allAttributes = getAttributesFromExtensions(extensions2);
    const { nodeExtensions, markExtensions } = splitExtensions(extensions2);
    const topNode = (_a = nodeExtensions.find((extension) => getExtensionField(extension, "topNode"))) === null || _a === void 0 ? void 0 : _a.name;
    const nodes = Object.fromEntries(nodeExtensions.map((extension) => {
      const extensionAttributes = allAttributes.filter((attribute) => attribute.type === extension.name);
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage
      };
      const extraNodeFields = extensions2.reduce((fields, e) => {
        const extendNodeSchema = getExtensionField(e, "extendNodeSchema", context);
        return {
          ...fields,
          ...extendNodeSchema ? extendNodeSchema(extension) : {}
        };
      }, {});
      const schema = cleanUpSchemaItem({
        ...extraNodeFields,
        content: callOrReturn(getExtensionField(extension, "content", context)),
        marks: callOrReturn(getExtensionField(extension, "marks", context)),
        group: callOrReturn(getExtensionField(extension, "group", context)),
        inline: callOrReturn(getExtensionField(extension, "inline", context)),
        atom: callOrReturn(getExtensionField(extension, "atom", context)),
        selectable: callOrReturn(getExtensionField(extension, "selectable", context)),
        draggable: callOrReturn(getExtensionField(extension, "draggable", context)),
        code: callOrReturn(getExtensionField(extension, "code", context)),
        defining: callOrReturn(getExtensionField(extension, "defining", context)),
        isolating: callOrReturn(getExtensionField(extension, "isolating", context)),
        attrs: Object.fromEntries(extensionAttributes.map((extensionAttribute) => {
          var _a2;
          return [extensionAttribute.name, { default: (_a2 = extensionAttribute === null || extensionAttribute === void 0 ? void 0 : extensionAttribute.attribute) === null || _a2 === void 0 ? void 0 : _a2.default }];
        }))
      });
      const parseHTML = callOrReturn(getExtensionField(extension, "parseHTML", context));
      if (parseHTML) {
        schema.parseDOM = parseHTML.map((parseRule) => injectExtensionAttributesToParseRule(parseRule, extensionAttributes));
      }
      const renderHTML = getExtensionField(extension, "renderHTML", context);
      if (renderHTML) {
        schema.toDOM = (node) => renderHTML({
          node,
          HTMLAttributes: getRenderedAttributes(node, extensionAttributes)
        });
      }
      const renderText = getExtensionField(extension, "renderText", context);
      if (renderText) {
        schema.toText = renderText;
      }
      return [extension.name, schema];
    }));
    const marks = Object.fromEntries(markExtensions.map((extension) => {
      const extensionAttributes = allAttributes.filter((attribute) => attribute.type === extension.name);
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage
      };
      const extraMarkFields = extensions2.reduce((fields, e) => {
        const extendMarkSchema = getExtensionField(e, "extendMarkSchema", context);
        return {
          ...fields,
          ...extendMarkSchema ? extendMarkSchema(extension) : {}
        };
      }, {});
      const schema = cleanUpSchemaItem({
        ...extraMarkFields,
        inclusive: callOrReturn(getExtensionField(extension, "inclusive", context)),
        excludes: callOrReturn(getExtensionField(extension, "excludes", context)),
        group: callOrReturn(getExtensionField(extension, "group", context)),
        spanning: callOrReturn(getExtensionField(extension, "spanning", context)),
        code: callOrReturn(getExtensionField(extension, "code", context)),
        attrs: Object.fromEntries(extensionAttributes.map((extensionAttribute) => {
          var _a2;
          return [extensionAttribute.name, { default: (_a2 = extensionAttribute === null || extensionAttribute === void 0 ? void 0 : extensionAttribute.attribute) === null || _a2 === void 0 ? void 0 : _a2.default }];
        }))
      });
      const parseHTML = callOrReturn(getExtensionField(extension, "parseHTML", context));
      if (parseHTML) {
        schema.parseDOM = parseHTML.map((parseRule) => injectExtensionAttributesToParseRule(parseRule, extensionAttributes));
      }
      const renderHTML = getExtensionField(extension, "renderHTML", context);
      if (renderHTML) {
        schema.toDOM = (mark) => renderHTML({
          mark,
          HTMLAttributes: getRenderedAttributes(mark, extensionAttributes)
        });
      }
      return [extension.name, schema];
    }));
    return new Schema({
      topNode,
      nodes,
      marks
    });
  }
  function getSchemaTypeByName(name, schema) {
    return schema.nodes[name] || schema.marks[name] || null;
  }
  function isExtensionRulesEnabled(extension, enabled) {
    if (Array.isArray(enabled)) {
      return enabled.some((enabledExtension) => {
        const name = typeof enabledExtension === "string" ? enabledExtension : enabledExtension.name;
        return name === extension.name;
      });
    }
    return enabled;
  }
  const getTextContentFromNodes = ($from, maxMatch = 500) => {
    let textBefore = "";
    const sliceEndPos = $from.parentOffset;
    $from.parent.nodesBetween(Math.max(0, sliceEndPos - maxMatch), sliceEndPos, (node, pos, parent, index) => {
      var _a, _b;
      const chunk = ((_b = (_a = node.type.spec).toText) === null || _b === void 0 ? void 0 : _b.call(_a, {
        node,
        pos,
        parent,
        index
      })) || node.textContent || "%leaf%";
      textBefore += chunk.slice(0, Math.max(0, sliceEndPos - pos));
    });
    return textBefore;
  };
  function isRegExp(value) {
    return Object.prototype.toString.call(value) === "[object RegExp]";
  }
  class InputRule {
    constructor(config) {
      this.find = config.find;
      this.handler = config.handler;
    }
  }
  const inputRuleMatcherHandler = (text2, find2) => {
    if (isRegExp(find2)) {
      return find2.exec(text2);
    }
    const inputRuleMatch = find2(text2);
    if (!inputRuleMatch) {
      return null;
    }
    const result = [];
    result.push(inputRuleMatch.text);
    result.index = inputRuleMatch.index;
    result.input = text2;
    result.data = inputRuleMatch.data;
    if (inputRuleMatch.replaceWith) {
      if (!inputRuleMatch.text.includes(inputRuleMatch.replaceWith)) {
        console.warn('[tiptap warn]: "inputRuleMatch.replaceWith" must be part of "inputRuleMatch.text".');
      }
      result.push(inputRuleMatch.replaceWith);
    }
    return result;
  };
  function run$1$1(config) {
    var _a;
    const { editor, from, to, text: text2, rules, plugin } = config;
    const { view } = editor;
    if (view.composing) {
      return false;
    }
    const $from = view.state.doc.resolve(from);
    if ($from.parent.type.spec.code || !!((_a = $from.nodeBefore || $from.nodeAfter) === null || _a === void 0 ? void 0 : _a.marks.find((mark) => mark.type.spec.code))) {
      return false;
    }
    let matched = false;
    const textBefore = getTextContentFromNodes($from) + text2;
    rules.forEach((rule) => {
      if (matched) {
        return;
      }
      const match = inputRuleMatcherHandler(textBefore, rule.find);
      if (!match) {
        return;
      }
      const tr = view.state.tr;
      const state = createChainableState({
        state: view.state,
        transaction: tr
      });
      const range = {
        from: from - (match[0].length - text2.length),
        to
      };
      const { commands: commands2, chain, can } = new CommandManager({
        editor,
        state
      });
      const handler = rule.handler({
        state,
        range,
        match,
        commands: commands2,
        chain,
        can
      });
      if (handler === null || !tr.steps.length) {
        return;
      }
      tr.setMeta(plugin, {
        transform: tr,
        from,
        to,
        text: text2
      });
      view.dispatch(tr);
      matched = true;
    });
    return matched;
  }
  function inputRulesPlugin(props) {
    const { editor, rules } = props;
    const plugin = new Plugin({
      state: {
        init() {
          return null;
        },
        apply(tr, prev) {
          const stored = tr.getMeta(plugin);
          if (stored) {
            return stored;
          }
          return tr.selectionSet || tr.docChanged ? null : prev;
        }
      },
      props: {
        handleTextInput(view, from, to, text2) {
          return run$1$1({
            editor,
            from,
            to,
            text: text2,
            rules,
            plugin
          });
        },
        handleDOMEvents: {
          compositionend: (view) => {
            setTimeout(() => {
              const { $cursor } = view.state.selection;
              if ($cursor) {
                run$1$1({
                  editor,
                  from: $cursor.pos,
                  to: $cursor.pos,
                  text: "",
                  rules,
                  plugin
                });
              }
            });
            return false;
          }
        },
        handleKeyDown(view, event) {
          if (event.key !== "Enter") {
            return false;
          }
          const { $cursor } = view.state.selection;
          if ($cursor) {
            return run$1$1({
              editor,
              from: $cursor.pos,
              to: $cursor.pos,
              text: "\n",
              rules,
              plugin
            });
          }
          return false;
        }
      },
      isInputRules: true
    });
    return plugin;
  }
  function isNumber(value) {
    return typeof value === "number";
  }
  class PasteRule {
    constructor(config) {
      this.find = config.find;
      this.handler = config.handler;
    }
  }
  const pasteRuleMatcherHandler = (text2, find2) => {
    if (isRegExp(find2)) {
      return [...text2.matchAll(find2)];
    }
    const matches2 = find2(text2);
    if (!matches2) {
      return [];
    }
    return matches2.map((pasteRuleMatch) => {
      const result = [];
      result.push(pasteRuleMatch.text);
      result.index = pasteRuleMatch.index;
      result.input = text2;
      result.data = pasteRuleMatch.data;
      if (pasteRuleMatch.replaceWith) {
        if (!pasteRuleMatch.text.includes(pasteRuleMatch.replaceWith)) {
          console.warn('[tiptap warn]: "pasteRuleMatch.replaceWith" must be part of "pasteRuleMatch.text".');
        }
        result.push(pasteRuleMatch.replaceWith);
      }
      return result;
    });
  };
  function run$2(config) {
    const { editor, state, from, to, rule } = config;
    const { commands: commands2, chain, can } = new CommandManager({
      editor,
      state
    });
    const handlers2 = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isTextblock || node.type.spec.code) {
        return;
      }
      const resolvedFrom = Math.max(from, pos);
      const resolvedTo = Math.min(to, pos + node.content.size);
      const textToMatch = node.textBetween(resolvedFrom - pos, resolvedTo - pos, void 0, "\uFFFC");
      const matches2 = pasteRuleMatcherHandler(textToMatch, rule.find);
      matches2.forEach((match) => {
        if (match.index === void 0) {
          return;
        }
        const start = resolvedFrom + match.index + 1;
        const end = start + match[0].length;
        const range = {
          from: state.tr.mapping.map(start),
          to: state.tr.mapping.map(end)
        };
        const handler = rule.handler({
          state,
          range,
          match,
          commands: commands2,
          chain,
          can
        });
        handlers2.push(handler);
      });
    });
    const success = handlers2.every((handler) => handler !== null);
    return success;
  }
  function pasteRulesPlugin(props) {
    const { editor, rules } = props;
    let dragSourceElement = null;
    let isPastedFromProseMirror = false;
    let isDroppedFromProseMirror = false;
    const plugins = rules.map((rule) => {
      return new Plugin({
        view(view) {
          const handleDragstart = (event) => {
            var _a;
            dragSourceElement = ((_a = view.dom.parentElement) === null || _a === void 0 ? void 0 : _a.contains(event.target)) ? view.dom.parentElement : null;
          };
          window.addEventListener("dragstart", handleDragstart);
          return {
            destroy() {
              window.removeEventListener("dragstart", handleDragstart);
            }
          };
        },
        props: {
          handleDOMEvents: {
            drop: (view) => {
              isDroppedFromProseMirror = dragSourceElement === view.dom.parentElement;
              return false;
            },
            paste: (view, event) => {
              var _a;
              const html = (_a = event.clipboardData) === null || _a === void 0 ? void 0 : _a.getData("text/html");
              isPastedFromProseMirror = !!(html === null || html === void 0 ? void 0 : html.includes("data-pm-slice"));
              return false;
            }
          }
        },
        appendTransaction: (transactions, oldState, state) => {
          const transaction = transactions[0];
          const isPaste = transaction.getMeta("uiEvent") === "paste" && !isPastedFromProseMirror;
          const isDrop = transaction.getMeta("uiEvent") === "drop" && !isDroppedFromProseMirror;
          if (!isPaste && !isDrop) {
            return;
          }
          const from = oldState.doc.content.findDiffStart(state.doc.content);
          const to = oldState.doc.content.findDiffEnd(state.doc.content);
          if (!isNumber(from) || !to || from === to.b) {
            return;
          }
          const tr = state.tr;
          const chainableState = createChainableState({
            state,
            transaction: tr
          });
          const handler = run$2({
            editor,
            state: chainableState,
            from: Math.max(from - 1, 0),
            to: to.b - 1,
            rule
          });
          if (!handler || !tr.steps.length) {
            return;
          }
          return tr;
        }
      });
    });
    return plugins;
  }
  function findDuplicates$1(items) {
    const filtered = items.filter((el, index) => items.indexOf(el) !== index);
    return [...new Set(filtered)];
  }
  class ExtensionManager {
    constructor(extensions2, editor) {
      this.splittableMarks = [];
      this.editor = editor;
      this.extensions = ExtensionManager.resolve(extensions2);
      this.schema = getSchemaByResolvedExtensions(this.extensions);
      this.extensions.forEach((extension) => {
        var _a;
        this.editor.extensionStorage[extension.name] = extension.storage;
        const context = {
          name: extension.name,
          options: extension.options,
          storage: extension.storage,
          editor: this.editor,
          type: getSchemaTypeByName(extension.name, this.schema)
        };
        if (extension.type === "mark") {
          const keepOnSplit = (_a = callOrReturn(getExtensionField(extension, "keepOnSplit", context))) !== null && _a !== void 0 ? _a : true;
          if (keepOnSplit) {
            this.splittableMarks.push(extension.name);
          }
        }
        const onBeforeCreate = getExtensionField(extension, "onBeforeCreate", context);
        if (onBeforeCreate) {
          this.editor.on("beforeCreate", onBeforeCreate);
        }
        const onCreate = getExtensionField(extension, "onCreate", context);
        if (onCreate) {
          this.editor.on("create", onCreate);
        }
        const onUpdate = getExtensionField(extension, "onUpdate", context);
        if (onUpdate) {
          this.editor.on("update", onUpdate);
        }
        const onSelectionUpdate = getExtensionField(extension, "onSelectionUpdate", context);
        if (onSelectionUpdate) {
          this.editor.on("selectionUpdate", onSelectionUpdate);
        }
        const onTransaction = getExtensionField(extension, "onTransaction", context);
        if (onTransaction) {
          this.editor.on("transaction", onTransaction);
        }
        const onFocus = getExtensionField(extension, "onFocus", context);
        if (onFocus) {
          this.editor.on("focus", onFocus);
        }
        const onBlur = getExtensionField(extension, "onBlur", context);
        if (onBlur) {
          this.editor.on("blur", onBlur);
        }
        const onDestroy = getExtensionField(extension, "onDestroy", context);
        if (onDestroy) {
          this.editor.on("destroy", onDestroy);
        }
      });
    }
    static resolve(extensions2) {
      const resolvedExtensions = ExtensionManager.sort(ExtensionManager.flatten(extensions2));
      const duplicatedNames = findDuplicates$1(resolvedExtensions.map((extension) => extension.name));
      if (duplicatedNames.length) {
        console.warn(`[tiptap warn]: Duplicate extension names found: [${duplicatedNames.map((item) => `'${item}'`).join(", ")}]. This can lead to issues.`);
      }
      return resolvedExtensions;
    }
    static flatten(extensions2) {
      return extensions2.map((extension) => {
        const context = {
          name: extension.name,
          options: extension.options,
          storage: extension.storage
        };
        const addExtensions = getExtensionField(extension, "addExtensions", context);
        if (addExtensions) {
          return [
            extension,
            ...this.flatten(addExtensions())
          ];
        }
        return extension;
      }).flat(10);
    }
    static sort(extensions2) {
      const defaultPriority = 100;
      return extensions2.sort((a, b) => {
        const priorityA = getExtensionField(a, "priority") || defaultPriority;
        const priorityB = getExtensionField(b, "priority") || defaultPriority;
        if (priorityA > priorityB) {
          return -1;
        }
        if (priorityA < priorityB) {
          return 1;
        }
        return 0;
      });
    }
    get commands() {
      return this.extensions.reduce((commands2, extension) => {
        const context = {
          name: extension.name,
          options: extension.options,
          storage: extension.storage,
          editor: this.editor,
          type: getSchemaTypeByName(extension.name, this.schema)
        };
        const addCommands = getExtensionField(extension, "addCommands", context);
        if (!addCommands) {
          return commands2;
        }
        return {
          ...commands2,
          ...addCommands()
        };
      }, {});
    }
    get plugins() {
      const { editor } = this;
      const extensions2 = ExtensionManager.sort([...this.extensions].reverse());
      const inputRules = [];
      const pasteRules = [];
      const allPlugins = extensions2.map((extension) => {
        const context = {
          name: extension.name,
          options: extension.options,
          storage: extension.storage,
          editor,
          type: getSchemaTypeByName(extension.name, this.schema)
        };
        const plugins = [];
        const addKeyboardShortcuts = getExtensionField(extension, "addKeyboardShortcuts", context);
        let defaultBindings = {};
        if (extension.type === "mark" && extension.config.exitable) {
          defaultBindings.ArrowRight = () => Mark.handleExit({ editor, mark: extension });
        }
        if (addKeyboardShortcuts) {
          const bindings = Object.fromEntries(Object.entries(addKeyboardShortcuts()).map(([shortcut, method]) => {
            return [shortcut, () => method({ editor })];
          }));
          defaultBindings = { ...defaultBindings, ...bindings };
        }
        const keyMapPlugin = keymap(defaultBindings);
        plugins.push(keyMapPlugin);
        const addInputRules = getExtensionField(extension, "addInputRules", context);
        if (isExtensionRulesEnabled(extension, editor.options.enableInputRules) && addInputRules) {
          inputRules.push(...addInputRules());
        }
        const addPasteRules = getExtensionField(extension, "addPasteRules", context);
        if (isExtensionRulesEnabled(extension, editor.options.enablePasteRules) && addPasteRules) {
          pasteRules.push(...addPasteRules());
        }
        const addProseMirrorPlugins = getExtensionField(extension, "addProseMirrorPlugins", context);
        if (addProseMirrorPlugins) {
          const proseMirrorPlugins = addProseMirrorPlugins();
          plugins.push(...proseMirrorPlugins);
        }
        return plugins;
      }).flat();
      return [
        inputRulesPlugin({
          editor,
          rules: inputRules
        }),
        ...pasteRulesPlugin({
          editor,
          rules: pasteRules
        }),
        ...allPlugins
      ];
    }
    get attributes() {
      return getAttributesFromExtensions(this.extensions);
    }
    get nodeViews() {
      const { editor } = this;
      const { nodeExtensions } = splitExtensions(this.extensions);
      return Object.fromEntries(nodeExtensions.filter((extension) => !!getExtensionField(extension, "addNodeView")).map((extension) => {
        const extensionAttributes = this.attributes.filter((attribute) => attribute.type === extension.name);
        const context = {
          name: extension.name,
          options: extension.options,
          storage: extension.storage,
          editor,
          type: getNodeType(extension.name, this.schema)
        };
        const addNodeView = getExtensionField(extension, "addNodeView", context);
        if (!addNodeView) {
          return [];
        }
        const nodeview = (node, view, getPos, decorations) => {
          const HTMLAttributes = getRenderedAttributes(node, extensionAttributes);
          return addNodeView()({
            editor,
            node,
            getPos,
            decorations,
            HTMLAttributes,
            extension
          });
        };
        return [extension.name, nodeview];
      }));
    }
  }
  function getType(value) {
    return Object.prototype.toString.call(value).slice(8, -1);
  }
  function isPlainObject(value) {
    if (getType(value) !== "Object") {
      return false;
    }
    return value.constructor === Object && Object.getPrototypeOf(value) === Object.prototype;
  }
  function mergeDeep(target, source) {
    const output = { ...target };
    if (isPlainObject(target) && isPlainObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isPlainObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }
  class Extension {
    constructor(config = {}) {
      this.type = "extension";
      this.name = "extension";
      this.parent = null;
      this.child = null;
      this.config = {
        name: this.name,
        defaultOptions: {}
      };
      this.config = {
        ...this.config,
        ...config
      };
      this.name = this.config.name;
      if (config.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
      }
      this.options = this.config.defaultOptions;
      if (this.config.addOptions) {
        this.options = callOrReturn(getExtensionField(this, "addOptions", {
          name: this.name
        }));
      }
      this.storage = callOrReturn(getExtensionField(this, "addStorage", {
        name: this.name,
        options: this.options
      })) || {};
    }
    static create(config = {}) {
      return new Extension(config);
    }
    configure(options = {}) {
      const extension = this.extend();
      extension.options = mergeDeep(this.options, options);
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
    extend(extendedConfig = {}) {
      const extension = new Extension(extendedConfig);
      extension.parent = this;
      this.child = extension;
      extension.name = extendedConfig.name ? extendedConfig.name : extension.parent.name;
      if (extendedConfig.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
      }
      extension.options = callOrReturn(getExtensionField(extension, "addOptions", {
        name: extension.name
      }));
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
  }
  function getTextBetween(startNode, range, options) {
    const { from, to } = range;
    const { blockSeparator = "\n\n", textSerializers = {} } = options || {};
    let text2 = "";
    let separated = true;
    startNode.nodesBetween(from, to, (node, pos, parent, index) => {
      var _a;
      const textSerializer = textSerializers === null || textSerializers === void 0 ? void 0 : textSerializers[node.type.name];
      if (textSerializer) {
        if (node.isBlock && !separated) {
          text2 += blockSeparator;
          separated = true;
        }
        if (parent) {
          text2 += textSerializer({
            node,
            pos,
            parent,
            index,
            range
          });
        }
      } else if (node.isText) {
        text2 += (_a = node === null || node === void 0 ? void 0 : node.text) === null || _a === void 0 ? void 0 : _a.slice(Math.max(from, pos) - pos, to - pos);
        separated = false;
      } else if (node.isBlock && !separated) {
        text2 += blockSeparator;
        separated = true;
      }
    });
    return text2;
  }
  function getTextSerializersFromSchema(schema) {
    return Object.fromEntries(Object.entries(schema.nodes).filter(([, node]) => node.spec.toText).map(([name, node]) => [name, node.spec.toText]));
  }
  const ClipboardTextSerializer = Extension.create({
    name: "clipboardTextSerializer",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("clipboardTextSerializer"),
          props: {
            clipboardTextSerializer: () => {
              const { editor } = this;
              const { state, schema } = editor;
              const { doc: doc2, selection } = state;
              const { ranges } = selection;
              const from = Math.min(...ranges.map((range2) => range2.$from.pos));
              const to = Math.max(...ranges.map((range2) => range2.$to.pos));
              const textSerializers = getTextSerializersFromSchema(schema);
              const range = { from, to };
              return getTextBetween(doc2, range, {
                textSerializers
              });
            }
          }
        })
      ];
    }
  });
  const blur = () => ({ editor, view }) => {
    requestAnimationFrame(() => {
      var _a;
      if (!editor.isDestroyed) {
        view.dom.blur();
        (_a = window === null || window === void 0 ? void 0 : window.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
      }
    });
    return true;
  };
  const clearContent = (emitUpdate = false) => ({ commands: commands2 }) => {
    return commands2.setContent("", emitUpdate);
  };
  const clearNodes = () => ({ state, tr, dispatch }) => {
    const { selection } = tr;
    const { ranges } = selection;
    if (!dispatch) {
      return true;
    }
    ranges.forEach(({ $from, $to }) => {
      state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.isText) {
          return;
        }
        const { doc: doc2, mapping } = tr;
        const $mappedFrom = doc2.resolve(mapping.map(pos));
        const $mappedTo = doc2.resolve(mapping.map(pos + node.nodeSize));
        const nodeRange = $mappedFrom.blockRange($mappedTo);
        if (!nodeRange) {
          return;
        }
        const targetLiftDepth = liftTarget(nodeRange);
        if (node.type.isTextblock) {
          const { defaultType } = $mappedFrom.parent.contentMatchAt($mappedFrom.index());
          tr.setNodeMarkup(nodeRange.start, defaultType);
        }
        if (targetLiftDepth || targetLiftDepth === 0) {
          tr.lift(nodeRange, targetLiftDepth);
        }
      });
    });
    return true;
  };
  const command = (fn) => (props) => {
    return fn(props);
  };
  const createParagraphNear = () => ({ state, dispatch }) => {
    return createParagraphNear$1(state, dispatch);
  };
  const deleteCurrentNode = () => ({ tr, dispatch }) => {
    const { selection } = tr;
    const currentNode = selection.$anchor.node();
    if (currentNode.content.size > 0) {
      return false;
    }
    const $pos = tr.selection.$anchor;
    for (let depth = $pos.depth; depth > 0; depth -= 1) {
      const node = $pos.node(depth);
      if (node.type === currentNode.type) {
        if (dispatch) {
          const from = $pos.before(depth);
          const to = $pos.after(depth);
          tr.delete(from, to).scrollIntoView();
        }
        return true;
      }
    }
    return false;
  };
  const deleteNode = (typeOrName) => ({ tr, state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    const $pos = tr.selection.$anchor;
    for (let depth = $pos.depth; depth > 0; depth -= 1) {
      const node = $pos.node(depth);
      if (node.type === type) {
        if (dispatch) {
          const from = $pos.before(depth);
          const to = $pos.after(depth);
          tr.delete(from, to).scrollIntoView();
        }
        return true;
      }
    }
    return false;
  };
  const deleteRange = (range) => ({ tr, dispatch }) => {
    const { from, to } = range;
    if (dispatch) {
      tr.delete(from, to);
    }
    return true;
  };
  const deleteSelection = () => ({ state, dispatch }) => {
    return deleteSelection$1(state, dispatch);
  };
  const enter = () => ({ commands: commands2 }) => {
    return commands2.keyboardShortcut("Enter");
  };
  const exitCode = () => ({ state, dispatch }) => {
    return exitCode$1(state, dispatch);
  };
  function objectIncludes(object1, object2, options = { strict: true }) {
    const keys2 = Object.keys(object2);
    if (!keys2.length) {
      return true;
    }
    return keys2.every((key) => {
      if (options.strict) {
        return object2[key] === object1[key];
      }
      if (isRegExp(object2[key])) {
        return object2[key].test(object1[key]);
      }
      return object2[key] === object1[key];
    });
  }
  function findMarkInSet(marks, type, attributes = {}) {
    return marks.find((item) => {
      return item.type === type && objectIncludes(item.attrs, attributes);
    });
  }
  function isMarkInSet(marks, type, attributes = {}) {
    return !!findMarkInSet(marks, type, attributes);
  }
  function getMarkRange($pos, type, attributes = {}) {
    if (!$pos || !type) {
      return;
    }
    let start = $pos.parent.childAfter($pos.parentOffset);
    if ($pos.parentOffset === start.offset && start.offset !== 0) {
      start = $pos.parent.childBefore($pos.parentOffset);
    }
    if (!start.node) {
      return;
    }
    const mark = findMarkInSet([...start.node.marks], type, attributes);
    if (!mark) {
      return;
    }
    let startIndex = start.index;
    let startPos = $pos.start() + start.offset;
    let endIndex = startIndex + 1;
    let endPos = startPos + start.node.nodeSize;
    findMarkInSet([...start.node.marks], type, attributes);
    while (startIndex > 0 && mark.isInSet($pos.parent.child(startIndex - 1).marks)) {
      startIndex -= 1;
      startPos -= $pos.parent.child(startIndex).nodeSize;
    }
    while (endIndex < $pos.parent.childCount && isMarkInSet([...$pos.parent.child(endIndex).marks], type, attributes)) {
      endPos += $pos.parent.child(endIndex).nodeSize;
      endIndex += 1;
    }
    return {
      from: startPos,
      to: endPos
    };
  }
  function getMarkType(nameOrType, schema) {
    if (typeof nameOrType === "string") {
      if (!schema.marks[nameOrType]) {
        throw Error(`There is no mark type named '${nameOrType}'. Maybe you forgot to add the extension?`);
      }
      return schema.marks[nameOrType];
    }
    return nameOrType;
  }
  const extendMarkRange = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
    const type = getMarkType(typeOrName, state.schema);
    const { doc: doc2, selection } = tr;
    const { $from, from, to } = selection;
    if (dispatch) {
      const range = getMarkRange($from, type, attributes);
      if (range && range.from <= from && range.to >= to) {
        const newSelection = TextSelection.create(doc2, range.from, range.to);
        tr.setSelection(newSelection);
      }
    }
    return true;
  };
  const first = (commands2) => (props) => {
    const items = typeof commands2 === "function" ? commands2(props) : commands2;
    for (let i2 = 0; i2 < items.length; i2 += 1) {
      if (items[i2](props)) {
        return true;
      }
    }
    return false;
  };
  function isTextSelection(value) {
    return value instanceof TextSelection;
  }
  function minMax(value = 0, min = 0, max = 0) {
    return Math.min(Math.max(value, min), max);
  }
  function resolveFocusPosition(doc2, position = null) {
    if (!position) {
      return null;
    }
    const selectionAtStart = Selection.atStart(doc2);
    const selectionAtEnd = Selection.atEnd(doc2);
    if (position === "start" || position === true) {
      return selectionAtStart;
    }
    if (position === "end") {
      return selectionAtEnd;
    }
    const minPos = selectionAtStart.from;
    const maxPos = selectionAtEnd.to;
    if (position === "all") {
      return TextSelection.create(doc2, minMax(0, minPos, maxPos), minMax(doc2.content.size, minPos, maxPos));
    }
    return TextSelection.create(doc2, minMax(position, minPos, maxPos), minMax(position, minPos, maxPos));
  }
  function isiOS() {
    return [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod"
    ].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document;
  }
  const focus = (position = null, options = {}) => ({ editor, view, tr, dispatch }) => {
    options = {
      scrollIntoView: true,
      ...options
    };
    const delayedFocus = () => {
      if (isiOS()) {
        view.dom.focus();
      }
      requestAnimationFrame(() => {
        if (!editor.isDestroyed) {
          view.focus();
          if (options === null || options === void 0 ? void 0 : options.scrollIntoView) {
            editor.commands.scrollIntoView();
          }
        }
      });
    };
    if (view.hasFocus() && position === null || position === false) {
      return true;
    }
    if (dispatch && position === null && !isTextSelection(editor.state.selection)) {
      delayedFocus();
      return true;
    }
    const selection = resolveFocusPosition(tr.doc, position) || editor.state.selection;
    const isSameSelection = editor.state.selection.eq(selection);
    if (dispatch) {
      if (!isSameSelection) {
        tr.setSelection(selection);
      }
      if (isSameSelection && tr.storedMarks) {
        tr.setStoredMarks(tr.storedMarks);
      }
      delayedFocus();
    }
    return true;
  };
  const forEach = (items, fn) => (props) => {
    return items.every((item, index) => fn(item, { ...props, index }));
  };
  const insertContent = (value, options) => ({ tr, commands: commands2 }) => {
    return commands2.insertContentAt({ from: tr.selection.from, to: tr.selection.to }, value, options);
  };
  function elementFromString(value) {
    const wrappedValue = `<body>${value}</body>`;
    return new window.DOMParser().parseFromString(wrappedValue, "text/html").body;
  }
  function createNodeFromContent(content, schema, options) {
    options = {
      slice: true,
      parseOptions: {},
      ...options
    };
    if (typeof content === "object" && content !== null) {
      try {
        if (Array.isArray(content)) {
          return Fragment.fromArray(content.map((item) => schema.nodeFromJSON(item)));
        }
        return schema.nodeFromJSON(content);
      } catch (error) {
        console.warn("[tiptap warn]: Invalid content.", "Passed value:", content, "Error:", error);
        return createNodeFromContent("", schema, options);
      }
    }
    if (typeof content === "string") {
      const parser = DOMParser.fromSchema(schema);
      return options.slice ? parser.parseSlice(elementFromString(content), options.parseOptions).content : parser.parse(elementFromString(content), options.parseOptions);
    }
    return createNodeFromContent("", schema, options);
  }
  function selectionToInsertionEnd(tr, startLen, bias) {
    const last = tr.steps.length - 1;
    if (last < startLen) {
      return;
    }
    const step = tr.steps[last];
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) {
      return;
    }
    const map = tr.mapping.maps[last];
    let end = 0;
    map.forEach((_from, _to, _newFrom, newTo) => {
      if (end === 0) {
        end = newTo;
      }
    });
    tr.setSelection(Selection.near(tr.doc.resolve(end), bias));
  }
  const isFragment = (nodeOrFragment) => {
    return nodeOrFragment.toString().startsWith("<");
  };
  const insertContentAt = (position, value, options) => ({ tr, dispatch, editor }) => {
    if (dispatch) {
      options = {
        parseOptions: {},
        updateSelection: true,
        ...options
      };
      const content = createNodeFromContent(value, editor.schema, {
        parseOptions: {
          preserveWhitespace: "full",
          ...options.parseOptions
        }
      });
      if (content.toString() === "<>") {
        return true;
      }
      let { from, to } = typeof position === "number" ? { from: position, to: position } : position;
      let isOnlyTextContent = true;
      let isOnlyBlockContent = true;
      const nodes = isFragment(content) ? content : [content];
      nodes.forEach((node) => {
        node.check();
        isOnlyTextContent = isOnlyTextContent ? node.isText && node.marks.length === 0 : false;
        isOnlyBlockContent = isOnlyBlockContent ? node.isBlock : false;
      });
      if (from === to && isOnlyBlockContent) {
        const { parent } = tr.doc.resolve(from);
        const isEmptyTextBlock = parent.isTextblock && !parent.type.spec.code && !parent.childCount;
        if (isEmptyTextBlock) {
          from -= 1;
          to += 1;
        }
      }
      if (isOnlyTextContent) {
        tr.insertText(value, from, to);
      } else {
        tr.replaceWith(from, to, content);
      }
      if (options.updateSelection) {
        selectionToInsertionEnd(tr, tr.steps.length - 1, -1);
      }
    }
    return true;
  };
  const joinUp = () => ({ state, dispatch }) => {
    return joinUp$1(state, dispatch);
  };
  const joinDown = () => ({ state, dispatch }) => {
    return joinDown$1(state, dispatch);
  };
  const joinBackward = () => ({ state, dispatch }) => {
    return joinBackward$1(state, dispatch);
  };
  const joinForward = () => ({ state, dispatch }) => {
    return joinForward$1(state, dispatch);
  };
  function isMacOS() {
    return typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
  }
  function normalizeKeyName(name) {
    const parts = name.split(/-(?!$)/);
    let result = parts[parts.length - 1];
    if (result === "Space") {
      result = " ";
    }
    let alt;
    let ctrl;
    let shift2;
    let meta;
    for (let i2 = 0; i2 < parts.length - 1; i2 += 1) {
      const mod = parts[i2];
      if (/^(cmd|meta|m)$/i.test(mod)) {
        meta = true;
      } else if (/^a(lt)?$/i.test(mod)) {
        alt = true;
      } else if (/^(c|ctrl|control)$/i.test(mod)) {
        ctrl = true;
      } else if (/^s(hift)?$/i.test(mod)) {
        shift2 = true;
      } else if (/^mod$/i.test(mod)) {
        if (isiOS() || isMacOS()) {
          meta = true;
        } else {
          ctrl = true;
        }
      } else {
        throw new Error(`Unrecognized modifier name: ${mod}`);
      }
    }
    if (alt) {
      result = `Alt-${result}`;
    }
    if (ctrl) {
      result = `Ctrl-${result}`;
    }
    if (meta) {
      result = `Meta-${result}`;
    }
    if (shift2) {
      result = `Shift-${result}`;
    }
    return result;
  }
  const keyboardShortcut = (name) => ({ editor, view, tr, dispatch }) => {
    const keys2 = normalizeKeyName(name).split(/-(?!$)/);
    const key = keys2.find((item) => !["Alt", "Ctrl", "Meta", "Shift"].includes(item));
    const event = new KeyboardEvent("keydown", {
      key: key === "Space" ? " " : key,
      altKey: keys2.includes("Alt"),
      ctrlKey: keys2.includes("Ctrl"),
      metaKey: keys2.includes("Meta"),
      shiftKey: keys2.includes("Shift"),
      bubbles: true,
      cancelable: true
    });
    const capturedTransaction = editor.captureTransaction(() => {
      view.someProp("handleKeyDown", (f) => f(view, event));
    });
    capturedTransaction === null || capturedTransaction === void 0 ? void 0 : capturedTransaction.steps.forEach((step) => {
      const newStep = step.map(tr.mapping);
      if (newStep && dispatch) {
        tr.maybeStep(newStep);
      }
    });
    return true;
  };
  function isNodeActive(state, typeOrName, attributes = {}) {
    const { from, to, empty: empty2 } = state.selection;
    const type = typeOrName ? getNodeType(typeOrName, state.schema) : null;
    const nodeRanges = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isText) {
        return;
      }
      const relativeFrom = Math.max(from, pos);
      const relativeTo = Math.min(to, pos + node.nodeSize);
      nodeRanges.push({
        node,
        from: relativeFrom,
        to: relativeTo
      });
    });
    const selectionRange = to - from;
    const matchedNodeRanges = nodeRanges.filter((nodeRange) => {
      if (!type) {
        return true;
      }
      return type.name === nodeRange.node.type.name;
    }).filter((nodeRange) => objectIncludes(nodeRange.node.attrs, attributes, { strict: false }));
    if (empty2) {
      return !!matchedNodeRanges.length;
    }
    const range = matchedNodeRanges.reduce((sum, nodeRange) => sum + nodeRange.to - nodeRange.from, 0);
    return range >= selectionRange;
  }
  const lift = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    const isActive2 = isNodeActive(state, type, attributes);
    if (!isActive2) {
      return false;
    }
    return lift$1(state, dispatch);
  };
  const liftEmptyBlock = () => ({ state, dispatch }) => {
    return liftEmptyBlock$1(state, dispatch);
  };
  const liftListItem = (typeOrName) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    return liftListItem$1(type)(state, dispatch);
  };
  const newlineInCode = () => ({ state, dispatch }) => {
    return newlineInCode$1(state, dispatch);
  };
  function getSchemaTypeNameByName(name, schema) {
    if (schema.nodes[name]) {
      return "node";
    }
    if (schema.marks[name]) {
      return "mark";
    }
    return null;
  }
  function deleteProps(obj, propOrProps) {
    const props = typeof propOrProps === "string" ? [propOrProps] : propOrProps;
    return Object.keys(obj).reduce((newObj, prop) => {
      if (!props.includes(prop)) {
        newObj[prop] = obj[prop];
      }
      return newObj;
    }, {});
  }
  const resetAttributes = (typeOrName, attributes) => ({ tr, state, dispatch }) => {
    let nodeType = null;
    let markType = null;
    const schemaType = getSchemaTypeNameByName(typeof typeOrName === "string" ? typeOrName : typeOrName.name, state.schema);
    if (!schemaType) {
      return false;
    }
    if (schemaType === "node") {
      nodeType = getNodeType(typeOrName, state.schema);
    }
    if (schemaType === "mark") {
      markType = getMarkType(typeOrName, state.schema);
    }
    if (dispatch) {
      tr.selection.ranges.forEach((range) => {
        state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
          if (nodeType && nodeType === node.type) {
            tr.setNodeMarkup(pos, void 0, deleteProps(node.attrs, attributes));
          }
          if (markType && node.marks.length) {
            node.marks.forEach((mark) => {
              if (markType === mark.type) {
                tr.addMark(pos, pos + node.nodeSize, markType.create(deleteProps(mark.attrs, attributes)));
              }
            });
          }
        });
      });
    }
    return true;
  };
  const scrollIntoView = () => ({ tr, dispatch }) => {
    if (dispatch) {
      tr.scrollIntoView();
    }
    return true;
  };
  const selectAll = () => ({ tr, commands: commands2 }) => {
    return commands2.setTextSelection({
      from: 0,
      to: tr.doc.content.size
    });
  };
  const selectNodeBackward = () => ({ state, dispatch }) => {
    return selectNodeBackward$1(state, dispatch);
  };
  const selectNodeForward = () => ({ state, dispatch }) => {
    return selectNodeForward$1(state, dispatch);
  };
  const selectParentNode = () => ({ state, dispatch }) => {
    return selectParentNode$1(state, dispatch);
  };
  const selectTextblockEnd = () => ({ state, dispatch }) => {
    return selectTextblockEnd$1(state, dispatch);
  };
  const selectTextblockStart = () => ({ state, dispatch }) => {
    return selectTextblockStart$1(state, dispatch);
  };
  function createDocument(content, schema, parseOptions = {}) {
    return createNodeFromContent(content, schema, { slice: false, parseOptions });
  }
  const setContent = (content, emitUpdate = false, parseOptions = {}) => ({ tr, editor, dispatch }) => {
    const { doc: doc2 } = tr;
    const document2 = createDocument(content, editor.schema, parseOptions);
    if (dispatch) {
      tr.replaceWith(0, doc2.content.size, document2).setMeta("preventUpdate", !emitUpdate);
    }
    return true;
  };
  function combineTransactionSteps(oldDoc, transactions) {
    const transform = new Transform(oldDoc);
    transactions.forEach((transaction) => {
      transaction.steps.forEach((step) => {
        transform.step(step);
      });
    });
    return transform;
  }
  function defaultBlockAt(match) {
    for (let i2 = 0; i2 < match.edgeCount; i2 += 1) {
      const { type } = match.edge(i2);
      if (type.isTextblock && !type.hasRequiredAttrs()) {
        return type;
      }
    }
    return null;
  }
  function findChildren(node, predicate) {
    const nodesWithPos = [];
    node.descendants((child, pos) => {
      if (predicate(child)) {
        nodesWithPos.push({
          node: child,
          pos
        });
      }
    });
    return nodesWithPos;
  }
  function findChildrenInRange(node, range, predicate) {
    const nodesWithPos = [];
    node.nodesBetween(range.from, range.to, (child, pos) => {
      if (predicate(child)) {
        nodesWithPos.push({
          node: child,
          pos
        });
      }
    });
    return nodesWithPos;
  }
  function findParentNodeClosestToPos($pos, predicate) {
    for (let i2 = $pos.depth; i2 > 0; i2 -= 1) {
      const node = $pos.node(i2);
      if (predicate(node)) {
        return {
          pos: i2 > 0 ? $pos.before(i2) : 0,
          start: $pos.start(i2),
          depth: i2,
          node
        };
      }
    }
  }
  function findParentNode(predicate) {
    return (selection) => findParentNodeClosestToPos(selection.$from, predicate);
  }
  function getHTMLFromFragment(fragment, schema) {
    const documentFragment = DOMSerializer.fromSchema(schema).serializeFragment(fragment);
    const temporaryDocument = document.implementation.createHTMLDocument();
    const container = temporaryDocument.createElement("div");
    container.appendChild(documentFragment);
    return container.innerHTML;
  }
  function getText(node, options) {
    const range = {
      from: 0,
      to: node.content.size
    };
    return getTextBetween(node, range, options);
  }
  function getMarkAttributes(state, typeOrName) {
    const type = getMarkType(typeOrName, state.schema);
    const { from, to, empty: empty2 } = state.selection;
    const marks = [];
    if (empty2) {
      if (state.storedMarks) {
        marks.push(...state.storedMarks);
      }
      marks.push(...state.selection.$head.marks());
    } else {
      state.doc.nodesBetween(from, to, (node) => {
        marks.push(...node.marks);
      });
    }
    const mark = marks.find((markItem) => markItem.type.name === type.name);
    if (!mark) {
      return {};
    }
    return { ...mark.attrs };
  }
  function getNodeAttributes(state, typeOrName) {
    const type = getNodeType(typeOrName, state.schema);
    const { from, to } = state.selection;
    const nodes = [];
    state.doc.nodesBetween(from, to, (node2) => {
      nodes.push(node2);
    });
    const node = nodes.reverse().find((nodeItem) => nodeItem.type.name === type.name);
    if (!node) {
      return {};
    }
    return { ...node.attrs };
  }
  function getAttributes(state, typeOrName) {
    const schemaType = getSchemaTypeNameByName(typeof typeOrName === "string" ? typeOrName : typeOrName.name, state.schema);
    if (schemaType === "node") {
      return getNodeAttributes(state, typeOrName);
    }
    if (schemaType === "mark") {
      return getMarkAttributes(state, typeOrName);
    }
    return {};
  }
  function removeDuplicates$1(array, by = JSON.stringify) {
    const seen = {};
    return array.filter((item) => {
      const key = by(item);
      return Object.prototype.hasOwnProperty.call(seen, key) ? false : seen[key] = true;
    });
  }
  function simplifyChangedRanges(changes) {
    const uniqueChanges = removeDuplicates$1(changes);
    return uniqueChanges.length === 1 ? uniqueChanges : uniqueChanges.filter((change, index) => {
      const rest = uniqueChanges.filter((_, i2) => i2 !== index);
      return !rest.some((otherChange) => {
        return change.oldRange.from >= otherChange.oldRange.from && change.oldRange.to <= otherChange.oldRange.to && change.newRange.from >= otherChange.newRange.from && change.newRange.to <= otherChange.newRange.to;
      });
    });
  }
  function getChangedRanges(transform) {
    const { mapping, steps } = transform;
    const changes = [];
    mapping.maps.forEach((stepMap, index) => {
      const ranges = [];
      if (!stepMap.ranges.length) {
        const { from, to } = steps[index];
        if (from === void 0 || to === void 0) {
          return;
        }
        ranges.push({ from, to });
      } else {
        stepMap.forEach((from, to) => {
          ranges.push({ from, to });
        });
      }
      ranges.forEach(({ from, to }) => {
        const newStart = mapping.slice(index).map(from, -1);
        const newEnd = mapping.slice(index).map(to);
        const oldStart = mapping.invert().map(newStart, -1);
        const oldEnd = mapping.invert().map(newEnd);
        changes.push({
          oldRange: {
            from: oldStart,
            to: oldEnd
          },
          newRange: {
            from: newStart,
            to: newEnd
          }
        });
      });
    });
    return simplifyChangedRanges(changes);
  }
  function getMarksBetween(from, to, doc2) {
    const marks = [];
    if (from === to) {
      doc2.resolve(from).marks().forEach((mark) => {
        const $pos = doc2.resolve(from - 1);
        const range = getMarkRange($pos, mark.type);
        if (!range) {
          return;
        }
        marks.push({
          mark,
          ...range
        });
      });
    } else {
      doc2.nodesBetween(from, to, (node, pos) => {
        marks.push(...node.marks.map((mark) => ({
          from: pos,
          to: pos + node.nodeSize,
          mark
        })));
      });
    }
    return marks;
  }
  function isMarkActive(state, typeOrName, attributes = {}) {
    const { empty: empty2, ranges } = state.selection;
    const type = typeOrName ? getMarkType(typeOrName, state.schema) : null;
    if (empty2) {
      return !!(state.storedMarks || state.selection.$from.marks()).filter((mark) => {
        if (!type) {
          return true;
        }
        return type.name === mark.type.name;
      }).find((mark) => objectIncludes(mark.attrs, attributes, { strict: false }));
    }
    let selectionRange = 0;
    const markRanges = [];
    ranges.forEach(({ $from, $to }) => {
      const from = $from.pos;
      const to = $to.pos;
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isText && !node.marks.length) {
          return;
        }
        const relativeFrom = Math.max(from, pos);
        const relativeTo = Math.min(to, pos + node.nodeSize);
        const range2 = relativeTo - relativeFrom;
        selectionRange += range2;
        markRanges.push(...node.marks.map((mark) => ({
          mark,
          from: relativeFrom,
          to: relativeTo
        })));
      });
    });
    if (selectionRange === 0) {
      return false;
    }
    const matchedRange = markRanges.filter((markRange) => {
      if (!type) {
        return true;
      }
      return type.name === markRange.mark.type.name;
    }).filter((markRange) => objectIncludes(markRange.mark.attrs, attributes, { strict: false })).reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
    const excludedRange = markRanges.filter((markRange) => {
      if (!type) {
        return true;
      }
      return markRange.mark.type !== type && markRange.mark.type.excludes(type);
    }).reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
    const range = matchedRange > 0 ? matchedRange + excludedRange : matchedRange;
    return range >= selectionRange;
  }
  function isActive(state, name, attributes = {}) {
    if (!name) {
      return isNodeActive(state, null, attributes) || isMarkActive(state, null, attributes);
    }
    const schemaType = getSchemaTypeNameByName(name, state.schema);
    if (schemaType === "node") {
      return isNodeActive(state, name, attributes);
    }
    if (schemaType === "mark") {
      return isMarkActive(state, name, attributes);
    }
    return false;
  }
  function isList(name, extensions2) {
    const { nodeExtensions } = splitExtensions(extensions2);
    const extension = nodeExtensions.find((item) => item.name === name);
    if (!extension) {
      return false;
    }
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage
    };
    const group = callOrReturn(getExtensionField(extension, "group", context));
    if (typeof group !== "string") {
      return false;
    }
    return group.split(" ").includes("list");
  }
  function isNodeEmpty(node) {
    var _a;
    const defaultContent = (_a = node.type.createAndFill()) === null || _a === void 0 ? void 0 : _a.toJSON();
    const content = node.toJSON();
    return JSON.stringify(defaultContent) === JSON.stringify(content);
  }
  function isNodeSelection(value) {
    return value instanceof NodeSelection;
  }
  function posToDOMRect(view, from, to) {
    const minPos = 0;
    const maxPos = view.state.doc.content.size;
    const resolvedFrom = minMax(from, minPos, maxPos);
    const resolvedEnd = minMax(to, minPos, maxPos);
    const start = view.coordsAtPos(resolvedFrom);
    const end = view.coordsAtPos(resolvedEnd, -1);
    const top = Math.min(start.top, end.top);
    const bottom = Math.max(start.bottom, end.bottom);
    const left = Math.min(start.left, end.left);
    const right = Math.max(start.right, end.right);
    const width = right - left;
    const height = bottom - top;
    const x = left;
    const y = top;
    const data = {
      top,
      bottom,
      left,
      right,
      width,
      height,
      x,
      y
    };
    return {
      ...data,
      toJSON: () => data
    };
  }
  function canSetMark(state, tr, newMarkType) {
    var _a;
    const { selection } = tr;
    let cursor = null;
    if (isTextSelection(selection)) {
      cursor = selection.$cursor;
    }
    if (cursor) {
      const currentMarks = (_a = state.storedMarks) !== null && _a !== void 0 ? _a : cursor.marks();
      return !!newMarkType.isInSet(currentMarks) || !currentMarks.some((mark) => mark.type.excludes(newMarkType));
    }
    const { ranges } = selection;
    return ranges.some(({ $from, $to }) => {
      let someNodeSupportsMark = $from.depth === 0 ? state.doc.inlineContent && state.doc.type.allowsMarkType(newMarkType) : false;
      state.doc.nodesBetween($from.pos, $to.pos, (node, _pos, parent) => {
        if (someNodeSupportsMark) {
          return false;
        }
        if (node.isInline) {
          const parentAllowsMarkType = !parent || parent.type.allowsMarkType(newMarkType);
          const currentMarksAllowMarkType = !!newMarkType.isInSet(node.marks) || !node.marks.some((otherMark) => otherMark.type.excludes(newMarkType));
          someNodeSupportsMark = parentAllowsMarkType && currentMarksAllowMarkType;
        }
        return !someNodeSupportsMark;
      });
      return someNodeSupportsMark;
    });
  }
  const setMark = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
    const { selection } = tr;
    const { empty: empty2, ranges } = selection;
    const type = getMarkType(typeOrName, state.schema);
    if (dispatch) {
      if (empty2) {
        const oldAttributes = getMarkAttributes(state, type);
        tr.addStoredMark(type.create({
          ...oldAttributes,
          ...attributes
        }));
      } else {
        ranges.forEach((range) => {
          const from = range.$from.pos;
          const to = range.$to.pos;
          state.doc.nodesBetween(from, to, (node, pos) => {
            const trimmedFrom = Math.max(pos, from);
            const trimmedTo = Math.min(pos + node.nodeSize, to);
            const someHasMark = node.marks.find((mark) => mark.type === type);
            if (someHasMark) {
              node.marks.forEach((mark) => {
                if (type === mark.type) {
                  tr.addMark(trimmedFrom, trimmedTo, type.create({
                    ...mark.attrs,
                    ...attributes
                  }));
                }
              });
            } else {
              tr.addMark(trimmedFrom, trimmedTo, type.create(attributes));
            }
          });
        });
      }
    }
    return canSetMark(state, tr, type);
  };
  const setMeta = (key, value) => ({ tr }) => {
    tr.setMeta(key, value);
    return true;
  };
  const setNode = (typeOrName, attributes = {}) => ({ state, dispatch, chain }) => {
    const type = getNodeType(typeOrName, state.schema);
    if (!type.isTextblock) {
      console.warn('[tiptap warn]: Currently "setNode()" only supports text block nodes.');
      return false;
    }
    return chain().command(({ commands: commands2 }) => {
      const canSetBlock = setBlockType(type, attributes)(state);
      if (canSetBlock) {
        return true;
      }
      return commands2.clearNodes();
    }).command(({ state: updatedState }) => {
      return setBlockType(type, attributes)(updatedState, dispatch);
    }).run();
  };
  const setNodeSelection = (position) => ({ tr, dispatch }) => {
    if (dispatch) {
      const { doc: doc2 } = tr;
      const from = minMax(position, 0, doc2.content.size);
      const selection = NodeSelection.create(doc2, from);
      tr.setSelection(selection);
    }
    return true;
  };
  const setTextSelection = (position) => ({ tr, dispatch }) => {
    if (dispatch) {
      const { doc: doc2 } = tr;
      const { from, to } = typeof position === "number" ? { from: position, to: position } : position;
      const minPos = TextSelection.atStart(doc2).from;
      const maxPos = TextSelection.atEnd(doc2).to;
      const resolvedFrom = minMax(from, minPos, maxPos);
      const resolvedEnd = minMax(to, minPos, maxPos);
      const selection = TextSelection.create(doc2, resolvedFrom, resolvedEnd);
      tr.setSelection(selection);
    }
    return true;
  };
  const sinkListItem = (typeOrName) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    return sinkListItem$1(type)(state, dispatch);
  };
  function getSplittedAttributes(extensionAttributes, typeName, attributes) {
    return Object.fromEntries(Object.entries(attributes).filter(([name]) => {
      const extensionAttribute = extensionAttributes.find((item) => {
        return item.type === typeName && item.name === name;
      });
      if (!extensionAttribute) {
        return false;
      }
      return extensionAttribute.attribute.keepOnSplit;
    }));
  }
  function ensureMarks(state, splittableMarks) {
    const marks = state.storedMarks || state.selection.$to.parentOffset && state.selection.$from.marks();
    if (marks) {
      const filteredMarks = marks.filter((mark) => splittableMarks === null || splittableMarks === void 0 ? void 0 : splittableMarks.includes(mark.type.name));
      state.tr.ensureMarks(filteredMarks);
    }
  }
  const splitBlock = ({ keepMarks = true } = {}) => ({ tr, state, dispatch, editor }) => {
    const { selection, doc: doc2 } = tr;
    const { $from, $to } = selection;
    const extensionAttributes = editor.extensionManager.attributes;
    const newAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
    if (selection instanceof NodeSelection && selection.node.isBlock) {
      if (!$from.parentOffset || !canSplit(doc2, $from.pos)) {
        return false;
      }
      if (dispatch) {
        if (keepMarks) {
          ensureMarks(state, editor.extensionManager.splittableMarks);
        }
        tr.split($from.pos).scrollIntoView();
      }
      return true;
    }
    if (!$from.parent.isBlock) {
      return false;
    }
    if (dispatch) {
      const atEnd = $to.parentOffset === $to.parent.content.size;
      if (selection instanceof TextSelection) {
        tr.deleteSelection();
      }
      const deflt = $from.depth === 0 ? void 0 : defaultBlockAt($from.node(-1).contentMatchAt($from.indexAfter(-1)));
      let types = atEnd && deflt ? [{
        type: deflt,
        attrs: newAttributes
      }] : void 0;
      let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
      if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : void 0)) {
        can = true;
        types = deflt ? [{
          type: deflt,
          attrs: newAttributes
        }] : void 0;
      }
      if (can) {
        tr.split(tr.mapping.map($from.pos), 1, types);
        if (deflt && !atEnd && !$from.parentOffset && $from.parent.type !== deflt) {
          const first2 = tr.mapping.map($from.before());
          const $first = tr.doc.resolve(first2);
          if ($from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt)) {
            tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
          }
        }
      }
      if (keepMarks) {
        ensureMarks(state, editor.extensionManager.splittableMarks);
      }
      tr.scrollIntoView();
    }
    return true;
  };
  const splitListItem = (typeOrName) => ({ tr, state, dispatch, editor }) => {
    var _a;
    const type = getNodeType(typeOrName, state.schema);
    const { $from, $to } = state.selection;
    const node = state.selection.node;
    if (node && node.isBlock || $from.depth < 2 || !$from.sameParent($to)) {
      return false;
    }
    const grandParent = $from.node(-1);
    if (grandParent.type !== type) {
      return false;
    }
    const extensionAttributes = editor.extensionManager.attributes;
    if ($from.parent.content.size === 0 && $from.node(-1).childCount === $from.indexAfter(-1)) {
      if ($from.depth === 2 || $from.node(-3).type !== type || $from.index(-2) !== $from.node(-2).childCount - 1) {
        return false;
      }
      if (dispatch) {
        let wrap2 = Fragment.empty;
        const depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;
        for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d -= 1) {
          wrap2 = Fragment.from($from.node(d).copy(wrap2));
        }
        const depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount ? 1 : $from.indexAfter(-2) < $from.node(-3).childCount ? 2 : 3;
        const newNextTypeAttributes2 = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
        const nextType2 = ((_a = type.contentMatch.defaultType) === null || _a === void 0 ? void 0 : _a.createAndFill(newNextTypeAttributes2)) || void 0;
        wrap2 = wrap2.append(Fragment.from(type.createAndFill(null, nextType2) || void 0));
        const start = $from.before($from.depth - (depthBefore - 1));
        tr.replace(start, $from.after(-depthAfter), new Slice(wrap2, 4 - depthBefore, 0));
        let sel = -1;
        tr.doc.nodesBetween(start, tr.doc.content.size, (n, pos) => {
          if (sel > -1) {
            return false;
          }
          if (n.isTextblock && n.content.size === 0) {
            sel = pos + 1;
          }
        });
        if (sel > -1) {
          tr.setSelection(TextSelection.near(tr.doc.resolve(sel)));
        }
        tr.scrollIntoView();
      }
      return true;
    }
    const nextType = $to.pos === $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
    const newTypeAttributes = getSplittedAttributes(extensionAttributes, grandParent.type.name, grandParent.attrs);
    const newNextTypeAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
    tr.delete($from.pos, $to.pos);
    const types = nextType ? [{ type, attrs: newTypeAttributes }, { type: nextType, attrs: newNextTypeAttributes }] : [{ type, attrs: newTypeAttributes }];
    if (!canSplit(tr.doc, $from.pos, 2)) {
      return false;
    }
    if (dispatch) {
      tr.split($from.pos, 2, types).scrollIntoView();
    }
    return true;
  };
  const joinListBackwards = (tr, listType) => {
    const list = findParentNode((node) => node.type === listType)(tr.selection);
    if (!list) {
      return true;
    }
    const before = tr.doc.resolve(Math.max(0, list.pos - 1)).before(list.depth);
    if (before === void 0) {
      return true;
    }
    const nodeBefore = tr.doc.nodeAt(before);
    const canJoinBackwards = list.node.type === (nodeBefore === null || nodeBefore === void 0 ? void 0 : nodeBefore.type) && canJoin(tr.doc, list.pos);
    if (!canJoinBackwards) {
      return true;
    }
    tr.join(list.pos);
    return true;
  };
  const joinListForwards = (tr, listType) => {
    const list = findParentNode((node) => node.type === listType)(tr.selection);
    if (!list) {
      return true;
    }
    const after = tr.doc.resolve(list.start).after(list.depth);
    if (after === void 0) {
      return true;
    }
    const nodeAfter = tr.doc.nodeAt(after);
    const canJoinForwards = list.node.type === (nodeAfter === null || nodeAfter === void 0 ? void 0 : nodeAfter.type) && canJoin(tr.doc, after);
    if (!canJoinForwards) {
      return true;
    }
    tr.join(after);
    return true;
  };
  const toggleList = (listTypeOrName, itemTypeOrName) => ({ editor, tr, state, dispatch, chain, commands: commands2, can }) => {
    const { extensions: extensions2 } = editor.extensionManager;
    const listType = getNodeType(listTypeOrName, state.schema);
    const itemType = getNodeType(itemTypeOrName, state.schema);
    const { selection } = state;
    const { $from, $to } = selection;
    const range = $from.blockRange($to);
    if (!range) {
      return false;
    }
    const parentList = findParentNode((node) => isList(node.type.name, extensions2))(selection);
    if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
      if (parentList.node.type === listType) {
        return commands2.liftListItem(itemType);
      }
      if (isList(parentList.node.type.name, extensions2) && listType.validContent(parentList.node.content) && dispatch) {
        return chain().command(() => {
          tr.setNodeMarkup(parentList.pos, listType);
          return true;
        }).command(() => joinListBackwards(tr, listType)).command(() => joinListForwards(tr, listType)).run();
      }
    }
    return chain().command(() => {
      const canWrapInList = can().wrapInList(listType);
      if (canWrapInList) {
        return true;
      }
      return commands2.clearNodes();
    }).wrapInList(listType).command(() => joinListBackwards(tr, listType)).command(() => joinListForwards(tr, listType)).run();
  };
  const toggleMark = (typeOrName, attributes = {}, options = {}) => ({ state, commands: commands2 }) => {
    const { extendEmptyMarkRange = false } = options;
    const type = getMarkType(typeOrName, state.schema);
    const isActive2 = isMarkActive(state, type, attributes);
    if (isActive2) {
      return commands2.unsetMark(type, { extendEmptyMarkRange });
    }
    return commands2.setMark(type, attributes);
  };
  const toggleNode = (typeOrName, toggleTypeOrName, attributes = {}) => ({ state, commands: commands2 }) => {
    const type = getNodeType(typeOrName, state.schema);
    const toggleType = getNodeType(toggleTypeOrName, state.schema);
    const isActive2 = isNodeActive(state, type, attributes);
    if (isActive2) {
      return commands2.setNode(toggleType);
    }
    return commands2.setNode(type, attributes);
  };
  const toggleWrap = (typeOrName, attributes = {}) => ({ state, commands: commands2 }) => {
    const type = getNodeType(typeOrName, state.schema);
    const isActive2 = isNodeActive(state, type, attributes);
    if (isActive2) {
      return commands2.lift(type);
    }
    return commands2.wrapIn(type, attributes);
  };
  const undoInputRule = () => ({ state, dispatch }) => {
    const plugins = state.plugins;
    for (let i2 = 0; i2 < plugins.length; i2 += 1) {
      const plugin = plugins[i2];
      let undoable;
      if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
        if (dispatch) {
          const tr = state.tr;
          const toUndo = undoable.transform;
          for (let j = toUndo.steps.length - 1; j >= 0; j -= 1) {
            tr.step(toUndo.steps[j].invert(toUndo.docs[j]));
          }
          if (undoable.text) {
            const marks = tr.doc.resolve(undoable.from).marks();
            tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks));
          } else {
            tr.delete(undoable.from, undoable.to);
          }
        }
        return true;
      }
    }
    return false;
  };
  const unsetAllMarks = () => ({ tr, dispatch }) => {
    const { selection } = tr;
    const { empty: empty2, ranges } = selection;
    if (empty2) {
      return true;
    }
    if (dispatch) {
      ranges.forEach((range) => {
        tr.removeMark(range.$from.pos, range.$to.pos);
      });
    }
    return true;
  };
  const unsetMark = (typeOrName, options = {}) => ({ tr, state, dispatch }) => {
    var _a;
    const { extendEmptyMarkRange = false } = options;
    const { selection } = tr;
    const type = getMarkType(typeOrName, state.schema);
    const { $from, empty: empty2, ranges } = selection;
    if (!dispatch) {
      return true;
    }
    if (empty2 && extendEmptyMarkRange) {
      let { from, to } = selection;
      const attrs = (_a = $from.marks().find((mark) => mark.type === type)) === null || _a === void 0 ? void 0 : _a.attrs;
      const range = getMarkRange($from, type, attrs);
      if (range) {
        from = range.from;
        to = range.to;
      }
      tr.removeMark(from, to, type);
    } else {
      ranges.forEach((range) => {
        tr.removeMark(range.$from.pos, range.$to.pos, type);
      });
    }
    tr.removeStoredMark(type);
    return true;
  };
  const updateAttributes = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
    let nodeType = null;
    let markType = null;
    const schemaType = getSchemaTypeNameByName(typeof typeOrName === "string" ? typeOrName : typeOrName.name, state.schema);
    if (!schemaType) {
      return false;
    }
    if (schemaType === "node") {
      nodeType = getNodeType(typeOrName, state.schema);
    }
    if (schemaType === "mark") {
      markType = getMarkType(typeOrName, state.schema);
    }
    if (dispatch) {
      tr.selection.ranges.forEach((range) => {
        const from = range.$from.pos;
        const to = range.$to.pos;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (nodeType && nodeType === node.type) {
            tr.setNodeMarkup(pos, void 0, {
              ...node.attrs,
              ...attributes
            });
          }
          if (markType && node.marks.length) {
            node.marks.forEach((mark) => {
              if (markType === mark.type) {
                const trimmedFrom = Math.max(pos, from);
                const trimmedTo = Math.min(pos + node.nodeSize, to);
                tr.addMark(trimmedFrom, trimmedTo, markType.create({
                  ...mark.attrs,
                  ...attributes
                }));
              }
            });
          }
        });
      });
    }
    return true;
  };
  const wrapIn = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    return wrapIn$1(type, attributes)(state, dispatch);
  };
  const wrapInList = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    return wrapInList$1(type, attributes)(state, dispatch);
  };
  var commands = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    blur,
    clearContent,
    clearNodes,
    command,
    createParagraphNear,
    deleteCurrentNode,
    deleteNode,
    deleteRange,
    deleteSelection,
    enter,
    exitCode,
    extendMarkRange,
    first,
    focus,
    forEach,
    insertContent,
    insertContentAt,
    joinUp,
    joinDown,
    joinBackward,
    joinForward,
    keyboardShortcut,
    lift,
    liftEmptyBlock,
    liftListItem,
    newlineInCode,
    resetAttributes,
    scrollIntoView,
    selectAll,
    selectNodeBackward,
    selectNodeForward,
    selectParentNode,
    selectTextblockEnd,
    selectTextblockStart,
    setContent,
    setMark,
    setMeta,
    setNode,
    setNodeSelection,
    setTextSelection,
    sinkListItem,
    splitBlock,
    splitListItem,
    toggleList,
    toggleMark,
    toggleNode,
    toggleWrap,
    undoInputRule,
    unsetAllMarks,
    unsetMark,
    updateAttributes,
    wrapIn,
    wrapInList
  });
  const Commands = Extension.create({
    name: "commands",
    addCommands() {
      return {
        ...commands
      };
    }
  });
  const Editable = Extension.create({
    name: "editable",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("editable"),
          props: {
            editable: () => this.editor.options.editable
          }
        })
      ];
    }
  });
  const FocusEvents = Extension.create({
    name: "focusEvents",
    addProseMirrorPlugins() {
      const { editor } = this;
      return [
        new Plugin({
          key: new PluginKey("focusEvents"),
          props: {
            handleDOMEvents: {
              focus: (view, event) => {
                editor.isFocused = true;
                const transaction = editor.state.tr.setMeta("focus", { event }).setMeta("addToHistory", false);
                view.dispatch(transaction);
                return false;
              },
              blur: (view, event) => {
                editor.isFocused = false;
                const transaction = editor.state.tr.setMeta("blur", { event }).setMeta("addToHistory", false);
                view.dispatch(transaction);
                return false;
              }
            }
          }
        })
      ];
    }
  });
  const Keymap = Extension.create({
    name: "keymap",
    addKeyboardShortcuts() {
      const handleBackspace = () => this.editor.commands.first(({ commands: commands2 }) => [
        () => commands2.undoInputRule(),
        () => commands2.command(({ tr }) => {
          const { selection, doc: doc2 } = tr;
          const { empty: empty2, $anchor } = selection;
          const { pos, parent } = $anchor;
          const isAtStart = Selection.atStart(doc2).from === pos;
          if (!empty2 || !isAtStart || !parent.type.isTextblock || parent.textContent.length) {
            return false;
          }
          return commands2.clearNodes();
        }),
        () => commands2.deleteSelection(),
        () => commands2.joinBackward(),
        () => commands2.selectNodeBackward()
      ]);
      const handleDelete = () => this.editor.commands.first(({ commands: commands2 }) => [
        () => commands2.deleteSelection(),
        () => commands2.deleteCurrentNode(),
        () => commands2.joinForward(),
        () => commands2.selectNodeForward()
      ]);
      const handleEnter2 = () => this.editor.commands.first(({ commands: commands2 }) => [
        () => commands2.newlineInCode(),
        () => commands2.createParagraphNear(),
        () => commands2.liftEmptyBlock(),
        () => commands2.splitBlock()
      ]);
      const baseKeymap = {
        Enter: handleEnter2,
        "Mod-Enter": () => this.editor.commands.exitCode(),
        Backspace: handleBackspace,
        "Mod-Backspace": handleBackspace,
        "Shift-Backspace": handleBackspace,
        Delete: handleDelete,
        "Mod-Delete": handleDelete,
        "Mod-a": () => this.editor.commands.selectAll()
      };
      const pcKeymap = {
        ...baseKeymap
      };
      const macKeymap = {
        ...baseKeymap,
        "Ctrl-h": handleBackspace,
        "Alt-Backspace": handleBackspace,
        "Ctrl-d": handleDelete,
        "Ctrl-Alt-Backspace": handleDelete,
        "Alt-Delete": handleDelete,
        "Alt-d": handleDelete,
        "Ctrl-a": () => this.editor.commands.selectTextblockStart(),
        "Ctrl-e": () => this.editor.commands.selectTextblockEnd()
      };
      if (isiOS() || isMacOS()) {
        return macKeymap;
      }
      return pcKeymap;
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("clearDocument"),
          appendTransaction: (transactions, oldState, newState) => {
            const docChanges = transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
            if (!docChanges) {
              return;
            }
            const { empty: empty2, from, to } = oldState.selection;
            const allFrom = Selection.atStart(oldState.doc).from;
            const allEnd = Selection.atEnd(oldState.doc).to;
            const allWasSelected = from === allFrom && to === allEnd;
            const isEmpty2 = newState.doc.textBetween(0, newState.doc.content.size, " ", " ").length === 0;
            if (empty2 || !allWasSelected || !isEmpty2) {
              return;
            }
            const tr = newState.tr;
            const state = createChainableState({
              state: newState,
              transaction: tr
            });
            const { commands: commands2 } = new CommandManager({
              editor: this.editor,
              state
            });
            commands2.clearNodes();
            if (!tr.steps.length) {
              return;
            }
            return tr;
          }
        })
      ];
    }
  });
  const Tabindex = Extension.create({
    name: "tabindex",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("tabindex"),
          props: {
            attributes: this.editor.isEditable ? { tabindex: "0" } : {}
          }
        })
      ];
    }
  });
  var extensions = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    ClipboardTextSerializer,
    Commands,
    Editable,
    FocusEvents,
    Keymap,
    Tabindex
  });
  const style = `.ProseMirror {
  position: relative;
}

.ProseMirror {
  word-wrap: break-word;
  white-space: pre-wrap;
  white-space: break-spaces;
  -webkit-font-variant-ligatures: none;
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
}

.ProseMirror [contenteditable="false"] {
  white-space: normal;
}

.ProseMirror [contenteditable="false"] [contenteditable="true"] {
  white-space: pre-wrap;
}

.ProseMirror pre {
  white-space: pre-wrap;
}

img.ProseMirror-separator {
  display: inline !important;
  border: none !important;
  margin: 0 !important;
  width: 1px !important;
  height: 1px !important;
}

.ProseMirror-gapcursor {
  display: none;
  pointer-events: none;
  position: absolute;
  margin: 0;
}

.ProseMirror-gapcursor:after {
  content: "";
  display: block;
  position: absolute;
  top: -2px;
  width: 20px;
  border-top: 1px solid black;
  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
}

@keyframes ProseMirror-cursor-blink {
  to {
    visibility: hidden;
  }
}

.ProseMirror-hideselection *::selection {
  background: transparent;
}

.ProseMirror-hideselection *::-moz-selection {
  background: transparent;
}

.ProseMirror-hideselection * {
  caret-color: transparent;
}

.ProseMirror-focused .ProseMirror-gapcursor {
  display: block;
}

.tippy-box[data-animation=fade][data-state=hidden] {
  opacity: 0
}`;
  function createStyleTag(style2, nonce) {
    const tipTapStyleTag = document.querySelector("style[data-tiptap-style]");
    if (tipTapStyleTag !== null) {
      return tipTapStyleTag;
    }
    const styleNode = document.createElement("style");
    if (nonce) {
      styleNode.setAttribute("nonce", nonce);
    }
    styleNode.setAttribute("data-tiptap-style", "");
    styleNode.innerHTML = style2;
    document.getElementsByTagName("head")[0].appendChild(styleNode);
    return styleNode;
  }
  class Editor extends EventEmitter {
    constructor(options = {}) {
      super();
      this.isFocused = false;
      this.extensionStorage = {};
      this.options = {
        element: document.createElement("div"),
        content: "",
        injectCSS: true,
        injectNonce: void 0,
        extensions: [],
        autofocus: false,
        editable: true,
        editorProps: {},
        parseOptions: {},
        enableInputRules: true,
        enablePasteRules: true,
        enableCoreExtensions: true,
        onBeforeCreate: () => null,
        onCreate: () => null,
        onUpdate: () => null,
        onSelectionUpdate: () => null,
        onTransaction: () => null,
        onFocus: () => null,
        onBlur: () => null,
        onDestroy: () => null
      };
      this.isCapturingTransaction = false;
      this.capturedTransaction = null;
      this.setOptions(options);
      this.createExtensionManager();
      this.createCommandManager();
      this.createSchema();
      this.on("beforeCreate", this.options.onBeforeCreate);
      this.emit("beforeCreate", { editor: this });
      this.createView();
      this.injectCSS();
      this.on("create", this.options.onCreate);
      this.on("update", this.options.onUpdate);
      this.on("selectionUpdate", this.options.onSelectionUpdate);
      this.on("transaction", this.options.onTransaction);
      this.on("focus", this.options.onFocus);
      this.on("blur", this.options.onBlur);
      this.on("destroy", this.options.onDestroy);
      window.setTimeout(() => {
        if (this.isDestroyed) {
          return;
        }
        this.commands.focus(this.options.autofocus);
        this.emit("create", { editor: this });
      }, 0);
    }
    get storage() {
      return this.extensionStorage;
    }
    get commands() {
      return this.commandManager.commands;
    }
    chain() {
      return this.commandManager.chain();
    }
    can() {
      return this.commandManager.can();
    }
    injectCSS() {
      if (this.options.injectCSS && document) {
        this.css = createStyleTag(style, this.options.injectNonce);
      }
    }
    setOptions(options = {}) {
      this.options = {
        ...this.options,
        ...options
      };
      if (!this.view || !this.state || this.isDestroyed) {
        return;
      }
      if (this.options.editorProps) {
        this.view.setProps(this.options.editorProps);
      }
      this.view.updateState(this.state);
    }
    setEditable(editable) {
      this.setOptions({ editable });
      this.emit("update", { editor: this, transaction: this.state.tr });
    }
    get isEditable() {
      return this.options.editable && this.view && this.view.editable;
    }
    get state() {
      return this.view.state;
    }
    registerPlugin(plugin, handlePlugins) {
      const plugins = isFunction(handlePlugins) ? handlePlugins(plugin, [...this.state.plugins]) : [...this.state.plugins, plugin];
      const state = this.state.reconfigure({ plugins });
      this.view.updateState(state);
    }
    unregisterPlugin(nameOrPluginKey) {
      if (this.isDestroyed) {
        return;
      }
      const name = typeof nameOrPluginKey === "string" ? `${nameOrPluginKey}$` : nameOrPluginKey.key;
      const state = this.state.reconfigure({
        plugins: this.state.plugins.filter((plugin) => !plugin.key.startsWith(name))
      });
      this.view.updateState(state);
    }
    createExtensionManager() {
      const coreExtensions = this.options.enableCoreExtensions ? Object.values(extensions) : [];
      const allExtensions = [...coreExtensions, ...this.options.extensions].filter((extension) => {
        return ["extension", "node", "mark"].includes(extension === null || extension === void 0 ? void 0 : extension.type);
      });
      this.extensionManager = new ExtensionManager(allExtensions, this);
    }
    createCommandManager() {
      this.commandManager = new CommandManager({
        editor: this
      });
    }
    createSchema() {
      this.schema = this.extensionManager.schema;
    }
    createView() {
      const doc2 = createDocument(this.options.content, this.schema, this.options.parseOptions);
      const selection = resolveFocusPosition(doc2, this.options.autofocus);
      this.view = new EditorView(this.options.element, {
        ...this.options.editorProps,
        dispatchTransaction: this.dispatchTransaction.bind(this),
        state: EditorState.create({
          doc: doc2,
          selection: selection || void 0
        })
      });
      const newState = this.state.reconfigure({
        plugins: this.extensionManager.plugins
      });
      this.view.updateState(newState);
      this.createNodeViews();
      const dom = this.view.dom;
      dom.editor = this;
    }
    createNodeViews() {
      this.view.setProps({
        nodeViews: this.extensionManager.nodeViews
      });
    }
    captureTransaction(fn) {
      this.isCapturingTransaction = true;
      fn();
      this.isCapturingTransaction = false;
      const tr = this.capturedTransaction;
      this.capturedTransaction = null;
      return tr;
    }
    dispatchTransaction(transaction) {
      if (this.isCapturingTransaction) {
        if (!this.capturedTransaction) {
          this.capturedTransaction = transaction;
          return;
        }
        transaction.steps.forEach((step) => {
          var _a;
          return (_a = this.capturedTransaction) === null || _a === void 0 ? void 0 : _a.step(step);
        });
        return;
      }
      const state = this.state.apply(transaction);
      const selectionHasChanged = !this.state.selection.eq(state.selection);
      this.view.updateState(state);
      this.emit("transaction", {
        editor: this,
        transaction
      });
      if (selectionHasChanged) {
        this.emit("selectionUpdate", {
          editor: this,
          transaction
        });
      }
      const focus2 = transaction.getMeta("focus");
      const blur2 = transaction.getMeta("blur");
      if (focus2) {
        this.emit("focus", {
          editor: this,
          event: focus2.event,
          transaction
        });
      }
      if (blur2) {
        this.emit("blur", {
          editor: this,
          event: blur2.event,
          transaction
        });
      }
      if (!transaction.docChanged || transaction.getMeta("preventUpdate")) {
        return;
      }
      this.emit("update", {
        editor: this,
        transaction
      });
    }
    getAttributes(nameOrType) {
      return getAttributes(this.state, nameOrType);
    }
    isActive(nameOrAttributes, attributesOrUndefined) {
      const name = typeof nameOrAttributes === "string" ? nameOrAttributes : null;
      const attributes = typeof nameOrAttributes === "string" ? attributesOrUndefined : nameOrAttributes;
      return isActive(this.state, name, attributes);
    }
    getJSON() {
      return this.state.doc.toJSON();
    }
    getHTML() {
      return getHTMLFromFragment(this.state.doc.content, this.schema);
    }
    getText(options) {
      const { blockSeparator = "\n\n", textSerializers = {} } = options || {};
      return getText(this.state.doc, {
        blockSeparator,
        textSerializers: {
          ...textSerializers,
          ...getTextSerializersFromSchema(this.schema)
        }
      });
    }
    get isEmpty() {
      return isNodeEmpty(this.state.doc);
    }
    getCharacterCount() {
      console.warn('[tiptap warn]: "editor.getCharacterCount()" is deprecated. Please use "editor.storage.characterCount.characters()" instead.');
      return this.state.doc.content.size - 2;
    }
    destroy() {
      this.emit("destroy");
      if (this.view) {
        this.view.destroy();
      }
      this.removeAllListeners();
    }
    get isDestroyed() {
      var _a;
      return !((_a = this.view) === null || _a === void 0 ? void 0 : _a.docView);
    }
  }
  function markInputRule(config) {
    return new InputRule({
      find: config.find,
      handler: ({ state, range, match }) => {
        const attributes = callOrReturn(config.getAttributes, void 0, match);
        if (attributes === false || attributes === null) {
          return null;
        }
        const { tr } = state;
        const captureGroup = match[match.length - 1];
        const fullMatch = match[0];
        let markEnd = range.to;
        if (captureGroup) {
          const startSpaces = fullMatch.search(/\S/);
          const textStart = range.from + fullMatch.indexOf(captureGroup);
          const textEnd = textStart + captureGroup.length;
          const excludedMarks = getMarksBetween(range.from, range.to, state.doc).filter((item) => {
            const excluded = item.mark.type.excluded;
            return excluded.find((type) => type === config.type && type !== item.mark.type);
          }).filter((item) => item.to > textStart);
          if (excludedMarks.length) {
            return null;
          }
          if (textEnd < range.to) {
            tr.delete(textEnd, range.to);
          }
          if (textStart > range.from) {
            tr.delete(range.from + startSpaces, textStart);
          }
          markEnd = range.from + startSpaces + captureGroup.length;
          tr.addMark(range.from + startSpaces, markEnd, config.type.create(attributes || {}));
          tr.removeStoredMark(config.type);
        }
      }
    });
  }
  class Mark {
    constructor(config = {}) {
      this.type = "mark";
      this.name = "mark";
      this.parent = null;
      this.child = null;
      this.config = {
        name: this.name,
        defaultOptions: {}
      };
      this.config = {
        ...this.config,
        ...config
      };
      this.name = this.config.name;
      if (config.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
      }
      this.options = this.config.defaultOptions;
      if (this.config.addOptions) {
        this.options = callOrReturn(getExtensionField(this, "addOptions", {
          name: this.name
        }));
      }
      this.storage = callOrReturn(getExtensionField(this, "addStorage", {
        name: this.name,
        options: this.options
      })) || {};
    }
    static create(config = {}) {
      return new Mark(config);
    }
    configure(options = {}) {
      const extension = this.extend();
      extension.options = mergeDeep(this.options, options);
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
    extend(extendedConfig = {}) {
      const extension = new Mark(extendedConfig);
      extension.parent = this;
      this.child = extension;
      extension.name = extendedConfig.name ? extendedConfig.name : extension.parent.name;
      if (extendedConfig.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
      }
      extension.options = callOrReturn(getExtensionField(extension, "addOptions", {
        name: extension.name
      }));
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
    static handleExit({ editor, mark }) {
      const { tr } = editor.state;
      const currentPos = editor.state.selection.$from;
      const isAtEnd = currentPos.pos === currentPos.end();
      if (isAtEnd) {
        const currentMarks = currentPos.marks();
        const isInMark = !!currentMarks.find((m) => (m === null || m === void 0 ? void 0 : m.type.name) === mark.name);
        if (!isInMark) {
          return false;
        }
        const removeMark2 = currentMarks.find((m) => (m === null || m === void 0 ? void 0 : m.type.name) === mark.name);
        if (removeMark2) {
          tr.removeStoredMark(removeMark2);
        }
        tr.insertText(" ", currentPos.pos);
        editor.view.dispatch(tr);
        return true;
      }
      return false;
    }
  }
  class Node {
    constructor(config = {}) {
      this.type = "node";
      this.name = "node";
      this.parent = null;
      this.child = null;
      this.config = {
        name: this.name,
        defaultOptions: {}
      };
      this.config = {
        ...this.config,
        ...config
      };
      this.name = this.config.name;
      if (config.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
      }
      this.options = this.config.defaultOptions;
      if (this.config.addOptions) {
        this.options = callOrReturn(getExtensionField(this, "addOptions", {
          name: this.name
        }));
      }
      this.storage = callOrReturn(getExtensionField(this, "addStorage", {
        name: this.name,
        options: this.options
      })) || {};
    }
    static create(config = {}) {
      return new Node(config);
    }
    configure(options = {}) {
      const extension = this.extend();
      extension.options = mergeDeep(this.options, options);
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
    extend(extendedConfig = {}) {
      const extension = new Node(extendedConfig);
      extension.parent = this;
      this.child = extension;
      extension.name = extendedConfig.name ? extendedConfig.name : extension.parent.name;
      if (extendedConfig.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
      }
      extension.options = callOrReturn(getExtensionField(extension, "addOptions", {
        name: extension.name
      }));
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
  }
  function markPasteRule(config) {
    return new PasteRule({
      find: config.find,
      handler: ({ state, range, match }) => {
        const attributes = callOrReturn(config.getAttributes, void 0, match);
        if (attributes === false || attributes === null) {
          return null;
        }
        const { tr } = state;
        const captureGroup = match[match.length - 1];
        const fullMatch = match[0];
        let markEnd = range.to;
        if (captureGroup) {
          const startSpaces = fullMatch.search(/\S/);
          const textStart = range.from + fullMatch.indexOf(captureGroup);
          const textEnd = textStart + captureGroup.length;
          const excludedMarks = getMarksBetween(range.from, range.to, state.doc).filter((item) => {
            const excluded = item.mark.type.excluded;
            return excluded.find((type) => type === config.type && type !== item.mark.type);
          }).filter((item) => item.to > textStart);
          if (excludedMarks.length) {
            return null;
          }
          if (textEnd < range.to) {
            tr.delete(textEnd, range.to);
          }
          if (textStart > range.from) {
            tr.delete(range.from + startSpaces, textStart);
          }
          markEnd = range.from + startSpaces + captureGroup.length;
          tr.addMark(range.from + startSpaces, markEnd, config.type.create(attributes || {}));
          tr.removeStoredMark(config.type);
        }
      }
    });
  }
  const starInputRegex$1 = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/;
  const starPasteRegex$1 = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g;
  const underscoreInputRegex$1 = /(?:^|\s)((?:__)((?:[^__]+))(?:__))$/;
  const underscorePasteRegex$1 = /(?:^|\s)((?:__)((?:[^__]+))(?:__))/g;
  const Bold = Mark.create({
    name: "bold",
    addOptions() {
      return {
        HTMLAttributes: {}
      };
    },
    parseHTML() {
      return [
        {
          tag: "strong"
        },
        {
          tag: "b",
          getAttrs: (node) => node.style.fontWeight !== "normal" && null
        },
        {
          style: "font-weight",
          getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null
        }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["strong", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
    addCommands() {
      return {
        setBold: () => ({ commands: commands2 }) => {
          return commands2.setMark(this.name);
        },
        toggleBold: () => ({ commands: commands2 }) => {
          return commands2.toggleMark(this.name);
        },
        unsetBold: () => ({ commands: commands2 }) => {
          return commands2.unsetMark(this.name);
        }
      };
    },
    addKeyboardShortcuts() {
      return {
        "Mod-b": () => this.editor.commands.toggleBold(),
        "Mod-B": () => this.editor.commands.toggleBold()
      };
    },
    addInputRules() {
      return [
        markInputRule({
          find: starInputRegex$1,
          type: this.type
        }),
        markInputRule({
          find: underscoreInputRegex$1,
          type: this.type
        })
      ];
    },
    addPasteRules() {
      return [
        markPasteRule({
          find: starPasteRegex$1,
          type: this.type
        }),
        markPasteRule({
          find: underscorePasteRegex$1,
          type: this.type
        })
      ];
    }
  });
  const inputRegex$1 = /(?:^|\s)((?:`)((?:[^`]+))(?:`))$/;
  const pasteRegex$1 = /(?:^|\s)((?:`)((?:[^`]+))(?:`))/g;
  const Code = Mark.create({
    name: "code",
    addOptions() {
      return {
        HTMLAttributes: {}
      };
    },
    excludes: "_",
    code: true,
    exitable: true,
    parseHTML() {
      return [
        { tag: "code" }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["code", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
    addCommands() {
      return {
        setCode: () => ({ commands: commands2 }) => {
          return commands2.setMark(this.name);
        },
        toggleCode: () => ({ commands: commands2 }) => {
          return commands2.toggleMark(this.name);
        },
        unsetCode: () => ({ commands: commands2 }) => {
          return commands2.unsetMark(this.name);
        }
      };
    },
    addKeyboardShortcuts() {
      return {
        "Mod-e": () => this.editor.commands.toggleCode()
      };
    },
    addInputRules() {
      return [
        markInputRule({
          find: inputRegex$1,
          type: this.type
        })
      ];
    },
    addPasteRules() {
      return [
        markPasteRule({
          find: pasteRegex$1,
          type: this.type
        })
      ];
    }
  });
  function dropCursor(options = {}) {
    return new Plugin({
      view(editorView) {
        return new DropCursorView(editorView, options);
      }
    });
  }
  class DropCursorView {
    constructor(editorView, options) {
      this.editorView = editorView;
      this.cursorPos = null;
      this.element = null;
      this.timeout = -1;
      this.width = options.width || 1;
      this.color = options.color || "black";
      this.class = options.class;
      this.handlers = ["dragover", "dragend", "drop", "dragleave"].map((name) => {
        let handler = (e) => {
          this[name](e);
        };
        editorView.dom.addEventListener(name, handler);
        return { name, handler };
      });
    }
    destroy() {
      this.handlers.forEach(({ name, handler }) => this.editorView.dom.removeEventListener(name, handler));
    }
    update(editorView, prevState) {
      if (this.cursorPos != null && prevState.doc != editorView.state.doc) {
        if (this.cursorPos > editorView.state.doc.content.size)
          this.setCursor(null);
        else
          this.updateOverlay();
      }
    }
    setCursor(pos) {
      if (pos == this.cursorPos)
        return;
      this.cursorPos = pos;
      if (pos == null) {
        this.element.parentNode.removeChild(this.element);
        this.element = null;
      } else {
        this.updateOverlay();
      }
    }
    updateOverlay() {
      let $pos = this.editorView.state.doc.resolve(this.cursorPos), rect;
      if (!$pos.parent.inlineContent) {
        let before = $pos.nodeBefore, after = $pos.nodeAfter;
        if (before || after) {
          let nodeRect = this.editorView.nodeDOM(this.cursorPos - (before ? before.nodeSize : 0)).getBoundingClientRect();
          let top = before ? nodeRect.bottom : nodeRect.top;
          if (before && after)
            top = (top + this.editorView.nodeDOM(this.cursorPos).getBoundingClientRect().top) / 2;
          rect = { left: nodeRect.left, right: nodeRect.right, top: top - this.width / 2, bottom: top + this.width / 2 };
        }
      }
      if (!rect) {
        let coords = this.editorView.coordsAtPos(this.cursorPos);
        rect = { left: coords.left - this.width / 2, right: coords.left + this.width / 2, top: coords.top, bottom: coords.bottom };
      }
      let parent = this.editorView.dom.offsetParent;
      if (!this.element) {
        this.element = parent.appendChild(document.createElement("div"));
        if (this.class)
          this.element.className = this.class;
        this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none; background-color: " + this.color;
      }
      let parentLeft, parentTop;
      if (!parent || parent == document.body && getComputedStyle(parent).position == "static") {
        parentLeft = -pageXOffset;
        parentTop = -pageYOffset;
      } else {
        let rect2 = parent.getBoundingClientRect();
        parentLeft = rect2.left - parent.scrollLeft;
        parentTop = rect2.top - parent.scrollTop;
      }
      this.element.style.left = rect.left - parentLeft + "px";
      this.element.style.top = rect.top - parentTop + "px";
      this.element.style.width = rect.right - rect.left + "px";
      this.element.style.height = rect.bottom - rect.top + "px";
    }
    scheduleRemoval(timeout) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.setCursor(null), timeout);
    }
    dragover(event) {
      if (!this.editorView.editable)
        return;
      let pos = this.editorView.posAtCoords({ left: event.clientX, top: event.clientY });
      let node = pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
      let disableDropCursor = node && node.type.spec.disableDropCursor;
      let disabled = typeof disableDropCursor == "function" ? disableDropCursor(this.editorView, pos) : disableDropCursor;
      if (pos && !disabled) {
        let target = pos.pos;
        if (this.editorView.dragging && this.editorView.dragging.slice) {
          target = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
          if (target == null)
            return this.setCursor(null);
        }
        this.setCursor(target);
        this.scheduleRemoval(5e3);
      }
    }
    dragend() {
      this.scheduleRemoval(20);
    }
    drop() {
      this.scheduleRemoval(20);
    }
    dragleave(event) {
      if (event.target == this.editorView.dom || !this.editorView.dom.contains(event.relatedTarget))
        this.setCursor(null);
    }
  }
  const Dropcursor = Extension.create({
    name: "dropCursor",
    addOptions() {
      return {
        color: "currentColor",
        width: 1,
        class: void 0
      };
    },
    addProseMirrorPlugins() {
      return [
        dropCursor(this.options)
      ];
    }
  });
  class GapCursor extends Selection {
    constructor($pos) {
      super($pos, $pos);
    }
    map(doc2, mapping) {
      let $pos = doc2.resolve(mapping.map(this.head));
      return GapCursor.valid($pos) ? new GapCursor($pos) : Selection.near($pos);
    }
    content() {
      return Slice.empty;
    }
    eq(other) {
      return other instanceof GapCursor && other.head == this.head;
    }
    toJSON() {
      return { type: "gapcursor", pos: this.head };
    }
    static fromJSON(doc2, json) {
      if (typeof json.pos != "number")
        throw new RangeError("Invalid input for GapCursor.fromJSON");
      return new GapCursor(doc2.resolve(json.pos));
    }
    getBookmark() {
      return new GapBookmark(this.anchor);
    }
    static valid($pos) {
      let parent = $pos.parent;
      if (parent.isTextblock || !closedBefore($pos) || !closedAfter($pos))
        return false;
      let override = parent.type.spec.allowGapCursor;
      if (override != null)
        return override;
      let deflt = parent.contentMatchAt($pos.index()).defaultType;
      return deflt && deflt.isTextblock;
    }
    static findGapCursorFrom($pos, dir, mustMove = false) {
      search:
        for (; ; ) {
          if (!mustMove && GapCursor.valid($pos))
            return $pos;
          let pos = $pos.pos, next = null;
          for (let d = $pos.depth; ; d--) {
            let parent = $pos.node(d);
            if (dir > 0 ? $pos.indexAfter(d) < parent.childCount : $pos.index(d) > 0) {
              next = parent.child(dir > 0 ? $pos.indexAfter(d) : $pos.index(d) - 1);
              break;
            } else if (d == 0) {
              return null;
            }
            pos += dir;
            let $cur = $pos.doc.resolve(pos);
            if (GapCursor.valid($cur))
              return $cur;
          }
          for (; ; ) {
            let inside = dir > 0 ? next.firstChild : next.lastChild;
            if (!inside) {
              if (next.isAtom && !next.isText && !NodeSelection.isSelectable(next)) {
                $pos = $pos.doc.resolve(pos + next.nodeSize * dir);
                mustMove = false;
                continue search;
              }
              break;
            }
            next = inside;
            pos += dir;
            let $cur = $pos.doc.resolve(pos);
            if (GapCursor.valid($cur))
              return $cur;
          }
          return null;
        }
    }
  }
  GapCursor.prototype.visible = false;
  GapCursor.findFrom = GapCursor.findGapCursorFrom;
  Selection.jsonID("gapcursor", GapCursor);
  class GapBookmark {
    constructor(pos) {
      this.pos = pos;
    }
    map(mapping) {
      return new GapBookmark(mapping.map(this.pos));
    }
    resolve(doc2) {
      let $pos = doc2.resolve(this.pos);
      return GapCursor.valid($pos) ? new GapCursor($pos) : Selection.near($pos);
    }
  }
  function closedBefore($pos) {
    for (let d = $pos.depth; d >= 0; d--) {
      let index = $pos.index(d), parent = $pos.node(d);
      if (index == 0) {
        if (parent.type.spec.isolating)
          return true;
        continue;
      }
      for (let before = parent.child(index - 1); ; before = before.lastChild) {
        if (before.childCount == 0 && !before.inlineContent || before.isAtom || before.type.spec.isolating)
          return true;
        if (before.inlineContent)
          return false;
      }
    }
    return true;
  }
  function closedAfter($pos) {
    for (let d = $pos.depth; d >= 0; d--) {
      let index = $pos.indexAfter(d), parent = $pos.node(d);
      if (index == parent.childCount) {
        if (parent.type.spec.isolating)
          return true;
        continue;
      }
      for (let after = parent.child(index); ; after = after.firstChild) {
        if (after.childCount == 0 && !after.inlineContent || after.isAtom || after.type.spec.isolating)
          return true;
        if (after.inlineContent)
          return false;
      }
    }
    return true;
  }
  function gapCursor() {
    return new Plugin({
      props: {
        decorations: drawGapCursor,
        createSelectionBetween(_view, $anchor, $head) {
          return $anchor.pos == $head.pos && GapCursor.valid($head) ? new GapCursor($head) : null;
        },
        handleClick,
        handleKeyDown,
        handleDOMEvents: { beforeinput }
      }
    });
  }
  const handleKeyDown = keydownHandler({
    "ArrowLeft": arrow("horiz", -1),
    "ArrowRight": arrow("horiz", 1),
    "ArrowUp": arrow("vert", -1),
    "ArrowDown": arrow("vert", 1)
  });
  function arrow(axis, dir) {
    const dirStr = axis == "vert" ? dir > 0 ? "down" : "up" : dir > 0 ? "right" : "left";
    return function(state, dispatch, view) {
      let sel = state.selection;
      let $start = dir > 0 ? sel.$to : sel.$from, mustMove = sel.empty;
      if (sel instanceof TextSelection) {
        if (!view.endOfTextblock(dirStr) || $start.depth == 0)
          return false;
        mustMove = false;
        $start = state.doc.resolve(dir > 0 ? $start.after() : $start.before());
      }
      let $found = GapCursor.findGapCursorFrom($start, dir, mustMove);
      if (!$found)
        return false;
      if (dispatch)
        dispatch(state.tr.setSelection(new GapCursor($found)));
      return true;
    };
  }
  function handleClick(view, pos, event) {
    if (!view || !view.editable)
      return false;
    let $pos = view.state.doc.resolve(pos);
    if (!GapCursor.valid($pos))
      return false;
    let clickPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (clickPos && clickPos.inside > -1 && NodeSelection.isSelectable(view.state.doc.nodeAt(clickPos.inside)))
      return false;
    view.dispatch(view.state.tr.setSelection(new GapCursor($pos)));
    return true;
  }
  function beforeinput(view, event) {
    if (event.inputType != "insertCompositionText" || !(view.state.selection instanceof GapCursor))
      return false;
    let { $from } = view.state.selection;
    let insert = $from.parent.contentMatchAt($from.index()).findWrapping(view.state.schema.nodes.text);
    if (!insert)
      return false;
    let frag = Fragment.empty;
    for (let i2 = insert.length - 1; i2 >= 0; i2--)
      frag = Fragment.from(insert[i2].createAndFill(null, frag));
    let tr = view.state.tr.replace($from.pos, $from.pos, new Slice(frag, 0, 0));
    tr.setSelection(TextSelection.near(tr.doc.resolve($from.pos + 1)));
    view.dispatch(tr);
    return false;
  }
  function drawGapCursor(state) {
    if (!(state.selection instanceof GapCursor))
      return null;
    let node = document.createElement("div");
    node.className = "ProseMirror-gapcursor";
    return DecorationSet.create(state.doc, [Decoration.widget(state.selection.head, node, { key: "gapcursor" })]);
  }
  const Gapcursor = Extension.create({
    name: "gapCursor",
    addProseMirrorPlugins() {
      return [
        gapCursor()
      ];
    },
    extendNodeSchema(extension) {
      var _a;
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage
      };
      return {
        allowGapCursor: (_a = callOrReturn(getExtensionField(extension, "allowGapCursor", context))) !== null && _a !== void 0 ? _a : null
      };
    }
  });
  const HardBreak = Node.create({
    name: "hardBreak",
    addOptions() {
      return {
        keepMarks: true,
        HTMLAttributes: {}
      };
    },
    inline: true,
    group: "inline",
    selectable: false,
    parseHTML() {
      return [
        { tag: "br" }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["br", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },
    renderText() {
      return "\n";
    },
    addCommands() {
      return {
        setHardBreak: () => ({ commands: commands2, chain, state, editor }) => {
          return commands2.first([
            () => commands2.exitCode(),
            () => commands2.command(() => {
              const { selection, storedMarks } = state;
              if (selection.$from.parent.type.spec.isolating) {
                return false;
              }
              const { keepMarks } = this.options;
              const { splittableMarks } = editor.extensionManager;
              const marks = storedMarks || selection.$to.parentOffset && selection.$from.marks();
              return chain().insertContent({ type: this.name }).command(({ tr, dispatch }) => {
                if (dispatch && marks && keepMarks) {
                  const filteredMarks = marks.filter((mark) => splittableMarks.includes(mark.type.name));
                  tr.ensureMarks(filteredMarks);
                }
                return true;
              }).run();
            })
          ]);
        }
      };
    },
    addKeyboardShortcuts() {
      return {
        "Mod-Enter": () => this.editor.commands.setHardBreak(),
        "Shift-Enter": () => this.editor.commands.setHardBreak()
      };
    }
  });
  var GOOD_LEAF_SIZE = 200;
  var RopeSequence = function RopeSequence2() {
  };
  RopeSequence.prototype.append = function append(other) {
    if (!other.length) {
      return this;
    }
    other = RopeSequence.from(other);
    return !this.length && other || other.length < GOOD_LEAF_SIZE && this.leafAppend(other) || this.length < GOOD_LEAF_SIZE && other.leafPrepend(this) || this.appendInner(other);
  };
  RopeSequence.prototype.prepend = function prepend(other) {
    if (!other.length) {
      return this;
    }
    return RopeSequence.from(other).append(this);
  };
  RopeSequence.prototype.appendInner = function appendInner(other) {
    return new Append(this, other);
  };
  RopeSequence.prototype.slice = function slice(from, to) {
    if (from === void 0)
      from = 0;
    if (to === void 0)
      to = this.length;
    if (from >= to) {
      return RopeSequence.empty;
    }
    return this.sliceInner(Math.max(0, from), Math.min(this.length, to));
  };
  RopeSequence.prototype.get = function get(i2) {
    if (i2 < 0 || i2 >= this.length) {
      return void 0;
    }
    return this.getInner(i2);
  };
  RopeSequence.prototype.forEach = function forEach2(f, from, to) {
    if (from === void 0)
      from = 0;
    if (to === void 0)
      to = this.length;
    if (from <= to) {
      this.forEachInner(f, from, to, 0);
    } else {
      this.forEachInvertedInner(f, from, to, 0);
    }
  };
  RopeSequence.prototype.map = function map(f, from, to) {
    if (from === void 0)
      from = 0;
    if (to === void 0)
      to = this.length;
    var result = [];
    this.forEach(function(elt, i2) {
      return result.push(f(elt, i2));
    }, from, to);
    return result;
  };
  RopeSequence.from = function from(values) {
    if (values instanceof RopeSequence) {
      return values;
    }
    return values && values.length ? new Leaf(values) : RopeSequence.empty;
  };
  var Leaf = /* @__PURE__ */ function(RopeSequence2) {
    function Leaf2(values) {
      RopeSequence2.call(this);
      this.values = values;
    }
    if (RopeSequence2)
      Leaf2.__proto__ = RopeSequence2;
    Leaf2.prototype = Object.create(RopeSequence2 && RopeSequence2.prototype);
    Leaf2.prototype.constructor = Leaf2;
    var prototypeAccessors = { length: { configurable: true }, depth: { configurable: true } };
    Leaf2.prototype.flatten = function flatten() {
      return this.values;
    };
    Leaf2.prototype.sliceInner = function sliceInner(from, to) {
      if (from == 0 && to == this.length) {
        return this;
      }
      return new Leaf2(this.values.slice(from, to));
    };
    Leaf2.prototype.getInner = function getInner(i2) {
      return this.values[i2];
    };
    Leaf2.prototype.forEachInner = function forEachInner(f, from, to, start) {
      for (var i2 = from; i2 < to; i2++) {
        if (f(this.values[i2], start + i2) === false) {
          return false;
        }
      }
    };
    Leaf2.prototype.forEachInvertedInner = function forEachInvertedInner(f, from, to, start) {
      for (var i2 = from - 1; i2 >= to; i2--) {
        if (f(this.values[i2], start + i2) === false) {
          return false;
        }
      }
    };
    Leaf2.prototype.leafAppend = function leafAppend(other) {
      if (this.length + other.length <= GOOD_LEAF_SIZE) {
        return new Leaf2(this.values.concat(other.flatten()));
      }
    };
    Leaf2.prototype.leafPrepend = function leafPrepend(other) {
      if (this.length + other.length <= GOOD_LEAF_SIZE) {
        return new Leaf2(other.flatten().concat(this.values));
      }
    };
    prototypeAccessors.length.get = function() {
      return this.values.length;
    };
    prototypeAccessors.depth.get = function() {
      return 0;
    };
    Object.defineProperties(Leaf2.prototype, prototypeAccessors);
    return Leaf2;
  }(RopeSequence);
  RopeSequence.empty = new Leaf([]);
  var Append = /* @__PURE__ */ function(RopeSequence2) {
    function Append2(left, right) {
      RopeSequence2.call(this);
      this.left = left;
      this.right = right;
      this.length = left.length + right.length;
      this.depth = Math.max(left.depth, right.depth) + 1;
    }
    if (RopeSequence2)
      Append2.__proto__ = RopeSequence2;
    Append2.prototype = Object.create(RopeSequence2 && RopeSequence2.prototype);
    Append2.prototype.constructor = Append2;
    Append2.prototype.flatten = function flatten() {
      return this.left.flatten().concat(this.right.flatten());
    };
    Append2.prototype.getInner = function getInner(i2) {
      return i2 < this.left.length ? this.left.get(i2) : this.right.get(i2 - this.left.length);
    };
    Append2.prototype.forEachInner = function forEachInner(f, from, to, start) {
      var leftLen = this.left.length;
      if (from < leftLen && this.left.forEachInner(f, from, Math.min(to, leftLen), start) === false) {
        return false;
      }
      if (to > leftLen && this.right.forEachInner(f, Math.max(from - leftLen, 0), Math.min(this.length, to) - leftLen, start + leftLen) === false) {
        return false;
      }
    };
    Append2.prototype.forEachInvertedInner = function forEachInvertedInner(f, from, to, start) {
      var leftLen = this.left.length;
      if (from > leftLen && this.right.forEachInvertedInner(f, from - leftLen, Math.max(to, leftLen) - leftLen, start + leftLen) === false) {
        return false;
      }
      if (to < leftLen && this.left.forEachInvertedInner(f, Math.min(from, leftLen), to, start) === false) {
        return false;
      }
    };
    Append2.prototype.sliceInner = function sliceInner(from, to) {
      if (from == 0 && to == this.length) {
        return this;
      }
      var leftLen = this.left.length;
      if (to <= leftLen) {
        return this.left.slice(from, to);
      }
      if (from >= leftLen) {
        return this.right.slice(from - leftLen, to - leftLen);
      }
      return this.left.slice(from, leftLen).append(this.right.slice(0, to - leftLen));
    };
    Append2.prototype.leafAppend = function leafAppend(other) {
      var inner = this.right.leafAppend(other);
      if (inner) {
        return new Append2(this.left, inner);
      }
    };
    Append2.prototype.leafPrepend = function leafPrepend(other) {
      var inner = this.left.leafPrepend(other);
      if (inner) {
        return new Append2(inner, this.right);
      }
    };
    Append2.prototype.appendInner = function appendInner(other) {
      if (this.left.depth >= Math.max(this.right.depth, other.depth) + 1) {
        return new Append2(this.left, new Append2(this.right, other));
      }
      return new Append2(this, other);
    };
    return Append2;
  }(RopeSequence);
  var ropeSequence = RopeSequence;
  const max_empty_items = 500;
  class Branch {
    constructor(items, eventCount) {
      this.items = items;
      this.eventCount = eventCount;
    }
    popEvent(state, preserveItems) {
      if (this.eventCount == 0)
        return null;
      let end = this.items.length;
      for (; ; end--) {
        let next = this.items.get(end - 1);
        if (next.selection) {
          --end;
          break;
        }
      }
      let remap, mapFrom;
      if (preserveItems) {
        remap = this.remapping(end, this.items.length);
        mapFrom = remap.maps.length;
      }
      let transform = state.tr;
      let selection, remaining;
      let addAfter = [], addBefore = [];
      this.items.forEach((item, i2) => {
        if (!item.step) {
          if (!remap) {
            remap = this.remapping(end, i2 + 1);
            mapFrom = remap.maps.length;
          }
          mapFrom--;
          addBefore.push(item);
          return;
        }
        if (remap) {
          addBefore.push(new Item(item.map));
          let step = item.step.map(remap.slice(mapFrom)), map;
          if (step && transform.maybeStep(step).doc) {
            map = transform.mapping.maps[transform.mapping.maps.length - 1];
            addAfter.push(new Item(map, void 0, void 0, addAfter.length + addBefore.length));
          }
          mapFrom--;
          if (map)
            remap.appendMap(map, mapFrom);
        } else {
          transform.maybeStep(item.step);
        }
        if (item.selection) {
          selection = remap ? item.selection.map(remap.slice(mapFrom)) : item.selection;
          remaining = new Branch(this.items.slice(0, end).append(addBefore.reverse().concat(addAfter)), this.eventCount - 1);
          return false;
        }
      }, this.items.length, 0);
      return { remaining, transform, selection };
    }
    addTransform(transform, selection, histOptions, preserveItems) {
      let newItems = [], eventCount = this.eventCount;
      let oldItems = this.items, lastItem = !preserveItems && oldItems.length ? oldItems.get(oldItems.length - 1) : null;
      for (let i2 = 0; i2 < transform.steps.length; i2++) {
        let step = transform.steps[i2].invert(transform.docs[i2]);
        let item = new Item(transform.mapping.maps[i2], step, selection), merged;
        if (merged = lastItem && lastItem.merge(item)) {
          item = merged;
          if (i2)
            newItems.pop();
          else
            oldItems = oldItems.slice(0, oldItems.length - 1);
        }
        newItems.push(item);
        if (selection) {
          eventCount++;
          selection = void 0;
        }
        if (!preserveItems)
          lastItem = item;
      }
      let overflow = eventCount - histOptions.depth;
      if (overflow > DEPTH_OVERFLOW) {
        oldItems = cutOffEvents(oldItems, overflow);
        eventCount -= overflow;
      }
      return new Branch(oldItems.append(newItems), eventCount);
    }
    remapping(from, to) {
      let maps = new Mapping();
      this.items.forEach((item, i2) => {
        let mirrorPos = item.mirrorOffset != null && i2 - item.mirrorOffset >= from ? maps.maps.length - item.mirrorOffset : void 0;
        maps.appendMap(item.map, mirrorPos);
      }, from, to);
      return maps;
    }
    addMaps(array) {
      if (this.eventCount == 0)
        return this;
      return new Branch(this.items.append(array.map((map) => new Item(map))), this.eventCount);
    }
    rebased(rebasedTransform, rebasedCount) {
      if (!this.eventCount)
        return this;
      let rebasedItems = [], start = Math.max(0, this.items.length - rebasedCount);
      let mapping = rebasedTransform.mapping;
      let newUntil = rebasedTransform.steps.length;
      let eventCount = this.eventCount;
      this.items.forEach((item) => {
        if (item.selection)
          eventCount--;
      }, start);
      let iRebased = rebasedCount;
      this.items.forEach((item) => {
        let pos = mapping.getMirror(--iRebased);
        if (pos == null)
          return;
        newUntil = Math.min(newUntil, pos);
        let map = mapping.maps[pos];
        if (item.step) {
          let step = rebasedTransform.steps[pos].invert(rebasedTransform.docs[pos]);
          let selection = item.selection && item.selection.map(mapping.slice(iRebased + 1, pos));
          if (selection)
            eventCount++;
          rebasedItems.push(new Item(map, step, selection));
        } else {
          rebasedItems.push(new Item(map));
        }
      }, start);
      let newMaps = [];
      for (let i2 = rebasedCount; i2 < newUntil; i2++)
        newMaps.push(new Item(mapping.maps[i2]));
      let items = this.items.slice(0, start).append(newMaps).append(rebasedItems);
      let branch = new Branch(items, eventCount);
      if (branch.emptyItemCount() > max_empty_items)
        branch = branch.compress(this.items.length - rebasedItems.length);
      return branch;
    }
    emptyItemCount() {
      let count = 0;
      this.items.forEach((item) => {
        if (!item.step)
          count++;
      });
      return count;
    }
    compress(upto = this.items.length) {
      let remap = this.remapping(0, upto), mapFrom = remap.maps.length;
      let items = [], events = 0;
      this.items.forEach((item, i2) => {
        if (i2 >= upto) {
          items.push(item);
          if (item.selection)
            events++;
        } else if (item.step) {
          let step = item.step.map(remap.slice(mapFrom)), map = step && step.getMap();
          mapFrom--;
          if (map)
            remap.appendMap(map, mapFrom);
          if (step) {
            let selection = item.selection && item.selection.map(remap.slice(mapFrom));
            if (selection)
              events++;
            let newItem = new Item(map.invert(), step, selection), merged, last = items.length - 1;
            if (merged = items.length && items[last].merge(newItem))
              items[last] = merged;
            else
              items.push(newItem);
          }
        } else if (item.map) {
          mapFrom--;
        }
      }, this.items.length, 0);
      return new Branch(ropeSequence.from(items.reverse()), events);
    }
  }
  Branch.empty = new Branch(ropeSequence.empty, 0);
  function cutOffEvents(items, n) {
    let cutPoint;
    items.forEach((item, i2) => {
      if (item.selection && n-- == 0) {
        cutPoint = i2;
        return false;
      }
    });
    return items.slice(cutPoint);
  }
  class Item {
    constructor(map, step, selection, mirrorOffset) {
      this.map = map;
      this.step = step;
      this.selection = selection;
      this.mirrorOffset = mirrorOffset;
    }
    merge(other) {
      if (this.step && other.step && !other.selection) {
        let step = other.step.merge(this.step);
        if (step)
          return new Item(step.getMap().invert(), step, this.selection);
      }
    }
  }
  class HistoryState {
    constructor(done, undone, prevRanges, prevTime) {
      this.done = done;
      this.undone = undone;
      this.prevRanges = prevRanges;
      this.prevTime = prevTime;
    }
  }
  const DEPTH_OVERFLOW = 20;
  function applyTransaction(history2, state, tr, options) {
    let historyTr = tr.getMeta(historyKey), rebased;
    if (historyTr)
      return historyTr.historyState;
    if (tr.getMeta(closeHistoryKey))
      history2 = new HistoryState(history2.done, history2.undone, null, 0);
    let appended = tr.getMeta("appendedTransaction");
    if (tr.steps.length == 0) {
      return history2;
    } else if (appended && appended.getMeta(historyKey)) {
      if (appended.getMeta(historyKey).redo)
        return new HistoryState(history2.done.addTransform(tr, void 0, options, mustPreserveItems(state)), history2.undone, rangesFor(tr.mapping.maps[tr.steps.length - 1]), history2.prevTime);
      else
        return new HistoryState(history2.done, history2.undone.addTransform(tr, void 0, options, mustPreserveItems(state)), null, history2.prevTime);
    } else if (tr.getMeta("addToHistory") !== false && !(appended && appended.getMeta("addToHistory") === false)) {
      let newGroup = history2.prevTime == 0 || !appended && (history2.prevTime < (tr.time || 0) - options.newGroupDelay || !isAdjacentTo(tr, history2.prevRanges));
      let prevRanges = appended ? mapRanges(history2.prevRanges, tr.mapping) : rangesFor(tr.mapping.maps[tr.steps.length - 1]);
      return new HistoryState(history2.done.addTransform(tr, newGroup ? state.selection.getBookmark() : void 0, options, mustPreserveItems(state)), Branch.empty, prevRanges, tr.time);
    } else if (rebased = tr.getMeta("rebased")) {
      return new HistoryState(history2.done.rebased(tr, rebased), history2.undone.rebased(tr, rebased), mapRanges(history2.prevRanges, tr.mapping), history2.prevTime);
    } else {
      return new HistoryState(history2.done.addMaps(tr.mapping.maps), history2.undone.addMaps(tr.mapping.maps), mapRanges(history2.prevRanges, tr.mapping), history2.prevTime);
    }
  }
  function isAdjacentTo(transform, prevRanges) {
    if (!prevRanges)
      return false;
    if (!transform.docChanged)
      return true;
    let adjacent = false;
    transform.mapping.maps[0].forEach((start, end) => {
      for (let i2 = 0; i2 < prevRanges.length; i2 += 2)
        if (start <= prevRanges[i2 + 1] && end >= prevRanges[i2])
          adjacent = true;
    });
    return adjacent;
  }
  function rangesFor(map) {
    let result = [];
    map.forEach((_from, _to, from, to) => result.push(from, to));
    return result;
  }
  function mapRanges(ranges, mapping) {
    if (!ranges)
      return null;
    let result = [];
    for (let i2 = 0; i2 < ranges.length; i2 += 2) {
      let from = mapping.map(ranges[i2], 1), to = mapping.map(ranges[i2 + 1], -1);
      if (from <= to)
        result.push(from, to);
    }
    return result;
  }
  function histTransaction(history2, state, dispatch, redo2) {
    let preserveItems = mustPreserveItems(state);
    let histOptions = historyKey.get(state).spec.config;
    let pop = (redo2 ? history2.undone : history2.done).popEvent(state, preserveItems);
    if (!pop)
      return;
    let selection = pop.selection.resolve(pop.transform.doc);
    let added = (redo2 ? history2.done : history2.undone).addTransform(pop.transform, state.selection.getBookmark(), histOptions, preserveItems);
    let newHist = new HistoryState(redo2 ? added : pop.remaining, redo2 ? pop.remaining : added, null, 0);
    dispatch(pop.transform.setSelection(selection).setMeta(historyKey, { redo: redo2, historyState: newHist }).scrollIntoView());
  }
  let cachedPreserveItems = false, cachedPreserveItemsPlugins = null;
  function mustPreserveItems(state) {
    let plugins = state.plugins;
    if (cachedPreserveItemsPlugins != plugins) {
      cachedPreserveItems = false;
      cachedPreserveItemsPlugins = plugins;
      for (let i2 = 0; i2 < plugins.length; i2++)
        if (plugins[i2].spec.historyPreserveItems) {
          cachedPreserveItems = true;
          break;
        }
    }
    return cachedPreserveItems;
  }
  const historyKey = new PluginKey("history");
  const closeHistoryKey = new PluginKey("closeHistory");
  function history(config = {}) {
    config = {
      depth: config.depth || 100,
      newGroupDelay: config.newGroupDelay || 500
    };
    return new Plugin({
      key: historyKey,
      state: {
        init() {
          return new HistoryState(Branch.empty, Branch.empty, null, 0);
        },
        apply(tr, hist, state) {
          return applyTransaction(hist, state, tr, config);
        }
      },
      config,
      props: {
        handleDOMEvents: {
          beforeinput(view, e) {
            let inputType = e.inputType;
            let command2 = inputType == "historyUndo" ? undo : inputType == "historyRedo" ? redo : null;
            if (!command2)
              return false;
            e.preventDefault();
            return command2(view.state, view.dispatch);
          }
        }
      }
    });
  }
  const undo = (state, dispatch) => {
    let hist = historyKey.getState(state);
    if (!hist || hist.done.eventCount == 0)
      return false;
    if (dispatch)
      histTransaction(hist, state, dispatch, false);
    return true;
  };
  const redo = (state, dispatch) => {
    let hist = historyKey.getState(state);
    if (!hist || hist.undone.eventCount == 0)
      return false;
    if (dispatch)
      histTransaction(hist, state, dispatch, true);
    return true;
  };
  const History = Extension.create({
    name: "history",
    addOptions() {
      return {
        depth: 100,
        newGroupDelay: 500
      };
    },
    addCommands() {
      return {
        undo: () => ({ state, dispatch }) => {
          return undo(state, dispatch);
        },
        redo: () => ({ state, dispatch }) => {
          return redo(state, dispatch);
        }
      };
    },
    addProseMirrorPlugins() {
      return [
        history(this.options)
      ];
    },
    addKeyboardShortcuts() {
      return {
        "Mod-z": () => this.editor.commands.undo(),
        "Mod-y": () => this.editor.commands.redo(),
        "Shift-Mod-z": () => this.editor.commands.redo(),
        "Mod-\u044F": () => this.editor.commands.undo(),
        "Shift-Mod-\u044F": () => this.editor.commands.redo()
      };
    }
  });
  const starInputRegex = /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))$/;
  const starPasteRegex = /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))/g;
  const underscoreInputRegex = /(?:^|\s)((?:_)((?:[^_]+))(?:_))$/;
  const underscorePasteRegex = /(?:^|\s)((?:_)((?:[^_]+))(?:_))/g;
  const Italic = Mark.create({
    name: "italic",
    addOptions() {
      return {
        HTMLAttributes: {}
      };
    },
    parseHTML() {
      return [
        {
          tag: "em"
        },
        {
          tag: "i",
          getAttrs: (node) => node.style.fontStyle !== "normal" && null
        },
        {
          style: "font-style=italic"
        }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["em", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
    addCommands() {
      return {
        setItalic: () => ({ commands: commands2 }) => {
          return commands2.setMark(this.name);
        },
        toggleItalic: () => ({ commands: commands2 }) => {
          return commands2.toggleMark(this.name);
        },
        unsetItalic: () => ({ commands: commands2 }) => {
          return commands2.unsetMark(this.name);
        }
      };
    },
    addKeyboardShortcuts() {
      return {
        "Mod-i": () => this.editor.commands.toggleItalic(),
        "Mod-I": () => this.editor.commands.toggleItalic()
      };
    },
    addInputRules() {
      return [
        markInputRule({
          find: starInputRegex,
          type: this.type
        }),
        markInputRule({
          find: underscoreInputRegex,
          type: this.type
        })
      ];
    },
    addPasteRules() {
      return [
        markPasteRule({
          find: starPasteRegex,
          type: this.type
        }),
        markPasteRule({
          find: underscorePasteRegex,
          type: this.type
        })
      ];
    }
  });
  const inputRegex = /(?:^|\s)((?:~~)((?:[^~]+))(?:~~))$/;
  const pasteRegex = /(?:^|\s)((?:~~)((?:[^~]+))(?:~~))/g;
  const Strike = Mark.create({
    name: "strike",
    addOptions() {
      return {
        HTMLAttributes: {}
      };
    },
    parseHTML() {
      return [
        {
          tag: "s"
        },
        {
          tag: "del"
        },
        {
          tag: "strike"
        },
        {
          style: "text-decoration",
          consuming: false,
          getAttrs: (style2) => style2.includes("line-through") ? {} : false
        }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["s", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
    addCommands() {
      return {
        setStrike: () => ({ commands: commands2 }) => {
          return commands2.setMark(this.name);
        },
        toggleStrike: () => ({ commands: commands2 }) => {
          return commands2.toggleMark(this.name);
        },
        unsetStrike: () => ({ commands: commands2 }) => {
          return commands2.unsetMark(this.name);
        }
      };
    },
    addKeyboardShortcuts() {
      return {
        "Mod-Shift-x": () => this.editor.commands.toggleStrike()
      };
    },
    addInputRules() {
      return [
        markInputRule({
          find: inputRegex,
          type: this.type
        })
      ];
    },
    addPasteRules() {
      return [
        markPasteRule({
          find: pasteRegex,
          type: this.type
        })
      ];
    }
  });
  const Text$1 = Node.create({
    name: "text",
    group: "inline"
  });
  const Underline = Mark.create({
    name: "underline",
    addOptions() {
      return {
        HTMLAttributes: {}
      };
    },
    parseHTML() {
      return [
        {
          tag: "u"
        },
        {
          style: "text-decoration",
          consuming: false,
          getAttrs: (style2) => style2.includes("underline") ? {} : false
        }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["u", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
    addCommands() {
      return {
        setUnderline: () => ({ commands: commands2 }) => {
          return commands2.setMark(this.name);
        },
        toggleUnderline: () => ({ commands: commands2 }) => {
          return commands2.toggleMark(this.name);
        },
        unsetUnderline: () => ({ commands: commands2 }) => {
          return commands2.unsetMark(this.name);
        }
      };
    },
    addKeyboardShortcuts() {
      return {
        "Mod-u": () => this.editor.commands.toggleUnderline(),
        "Mod-U": () => this.editor.commands.toggleUnderline()
      };
    }
  });
  function getBlockInfoFromPos(doc2, posInBlock) {
    if (posInBlock <= 0 || posInBlock > doc2.nodeSize) {
      return void 0;
    }
    const $pos = doc2.resolve(posInBlock);
    const maxDepth = $pos.depth;
    let node = $pos.node(maxDepth);
    let depth = maxDepth;
    while (depth >= 0) {
      if (depth === 0) {
        return void 0;
      }
      if (node.type.name === "blockContainer") {
        break;
      }
      depth -= 1;
      node = $pos.node(depth);
    }
    const id = node.attrs["id"];
    const contentNode = node.firstChild;
    const contentType = contentNode.type;
    const numChildBlocks = node.childCount === 2 ? node.lastChild.childCount : 0;
    const startPos = $pos.start(depth);
    const endPos = $pos.end(depth);
    return {
      id,
      node,
      contentNode,
      contentType,
      numChildBlocks,
      startPos,
      endPos,
      depth
    };
  }
  const PLUGIN_KEY$3 = new PluginKey(`previous-blocks`);
  const nodeAttributes = {
    index: "index",
    level: "level",
    type: "type",
    depth: "depth",
    "depth-change": "depth-change"
  };
  const PreviousBlockTypePlugin = () => {
    return new Plugin({
      key: PLUGIN_KEY$3,
      view(_editorView) {
        return {
          update: async (view, _prevState) => {
            var _a;
            if ((_a = this.key) == null ? void 0 : _a.getState(view.state).needsUpdate) {
              setTimeout(() => {
                view.dispatch(
                  view.state.tr.setMeta(PLUGIN_KEY$3, { clearUpdate: true })
                );
              }, 0);
            }
          }
        };
      },
      state: {
        init() {
          return {
            prevBlockAttrs: {},
            needsUpdate: false
          };
        },
        apply(transaction, prev, oldState, newState) {
          prev.needsUpdate = false;
          prev.prevBlockAttrs = {};
          if (!transaction.docChanged || oldState.doc.eq(newState.doc)) {
            return prev;
          }
          const transform = combineTransactionSteps(oldState.doc, [transaction]);
          const changes = getChangedRanges(transform);
          changes.forEach(() => {
            const oldNodes = findChildren(oldState.doc, (node) => node.attrs.id);
            const oldNodesById = new Map(
              oldNodes.map((node) => [node.node.attrs.id, node])
            );
            const newNodes = findChildren(newState.doc, (node) => node.attrs.id);
            for (let node of newNodes) {
              const oldNode = oldNodesById.get(node.node.attrs.id);
              const oldContentNode = oldNode == null ? void 0 : oldNode.node.firstChild;
              const newContentNode = node.node.firstChild;
              if (oldNode && oldContentNode && newContentNode) {
                const newAttrs = {
                  index: newContentNode.attrs.index,
                  level: newContentNode.attrs.level,
                  type: newContentNode.type.name,
                  depth: newState.doc.resolve(node.pos).depth
                };
                const oldAttrs = {
                  index: oldContentNode.attrs.index,
                  level: oldContentNode.attrs.level,
                  type: oldContentNode.type.name,
                  depth: oldState.doc.resolve(oldNode.pos).depth
                };
                const indexInitialized = oldAttrs.index === null && newAttrs.index !== null;
                const depthChanged = oldAttrs.index !== null && newAttrs.index !== null && oldAttrs.index === newAttrs.index;
                const shouldUpdate = oldAttrs.type === "numberedListItem" && newAttrs.type === "numberedListItem" ? indexInitialized || depthChanged : true;
                if (JSON.stringify(oldAttrs) !== JSON.stringify(newAttrs) && shouldUpdate) {
                  oldAttrs["depth-change"] = oldAttrs.depth - newAttrs.depth;
                  prev.prevBlockAttrs[node.node.attrs.id] = oldAttrs;
                  console.log(
                    "id:",
                    node.node.attrs.id,
                    "previousBlockTypePlugin changes detected, oldAttrs",
                    oldAttrs,
                    "new",
                    newAttrs
                  );
                  prev.needsUpdate = true;
                }
              }
            }
          });
          return prev;
        }
      },
      props: {
        decorations(state) {
          const pluginState = this.getState(state);
          if (!pluginState.needsUpdate) {
            return void 0;
          }
          const decorations = [];
          state.doc.descendants((node, pos) => {
            if (!node.attrs.id) {
              return;
            }
            const prevAttrs = pluginState.prevBlockAttrs[node.attrs.id];
            if (!prevAttrs) {
              return;
            }
            const decorationAttributes = {};
            for (let [nodeAttr, val] of Object.entries(prevAttrs)) {
              decorationAttributes["data-prev-" + nodeAttributes[nodeAttr]] = val || "none";
            }
            console.log(
              "previousBlockTypePlugin committing decorations",
              decorationAttributes
            );
            const decoration = Decoration.node(pos, pos + node.nodeSize, {
              ...decorationAttributes
            });
            decorations.push(decoration);
          });
          return DecorationSet.create(state.doc, decorations);
        }
      }
    });
  };
  const blockOuter = "_blockOuter_6qmsf_5";
  const block = "_block_6qmsf_5";
  const blockContent = "_blockContent_6qmsf_25";
  const blockGroup = "_blockGroup_6qmsf_53";
  const isEmpty = "_isEmpty_6qmsf_238";
  const isFilter = "_isFilter_6qmsf_239";
  const hasAnchor = "_hasAnchor_6qmsf_252";
  const blockStyles = {
    blockOuter,
    block,
    blockContent,
    blockGroup,
    isEmpty,
    isFilter,
    hasAnchor
  };
  const BlockAttributes = {
    blockColor: "data-block-color",
    blockStyle: "data-block-style",
    id: "data-id",
    depth: "data-depth",
    depthChange: "data-depth-change"
  };
  const BlockContainer = Node.create({
    name: "blockContainer",
    group: "blockContainer",
    content: "blockContent blockGroup?",
    priority: 50,
    defining: true,
    addOptions() {
      return {
        HTMLAttributes: {}
      };
    },
    addAttributes() {
      return {
        blockColor: {
          default: void 0
        },
        blockStyle: {
          default: void 0
        }
      };
    },
    parseHTML() {
      return [
        {
          tag: "div",
          getAttrs: (element) => {
            if (typeof element === "string") {
              return false;
            }
            const attrs = {};
            for (let [nodeAttr, HTMLAttr] of Object.entries(BlockAttributes)) {
              if (element.getAttribute(HTMLAttr)) {
                attrs[nodeAttr] = element.getAttribute(HTMLAttr);
              }
            }
            if (element.getAttribute("data-node-type") === "blockContainer") {
              return attrs;
            }
            return false;
          }
        }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          class: blockStyles.blockOuter,
          "data-node-type": "block-outer"
        }),
        [
          "div",
          mergeAttributes(HTMLAttributes, {
            class: blockStyles.block,
            "data-node-type": this.name
          }),
          0
        ]
      ];
    },
    addCommands() {
      return {
        BNCreateBlock: (pos) => ({ state, dispatch }) => {
          const newBlock = state.schema.nodes["blockContainer"].createAndFill();
          if (dispatch) {
            state.tr.insert(pos, newBlock);
          }
          return true;
        },
        BNDeleteBlock: (posInBlock) => ({ state, view, dispatch }) => {
          const blockInfo = getBlockInfoFromPos(state.doc, posInBlock);
          if (blockInfo === void 0) {
            return false;
          }
          const { startPos, endPos } = blockInfo;
          if (dispatch) {
            state.tr.deleteRange(startPos, endPos);
            state.tr.setSelection(
              new TextSelection(state.doc.resolve(startPos + 1))
            );
            view.focus();
          }
          return true;
        },
        BNMergeBlocks: (posBetweenBlocks) => ({ state, dispatch }) => {
          const nextNodeIsBlock = state.doc.resolve(posBetweenBlocks + 1).node().type.name === "blockContainer";
          const prevNodeIsBlock = state.doc.resolve(posBetweenBlocks - 1).node().type.name === "blockContainer";
          if (!nextNodeIsBlock || !prevNodeIsBlock) {
            return false;
          }
          const nextBlockInfo = getBlockInfoFromPos(
            state.doc,
            posBetweenBlocks + 1
          );
          const { node, contentNode, startPos, endPos, depth } = nextBlockInfo;
          if (node.childCount === 2) {
            const childBlocksStart = state.doc.resolve(
              startPos + contentNode.nodeSize + 1
            );
            const childBlocksEnd = state.doc.resolve(endPos - 1);
            const childBlocksRange = childBlocksStart.blockRange(childBlocksEnd);
            if (dispatch) {
              state.tr.lift(childBlocksRange, depth - 1);
            }
          }
          let prevBlockEndPos = posBetweenBlocks - 1;
          let prevBlockInfo = getBlockInfoFromPos(state.doc, prevBlockEndPos);
          while (prevBlockInfo.numChildBlocks > 0) {
            prevBlockEndPos--;
            prevBlockInfo = getBlockInfoFromPos(state.doc, prevBlockEndPos);
            if (prevBlockInfo === void 0) {
              return false;
            }
          }
          if (dispatch) {
            state.tr.deleteRange(startPos, startPos + contentNode.nodeSize);
            state.tr.insertText(contentNode.textContent, prevBlockEndPos - 1);
            state.tr.setSelection(
              new TextSelection(state.doc.resolve(prevBlockEndPos - 1))
            );
          }
          return true;
        },
        BNSplitBlock: (posInBlock, keepType) => ({ state, dispatch }) => {
          const blockInfo = getBlockInfoFromPos(state.doc, posInBlock);
          if (blockInfo === void 0) {
            return false;
          }
          const { contentNode, contentType, startPos, endPos, depth } = blockInfo;
          const newBlockInsertionPos = endPos + 1;
          const secondBlockContent = state.doc.textBetween(posInBlock, endPos);
          const newBlock = state.schema.nodes["blockContainer"].createAndFill();
          const newBlockContentPos = newBlockInsertionPos + 2;
          if (dispatch) {
            state.tr.insert(newBlockInsertionPos, newBlock);
            state.tr.insertText(secondBlockContent, newBlockContentPos);
            if (keepType) {
              state.tr.setBlockType(
                newBlockContentPos,
                newBlockContentPos,
                state.schema.node(contentType).type,
                contentNode.attrs
              );
            }
          }
          const firstBlockContent = state.doc.content.cut(startPos, posInBlock);
          if (dispatch) {
            state.tr.replace(
              startPos,
              endPos,
              new Slice(firstBlockContent, depth, depth)
            );
          }
          return true;
        },
        BNUpdateBlock: (posInBlock, blockUpdate) => ({ state, dispatch }) => {
          const blockInfo = getBlockInfoFromPos(state.doc, posInBlock);
          if (blockInfo === void 0) {
            return false;
          }
          const { node, startPos, contentNode } = blockInfo;
          if (dispatch) {
            state.tr.setBlockType(
              startPos + 1,
              startPos + contentNode.nodeSize + 1,
              state.schema.node(blockUpdate.type).type,
              {
                ...node.attrs,
                ...blockUpdate.props
              }
            );
          }
          return true;
        },
        BNCreateOrUpdateBlock: (posInBlock, blockUpdate) => ({ state, chain }) => {
          const blockInfo = getBlockInfoFromPos(state.doc, posInBlock);
          if (blockInfo === void 0) {
            return false;
          }
          const { node, startPos, endPos } = blockInfo;
          if (node.textContent.length === 0) {
            const oldBlockContentPos = startPos + 1;
            return chain().BNUpdateBlock(posInBlock, blockUpdate).setTextSelection(oldBlockContentPos).run();
          } else {
            const newBlockInsertionPos = endPos + 1;
            const newBlockContentPos = newBlockInsertionPos + 1;
            return chain().BNCreateBlock(newBlockInsertionPos).BNUpdateBlock(newBlockContentPos, blockUpdate).setTextSelection(newBlockContentPos).run();
          }
        }
      };
    },
    addProseMirrorPlugins() {
      return [PreviousBlockTypePlugin()];
    },
    addKeyboardShortcuts() {
      const handleBackspace = () => this.editor.commands.first(({ commands: commands2 }) => [
        () => commands2.deleteSelection(),
        () => commands2.undoInputRule(),
        () => commands2.command(({ state }) => {
          const { contentType } = getBlockInfoFromPos(
            state.doc,
            state.selection.from
          );
          const selectionAtBlockStart = state.selection.$anchor.parentOffset === 0;
          const isParagraph = contentType.name === "paragraph";
          if (selectionAtBlockStart && !isParagraph) {
            return commands2.BNUpdateBlock(state.selection.from, {
              type: "paragraph",
              props: {}
            });
          }
          return false;
        }),
        () => commands2.command(({ state }) => {
          const selectionAtBlockStart = state.selection.$anchor.parentOffset === 0;
          if (selectionAtBlockStart) {
            return commands2.liftListItem("blockContainer");
          }
          return false;
        }),
        () => commands2.command(({ state }) => {
          const { depth, startPos } = getBlockInfoFromPos(
            state.doc,
            state.selection.from
          );
          const selectionAtBlockStart = state.selection.$anchor.parentOffset === 0;
          const selectionEmpty = state.selection.anchor === state.selection.head;
          const blockAtDocStart = startPos === 2;
          const posBetweenBlocks = startPos - 1;
          if (!blockAtDocStart && selectionAtBlockStart && selectionEmpty && depth === 2) {
            return commands2.BNMergeBlocks(posBetweenBlocks);
          }
          return false;
        })
      ]);
      const handleEnter2 = () => this.editor.commands.first(({ commands: commands2 }) => [
        () => commands2.command(({ state }) => {
          const { node, depth } = getBlockInfoFromPos(
            state.doc,
            state.selection.from
          );
          const selectionAtBlockStart = state.selection.$anchor.parentOffset === 0;
          const selectionEmpty = state.selection.anchor === state.selection.head;
          const blockEmpty = node.textContent.length === 0;
          const blockIndented = depth > 2;
          if (selectionAtBlockStart && selectionEmpty && blockEmpty && blockIndented) {
            return commands2.liftListItem("blockContainer");
          }
          return false;
        }),
        () => commands2.command(({ state, chain }) => {
          const { node, endPos } = getBlockInfoFromPos(
            state.doc,
            state.selection.from
          );
          const selectionAtBlockStart = state.selection.$anchor.parentOffset === 0;
          const selectionEmpty = state.selection.anchor === state.selection.head;
          const blockEmpty = node.textContent.length === 0;
          if (selectionAtBlockStart && selectionEmpty && blockEmpty) {
            const newBlockInsertionPos = endPos + 1;
            const newBlockContentPos = newBlockInsertionPos + 2;
            chain().BNCreateBlock(newBlockInsertionPos).setTextSelection(newBlockContentPos).run();
            return true;
          }
          return false;
        }),
        () => commands2.command(({ state, chain }) => {
          const { node } = getBlockInfoFromPos(
            state.doc,
            state.selection.from
          );
          const blockEmpty = node.textContent.length === 0;
          if (!blockEmpty) {
            chain().deleteSelection().BNSplitBlock(state.selection.from, false).run();
            return true;
          }
          return false;
        })
      ]);
      return {
        Backspace: handleBackspace,
        Enter: handleEnter2,
        Tab: () => {
          this.editor.commands.sinkListItem("blockContainer");
          return true;
        },
        "Shift-Tab": () => {
          this.editor.commands.liftListItem("blockContainer");
          return true;
        },
        "Mod-Alt-0": () => this.editor.commands.BNCreateBlock(
          this.editor.state.selection.anchor + 2
        ),
        "Mod-Alt-1": () => this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: "1"
          }
        }),
        "Mod-Alt-2": () => this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: "2"
          }
        }),
        "Mod-Alt-3": () => this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: "3"
          }
        }),
        "Mod-Shift-7": () => this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "bulletListItem",
          props: {}
        }),
        "Mod-Shift-8": () => this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "numberedListItem",
          props: {}
        })
      };
    }
  });
  const BlockGroup = Node.create({
    name: "blockGroup",
    group: "blockGroup",
    content: "blockContainer+",
    addOptions() {
      return {
        HTMLAttributes: {}
      };
    },
    parseHTML() {
      return [
        {
          tag: "div",
          getAttrs: (element) => {
            if (typeof element === "string") {
              return false;
            }
            if (element.getAttribute("data-node-type") === "blockGroup") {
              return null;
            }
            return false;
          }
        }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: blockStyles.blockGroup,
          "data-node-type": "blockGroup"
        }),
        0
      ];
    }
  });
  const ParagraphBlockContent = Node.create({
    name: "paragraph",
    group: "blockContent",
    content: "inline*",
    parseHTML() {
      return [
        {
          tag: "p",
          priority: 200,
          node: "blockContainer"
        }
      ];
    },
    renderHTML() {
      return [
        "div",
        {
          class: blockStyles.blockContent,
          "data-content-type": this.name
        },
        ["p", 0]
      ];
    }
  });
  const HeadingBlockContent = Node.create({
    name: "heading",
    group: "blockContent",
    content: "inline*",
    addAttributes() {
      return {
        level: {
          default: "1",
          parseHTML: (element) => element.getAttribute("data-level"),
          renderHTML: (attributes) => {
            return {
              "data-level": attributes.level
            };
          }
        }
      };
    },
    addInputRules() {
      return [
        ...["1", "2", "3"].map((level) => {
          return new InputRule({
            find: new RegExp(`^(#{${parseInt(level)}})\\s$`),
            handler: ({ state, chain, range }) => {
              chain().BNUpdateBlock(state.selection.from, {
                type: "heading",
                props: {
                  level
                }
              }).deleteRange({ from: range.from, to: range.to });
            }
          });
        })
      ];
    },
    parseHTML() {
      return [
        {
          tag: "h1",
          attrs: { level: "1" },
          node: "blockContainer"
        },
        {
          tag: "h2",
          attrs: { level: "2" },
          node: "blockContainer"
        },
        {
          tag: "h3",
          attrs: { level: "3" },
          node: "blockContainer"
        }
      ];
    },
    renderHTML({ node, HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          class: blockStyles.blockContent,
          "data-content-type": this.name
        }),
        ["h" + node.attrs.level, 0]
      ];
    }
  });
  const handleEnter = (editor) => {
    const { node, contentType } = getBlockInfoFromPos(
      editor.state.doc,
      editor.state.selection.from
    );
    const selectionEmpty = editor.state.selection.anchor === editor.state.selection.head;
    if (!contentType.name.endsWith("ListItem") || !selectionEmpty) {
      return false;
    }
    return editor.commands.first(({ state, chain, commands: commands2 }) => [
      () => commands2.command(() => {
        if (node.textContent.length === 0) {
          return commands2.BNUpdateBlock(state.selection.from, {
            type: "paragraph",
            props: {}
          });
        }
        return false;
      }),
      () => commands2.command(() => {
        if (node.textContent.length > 0) {
          chain().deleteSelection().BNSplitBlock(state.selection.from, true).run();
          return true;
        }
        return false;
      })
    ]);
  };
  const BulletListItemBlockContent = Node.create({
    name: "bulletListItem",
    group: "blockContent",
    content: "inline*",
    addInputRules() {
      return [
        new InputRule({
          find: new RegExp(`^[-+*]\\s$`),
          handler: ({ state, chain, range }) => {
            chain().BNUpdateBlock(state.selection.from, {
              type: "bulletListItem",
              props: {}
            }).deleteRange({ from: range.from, to: range.to });
          }
        })
      ];
    },
    addKeyboardShortcuts() {
      return {
        Enter: () => handleEnter(this.editor)
      };
    },
    parseHTML() {
      return [
        {
          tag: "li",
          getAttrs: (element) => {
            if (typeof element === "string") {
              return false;
            }
            const parent = element.parentElement;
            if (parent === null) {
              return false;
            }
            if (parent.getAttribute("data-content-type") === "bulletListItem") {
              return {};
            }
            if (parent.tagName === "UL") {
              return {};
            }
            return false;
          },
          node: "blockContainer"
        }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          class: blockStyles.blockContent,
          "data-content-type": this.name
        }),
        ["li", 0]
      ];
    }
  });
  const PLUGIN_KEY$2 = new PluginKey(`numbered-list-indexing`);
  const NumberedListIndexingPlugin = () => {
    return new Plugin({
      key: PLUGIN_KEY$2,
      appendTransaction: (_transactions, _oldState, newState) => {
        const tr = newState.tr;
        tr.setMeta("numberedListIndexing", true);
        let modified = false;
        newState.doc.descendants((node, pos) => {
          if (node.type.name === "blockContainer" && node.firstChild.type.name === "numberedListItem") {
            let newIndex = "1";
            const isFirstBlockInDoc = pos === 1;
            const blockInfo = getBlockInfoFromPos(tr.doc, pos + 1);
            if (blockInfo === void 0) {
              return;
            }
            if (!isFirstBlockInDoc) {
              const prevBlockInfo = getBlockInfoFromPos(tr.doc, pos - 2);
              if (prevBlockInfo === void 0) {
                return;
              }
              const isFirstBlockInNestingLevel = blockInfo.depth !== prevBlockInfo.depth;
              if (!isFirstBlockInNestingLevel) {
                const prevBlockContentNode = prevBlockInfo.contentNode;
                const prevBlockContentType = prevBlockInfo.contentType;
                const isPrevBlockOrderedListItem = prevBlockContentType.name === "numberedListItem";
                if (isPrevBlockOrderedListItem) {
                  const prevBlockIndex = prevBlockContentNode.attrs["index"];
                  newIndex = (parseInt(prevBlockIndex) + 1).toString();
                }
              }
            }
            const contentNode = blockInfo.contentNode;
            const index = contentNode.attrs["index"];
            if (index !== newIndex) {
              modified = true;
              tr.setNodeMarkup(pos + 1, void 0, {
                index: newIndex
              });
            }
          }
        });
        return modified ? tr : null;
      }
    });
  };
  const NumberedListItemBlockContent = Node.create({
    name: "numberedListItem",
    group: "blockContent",
    content: "inline*",
    addAttributes() {
      return {
        index: {
          default: null,
          parseHTML: (element) => element.getAttribute("data-index"),
          renderHTML: (attributes) => {
            return {
              "data-index": attributes.index
            };
          }
        }
      };
    },
    addInputRules() {
      return [
        new InputRule({
          find: new RegExp(`^1\\.\\s$`),
          handler: ({ state, chain, range }) => {
            chain().BNUpdateBlock(state.selection.from, {
              type: "numberedListItem",
              props: {}
            }).deleteRange({ from: range.from, to: range.to });
          }
        })
      ];
    },
    addKeyboardShortcuts() {
      return {
        Enter: () => handleEnter(this.editor)
      };
    },
    addProseMirrorPlugins() {
      return [NumberedListIndexingPlugin()];
    },
    parseHTML() {
      return [
        {
          tag: "li",
          getAttrs: (element) => {
            if (typeof element === "string") {
              return false;
            }
            const parent = element.parentElement;
            if (parent === null) {
              return false;
            }
            if (parent.getAttribute("data-content-type") === "numberedListItem") {
              return {};
            }
            if (parent.tagName === "OL") {
              return {};
            }
            return false;
          },
          node: "blockContainer"
        }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          class: blockStyles.blockContent,
          "data-content-type": this.name
        }),
        ["li", 0]
      ];
    }
  });
  const blocks = [
    ParagraphBlockContent,
    HeadingBlockContent,
    BulletListItemBlockContent,
    NumberedListItemBlockContent,
    BlockContainer,
    BlockGroup,
    Node.create({
      name: "doc",
      topNode: true,
      content: "blockGroup"
    })
  ];
  class FormattingToolbarView {
    constructor({
      editor,
      formattingToolbarFactory,
      view,
      shouldShow
    }) {
      __publicField(this, "editor");
      __publicField(this, "view");
      __publicField(this, "formattingToolbar");
      __publicField(this, "preventHide", false);
      __publicField(this, "preventShow", false);
      __publicField(this, "toolbarIsOpen", false);
      __publicField(this, "shouldShow", ({ view, state, from, to }) => {
        const { doc: doc2, selection } = state;
        const { empty: empty2 } = selection;
        const isEmptyTextBlock = !doc2.textBetween(from, to).length && isTextSelection(state.selection);
        return !(!view.hasFocus() || empty2 || isEmptyTextBlock);
      });
      __publicField(this, "viewMousedownHandler", () => {
        this.preventShow = true;
      });
      __publicField(this, "viewMouseupHandler", () => {
        this.preventShow = false;
        setTimeout(() => this.update(this.editor.view));
      });
      __publicField(this, "dragstartHandler", () => {
        this.formattingToolbar.hide();
        this.toolbarIsOpen = false;
      });
      __publicField(this, "focusHandler", () => {
        setTimeout(() => this.update(this.editor.view));
      });
      __publicField(this, "blurHandler", ({ event }) => {
        var _a, _b;
        if (this.preventHide) {
          this.preventHide = false;
          return;
        }
        if ((event == null ? void 0 : event.relatedTarget) && ((_b = (_a = this.formattingToolbar.element) == null ? void 0 : _a.parentNode) == null ? void 0 : _b.contains(
          event.relatedTarget
        ))) {
          return;
        }
        if (this.toolbarIsOpen) {
          this.formattingToolbar.hide();
          this.toolbarIsOpen = false;
        }
      });
      this.editor = editor;
      this.view = view;
      this.formattingToolbar = formattingToolbarFactory(this.getStaticParams());
      if (shouldShow) {
        this.shouldShow = shouldShow;
      }
      this.view.dom.addEventListener("mousedown", this.viewMousedownHandler);
      this.view.dom.addEventListener("mouseup", this.viewMouseupHandler);
      this.view.dom.addEventListener("dragstart", this.dragstartHandler);
      this.editor.on("focus", this.focusHandler);
      this.editor.on("blur", this.blurHandler);
    }
    update(view, oldState) {
      var _a;
      const { state, composing } = view;
      const { doc: doc2, selection } = state;
      const isSame = oldState && oldState.doc.eq(doc2) && oldState.selection.eq(selection);
      if (composing || isSame) {
        return;
      }
      const { ranges } = selection;
      const from = Math.min(...ranges.map((range) => range.$from.pos));
      const to = Math.max(...ranges.map((range) => range.$to.pos));
      const shouldShow = (_a = this.shouldShow) == null ? void 0 : _a.call(this, {
        editor: this.editor,
        view,
        state,
        oldState,
        from,
        to
      });
      if (!this.toolbarIsOpen && !this.preventShow && (shouldShow || this.preventHide)) {
        this.formattingToolbar.render(this.getDynamicParams(), true);
        this.toolbarIsOpen = true;
        this.formattingToolbar.element.addEventListener(
          "mousedown",
          (event) => event.preventDefault()
        );
        return;
      }
      if (this.toolbarIsOpen && !this.preventShow && (shouldShow || this.preventHide)) {
        this.formattingToolbar.render(this.getDynamicParams(), false);
        return;
      }
      if (this.toolbarIsOpen && !this.preventHide && (!shouldShow || this.preventShow)) {
        this.formattingToolbar.hide();
        this.toolbarIsOpen = false;
        this.formattingToolbar.element.removeEventListener(
          "mousedown",
          (event) => event.preventDefault()
        );
        return;
      }
    }
    destroy() {
      this.view.dom.removeEventListener("mousedown", this.viewMousedownHandler);
      this.view.dom.removeEventListener("mouseup", this.viewMouseupHandler);
      this.view.dom.removeEventListener("dragstart", this.dragstartHandler);
      this.editor.off("focus", this.focusHandler);
      this.editor.off("blur", this.blurHandler);
    }
    getSelectionBoundingBox() {
      const { state } = this.editor.view;
      const { selection } = state;
      const { ranges } = selection;
      const from = Math.min(...ranges.map((range) => range.$from.pos));
      const to = Math.max(...ranges.map((range) => range.$to.pos));
      if (isNodeSelection(selection)) {
        const node = this.editor.view.nodeDOM(from);
        if (node) {
          return node.getBoundingClientRect();
        }
      }
      return posToDOMRect(this.editor.view, from, to);
    }
    getStaticParams() {
      return {
        toggleBold: () => {
          this.editor.view.focus();
          this.editor.commands.toggleBold();
        },
        toggleItalic: () => {
          this.editor.view.focus();
          this.editor.commands.toggleItalic();
        },
        toggleUnderline: () => {
          this.editor.view.focus();
          this.editor.commands.toggleUnderline();
        },
        toggleStrike: () => {
          this.editor.view.focus();
          this.editor.commands.toggleStrike();
        },
        setHyperlink: (url, text2) => {
          if (url === "") {
            return;
          }
          let { from, to } = this.editor.state.selection;
          if (!text2) {
            text2 = this.editor.state.doc.textBetween(from, to);
          }
          const mark = this.editor.schema.mark("link", { href: url });
          this.editor.view.dispatch(
            this.editor.view.state.tr.insertText(text2, from, to).addMark(from, from + text2.length, mark)
          );
          this.editor.view.focus();
        },
        updateBlock: (blockUpdate) => {
          this.editor.view.focus();
          this.editor.commands.BNUpdateBlock(
            this.editor.state.selection.from,
            blockUpdate
          );
        }
      };
    }
    getDynamicParams() {
      const blockInfo = getBlockInfoFromPos(
        this.editor.state.doc,
        this.editor.state.selection.from
      );
      return {
        boldIsActive: this.editor.isActive("bold"),
        italicIsActive: this.editor.isActive("italic"),
        underlineIsActive: this.editor.isActive("underline"),
        strikeIsActive: this.editor.isActive("strike"),
        hyperlinkIsActive: this.editor.isActive("link"),
        activeHyperlinkUrl: this.editor.getAttributes("link").href ? this.editor.getAttributes("link").href : "",
        activeHyperlinkText: this.editor.state.doc.textBetween(
          this.editor.state.selection.from,
          this.editor.state.selection.to
        ),
        block: {
          type: blockInfo.contentType.name,
          props: blockInfo.contentNode.attrs
        },
        referenceRect: this.getSelectionBoundingBox()
      };
    }
  }
  const createFormattingToolbarPlugin = (options) => {
    return new Plugin({
      key: new PluginKey("FormattingToolbarPlugin"),
      view: (view) => new FormattingToolbarView({ view, ...options })
    });
  };
  const FormattingToolbarExtension = Extension.create({
    name: "FormattingToolbarExtension",
    addProseMirrorPlugins() {
      if (!this.options.formattingToolbarFactory) {
        throw new Error(
          "UI Element factory not defined for FormattingToolbarExtension"
        );
      }
      return [
        createFormattingToolbarPlugin({
          editor: this.editor,
          formattingToolbarFactory: this.options.formattingToolbarFactory,
          pluginKey: new PluginKey("FormattingToolbarPlugin")
        })
      ];
    }
  });
  const bnEditor = "_bnEditor_xixap_3";
  const bnRoot = "_bnRoot_xixap_13";
  const dragPreview = "_dragPreview_xixap_27";
  const styles = {
    bnEditor,
    bnRoot,
    dragPreview
  };
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  var lodash = { exports: {} };
  /**
   * @license
   * Lodash <https://lodash.com/>
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   */
  (function(module2, exports3) {
    (function() {
      var undefined$1;
      var VERSION = "4.17.21";
      var LARGE_ARRAY_SIZE = 200;
      var CORE_ERROR_TEXT = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", FUNC_ERROR_TEXT = "Expected a function", INVALID_TEMPL_VAR_ERROR_TEXT = "Invalid `variable` option passed into `_.template`";
      var HASH_UNDEFINED = "__lodash_hash_undefined__";
      var MAX_MEMOIZE_SIZE = 500;
      var PLACEHOLDER = "__lodash_placeholder__";
      var CLONE_DEEP_FLAG = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG = 4;
      var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
      var WRAP_BIND_FLAG = 1, WRAP_BIND_KEY_FLAG = 2, WRAP_CURRY_BOUND_FLAG = 4, WRAP_CURRY_FLAG = 8, WRAP_CURRY_RIGHT_FLAG = 16, WRAP_PARTIAL_FLAG = 32, WRAP_PARTIAL_RIGHT_FLAG = 64, WRAP_ARY_FLAG = 128, WRAP_REARG_FLAG = 256, WRAP_FLIP_FLAG = 512;
      var DEFAULT_TRUNC_LENGTH = 30, DEFAULT_TRUNC_OMISSION = "...";
      var HOT_COUNT = 800, HOT_SPAN = 16;
      var LAZY_FILTER_FLAG = 1, LAZY_MAP_FLAG = 2, LAZY_WHILE_FLAG = 3;
      var INFINITY = 1 / 0, MAX_SAFE_INTEGER = 9007199254740991, MAX_INTEGER = 17976931348623157e292, NAN = 0 / 0;
      var MAX_ARRAY_LENGTH = 4294967295, MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1, HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;
      var wrapFlags = [
        ["ary", WRAP_ARY_FLAG],
        ["bind", WRAP_BIND_FLAG],
        ["bindKey", WRAP_BIND_KEY_FLAG],
        ["curry", WRAP_CURRY_FLAG],
        ["curryRight", WRAP_CURRY_RIGHT_FLAG],
        ["flip", WRAP_FLIP_FLAG],
        ["partial", WRAP_PARTIAL_FLAG],
        ["partialRight", WRAP_PARTIAL_RIGHT_FLAG],
        ["rearg", WRAP_REARG_FLAG]
      ];
      var argsTag = "[object Arguments]", arrayTag = "[object Array]", asyncTag = "[object AsyncFunction]", boolTag = "[object Boolean]", dateTag = "[object Date]", domExcTag = "[object DOMException]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag = "[object Map]", numberTag = "[object Number]", nullTag = "[object Null]", objectTag = "[object Object]", promiseTag = "[object Promise]", proxyTag = "[object Proxy]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]", undefinedTag = "[object Undefined]", weakMapTag = "[object WeakMap]", weakSetTag = "[object WeakSet]";
      var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
      var reEmptyStringLeading = /\b__p \+= '';/g, reEmptyStringMiddle = /\b(__p \+=) '' \+/g, reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
      var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g, reUnescapedHtml = /[&<>"']/g, reHasEscapedHtml = RegExp(reEscapedHtml.source), reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
      var reEscape = /<%-([\s\S]+?)%>/g, reEvaluate = /<%([\s\S]+?)%>/g, reInterpolate = /<%=([\s\S]+?)%>/g;
      var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/, rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
      var reRegExpChar = /[\\^$.*+?()[\]{}|]/g, reHasRegExpChar = RegExp(reRegExpChar.source);
      var reTrimStart = /^\s+/;
      var reWhitespace = /\s/;
      var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/, reSplitDetails = /,? & /;
      var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
      var reForbiddenIdentifierChars = /[()=,{}\[\]\/\s]/;
      var reEscapeChar = /\\(\\)?/g;
      var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
      var reFlags = /\w*$/;
      var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
      var reIsBinary = /^0b[01]+$/i;
      var reIsHostCtor = /^\[object .+?Constructor\]$/;
      var reIsOctal = /^0o[0-7]+$/i;
      var reIsUint = /^(?:0|[1-9]\d*)$/;
      var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
      var reNoMatch = /($^)/;
      var reUnescapedString = /['\n\r\u2028\u2029\\]/g;
      var rsAstralRange = "\\ud800-\\udfff", rsComboMarksRange = "\\u0300-\\u036f", reComboHalfMarksRange = "\\ufe20-\\ufe2f", rsComboSymbolsRange = "\\u20d0-\\u20ff", rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange, rsDingbatRange = "\\u2700-\\u27bf", rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff", rsMathOpRange = "\\xac\\xb1\\xd7\\xf7", rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", rsPunctuationRange = "\\u2000-\\u206f", rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde", rsVarRange = "\\ufe0e\\ufe0f", rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
      var rsApos = "['\u2019]", rsAstral = "[" + rsAstralRange + "]", rsBreak = "[" + rsBreakRange + "]", rsCombo = "[" + rsComboRange + "]", rsDigits = "\\d+", rsDingbat = "[" + rsDingbatRange + "]", rsLower = "[" + rsLowerRange + "]", rsMisc = "[^" + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]", rsFitz = "\\ud83c[\\udffb-\\udfff]", rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")", rsNonAstral = "[^" + rsAstralRange + "]", rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsUpper = "[" + rsUpperRange + "]", rsZWJ = "\\u200d";
      var rsMiscLower = "(?:" + rsLower + "|" + rsMisc + ")", rsMiscUpper = "(?:" + rsUpper + "|" + rsMisc + ")", rsOptContrLower = "(?:" + rsApos + "(?:d|ll|m|re|s|t|ve))?", rsOptContrUpper = "(?:" + rsApos + "(?:D|LL|M|RE|S|T|VE))?", reOptMod = rsModifier + "?", rsOptVar = "[" + rsVarRange + "]?", rsOptJoin = "(?:" + rsZWJ + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*", rsOrdLower = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rsOrdUpper = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", rsSeq = rsOptVar + reOptMod + rsOptJoin, rsEmoji = "(?:" + [rsDingbat, rsRegional, rsSurrPair].join("|") + ")" + rsSeq, rsSymbol = "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
      var reApos = RegExp(rsApos, "g");
      var reComboMark = RegExp(rsCombo, "g");
      var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
      var reUnicodeWord = RegExp([
        rsUpper + "?" + rsLower + "+" + rsOptContrLower + "(?=" + [rsBreak, rsUpper, "$"].join("|") + ")",
        rsMiscUpper + "+" + rsOptContrUpper + "(?=" + [rsBreak, rsUpper + rsMiscLower, "$"].join("|") + ")",
        rsUpper + "?" + rsMiscLower + "+" + rsOptContrLower,
        rsUpper + "+" + rsOptContrUpper,
        rsOrdUpper,
        rsOrdLower,
        rsDigits,
        rsEmoji
      ].join("|"), "g");
      var reHasUnicode = RegExp("[" + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + "]");
      var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
      var contextProps = [
        "Array",
        "Buffer",
        "DataView",
        "Date",
        "Error",
        "Float32Array",
        "Float64Array",
        "Function",
        "Int8Array",
        "Int16Array",
        "Int32Array",
        "Map",
        "Math",
        "Object",
        "Promise",
        "RegExp",
        "Set",
        "String",
        "Symbol",
        "TypeError",
        "Uint8Array",
        "Uint8ClampedArray",
        "Uint16Array",
        "Uint32Array",
        "WeakMap",
        "_",
        "clearTimeout",
        "isFinite",
        "parseInt",
        "setTimeout"
      ];
      var templateCounter = -1;
      var typedArrayTags = {};
      typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
      typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
      var cloneableTags = {};
      cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
      cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
      var deburredLetters = {
        "\xC0": "A",
        "\xC1": "A",
        "\xC2": "A",
        "\xC3": "A",
        "\xC4": "A",
        "\xC5": "A",
        "\xE0": "a",
        "\xE1": "a",
        "\xE2": "a",
        "\xE3": "a",
        "\xE4": "a",
        "\xE5": "a",
        "\xC7": "C",
        "\xE7": "c",
        "\xD0": "D",
        "\xF0": "d",
        "\xC8": "E",
        "\xC9": "E",
        "\xCA": "E",
        "\xCB": "E",
        "\xE8": "e",
        "\xE9": "e",
        "\xEA": "e",
        "\xEB": "e",
        "\xCC": "I",
        "\xCD": "I",
        "\xCE": "I",
        "\xCF": "I",
        "\xEC": "i",
        "\xED": "i",
        "\xEE": "i",
        "\xEF": "i",
        "\xD1": "N",
        "\xF1": "n",
        "\xD2": "O",
        "\xD3": "O",
        "\xD4": "O",
        "\xD5": "O",
        "\xD6": "O",
        "\xD8": "O",
        "\xF2": "o",
        "\xF3": "o",
        "\xF4": "o",
        "\xF5": "o",
        "\xF6": "o",
        "\xF8": "o",
        "\xD9": "U",
        "\xDA": "U",
        "\xDB": "U",
        "\xDC": "U",
        "\xF9": "u",
        "\xFA": "u",
        "\xFB": "u",
        "\xFC": "u",
        "\xDD": "Y",
        "\xFD": "y",
        "\xFF": "y",
        "\xC6": "Ae",
        "\xE6": "ae",
        "\xDE": "Th",
        "\xFE": "th",
        "\xDF": "ss",
        "\u0100": "A",
        "\u0102": "A",
        "\u0104": "A",
        "\u0101": "a",
        "\u0103": "a",
        "\u0105": "a",
        "\u0106": "C",
        "\u0108": "C",
        "\u010A": "C",
        "\u010C": "C",
        "\u0107": "c",
        "\u0109": "c",
        "\u010B": "c",
        "\u010D": "c",
        "\u010E": "D",
        "\u0110": "D",
        "\u010F": "d",
        "\u0111": "d",
        "\u0112": "E",
        "\u0114": "E",
        "\u0116": "E",
        "\u0118": "E",
        "\u011A": "E",
        "\u0113": "e",
        "\u0115": "e",
        "\u0117": "e",
        "\u0119": "e",
        "\u011B": "e",
        "\u011C": "G",
        "\u011E": "G",
        "\u0120": "G",
        "\u0122": "G",
        "\u011D": "g",
        "\u011F": "g",
        "\u0121": "g",
        "\u0123": "g",
        "\u0124": "H",
        "\u0126": "H",
        "\u0125": "h",
        "\u0127": "h",
        "\u0128": "I",
        "\u012A": "I",
        "\u012C": "I",
        "\u012E": "I",
        "\u0130": "I",
        "\u0129": "i",
        "\u012B": "i",
        "\u012D": "i",
        "\u012F": "i",
        "\u0131": "i",
        "\u0134": "J",
        "\u0135": "j",
        "\u0136": "K",
        "\u0137": "k",
        "\u0138": "k",
        "\u0139": "L",
        "\u013B": "L",
        "\u013D": "L",
        "\u013F": "L",
        "\u0141": "L",
        "\u013A": "l",
        "\u013C": "l",
        "\u013E": "l",
        "\u0140": "l",
        "\u0142": "l",
        "\u0143": "N",
        "\u0145": "N",
        "\u0147": "N",
        "\u014A": "N",
        "\u0144": "n",
        "\u0146": "n",
        "\u0148": "n",
        "\u014B": "n",
        "\u014C": "O",
        "\u014E": "O",
        "\u0150": "O",
        "\u014D": "o",
        "\u014F": "o",
        "\u0151": "o",
        "\u0154": "R",
        "\u0156": "R",
        "\u0158": "R",
        "\u0155": "r",
        "\u0157": "r",
        "\u0159": "r",
        "\u015A": "S",
        "\u015C": "S",
        "\u015E": "S",
        "\u0160": "S",
        "\u015B": "s",
        "\u015D": "s",
        "\u015F": "s",
        "\u0161": "s",
        "\u0162": "T",
        "\u0164": "T",
        "\u0166": "T",
        "\u0163": "t",
        "\u0165": "t",
        "\u0167": "t",
        "\u0168": "U",
        "\u016A": "U",
        "\u016C": "U",
        "\u016E": "U",
        "\u0170": "U",
        "\u0172": "U",
        "\u0169": "u",
        "\u016B": "u",
        "\u016D": "u",
        "\u016F": "u",
        "\u0171": "u",
        "\u0173": "u",
        "\u0174": "W",
        "\u0175": "w",
        "\u0176": "Y",
        "\u0177": "y",
        "\u0178": "Y",
        "\u0179": "Z",
        "\u017B": "Z",
        "\u017D": "Z",
        "\u017A": "z",
        "\u017C": "z",
        "\u017E": "z",
        "\u0132": "IJ",
        "\u0133": "ij",
        "\u0152": "Oe",
        "\u0153": "oe",
        "\u0149": "'n",
        "\u017F": "s"
      };
      var htmlEscapes = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      var htmlUnescapes = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'"
      };
      var stringEscapes = {
        "\\": "\\",
        "'": "'",
        "\n": "n",
        "\r": "r",
        "\u2028": "u2028",
        "\u2029": "u2029"
      };
      var freeParseFloat = parseFloat, freeParseInt = parseInt;
      var freeGlobal = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
      var freeSelf = typeof self == "object" && self && self.Object === Object && self;
      var root = freeGlobal || freeSelf || Function("return this")();
      var freeExports = exports3 && !exports3.nodeType && exports3;
      var freeModule = freeExports && true && module2 && !module2.nodeType && module2;
      var moduleExports = freeModule && freeModule.exports === freeExports;
      var freeProcess = moduleExports && freeGlobal.process;
      var nodeUtil = function() {
        try {
          var types = freeModule && freeModule.require && freeModule.require("util").types;
          if (types) {
            return types;
          }
          return freeProcess && freeProcess.binding && freeProcess.binding("util");
        } catch (e) {
        }
      }();
      var nodeIsArrayBuffer = nodeUtil && nodeUtil.isArrayBuffer, nodeIsDate = nodeUtil && nodeUtil.isDate, nodeIsMap = nodeUtil && nodeUtil.isMap, nodeIsRegExp = nodeUtil && nodeUtil.isRegExp, nodeIsSet = nodeUtil && nodeUtil.isSet, nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
      function apply2(func, thisArg, args) {
        switch (args.length) {
          case 0:
            return func.call(thisArg);
          case 1:
            return func.call(thisArg, args[0]);
          case 2:
            return func.call(thisArg, args[0], args[1]);
          case 3:
            return func.call(thisArg, args[0], args[1], args[2]);
        }
        return func.apply(thisArg, args);
      }
      function arrayAggregator(array, setter, iteratee, accumulator) {
        var index = -1, length = array == null ? 0 : array.length;
        while (++index < length) {
          var value = array[index];
          setter(accumulator, value, iteratee(value), array);
        }
        return accumulator;
      }
      function arrayEach(array, iteratee) {
        var index = -1, length = array == null ? 0 : array.length;
        while (++index < length) {
          if (iteratee(array[index], index, array) === false) {
            break;
          }
        }
        return array;
      }
      function arrayEachRight(array, iteratee) {
        var length = array == null ? 0 : array.length;
        while (length--) {
          if (iteratee(array[length], length, array) === false) {
            break;
          }
        }
        return array;
      }
      function arrayEvery(array, predicate) {
        var index = -1, length = array == null ? 0 : array.length;
        while (++index < length) {
          if (!predicate(array[index], index, array)) {
            return false;
          }
        }
        return true;
      }
      function arrayFilter(array, predicate) {
        var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
        while (++index < length) {
          var value = array[index];
          if (predicate(value, index, array)) {
            result[resIndex++] = value;
          }
        }
        return result;
      }
      function arrayIncludes(array, value) {
        var length = array == null ? 0 : array.length;
        return !!length && baseIndexOf(array, value, 0) > -1;
      }
      function arrayIncludesWith(array, value, comparator) {
        var index = -1, length = array == null ? 0 : array.length;
        while (++index < length) {
          if (comparator(value, array[index])) {
            return true;
          }
        }
        return false;
      }
      function arrayMap(array, iteratee) {
        var index = -1, length = array == null ? 0 : array.length, result = Array(length);
        while (++index < length) {
          result[index] = iteratee(array[index], index, array);
        }
        return result;
      }
      function arrayPush(array, values) {
        var index = -1, length = values.length, offset = array.length;
        while (++index < length) {
          array[offset + index] = values[index];
        }
        return array;
      }
      function arrayReduce(array, iteratee, accumulator, initAccum) {
        var index = -1, length = array == null ? 0 : array.length;
        if (initAccum && length) {
          accumulator = array[++index];
        }
        while (++index < length) {
          accumulator = iteratee(accumulator, array[index], index, array);
        }
        return accumulator;
      }
      function arrayReduceRight(array, iteratee, accumulator, initAccum) {
        var length = array == null ? 0 : array.length;
        if (initAccum && length) {
          accumulator = array[--length];
        }
        while (length--) {
          accumulator = iteratee(accumulator, array[length], length, array);
        }
        return accumulator;
      }
      function arraySome(array, predicate) {
        var index = -1, length = array == null ? 0 : array.length;
        while (++index < length) {
          if (predicate(array[index], index, array)) {
            return true;
          }
        }
        return false;
      }
      var asciiSize = baseProperty("length");
      function asciiToArray(string) {
        return string.split("");
      }
      function asciiWords(string) {
        return string.match(reAsciiWord) || [];
      }
      function baseFindKey(collection, predicate, eachFunc) {
        var result;
        eachFunc(collection, function(value, key, collection2) {
          if (predicate(value, key, collection2)) {
            result = key;
            return false;
          }
        });
        return result;
      }
      function baseFindIndex(array, predicate, fromIndex, fromRight) {
        var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
        while (fromRight ? index-- : ++index < length) {
          if (predicate(array[index], index, array)) {
            return index;
          }
        }
        return -1;
      }
      function baseIndexOf(array, value, fromIndex) {
        return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
      }
      function baseIndexOfWith(array, value, fromIndex, comparator) {
        var index = fromIndex - 1, length = array.length;
        while (++index < length) {
          if (comparator(array[index], value)) {
            return index;
          }
        }
        return -1;
      }
      function baseIsNaN(value) {
        return value !== value;
      }
      function baseMean(array, iteratee) {
        var length = array == null ? 0 : array.length;
        return length ? baseSum(array, iteratee) / length : NAN;
      }
      function baseProperty(key) {
        return function(object) {
          return object == null ? undefined$1 : object[key];
        };
      }
      function basePropertyOf(object) {
        return function(key) {
          return object == null ? undefined$1 : object[key];
        };
      }
      function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
        eachFunc(collection, function(value, index, collection2) {
          accumulator = initAccum ? (initAccum = false, value) : iteratee(accumulator, value, index, collection2);
        });
        return accumulator;
      }
      function baseSortBy(array, comparer) {
        var length = array.length;
        array.sort(comparer);
        while (length--) {
          array[length] = array[length].value;
        }
        return array;
      }
      function baseSum(array, iteratee) {
        var result, index = -1, length = array.length;
        while (++index < length) {
          var current = iteratee(array[index]);
          if (current !== undefined$1) {
            result = result === undefined$1 ? current : result + current;
          }
        }
        return result;
      }
      function baseTimes(n, iteratee) {
        var index = -1, result = Array(n);
        while (++index < n) {
          result[index] = iteratee(index);
        }
        return result;
      }
      function baseToPairs(object, props) {
        return arrayMap(props, function(key) {
          return [key, object[key]];
        });
      }
      function baseTrim(string) {
        return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
      }
      function baseUnary(func) {
        return function(value) {
          return func(value);
        };
      }
      function baseValues(object, props) {
        return arrayMap(props, function(key) {
          return object[key];
        });
      }
      function cacheHas(cache, key) {
        return cache.has(key);
      }
      function charsStartIndex(strSymbols, chrSymbols) {
        var index = -1, length = strSymbols.length;
        while (++index < length && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {
        }
        return index;
      }
      function charsEndIndex(strSymbols, chrSymbols) {
        var index = strSymbols.length;
        while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {
        }
        return index;
      }
      function countHolders(array, placeholder) {
        var length = array.length, result = 0;
        while (length--) {
          if (array[length] === placeholder) {
            ++result;
          }
        }
        return result;
      }
      var deburrLetter = basePropertyOf(deburredLetters);
      var escapeHtmlChar = basePropertyOf(htmlEscapes);
      function escapeStringChar(chr) {
        return "\\" + stringEscapes[chr];
      }
      function getValue(object, key) {
        return object == null ? undefined$1 : object[key];
      }
      function hasUnicode(string) {
        return reHasUnicode.test(string);
      }
      function hasUnicodeWord(string) {
        return reHasUnicodeWord.test(string);
      }
      function iteratorToArray(iterator) {
        var data, result = [];
        while (!(data = iterator.next()).done) {
          result.push(data.value);
        }
        return result;
      }
      function mapToArray(map) {
        var index = -1, result = Array(map.size);
        map.forEach(function(value, key) {
          result[++index] = [key, value];
        });
        return result;
      }
      function overArg(func, transform) {
        return function(arg) {
          return func(transform(arg));
        };
      }
      function replaceHolders(array, placeholder) {
        var index = -1, length = array.length, resIndex = 0, result = [];
        while (++index < length) {
          var value = array[index];
          if (value === placeholder || value === PLACEHOLDER) {
            array[index] = PLACEHOLDER;
            result[resIndex++] = index;
          }
        }
        return result;
      }
      function setToArray(set) {
        var index = -1, result = Array(set.size);
        set.forEach(function(value) {
          result[++index] = value;
        });
        return result;
      }
      function setToPairs(set) {
        var index = -1, result = Array(set.size);
        set.forEach(function(value) {
          result[++index] = [value, value];
        });
        return result;
      }
      function strictIndexOf(array, value, fromIndex) {
        var index = fromIndex - 1, length = array.length;
        while (++index < length) {
          if (array[index] === value) {
            return index;
          }
        }
        return -1;
      }
      function strictLastIndexOf(array, value, fromIndex) {
        var index = fromIndex + 1;
        while (index--) {
          if (array[index] === value) {
            return index;
          }
        }
        return index;
      }
      function stringSize(string) {
        return hasUnicode(string) ? unicodeSize(string) : asciiSize(string);
      }
      function stringToArray2(string) {
        return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
      }
      function trimmedEndIndex(string) {
        var index = string.length;
        while (index-- && reWhitespace.test(string.charAt(index))) {
        }
        return index;
      }
      var unescapeHtmlChar = basePropertyOf(htmlUnescapes);
      function unicodeSize(string) {
        var result = reUnicode.lastIndex = 0;
        while (reUnicode.test(string)) {
          ++result;
        }
        return result;
      }
      function unicodeToArray(string) {
        return string.match(reUnicode) || [];
      }
      function unicodeWords(string) {
        return string.match(reUnicodeWord) || [];
      }
      var runInContext = function runInContext2(context) {
        context = context == null ? root : _.defaults(root.Object(), context, _.pick(root, contextProps));
        var Array2 = context.Array, Date2 = context.Date, Error2 = context.Error, Function2 = context.Function, Math2 = context.Math, Object2 = context.Object, RegExp2 = context.RegExp, String2 = context.String, TypeError2 = context.TypeError;
        var arrayProto = Array2.prototype, funcProto = Function2.prototype, objectProto = Object2.prototype;
        var coreJsData = context["__core-js_shared__"];
        var funcToString = funcProto.toString;
        var hasOwnProperty = objectProto.hasOwnProperty;
        var idCounter = 0;
        var maskSrcKey = function() {
          var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
          return uid ? "Symbol(src)_1." + uid : "";
        }();
        var nativeObjectToString = objectProto.toString;
        var objectCtorString = funcToString.call(Object2);
        var oldDash = root._;
        var reIsNative = RegExp2(
          "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
        );
        var Buffer2 = moduleExports ? context.Buffer : undefined$1, Symbol2 = context.Symbol, Uint8Array2 = context.Uint8Array, allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : undefined$1, getPrototype = overArg(Object2.getPrototypeOf, Object2), objectCreate = Object2.create, propertyIsEnumerable = objectProto.propertyIsEnumerable, splice = arrayProto.splice, spreadableSymbol = Symbol2 ? Symbol2.isConcatSpreadable : undefined$1, symIterator = Symbol2 ? Symbol2.iterator : undefined$1, symToStringTag = Symbol2 ? Symbol2.toStringTag : undefined$1;
        var defineProperty = function() {
          try {
            var func = getNative(Object2, "defineProperty");
            func({}, "", {});
            return func;
          } catch (e) {
          }
        }();
        var ctxClearTimeout = context.clearTimeout !== root.clearTimeout && context.clearTimeout, ctxNow = Date2 && Date2.now !== root.Date.now && Date2.now, ctxSetTimeout = context.setTimeout !== root.setTimeout && context.setTimeout;
        var nativeCeil = Math2.ceil, nativeFloor = Math2.floor, nativeGetSymbols = Object2.getOwnPropertySymbols, nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : undefined$1, nativeIsFinite = context.isFinite, nativeJoin = arrayProto.join, nativeKeys = overArg(Object2.keys, Object2), nativeMax = Math2.max, nativeMin = Math2.min, nativeNow = Date2.now, nativeParseInt = context.parseInt, nativeRandom = Math2.random, nativeReverse = arrayProto.reverse;
        var DataView = getNative(context, "DataView"), Map2 = getNative(context, "Map"), Promise2 = getNative(context, "Promise"), Set2 = getNative(context, "Set"), WeakMap2 = getNative(context, "WeakMap"), nativeCreate = getNative(Object2, "create");
        var metaMap = WeakMap2 && new WeakMap2();
        var realNames = {};
        var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise2), setCtorString = toSource(Set2), weakMapCtorString = toSource(WeakMap2);
        var symbolProto = Symbol2 ? Symbol2.prototype : undefined$1, symbolValueOf = symbolProto ? symbolProto.valueOf : undefined$1, symbolToString = symbolProto ? symbolProto.toString : undefined$1;
        function lodash2(value) {
          if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
            if (value instanceof LodashWrapper) {
              return value;
            }
            if (hasOwnProperty.call(value, "__wrapped__")) {
              return wrapperClone(value);
            }
          }
          return new LodashWrapper(value);
        }
        var baseCreate = function() {
          function object() {
          }
          return function(proto) {
            if (!isObject(proto)) {
              return {};
            }
            if (objectCreate) {
              return objectCreate(proto);
            }
            object.prototype = proto;
            var result2 = new object();
            object.prototype = undefined$1;
            return result2;
          };
        }();
        function baseLodash() {
        }
        function LodashWrapper(value, chainAll) {
          this.__wrapped__ = value;
          this.__actions__ = [];
          this.__chain__ = !!chainAll;
          this.__index__ = 0;
          this.__values__ = undefined$1;
        }
        lodash2.templateSettings = {
          "escape": reEscape,
          "evaluate": reEvaluate,
          "interpolate": reInterpolate,
          "variable": "",
          "imports": {
            "_": lodash2
          }
        };
        lodash2.prototype = baseLodash.prototype;
        lodash2.prototype.constructor = lodash2;
        LodashWrapper.prototype = baseCreate(baseLodash.prototype);
        LodashWrapper.prototype.constructor = LodashWrapper;
        function LazyWrapper(value) {
          this.__wrapped__ = value;
          this.__actions__ = [];
          this.__dir__ = 1;
          this.__filtered__ = false;
          this.__iteratees__ = [];
          this.__takeCount__ = MAX_ARRAY_LENGTH;
          this.__views__ = [];
        }
        function lazyClone() {
          var result2 = new LazyWrapper(this.__wrapped__);
          result2.__actions__ = copyArray(this.__actions__);
          result2.__dir__ = this.__dir__;
          result2.__filtered__ = this.__filtered__;
          result2.__iteratees__ = copyArray(this.__iteratees__);
          result2.__takeCount__ = this.__takeCount__;
          result2.__views__ = copyArray(this.__views__);
          return result2;
        }
        function lazyReverse() {
          if (this.__filtered__) {
            var result2 = new LazyWrapper(this);
            result2.__dir__ = -1;
            result2.__filtered__ = true;
          } else {
            result2 = this.clone();
            result2.__dir__ *= -1;
          }
          return result2;
        }
        function lazyValue() {
          var array = this.__wrapped__.value(), dir = this.__dir__, isArr = isArray(array), isRight = dir < 0, arrLength = isArr ? array.length : 0, view = getView(0, arrLength, this.__views__), start = view.start, end = view.end, length = end - start, index = isRight ? end : start - 1, iteratees = this.__iteratees__, iterLength = iteratees.length, resIndex = 0, takeCount = nativeMin(length, this.__takeCount__);
          if (!isArr || !isRight && arrLength == length && takeCount == length) {
            return baseWrapperValue(array, this.__actions__);
          }
          var result2 = [];
          outer:
            while (length-- && resIndex < takeCount) {
              index += dir;
              var iterIndex = -1, value = array[index];
              while (++iterIndex < iterLength) {
                var data = iteratees[iterIndex], iteratee2 = data.iteratee, type = data.type, computed = iteratee2(value);
                if (type == LAZY_MAP_FLAG) {
                  value = computed;
                } else if (!computed) {
                  if (type == LAZY_FILTER_FLAG) {
                    continue outer;
                  } else {
                    break outer;
                  }
                }
              }
              result2[resIndex++] = value;
            }
          return result2;
        }
        LazyWrapper.prototype = baseCreate(baseLodash.prototype);
        LazyWrapper.prototype.constructor = LazyWrapper;
        function Hash(entries) {
          var index = -1, length = entries == null ? 0 : entries.length;
          this.clear();
          while (++index < length) {
            var entry = entries[index];
            this.set(entry[0], entry[1]);
          }
        }
        function hashClear() {
          this.__data__ = nativeCreate ? nativeCreate(null) : {};
          this.size = 0;
        }
        function hashDelete(key) {
          var result2 = this.has(key) && delete this.__data__[key];
          this.size -= result2 ? 1 : 0;
          return result2;
        }
        function hashGet(key) {
          var data = this.__data__;
          if (nativeCreate) {
            var result2 = data[key];
            return result2 === HASH_UNDEFINED ? undefined$1 : result2;
          }
          return hasOwnProperty.call(data, key) ? data[key] : undefined$1;
        }
        function hashHas(key) {
          var data = this.__data__;
          return nativeCreate ? data[key] !== undefined$1 : hasOwnProperty.call(data, key);
        }
        function hashSet(key, value) {
          var data = this.__data__;
          this.size += this.has(key) ? 0 : 1;
          data[key] = nativeCreate && value === undefined$1 ? HASH_UNDEFINED : value;
          return this;
        }
        Hash.prototype.clear = hashClear;
        Hash.prototype["delete"] = hashDelete;
        Hash.prototype.get = hashGet;
        Hash.prototype.has = hashHas;
        Hash.prototype.set = hashSet;
        function ListCache(entries) {
          var index = -1, length = entries == null ? 0 : entries.length;
          this.clear();
          while (++index < length) {
            var entry = entries[index];
            this.set(entry[0], entry[1]);
          }
        }
        function listCacheClear() {
          this.__data__ = [];
          this.size = 0;
        }
        function listCacheDelete(key) {
          var data = this.__data__, index = assocIndexOf(data, key);
          if (index < 0) {
            return false;
          }
          var lastIndex = data.length - 1;
          if (index == lastIndex) {
            data.pop();
          } else {
            splice.call(data, index, 1);
          }
          --this.size;
          return true;
        }
        function listCacheGet(key) {
          var data = this.__data__, index = assocIndexOf(data, key);
          return index < 0 ? undefined$1 : data[index][1];
        }
        function listCacheHas(key) {
          return assocIndexOf(this.__data__, key) > -1;
        }
        function listCacheSet(key, value) {
          var data = this.__data__, index = assocIndexOf(data, key);
          if (index < 0) {
            ++this.size;
            data.push([key, value]);
          } else {
            data[index][1] = value;
          }
          return this;
        }
        ListCache.prototype.clear = listCacheClear;
        ListCache.prototype["delete"] = listCacheDelete;
        ListCache.prototype.get = listCacheGet;
        ListCache.prototype.has = listCacheHas;
        ListCache.prototype.set = listCacheSet;
        function MapCache(entries) {
          var index = -1, length = entries == null ? 0 : entries.length;
          this.clear();
          while (++index < length) {
            var entry = entries[index];
            this.set(entry[0], entry[1]);
          }
        }
        function mapCacheClear() {
          this.size = 0;
          this.__data__ = {
            "hash": new Hash(),
            "map": new (Map2 || ListCache)(),
            "string": new Hash()
          };
        }
        function mapCacheDelete(key) {
          var result2 = getMapData(this, key)["delete"](key);
          this.size -= result2 ? 1 : 0;
          return result2;
        }
        function mapCacheGet(key) {
          return getMapData(this, key).get(key);
        }
        function mapCacheHas(key) {
          return getMapData(this, key).has(key);
        }
        function mapCacheSet(key, value) {
          var data = getMapData(this, key), size2 = data.size;
          data.set(key, value);
          this.size += data.size == size2 ? 0 : 1;
          return this;
        }
        MapCache.prototype.clear = mapCacheClear;
        MapCache.prototype["delete"] = mapCacheDelete;
        MapCache.prototype.get = mapCacheGet;
        MapCache.prototype.has = mapCacheHas;
        MapCache.prototype.set = mapCacheSet;
        function SetCache(values2) {
          var index = -1, length = values2 == null ? 0 : values2.length;
          this.__data__ = new MapCache();
          while (++index < length) {
            this.add(values2[index]);
          }
        }
        function setCacheAdd(value) {
          this.__data__.set(value, HASH_UNDEFINED);
          return this;
        }
        function setCacheHas(value) {
          return this.__data__.has(value);
        }
        SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
        SetCache.prototype.has = setCacheHas;
        function Stack(entries) {
          var data = this.__data__ = new ListCache(entries);
          this.size = data.size;
        }
        function stackClear() {
          this.__data__ = new ListCache();
          this.size = 0;
        }
        function stackDelete(key) {
          var data = this.__data__, result2 = data["delete"](key);
          this.size = data.size;
          return result2;
        }
        function stackGet(key) {
          return this.__data__.get(key);
        }
        function stackHas(key) {
          return this.__data__.has(key);
        }
        function stackSet(key, value) {
          var data = this.__data__;
          if (data instanceof ListCache) {
            var pairs = data.__data__;
            if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
              pairs.push([key, value]);
              this.size = ++data.size;
              return this;
            }
            data = this.__data__ = new MapCache(pairs);
          }
          data.set(key, value);
          this.size = data.size;
          return this;
        }
        Stack.prototype.clear = stackClear;
        Stack.prototype["delete"] = stackDelete;
        Stack.prototype.get = stackGet;
        Stack.prototype.has = stackHas;
        Stack.prototype.set = stackSet;
        function arrayLikeKeys(value, inherited) {
          var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result2 = skipIndexes ? baseTimes(value.length, String2) : [], length = result2.length;
          for (var key in value) {
            if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isBuff && (key == "offset" || key == "parent") || isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || isIndex(key, length)))) {
              result2.push(key);
            }
          }
          return result2;
        }
        function arraySample(array) {
          var length = array.length;
          return length ? array[baseRandom(0, length - 1)] : undefined$1;
        }
        function arraySampleSize(array, n) {
          return shuffleSelf(copyArray(array), baseClamp(n, 0, array.length));
        }
        function arrayShuffle(array) {
          return shuffleSelf(copyArray(array));
        }
        function assignMergeValue(object, key, value) {
          if (value !== undefined$1 && !eq(object[key], value) || value === undefined$1 && !(key in object)) {
            baseAssignValue(object, key, value);
          }
        }
        function assignValue(object, key, value) {
          var objValue = object[key];
          if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === undefined$1 && !(key in object)) {
            baseAssignValue(object, key, value);
          }
        }
        function assocIndexOf(array, key) {
          var length = array.length;
          while (length--) {
            if (eq(array[length][0], key)) {
              return length;
            }
          }
          return -1;
        }
        function baseAggregator(collection, setter, iteratee2, accumulator) {
          baseEach(collection, function(value, key, collection2) {
            setter(accumulator, value, iteratee2(value), collection2);
          });
          return accumulator;
        }
        function baseAssign(object, source) {
          return object && copyObject(source, keys2(source), object);
        }
        function baseAssignIn(object, source) {
          return object && copyObject(source, keysIn(source), object);
        }
        function baseAssignValue(object, key, value) {
          if (key == "__proto__" && defineProperty) {
            defineProperty(object, key, {
              "configurable": true,
              "enumerable": true,
              "value": value,
              "writable": true
            });
          } else {
            object[key] = value;
          }
        }
        function baseAt(object, paths) {
          var index = -1, length = paths.length, result2 = Array2(length), skip = object == null;
          while (++index < length) {
            result2[index] = skip ? undefined$1 : get(object, paths[index]);
          }
          return result2;
        }
        function baseClamp(number, lower, upper) {
          if (number === number) {
            if (upper !== undefined$1) {
              number = number <= upper ? number : upper;
            }
            if (lower !== undefined$1) {
              number = number >= lower ? number : lower;
            }
          }
          return number;
        }
        function baseClone(value, bitmask, customizer, key, object, stack) {
          var result2, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
          if (customizer) {
            result2 = object ? customizer(value, key, object, stack) : customizer(value);
          }
          if (result2 !== undefined$1) {
            return result2;
          }
          if (!isObject(value)) {
            return value;
          }
          var isArr = isArray(value);
          if (isArr) {
            result2 = initCloneArray(value);
            if (!isDeep) {
              return copyArray(value, result2);
            }
          } else {
            var tag = getTag(value), isFunc = tag == funcTag || tag == genTag;
            if (isBuffer(value)) {
              return cloneBuffer(value, isDeep);
            }
            if (tag == objectTag || tag == argsTag || isFunc && !object) {
              result2 = isFlat || isFunc ? {} : initCloneObject(value);
              if (!isDeep) {
                return isFlat ? copySymbolsIn(value, baseAssignIn(result2, value)) : copySymbols(value, baseAssign(result2, value));
              }
            } else {
              if (!cloneableTags[tag]) {
                return object ? value : {};
              }
              result2 = initCloneByTag(value, tag, isDeep);
            }
          }
          stack || (stack = new Stack());
          var stacked = stack.get(value);
          if (stacked) {
            return stacked;
          }
          stack.set(value, result2);
          if (isSet(value)) {
            value.forEach(function(subValue) {
              result2.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
            });
          } else if (isMap(value)) {
            value.forEach(function(subValue, key2) {
              result2.set(key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
            });
          }
          var keysFunc = isFull ? isFlat ? getAllKeysIn : getAllKeys : isFlat ? keysIn : keys2;
          var props = isArr ? undefined$1 : keysFunc(value);
          arrayEach(props || value, function(subValue, key2) {
            if (props) {
              key2 = subValue;
              subValue = value[key2];
            }
            assignValue(result2, key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
          });
          return result2;
        }
        function baseConforms(source) {
          var props = keys2(source);
          return function(object) {
            return baseConformsTo(object, source, props);
          };
        }
        function baseConformsTo(object, source, props) {
          var length = props.length;
          if (object == null) {
            return !length;
          }
          object = Object2(object);
          while (length--) {
            var key = props[length], predicate = source[key], value = object[key];
            if (value === undefined$1 && !(key in object) || !predicate(value)) {
              return false;
            }
          }
          return true;
        }
        function baseDelay(func, wait, args) {
          if (typeof func != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          return setTimeout2(function() {
            func.apply(undefined$1, args);
          }, wait);
        }
        function baseDifference(array, values2, iteratee2, comparator) {
          var index = -1, includes2 = arrayIncludes, isCommon = true, length = array.length, result2 = [], valuesLength = values2.length;
          if (!length) {
            return result2;
          }
          if (iteratee2) {
            values2 = arrayMap(values2, baseUnary(iteratee2));
          }
          if (comparator) {
            includes2 = arrayIncludesWith;
            isCommon = false;
          } else if (values2.length >= LARGE_ARRAY_SIZE) {
            includes2 = cacheHas;
            isCommon = false;
            values2 = new SetCache(values2);
          }
          outer:
            while (++index < length) {
              var value = array[index], computed = iteratee2 == null ? value : iteratee2(value);
              value = comparator || value !== 0 ? value : 0;
              if (isCommon && computed === computed) {
                var valuesIndex = valuesLength;
                while (valuesIndex--) {
                  if (values2[valuesIndex] === computed) {
                    continue outer;
                  }
                }
                result2.push(value);
              } else if (!includes2(values2, computed, comparator)) {
                result2.push(value);
              }
            }
          return result2;
        }
        var baseEach = createBaseEach(baseForOwn);
        var baseEachRight = createBaseEach(baseForOwnRight, true);
        function baseEvery(collection, predicate) {
          var result2 = true;
          baseEach(collection, function(value, index, collection2) {
            result2 = !!predicate(value, index, collection2);
            return result2;
          });
          return result2;
        }
        function baseExtremum(array, iteratee2, comparator) {
          var index = -1, length = array.length;
          while (++index < length) {
            var value = array[index], current = iteratee2(value);
            if (current != null && (computed === undefined$1 ? current === current && !isSymbol(current) : comparator(current, computed))) {
              var computed = current, result2 = value;
            }
          }
          return result2;
        }
        function baseFill(array, value, start, end) {
          var length = array.length;
          start = toInteger(start);
          if (start < 0) {
            start = -start > length ? 0 : length + start;
          }
          end = end === undefined$1 || end > length ? length : toInteger(end);
          if (end < 0) {
            end += length;
          }
          end = start > end ? 0 : toLength(end);
          while (start < end) {
            array[start++] = value;
          }
          return array;
        }
        function baseFilter(collection, predicate) {
          var result2 = [];
          baseEach(collection, function(value, index, collection2) {
            if (predicate(value, index, collection2)) {
              result2.push(value);
            }
          });
          return result2;
        }
        function baseFlatten(array, depth, predicate, isStrict, result2) {
          var index = -1, length = array.length;
          predicate || (predicate = isFlattenable);
          result2 || (result2 = []);
          while (++index < length) {
            var value = array[index];
            if (depth > 0 && predicate(value)) {
              if (depth > 1) {
                baseFlatten(value, depth - 1, predicate, isStrict, result2);
              } else {
                arrayPush(result2, value);
              }
            } else if (!isStrict) {
              result2[result2.length] = value;
            }
          }
          return result2;
        }
        var baseFor = createBaseFor();
        var baseForRight = createBaseFor(true);
        function baseForOwn(object, iteratee2) {
          return object && baseFor(object, iteratee2, keys2);
        }
        function baseForOwnRight(object, iteratee2) {
          return object && baseForRight(object, iteratee2, keys2);
        }
        function baseFunctions(object, props) {
          return arrayFilter(props, function(key) {
            return isFunction2(object[key]);
          });
        }
        function baseGet(object, path) {
          path = castPath(path, object);
          var index = 0, length = path.length;
          while (object != null && index < length) {
            object = object[toKey(path[index++])];
          }
          return index && index == length ? object : undefined$1;
        }
        function baseGetAllKeys(object, keysFunc, symbolsFunc) {
          var result2 = keysFunc(object);
          return isArray(object) ? result2 : arrayPush(result2, symbolsFunc(object));
        }
        function baseGetTag(value) {
          if (value == null) {
            return value === undefined$1 ? undefinedTag : nullTag;
          }
          return symToStringTag && symToStringTag in Object2(value) ? getRawTag(value) : objectToString(value);
        }
        function baseGt(value, other) {
          return value > other;
        }
        function baseHas(object, key) {
          return object != null && hasOwnProperty.call(object, key);
        }
        function baseHasIn(object, key) {
          return object != null && key in Object2(object);
        }
        function baseInRange(number, start, end) {
          return number >= nativeMin(start, end) && number < nativeMax(start, end);
        }
        function baseIntersection(arrays, iteratee2, comparator) {
          var includes2 = comparator ? arrayIncludesWith : arrayIncludes, length = arrays[0].length, othLength = arrays.length, othIndex = othLength, caches = Array2(othLength), maxLength = Infinity, result2 = [];
          while (othIndex--) {
            var array = arrays[othIndex];
            if (othIndex && iteratee2) {
              array = arrayMap(array, baseUnary(iteratee2));
            }
            maxLength = nativeMin(array.length, maxLength);
            caches[othIndex] = !comparator && (iteratee2 || length >= 120 && array.length >= 120) ? new SetCache(othIndex && array) : undefined$1;
          }
          array = arrays[0];
          var index = -1, seen = caches[0];
          outer:
            while (++index < length && result2.length < maxLength) {
              var value = array[index], computed = iteratee2 ? iteratee2(value) : value;
              value = comparator || value !== 0 ? value : 0;
              if (!(seen ? cacheHas(seen, computed) : includes2(result2, computed, comparator))) {
                othIndex = othLength;
                while (--othIndex) {
                  var cache = caches[othIndex];
                  if (!(cache ? cacheHas(cache, computed) : includes2(arrays[othIndex], computed, comparator))) {
                    continue outer;
                  }
                }
                if (seen) {
                  seen.push(computed);
                }
                result2.push(value);
              }
            }
          return result2;
        }
        function baseInverter(object, setter, iteratee2, accumulator) {
          baseForOwn(object, function(value, key, object2) {
            setter(accumulator, iteratee2(value), key, object2);
          });
          return accumulator;
        }
        function baseInvoke(object, path, args) {
          path = castPath(path, object);
          object = parent(object, path);
          var func = object == null ? object : object[toKey(last(path))];
          return func == null ? undefined$1 : apply2(func, object, args);
        }
        function baseIsArguments(value) {
          return isObjectLike(value) && baseGetTag(value) == argsTag;
        }
        function baseIsArrayBuffer(value) {
          return isObjectLike(value) && baseGetTag(value) == arrayBufferTag;
        }
        function baseIsDate(value) {
          return isObjectLike(value) && baseGetTag(value) == dateTag;
        }
        function baseIsEqual(value, other, bitmask, customizer, stack) {
          if (value === other) {
            return true;
          }
          if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
            return value !== value && other !== other;
          }
          return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
        }
        function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
          var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
          objTag = objTag == argsTag ? objectTag : objTag;
          othTag = othTag == argsTag ? objectTag : othTag;
          var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
          if (isSameTag && isBuffer(object)) {
            if (!isBuffer(other)) {
              return false;
            }
            objIsArr = true;
            objIsObj = false;
          }
          if (isSameTag && !objIsObj) {
            stack || (stack = new Stack());
            return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
          }
          if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
            var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
            if (objIsWrapped || othIsWrapped) {
              var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
              stack || (stack = new Stack());
              return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
            }
          }
          if (!isSameTag) {
            return false;
          }
          stack || (stack = new Stack());
          return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
        }
        function baseIsMap(value) {
          return isObjectLike(value) && getTag(value) == mapTag;
        }
        function baseIsMatch(object, source, matchData, customizer) {
          var index = matchData.length, length = index, noCustomizer = !customizer;
          if (object == null) {
            return !length;
          }
          object = Object2(object);
          while (index--) {
            var data = matchData[index];
            if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
              return false;
            }
          }
          while (++index < length) {
            data = matchData[index];
            var key = data[0], objValue = object[key], srcValue = data[1];
            if (noCustomizer && data[2]) {
              if (objValue === undefined$1 && !(key in object)) {
                return false;
              }
            } else {
              var stack = new Stack();
              if (customizer) {
                var result2 = customizer(objValue, srcValue, key, object, source, stack);
              }
              if (!(result2 === undefined$1 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result2)) {
                return false;
              }
            }
          }
          return true;
        }
        function baseIsNative(value) {
          if (!isObject(value) || isMasked(value)) {
            return false;
          }
          var pattern = isFunction2(value) ? reIsNative : reIsHostCtor;
          return pattern.test(toSource(value));
        }
        function baseIsRegExp(value) {
          return isObjectLike(value) && baseGetTag(value) == regexpTag;
        }
        function baseIsSet(value) {
          return isObjectLike(value) && getTag(value) == setTag;
        }
        function baseIsTypedArray(value) {
          return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
        }
        function baseIteratee(value) {
          if (typeof value == "function") {
            return value;
          }
          if (value == null) {
            return identity;
          }
          if (typeof value == "object") {
            return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
          }
          return property(value);
        }
        function baseKeys(object) {
          if (!isPrototype(object)) {
            return nativeKeys(object);
          }
          var result2 = [];
          for (var key in Object2(object)) {
            if (hasOwnProperty.call(object, key) && key != "constructor") {
              result2.push(key);
            }
          }
          return result2;
        }
        function baseKeysIn(object) {
          if (!isObject(object)) {
            return nativeKeysIn(object);
          }
          var isProto = isPrototype(object), result2 = [];
          for (var key in object) {
            if (!(key == "constructor" && (isProto || !hasOwnProperty.call(object, key)))) {
              result2.push(key);
            }
          }
          return result2;
        }
        function baseLt(value, other) {
          return value < other;
        }
        function baseMap(collection, iteratee2) {
          var index = -1, result2 = isArrayLike(collection) ? Array2(collection.length) : [];
          baseEach(collection, function(value, key, collection2) {
            result2[++index] = iteratee2(value, key, collection2);
          });
          return result2;
        }
        function baseMatches(source) {
          var matchData = getMatchData(source);
          if (matchData.length == 1 && matchData[0][2]) {
            return matchesStrictComparable(matchData[0][0], matchData[0][1]);
          }
          return function(object) {
            return object === source || baseIsMatch(object, source, matchData);
          };
        }
        function baseMatchesProperty(path, srcValue) {
          if (isKey(path) && isStrictComparable(srcValue)) {
            return matchesStrictComparable(toKey(path), srcValue);
          }
          return function(object) {
            var objValue = get(object, path);
            return objValue === undefined$1 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
          };
        }
        function baseMerge(object, source, srcIndex, customizer, stack) {
          if (object === source) {
            return;
          }
          baseFor(source, function(srcValue, key) {
            stack || (stack = new Stack());
            if (isObject(srcValue)) {
              baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
            } else {
              var newValue = customizer ? customizer(safeGet(object, key), srcValue, key + "", object, source, stack) : undefined$1;
              if (newValue === undefined$1) {
                newValue = srcValue;
              }
              assignMergeValue(object, key, newValue);
            }
          }, keysIn);
        }
        function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
          var objValue = safeGet(object, key), srcValue = safeGet(source, key), stacked = stack.get(srcValue);
          if (stacked) {
            assignMergeValue(object, key, stacked);
            return;
          }
          var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack) : undefined$1;
          var isCommon = newValue === undefined$1;
          if (isCommon) {
            var isArr = isArray(srcValue), isBuff = !isArr && isBuffer(srcValue), isTyped = !isArr && !isBuff && isTypedArray(srcValue);
            newValue = srcValue;
            if (isArr || isBuff || isTyped) {
              if (isArray(objValue)) {
                newValue = objValue;
              } else if (isArrayLikeObject(objValue)) {
                newValue = copyArray(objValue);
              } else if (isBuff) {
                isCommon = false;
                newValue = cloneBuffer(srcValue, true);
              } else if (isTyped) {
                isCommon = false;
                newValue = cloneTypedArray(srcValue, true);
              } else {
                newValue = [];
              }
            } else if (isPlainObject2(srcValue) || isArguments(srcValue)) {
              newValue = objValue;
              if (isArguments(objValue)) {
                newValue = toPlainObject(objValue);
              } else if (!isObject(objValue) || isFunction2(objValue)) {
                newValue = initCloneObject(srcValue);
              }
            } else {
              isCommon = false;
            }
          }
          if (isCommon) {
            stack.set(srcValue, newValue);
            mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
            stack["delete"](srcValue);
          }
          assignMergeValue(object, key, newValue);
        }
        function baseNth(array, n) {
          var length = array.length;
          if (!length) {
            return;
          }
          n += n < 0 ? length : 0;
          return isIndex(n, length) ? array[n] : undefined$1;
        }
        function baseOrderBy(collection, iteratees, orders) {
          if (iteratees.length) {
            iteratees = arrayMap(iteratees, function(iteratee2) {
              if (isArray(iteratee2)) {
                return function(value) {
                  return baseGet(value, iteratee2.length === 1 ? iteratee2[0] : iteratee2);
                };
              }
              return iteratee2;
            });
          } else {
            iteratees = [identity];
          }
          var index = -1;
          iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
          var result2 = baseMap(collection, function(value, key, collection2) {
            var criteria = arrayMap(iteratees, function(iteratee2) {
              return iteratee2(value);
            });
            return { "criteria": criteria, "index": ++index, "value": value };
          });
          return baseSortBy(result2, function(object, other) {
            return compareMultiple(object, other, orders);
          });
        }
        function basePick(object, paths) {
          return basePickBy(object, paths, function(value, path) {
            return hasIn(object, path);
          });
        }
        function basePickBy(object, paths, predicate) {
          var index = -1, length = paths.length, result2 = {};
          while (++index < length) {
            var path = paths[index], value = baseGet(object, path);
            if (predicate(value, path)) {
              baseSet(result2, castPath(path, object), value);
            }
          }
          return result2;
        }
        function basePropertyDeep(path) {
          return function(object) {
            return baseGet(object, path);
          };
        }
        function basePullAll(array, values2, iteratee2, comparator) {
          var indexOf2 = comparator ? baseIndexOfWith : baseIndexOf, index = -1, length = values2.length, seen = array;
          if (array === values2) {
            values2 = copyArray(values2);
          }
          if (iteratee2) {
            seen = arrayMap(array, baseUnary(iteratee2));
          }
          while (++index < length) {
            var fromIndex = 0, value = values2[index], computed = iteratee2 ? iteratee2(value) : value;
            while ((fromIndex = indexOf2(seen, computed, fromIndex, comparator)) > -1) {
              if (seen !== array) {
                splice.call(seen, fromIndex, 1);
              }
              splice.call(array, fromIndex, 1);
            }
          }
          return array;
        }
        function basePullAt(array, indexes) {
          var length = array ? indexes.length : 0, lastIndex = length - 1;
          while (length--) {
            var index = indexes[length];
            if (length == lastIndex || index !== previous) {
              var previous = index;
              if (isIndex(index)) {
                splice.call(array, index, 1);
              } else {
                baseUnset(array, index);
              }
            }
          }
          return array;
        }
        function baseRandom(lower, upper) {
          return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
        }
        function baseRange(start, end, step, fromRight) {
          var index = -1, length = nativeMax(nativeCeil((end - start) / (step || 1)), 0), result2 = Array2(length);
          while (length--) {
            result2[fromRight ? length : ++index] = start;
            start += step;
          }
          return result2;
        }
        function baseRepeat(string, n) {
          var result2 = "";
          if (!string || n < 1 || n > MAX_SAFE_INTEGER) {
            return result2;
          }
          do {
            if (n % 2) {
              result2 += string;
            }
            n = nativeFloor(n / 2);
            if (n) {
              string += string;
            }
          } while (n);
          return result2;
        }
        function baseRest(func, start) {
          return setToString(overRest(func, start, identity), func + "");
        }
        function baseSample(collection) {
          return arraySample(values(collection));
        }
        function baseSampleSize(collection, n) {
          var array = values(collection);
          return shuffleSelf(array, baseClamp(n, 0, array.length));
        }
        function baseSet(object, path, value, customizer) {
          if (!isObject(object)) {
            return object;
          }
          path = castPath(path, object);
          var index = -1, length = path.length, lastIndex = length - 1, nested = object;
          while (nested != null && ++index < length) {
            var key = toKey(path[index]), newValue = value;
            if (key === "__proto__" || key === "constructor" || key === "prototype") {
              return object;
            }
            if (index != lastIndex) {
              var objValue = nested[key];
              newValue = customizer ? customizer(objValue, key, nested) : undefined$1;
              if (newValue === undefined$1) {
                newValue = isObject(objValue) ? objValue : isIndex(path[index + 1]) ? [] : {};
              }
            }
            assignValue(nested, key, newValue);
            nested = nested[key];
          }
          return object;
        }
        var baseSetData = !metaMap ? identity : function(func, data) {
          metaMap.set(func, data);
          return func;
        };
        var baseSetToString = !defineProperty ? identity : function(func, string) {
          return defineProperty(func, "toString", {
            "configurable": true,
            "enumerable": false,
            "value": constant(string),
            "writable": true
          });
        };
        function baseShuffle(collection) {
          return shuffleSelf(values(collection));
        }
        function baseSlice(array, start, end) {
          var index = -1, length = array.length;
          if (start < 0) {
            start = -start > length ? 0 : length + start;
          }
          end = end > length ? length : end;
          if (end < 0) {
            end += length;
          }
          length = start > end ? 0 : end - start >>> 0;
          start >>>= 0;
          var result2 = Array2(length);
          while (++index < length) {
            result2[index] = array[index + start];
          }
          return result2;
        }
        function baseSome(collection, predicate) {
          var result2;
          baseEach(collection, function(value, index, collection2) {
            result2 = predicate(value, index, collection2);
            return !result2;
          });
          return !!result2;
        }
        function baseSortedIndex(array, value, retHighest) {
          var low = 0, high = array == null ? low : array.length;
          if (typeof value == "number" && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
            while (low < high) {
              var mid = low + high >>> 1, computed = array[mid];
              if (computed !== null && !isSymbol(computed) && (retHighest ? computed <= value : computed < value)) {
                low = mid + 1;
              } else {
                high = mid;
              }
            }
            return high;
          }
          return baseSortedIndexBy(array, value, identity, retHighest);
        }
        function baseSortedIndexBy(array, value, iteratee2, retHighest) {
          var low = 0, high = array == null ? 0 : array.length;
          if (high === 0) {
            return 0;
          }
          value = iteratee2(value);
          var valIsNaN = value !== value, valIsNull = value === null, valIsSymbol = isSymbol(value), valIsUndefined = value === undefined$1;
          while (low < high) {
            var mid = nativeFloor((low + high) / 2), computed = iteratee2(array[mid]), othIsDefined = computed !== undefined$1, othIsNull = computed === null, othIsReflexive = computed === computed, othIsSymbol = isSymbol(computed);
            if (valIsNaN) {
              var setLow = retHighest || othIsReflexive;
            } else if (valIsUndefined) {
              setLow = othIsReflexive && (retHighest || othIsDefined);
            } else if (valIsNull) {
              setLow = othIsReflexive && othIsDefined && (retHighest || !othIsNull);
            } else if (valIsSymbol) {
              setLow = othIsReflexive && othIsDefined && !othIsNull && (retHighest || !othIsSymbol);
            } else if (othIsNull || othIsSymbol) {
              setLow = false;
            } else {
              setLow = retHighest ? computed <= value : computed < value;
            }
            if (setLow) {
              low = mid + 1;
            } else {
              high = mid;
            }
          }
          return nativeMin(high, MAX_ARRAY_INDEX);
        }
        function baseSortedUniq(array, iteratee2) {
          var index = -1, length = array.length, resIndex = 0, result2 = [];
          while (++index < length) {
            var value = array[index], computed = iteratee2 ? iteratee2(value) : value;
            if (!index || !eq(computed, seen)) {
              var seen = computed;
              result2[resIndex++] = value === 0 ? 0 : value;
            }
          }
          return result2;
        }
        function baseToNumber(value) {
          if (typeof value == "number") {
            return value;
          }
          if (isSymbol(value)) {
            return NAN;
          }
          return +value;
        }
        function baseToString(value) {
          if (typeof value == "string") {
            return value;
          }
          if (isArray(value)) {
            return arrayMap(value, baseToString) + "";
          }
          if (isSymbol(value)) {
            return symbolToString ? symbolToString.call(value) : "";
          }
          var result2 = value + "";
          return result2 == "0" && 1 / value == -INFINITY ? "-0" : result2;
        }
        function baseUniq(array, iteratee2, comparator) {
          var index = -1, includes2 = arrayIncludes, length = array.length, isCommon = true, result2 = [], seen = result2;
          if (comparator) {
            isCommon = false;
            includes2 = arrayIncludesWith;
          } else if (length >= LARGE_ARRAY_SIZE) {
            var set2 = iteratee2 ? null : createSet(array);
            if (set2) {
              return setToArray(set2);
            }
            isCommon = false;
            includes2 = cacheHas;
            seen = new SetCache();
          } else {
            seen = iteratee2 ? [] : result2;
          }
          outer:
            while (++index < length) {
              var value = array[index], computed = iteratee2 ? iteratee2(value) : value;
              value = comparator || value !== 0 ? value : 0;
              if (isCommon && computed === computed) {
                var seenIndex = seen.length;
                while (seenIndex--) {
                  if (seen[seenIndex] === computed) {
                    continue outer;
                  }
                }
                if (iteratee2) {
                  seen.push(computed);
                }
                result2.push(value);
              } else if (!includes2(seen, computed, comparator)) {
                if (seen !== result2) {
                  seen.push(computed);
                }
                result2.push(value);
              }
            }
          return result2;
        }
        function baseUnset(object, path) {
          path = castPath(path, object);
          object = parent(object, path);
          return object == null || delete object[toKey(last(path))];
        }
        function baseUpdate(object, path, updater, customizer) {
          return baseSet(object, path, updater(baseGet(object, path)), customizer);
        }
        function baseWhile(array, predicate, isDrop, fromRight) {
          var length = array.length, index = fromRight ? length : -1;
          while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {
          }
          return isDrop ? baseSlice(array, fromRight ? 0 : index, fromRight ? index + 1 : length) : baseSlice(array, fromRight ? index + 1 : 0, fromRight ? length : index);
        }
        function baseWrapperValue(value, actions) {
          var result2 = value;
          if (result2 instanceof LazyWrapper) {
            result2 = result2.value();
          }
          return arrayReduce(actions, function(result3, action) {
            return action.func.apply(action.thisArg, arrayPush([result3], action.args));
          }, result2);
        }
        function baseXor(arrays, iteratee2, comparator) {
          var length = arrays.length;
          if (length < 2) {
            return length ? baseUniq(arrays[0]) : [];
          }
          var index = -1, result2 = Array2(length);
          while (++index < length) {
            var array = arrays[index], othIndex = -1;
            while (++othIndex < length) {
              if (othIndex != index) {
                result2[index] = baseDifference(result2[index] || array, arrays[othIndex], iteratee2, comparator);
              }
            }
          }
          return baseUniq(baseFlatten(result2, 1), iteratee2, comparator);
        }
        function baseZipObject(props, values2, assignFunc) {
          var index = -1, length = props.length, valsLength = values2.length, result2 = {};
          while (++index < length) {
            var value = index < valsLength ? values2[index] : undefined$1;
            assignFunc(result2, props[index], value);
          }
          return result2;
        }
        function castArrayLikeObject(value) {
          return isArrayLikeObject(value) ? value : [];
        }
        function castFunction(value) {
          return typeof value == "function" ? value : identity;
        }
        function castPath(value, object) {
          if (isArray(value)) {
            return value;
          }
          return isKey(value, object) ? [value] : stringToPath(toString(value));
        }
        var castRest = baseRest;
        function castSlice(array, start, end) {
          var length = array.length;
          end = end === undefined$1 ? length : end;
          return !start && end >= length ? array : baseSlice(array, start, end);
        }
        var clearTimeout2 = ctxClearTimeout || function(id) {
          return root.clearTimeout(id);
        };
        function cloneBuffer(buffer, isDeep) {
          if (isDeep) {
            return buffer.slice();
          }
          var length = buffer.length, result2 = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
          buffer.copy(result2);
          return result2;
        }
        function cloneArrayBuffer(arrayBuffer) {
          var result2 = new arrayBuffer.constructor(arrayBuffer.byteLength);
          new Uint8Array2(result2).set(new Uint8Array2(arrayBuffer));
          return result2;
        }
        function cloneDataView(dataView, isDeep) {
          var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
          return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
        }
        function cloneRegExp(regexp) {
          var result2 = new regexp.constructor(regexp.source, reFlags.exec(regexp));
          result2.lastIndex = regexp.lastIndex;
          return result2;
        }
        function cloneSymbol(symbol) {
          return symbolValueOf ? Object2(symbolValueOf.call(symbol)) : {};
        }
        function cloneTypedArray(typedArray, isDeep) {
          var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
          return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
        }
        function compareAscending(value, other) {
          if (value !== other) {
            var valIsDefined = value !== undefined$1, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol(value);
            var othIsDefined = other !== undefined$1, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol(other);
            if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
              return 1;
            }
            if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
              return -1;
            }
          }
          return 0;
        }
        function compareMultiple(object, other, orders) {
          var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
          while (++index < length) {
            var result2 = compareAscending(objCriteria[index], othCriteria[index]);
            if (result2) {
              if (index >= ordersLength) {
                return result2;
              }
              var order = orders[index];
              return result2 * (order == "desc" ? -1 : 1);
            }
          }
          return object.index - other.index;
        }
        function composeArgs(args, partials, holders, isCurried) {
          var argsIndex = -1, argsLength = args.length, holdersLength = holders.length, leftIndex = -1, leftLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(leftLength + rangeLength), isUncurried = !isCurried;
          while (++leftIndex < leftLength) {
            result2[leftIndex] = partials[leftIndex];
          }
          while (++argsIndex < holdersLength) {
            if (isUncurried || argsIndex < argsLength) {
              result2[holders[argsIndex]] = args[argsIndex];
            }
          }
          while (rangeLength--) {
            result2[leftIndex++] = args[argsIndex++];
          }
          return result2;
        }
        function composeArgsRight(args, partials, holders, isCurried) {
          var argsIndex = -1, argsLength = args.length, holdersIndex = -1, holdersLength = holders.length, rightIndex = -1, rightLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(rangeLength + rightLength), isUncurried = !isCurried;
          while (++argsIndex < rangeLength) {
            result2[argsIndex] = args[argsIndex];
          }
          var offset = argsIndex;
          while (++rightIndex < rightLength) {
            result2[offset + rightIndex] = partials[rightIndex];
          }
          while (++holdersIndex < holdersLength) {
            if (isUncurried || argsIndex < argsLength) {
              result2[offset + holders[holdersIndex]] = args[argsIndex++];
            }
          }
          return result2;
        }
        function copyArray(source, array) {
          var index = -1, length = source.length;
          array || (array = Array2(length));
          while (++index < length) {
            array[index] = source[index];
          }
          return array;
        }
        function copyObject(source, props, object, customizer) {
          var isNew = !object;
          object || (object = {});
          var index = -1, length = props.length;
          while (++index < length) {
            var key = props[index];
            var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined$1;
            if (newValue === undefined$1) {
              newValue = source[key];
            }
            if (isNew) {
              baseAssignValue(object, key, newValue);
            } else {
              assignValue(object, key, newValue);
            }
          }
          return object;
        }
        function copySymbols(source, object) {
          return copyObject(source, getSymbols(source), object);
        }
        function copySymbolsIn(source, object) {
          return copyObject(source, getSymbolsIn(source), object);
        }
        function createAggregator(setter, initializer) {
          return function(collection, iteratee2) {
            var func = isArray(collection) ? arrayAggregator : baseAggregator, accumulator = initializer ? initializer() : {};
            return func(collection, setter, getIteratee(iteratee2, 2), accumulator);
          };
        }
        function createAssigner(assigner) {
          return baseRest(function(object, sources) {
            var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : undefined$1, guard = length > 2 ? sources[2] : undefined$1;
            customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : undefined$1;
            if (guard && isIterateeCall(sources[0], sources[1], guard)) {
              customizer = length < 3 ? undefined$1 : customizer;
              length = 1;
            }
            object = Object2(object);
            while (++index < length) {
              var source = sources[index];
              if (source) {
                assigner(object, source, index, customizer);
              }
            }
            return object;
          });
        }
        function createBaseEach(eachFunc, fromRight) {
          return function(collection, iteratee2) {
            if (collection == null) {
              return collection;
            }
            if (!isArrayLike(collection)) {
              return eachFunc(collection, iteratee2);
            }
            var length = collection.length, index = fromRight ? length : -1, iterable = Object2(collection);
            while (fromRight ? index-- : ++index < length) {
              if (iteratee2(iterable[index], index, iterable) === false) {
                break;
              }
            }
            return collection;
          };
        }
        function createBaseFor(fromRight) {
          return function(object, iteratee2, keysFunc) {
            var index = -1, iterable = Object2(object), props = keysFunc(object), length = props.length;
            while (length--) {
              var key = props[fromRight ? length : ++index];
              if (iteratee2(iterable[key], key, iterable) === false) {
                break;
              }
            }
            return object;
          };
        }
        function createBind(func, bitmask, thisArg) {
          var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
          function wrapper() {
            var fn = this && this !== root && this instanceof wrapper ? Ctor : func;
            return fn.apply(isBind ? thisArg : this, arguments);
          }
          return wrapper;
        }
        function createCaseFirst(methodName) {
          return function(string) {
            string = toString(string);
            var strSymbols = hasUnicode(string) ? stringToArray2(string) : undefined$1;
            var chr = strSymbols ? strSymbols[0] : string.charAt(0);
            var trailing = strSymbols ? castSlice(strSymbols, 1).join("") : string.slice(1);
            return chr[methodName]() + trailing;
          };
        }
        function createCompounder(callback) {
          return function(string) {
            return arrayReduce(words(deburr(string).replace(reApos, "")), callback, "");
          };
        }
        function createCtor(Ctor) {
          return function() {
            var args = arguments;
            switch (args.length) {
              case 0:
                return new Ctor();
              case 1:
                return new Ctor(args[0]);
              case 2:
                return new Ctor(args[0], args[1]);
              case 3:
                return new Ctor(args[0], args[1], args[2]);
              case 4:
                return new Ctor(args[0], args[1], args[2], args[3]);
              case 5:
                return new Ctor(args[0], args[1], args[2], args[3], args[4]);
              case 6:
                return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
              case 7:
                return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
            }
            var thisBinding = baseCreate(Ctor.prototype), result2 = Ctor.apply(thisBinding, args);
            return isObject(result2) ? result2 : thisBinding;
          };
        }
        function createCurry(func, bitmask, arity) {
          var Ctor = createCtor(func);
          function wrapper() {
            var length = arguments.length, args = Array2(length), index = length, placeholder = getHolder(wrapper);
            while (index--) {
              args[index] = arguments[index];
            }
            var holders = length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder ? [] : replaceHolders(args, placeholder);
            length -= holders.length;
            if (length < arity) {
              return createRecurry(
                func,
                bitmask,
                createHybrid,
                wrapper.placeholder,
                undefined$1,
                args,
                holders,
                undefined$1,
                undefined$1,
                arity - length
              );
            }
            var fn = this && this !== root && this instanceof wrapper ? Ctor : func;
            return apply2(fn, this, args);
          }
          return wrapper;
        }
        function createFind(findIndexFunc) {
          return function(collection, predicate, fromIndex) {
            var iterable = Object2(collection);
            if (!isArrayLike(collection)) {
              var iteratee2 = getIteratee(predicate, 3);
              collection = keys2(collection);
              predicate = function(key) {
                return iteratee2(iterable[key], key, iterable);
              };
            }
            var index = findIndexFunc(collection, predicate, fromIndex);
            return index > -1 ? iterable[iteratee2 ? collection[index] : index] : undefined$1;
          };
        }
        function createFlow(fromRight) {
          return flatRest(function(funcs) {
            var length = funcs.length, index = length, prereq = LodashWrapper.prototype.thru;
            if (fromRight) {
              funcs.reverse();
            }
            while (index--) {
              var func = funcs[index];
              if (typeof func != "function") {
                throw new TypeError2(FUNC_ERROR_TEXT);
              }
              if (prereq && !wrapper && getFuncName(func) == "wrapper") {
                var wrapper = new LodashWrapper([], true);
              }
            }
            index = wrapper ? index : length;
            while (++index < length) {
              func = funcs[index];
              var funcName = getFuncName(func), data = funcName == "wrapper" ? getData(func) : undefined$1;
              if (data && isLaziable(data[0]) && data[1] == (WRAP_ARY_FLAG | WRAP_CURRY_FLAG | WRAP_PARTIAL_FLAG | WRAP_REARG_FLAG) && !data[4].length && data[9] == 1) {
                wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
              } else {
                wrapper = func.length == 1 && isLaziable(func) ? wrapper[funcName]() : wrapper.thru(func);
              }
            }
            return function() {
              var args = arguments, value = args[0];
              if (wrapper && args.length == 1 && isArray(value)) {
                return wrapper.plant(value).value();
              }
              var index2 = 0, result2 = length ? funcs[index2].apply(this, args) : value;
              while (++index2 < length) {
                result2 = funcs[index2].call(this, result2);
              }
              return result2;
            };
          });
        }
        function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary2, arity) {
          var isAry = bitmask & WRAP_ARY_FLAG, isBind = bitmask & WRAP_BIND_FLAG, isBindKey = bitmask & WRAP_BIND_KEY_FLAG, isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG), isFlip = bitmask & WRAP_FLIP_FLAG, Ctor = isBindKey ? undefined$1 : createCtor(func);
          function wrapper() {
            var length = arguments.length, args = Array2(length), index = length;
            while (index--) {
              args[index] = arguments[index];
            }
            if (isCurried) {
              var placeholder = getHolder(wrapper), holdersCount = countHolders(args, placeholder);
            }
            if (partials) {
              args = composeArgs(args, partials, holders, isCurried);
            }
            if (partialsRight) {
              args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
            }
            length -= holdersCount;
            if (isCurried && length < arity) {
              var newHolders = replaceHolders(args, placeholder);
              return createRecurry(
                func,
                bitmask,
                createHybrid,
                wrapper.placeholder,
                thisArg,
                args,
                newHolders,
                argPos,
                ary2,
                arity - length
              );
            }
            var thisBinding = isBind ? thisArg : this, fn = isBindKey ? thisBinding[func] : func;
            length = args.length;
            if (argPos) {
              args = reorder(args, argPos);
            } else if (isFlip && length > 1) {
              args.reverse();
            }
            if (isAry && ary2 < length) {
              args.length = ary2;
            }
            if (this && this !== root && this instanceof wrapper) {
              fn = Ctor || createCtor(fn);
            }
            return fn.apply(thisBinding, args);
          }
          return wrapper;
        }
        function createInverter(setter, toIteratee) {
          return function(object, iteratee2) {
            return baseInverter(object, setter, toIteratee(iteratee2), {});
          };
        }
        function createMathOperation(operator, defaultValue) {
          return function(value, other) {
            var result2;
            if (value === undefined$1 && other === undefined$1) {
              return defaultValue;
            }
            if (value !== undefined$1) {
              result2 = value;
            }
            if (other !== undefined$1) {
              if (result2 === undefined$1) {
                return other;
              }
              if (typeof value == "string" || typeof other == "string") {
                value = baseToString(value);
                other = baseToString(other);
              } else {
                value = baseToNumber(value);
                other = baseToNumber(other);
              }
              result2 = operator(value, other);
            }
            return result2;
          };
        }
        function createOver(arrayFunc) {
          return flatRest(function(iteratees) {
            iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
            return baseRest(function(args) {
              var thisArg = this;
              return arrayFunc(iteratees, function(iteratee2) {
                return apply2(iteratee2, thisArg, args);
              });
            });
          });
        }
        function createPadding(length, chars) {
          chars = chars === undefined$1 ? " " : baseToString(chars);
          var charsLength = chars.length;
          if (charsLength < 2) {
            return charsLength ? baseRepeat(chars, length) : chars;
          }
          var result2 = baseRepeat(chars, nativeCeil(length / stringSize(chars)));
          return hasUnicode(chars) ? castSlice(stringToArray2(result2), 0, length).join("") : result2.slice(0, length);
        }
        function createPartial(func, bitmask, thisArg, partials) {
          var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
          function wrapper() {
            var argsIndex = -1, argsLength = arguments.length, leftIndex = -1, leftLength = partials.length, args = Array2(leftLength + argsLength), fn = this && this !== root && this instanceof wrapper ? Ctor : func;
            while (++leftIndex < leftLength) {
              args[leftIndex] = partials[leftIndex];
            }
            while (argsLength--) {
              args[leftIndex++] = arguments[++argsIndex];
            }
            return apply2(fn, isBind ? thisArg : this, args);
          }
          return wrapper;
        }
        function createRange(fromRight) {
          return function(start, end, step) {
            if (step && typeof step != "number" && isIterateeCall(start, end, step)) {
              end = step = undefined$1;
            }
            start = toFinite(start);
            if (end === undefined$1) {
              end = start;
              start = 0;
            } else {
              end = toFinite(end);
            }
            step = step === undefined$1 ? start < end ? 1 : -1 : toFinite(step);
            return baseRange(start, end, step, fromRight);
          };
        }
        function createRelationalOperation(operator) {
          return function(value, other) {
            if (!(typeof value == "string" && typeof other == "string")) {
              value = toNumber(value);
              other = toNumber(other);
            }
            return operator(value, other);
          };
        }
        function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary2, arity) {
          var isCurry = bitmask & WRAP_CURRY_FLAG, newHolders = isCurry ? holders : undefined$1, newHoldersRight = isCurry ? undefined$1 : holders, newPartials = isCurry ? partials : undefined$1, newPartialsRight = isCurry ? undefined$1 : partials;
          bitmask |= isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG;
          bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);
          if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
            bitmask &= ~(WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG);
          }
          var newData = [
            func,
            bitmask,
            thisArg,
            newPartials,
            newHolders,
            newPartialsRight,
            newHoldersRight,
            argPos,
            ary2,
            arity
          ];
          var result2 = wrapFunc.apply(undefined$1, newData);
          if (isLaziable(func)) {
            setData(result2, newData);
          }
          result2.placeholder = placeholder;
          return setWrapToString(result2, func, bitmask);
        }
        function createRound(methodName) {
          var func = Math2[methodName];
          return function(number, precision) {
            number = toNumber(number);
            precision = precision == null ? 0 : nativeMin(toInteger(precision), 292);
            if (precision && nativeIsFinite(number)) {
              var pair = (toString(number) + "e").split("e"), value = func(pair[0] + "e" + (+pair[1] + precision));
              pair = (toString(value) + "e").split("e");
              return +(pair[0] + "e" + (+pair[1] - precision));
            }
            return func(number);
          };
        }
        var createSet = !(Set2 && 1 / setToArray(new Set2([, -0]))[1] == INFINITY) ? noop2 : function(values2) {
          return new Set2(values2);
        };
        function createToPairs(keysFunc) {
          return function(object) {
            var tag = getTag(object);
            if (tag == mapTag) {
              return mapToArray(object);
            }
            if (tag == setTag) {
              return setToPairs(object);
            }
            return baseToPairs(object, keysFunc(object));
          };
        }
        function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary2, arity) {
          var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
          if (!isBindKey && typeof func != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          var length = partials ? partials.length : 0;
          if (!length) {
            bitmask &= ~(WRAP_PARTIAL_FLAG | WRAP_PARTIAL_RIGHT_FLAG);
            partials = holders = undefined$1;
          }
          ary2 = ary2 === undefined$1 ? ary2 : nativeMax(toInteger(ary2), 0);
          arity = arity === undefined$1 ? arity : toInteger(arity);
          length -= holders ? holders.length : 0;
          if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
            var partialsRight = partials, holdersRight = holders;
            partials = holders = undefined$1;
          }
          var data = isBindKey ? undefined$1 : getData(func);
          var newData = [
            func,
            bitmask,
            thisArg,
            partials,
            holders,
            partialsRight,
            holdersRight,
            argPos,
            ary2,
            arity
          ];
          if (data) {
            mergeData(newData, data);
          }
          func = newData[0];
          bitmask = newData[1];
          thisArg = newData[2];
          partials = newData[3];
          holders = newData[4];
          arity = newData[9] = newData[9] === undefined$1 ? isBindKey ? 0 : func.length : nativeMax(newData[9] - length, 0);
          if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
            bitmask &= ~(WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG);
          }
          if (!bitmask || bitmask == WRAP_BIND_FLAG) {
            var result2 = createBind(func, bitmask, thisArg);
          } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
            result2 = createCurry(func, bitmask, arity);
          } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
            result2 = createPartial(func, bitmask, thisArg, partials);
          } else {
            result2 = createHybrid.apply(undefined$1, newData);
          }
          var setter = data ? baseSetData : setData;
          return setWrapToString(setter(result2, newData), func, bitmask);
        }
        function customDefaultsAssignIn(objValue, srcValue, key, object) {
          if (objValue === undefined$1 || eq(objValue, objectProto[key]) && !hasOwnProperty.call(object, key)) {
            return srcValue;
          }
          return objValue;
        }
        function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
          if (isObject(objValue) && isObject(srcValue)) {
            stack.set(srcValue, objValue);
            baseMerge(objValue, srcValue, undefined$1, customDefaultsMerge, stack);
            stack["delete"](srcValue);
          }
          return objValue;
        }
        function customOmitClone(value) {
          return isPlainObject2(value) ? undefined$1 : value;
        }
        function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
          if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
            return false;
          }
          var arrStacked = stack.get(array);
          var othStacked = stack.get(other);
          if (arrStacked && othStacked) {
            return arrStacked == other && othStacked == array;
          }
          var index = -1, result2 = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : undefined$1;
          stack.set(array, other);
          stack.set(other, array);
          while (++index < arrLength) {
            var arrValue = array[index], othValue = other[index];
            if (customizer) {
              var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
            }
            if (compared !== undefined$1) {
              if (compared) {
                continue;
              }
              result2 = false;
              break;
            }
            if (seen) {
              if (!arraySome(other, function(othValue2, othIndex) {
                if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
                  return seen.push(othIndex);
                }
              })) {
                result2 = false;
                break;
              }
            } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              result2 = false;
              break;
            }
          }
          stack["delete"](array);
          stack["delete"](other);
          return result2;
        }
        function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
          switch (tag) {
            case dataViewTag:
              if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
                return false;
              }
              object = object.buffer;
              other = other.buffer;
            case arrayBufferTag:
              if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
                return false;
              }
              return true;
            case boolTag:
            case dateTag:
            case numberTag:
              return eq(+object, +other);
            case errorTag:
              return object.name == other.name && object.message == other.message;
            case regexpTag:
            case stringTag:
              return object == other + "";
            case mapTag:
              var convert = mapToArray;
            case setTag:
              var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
              convert || (convert = setToArray);
              if (object.size != other.size && !isPartial) {
                return false;
              }
              var stacked = stack.get(object);
              if (stacked) {
                return stacked == other;
              }
              bitmask |= COMPARE_UNORDERED_FLAG;
              stack.set(object, other);
              var result2 = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
              stack["delete"](object);
              return result2;
            case symbolTag:
              if (symbolValueOf) {
                return symbolValueOf.call(object) == symbolValueOf.call(other);
              }
          }
          return false;
        }
        function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
          if (objLength != othLength && !isPartial) {
            return false;
          }
          var index = objLength;
          while (index--) {
            var key = objProps[index];
            if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
              return false;
            }
          }
          var objStacked = stack.get(object);
          var othStacked = stack.get(other);
          if (objStacked && othStacked) {
            return objStacked == other && othStacked == object;
          }
          var result2 = true;
          stack.set(object, other);
          stack.set(other, object);
          var skipCtor = isPartial;
          while (++index < objLength) {
            key = objProps[index];
            var objValue = object[key], othValue = other[key];
            if (customizer) {
              var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
            }
            if (!(compared === undefined$1 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
              result2 = false;
              break;
            }
            skipCtor || (skipCtor = key == "constructor");
          }
          if (result2 && !skipCtor) {
            var objCtor = object.constructor, othCtor = other.constructor;
            if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
              result2 = false;
            }
          }
          stack["delete"](object);
          stack["delete"](other);
          return result2;
        }
        function flatRest(func) {
          return setToString(overRest(func, undefined$1, flatten), func + "");
        }
        function getAllKeys(object) {
          return baseGetAllKeys(object, keys2, getSymbols);
        }
        function getAllKeysIn(object) {
          return baseGetAllKeys(object, keysIn, getSymbolsIn);
        }
        var getData = !metaMap ? noop2 : function(func) {
          return metaMap.get(func);
        };
        function getFuncName(func) {
          var result2 = func.name + "", array = realNames[result2], length = hasOwnProperty.call(realNames, result2) ? array.length : 0;
          while (length--) {
            var data = array[length], otherFunc = data.func;
            if (otherFunc == null || otherFunc == func) {
              return data.name;
            }
          }
          return result2;
        }
        function getHolder(func) {
          var object = hasOwnProperty.call(lodash2, "placeholder") ? lodash2 : func;
          return object.placeholder;
        }
        function getIteratee() {
          var result2 = lodash2.iteratee || iteratee;
          result2 = result2 === iteratee ? baseIteratee : result2;
          return arguments.length ? result2(arguments[0], arguments[1]) : result2;
        }
        function getMapData(map2, key) {
          var data = map2.__data__;
          return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
        }
        function getMatchData(object) {
          var result2 = keys2(object), length = result2.length;
          while (length--) {
            var key = result2[length], value = object[key];
            result2[length] = [key, value, isStrictComparable(value)];
          }
          return result2;
        }
        function getNative(object, key) {
          var value = getValue(object, key);
          return baseIsNative(value) ? value : undefined$1;
        }
        function getRawTag(value) {
          var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
          try {
            value[symToStringTag] = undefined$1;
            var unmasked = true;
          } catch (e) {
          }
          var result2 = nativeObjectToString.call(value);
          if (unmasked) {
            if (isOwn) {
              value[symToStringTag] = tag;
            } else {
              delete value[symToStringTag];
            }
          }
          return result2;
        }
        var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
          if (object == null) {
            return [];
          }
          object = Object2(object);
          return arrayFilter(nativeGetSymbols(object), function(symbol) {
            return propertyIsEnumerable.call(object, symbol);
          });
        };
        var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
          var result2 = [];
          while (object) {
            arrayPush(result2, getSymbols(object));
            object = getPrototype(object);
          }
          return result2;
        };
        var getTag = baseGetTag;
        if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap2 && getTag(new WeakMap2()) != weakMapTag) {
          getTag = function(value) {
            var result2 = baseGetTag(value), Ctor = result2 == objectTag ? value.constructor : undefined$1, ctorString = Ctor ? toSource(Ctor) : "";
            if (ctorString) {
              switch (ctorString) {
                case dataViewCtorString:
                  return dataViewTag;
                case mapCtorString:
                  return mapTag;
                case promiseCtorString:
                  return promiseTag;
                case setCtorString:
                  return setTag;
                case weakMapCtorString:
                  return weakMapTag;
              }
            }
            return result2;
          };
        }
        function getView(start, end, transforms) {
          var index = -1, length = transforms.length;
          while (++index < length) {
            var data = transforms[index], size2 = data.size;
            switch (data.type) {
              case "drop":
                start += size2;
                break;
              case "dropRight":
                end -= size2;
                break;
              case "take":
                end = nativeMin(end, start + size2);
                break;
              case "takeRight":
                start = nativeMax(start, end - size2);
                break;
            }
          }
          return { "start": start, "end": end };
        }
        function getWrapDetails(source) {
          var match = source.match(reWrapDetails);
          return match ? match[1].split(reSplitDetails) : [];
        }
        function hasPath(object, path, hasFunc) {
          path = castPath(path, object);
          var index = -1, length = path.length, result2 = false;
          while (++index < length) {
            var key = toKey(path[index]);
            if (!(result2 = object != null && hasFunc(object, key))) {
              break;
            }
            object = object[key];
          }
          if (result2 || ++index != length) {
            return result2;
          }
          length = object == null ? 0 : object.length;
          return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
        }
        function initCloneArray(array) {
          var length = array.length, result2 = new array.constructor(length);
          if (length && typeof array[0] == "string" && hasOwnProperty.call(array, "index")) {
            result2.index = array.index;
            result2.input = array.input;
          }
          return result2;
        }
        function initCloneObject(object) {
          return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
        }
        function initCloneByTag(object, tag, isDeep) {
          var Ctor = object.constructor;
          switch (tag) {
            case arrayBufferTag:
              return cloneArrayBuffer(object);
            case boolTag:
            case dateTag:
              return new Ctor(+object);
            case dataViewTag:
              return cloneDataView(object, isDeep);
            case float32Tag:
            case float64Tag:
            case int8Tag:
            case int16Tag:
            case int32Tag:
            case uint8Tag:
            case uint8ClampedTag:
            case uint16Tag:
            case uint32Tag:
              return cloneTypedArray(object, isDeep);
            case mapTag:
              return new Ctor();
            case numberTag:
            case stringTag:
              return new Ctor(object);
            case regexpTag:
              return cloneRegExp(object);
            case setTag:
              return new Ctor();
            case symbolTag:
              return cloneSymbol(object);
          }
        }
        function insertWrapDetails(source, details) {
          var length = details.length;
          if (!length) {
            return source;
          }
          var lastIndex = length - 1;
          details[lastIndex] = (length > 1 ? "& " : "") + details[lastIndex];
          details = details.join(length > 2 ? ", " : " ");
          return source.replace(reWrapComment, "{\n/* [wrapped with " + details + "] */\n");
        }
        function isFlattenable(value) {
          return isArray(value) || isArguments(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
        }
        function isIndex(value, length) {
          var type = typeof value;
          length = length == null ? MAX_SAFE_INTEGER : length;
          return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
        }
        function isIterateeCall(value, index, object) {
          if (!isObject(object)) {
            return false;
          }
          var type = typeof index;
          if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
            return eq(object[index], value);
          }
          return false;
        }
        function isKey(value, object) {
          if (isArray(value)) {
            return false;
          }
          var type = typeof value;
          if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
            return true;
          }
          return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object2(object);
        }
        function isKeyable(value) {
          var type = typeof value;
          return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
        }
        function isLaziable(func) {
          var funcName = getFuncName(func), other = lodash2[funcName];
          if (typeof other != "function" || !(funcName in LazyWrapper.prototype)) {
            return false;
          }
          if (func === other) {
            return true;
          }
          var data = getData(other);
          return !!data && func === data[0];
        }
        function isMasked(func) {
          return !!maskSrcKey && maskSrcKey in func;
        }
        var isMaskable = coreJsData ? isFunction2 : stubFalse;
        function isPrototype(value) {
          var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
          return value === proto;
        }
        function isStrictComparable(value) {
          return value === value && !isObject(value);
        }
        function matchesStrictComparable(key, srcValue) {
          return function(object) {
            if (object == null) {
              return false;
            }
            return object[key] === srcValue && (srcValue !== undefined$1 || key in Object2(object));
          };
        }
        function memoizeCapped(func) {
          var result2 = memoize(func, function(key) {
            if (cache.size === MAX_MEMOIZE_SIZE) {
              cache.clear();
            }
            return key;
          });
          var cache = result2.cache;
          return result2;
        }
        function mergeData(data, source) {
          var bitmask = data[1], srcBitmask = source[1], newBitmask = bitmask | srcBitmask, isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);
          var isCombo = srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_CURRY_FLAG || srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_REARG_FLAG && data[7].length <= source[8] || srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG) && source[7].length <= source[8] && bitmask == WRAP_CURRY_FLAG;
          if (!(isCommon || isCombo)) {
            return data;
          }
          if (srcBitmask & WRAP_BIND_FLAG) {
            data[2] = source[2];
            newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
          }
          var value = source[3];
          if (value) {
            var partials = data[3];
            data[3] = partials ? composeArgs(partials, value, source[4]) : value;
            data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source[4];
          }
          value = source[5];
          if (value) {
            partials = data[5];
            data[5] = partials ? composeArgsRight(partials, value, source[6]) : value;
            data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source[6];
          }
          value = source[7];
          if (value) {
            data[7] = value;
          }
          if (srcBitmask & WRAP_ARY_FLAG) {
            data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
          }
          if (data[9] == null) {
            data[9] = source[9];
          }
          data[0] = source[0];
          data[1] = newBitmask;
          return data;
        }
        function nativeKeysIn(object) {
          var result2 = [];
          if (object != null) {
            for (var key in Object2(object)) {
              result2.push(key);
            }
          }
          return result2;
        }
        function objectToString(value) {
          return nativeObjectToString.call(value);
        }
        function overRest(func, start, transform2) {
          start = nativeMax(start === undefined$1 ? func.length - 1 : start, 0);
          return function() {
            var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array2(length);
            while (++index < length) {
              array[index] = args[start + index];
            }
            index = -1;
            var otherArgs = Array2(start + 1);
            while (++index < start) {
              otherArgs[index] = args[index];
            }
            otherArgs[start] = transform2(array);
            return apply2(func, this, otherArgs);
          };
        }
        function parent(object, path) {
          return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
        }
        function reorder(array, indexes) {
          var arrLength = array.length, length = nativeMin(indexes.length, arrLength), oldArray = copyArray(array);
          while (length--) {
            var index = indexes[length];
            array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined$1;
          }
          return array;
        }
        function safeGet(object, key) {
          if (key === "constructor" && typeof object[key] === "function") {
            return;
          }
          if (key == "__proto__") {
            return;
          }
          return object[key];
        }
        var setData = shortOut(baseSetData);
        var setTimeout2 = ctxSetTimeout || function(func, wait) {
          return root.setTimeout(func, wait);
        };
        var setToString = shortOut(baseSetToString);
        function setWrapToString(wrapper, reference, bitmask) {
          var source = reference + "";
          return setToString(wrapper, insertWrapDetails(source, updateWrapDetails(getWrapDetails(source), bitmask)));
        }
        function shortOut(func) {
          var count = 0, lastCalled = 0;
          return function() {
            var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
            lastCalled = stamp;
            if (remaining > 0) {
              if (++count >= HOT_COUNT) {
                return arguments[0];
              }
            } else {
              count = 0;
            }
            return func.apply(undefined$1, arguments);
          };
        }
        function shuffleSelf(array, size2) {
          var index = -1, length = array.length, lastIndex = length - 1;
          size2 = size2 === undefined$1 ? length : size2;
          while (++index < size2) {
            var rand = baseRandom(index, lastIndex), value = array[rand];
            array[rand] = array[index];
            array[index] = value;
          }
          array.length = size2;
          return array;
        }
        var stringToPath = memoizeCapped(function(string) {
          var result2 = [];
          if (string.charCodeAt(0) === 46) {
            result2.push("");
          }
          string.replace(rePropName, function(match, number, quote, subString) {
            result2.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
          });
          return result2;
        });
        function toKey(value) {
          if (typeof value == "string" || isSymbol(value)) {
            return value;
          }
          var result2 = value + "";
          return result2 == "0" && 1 / value == -INFINITY ? "-0" : result2;
        }
        function toSource(func) {
          if (func != null) {
            try {
              return funcToString.call(func);
            } catch (e) {
            }
            try {
              return func + "";
            } catch (e) {
            }
          }
          return "";
        }
        function updateWrapDetails(details, bitmask) {
          arrayEach(wrapFlags, function(pair) {
            var value = "_." + pair[0];
            if (bitmask & pair[1] && !arrayIncludes(details, value)) {
              details.push(value);
            }
          });
          return details.sort();
        }
        function wrapperClone(wrapper) {
          if (wrapper instanceof LazyWrapper) {
            return wrapper.clone();
          }
          var result2 = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
          result2.__actions__ = copyArray(wrapper.__actions__);
          result2.__index__ = wrapper.__index__;
          result2.__values__ = wrapper.__values__;
          return result2;
        }
        function chunk(array, size2, guard) {
          if (guard ? isIterateeCall(array, size2, guard) : size2 === undefined$1) {
            size2 = 1;
          } else {
            size2 = nativeMax(toInteger(size2), 0);
          }
          var length = array == null ? 0 : array.length;
          if (!length || size2 < 1) {
            return [];
          }
          var index = 0, resIndex = 0, result2 = Array2(nativeCeil(length / size2));
          while (index < length) {
            result2[resIndex++] = baseSlice(array, index, index += size2);
          }
          return result2;
        }
        function compact(array) {
          var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result2 = [];
          while (++index < length) {
            var value = array[index];
            if (value) {
              result2[resIndex++] = value;
            }
          }
          return result2;
        }
        function concat() {
          var length = arguments.length;
          if (!length) {
            return [];
          }
          var args = Array2(length - 1), array = arguments[0], index = length;
          while (index--) {
            args[index - 1] = arguments[index];
          }
          return arrayPush(isArray(array) ? copyArray(array) : [array], baseFlatten(args, 1));
        }
        var difference = baseRest(function(array, values2) {
          return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true)) : [];
        });
        var differenceBy = baseRest(function(array, values2) {
          var iteratee2 = last(values2);
          if (isArrayLikeObject(iteratee2)) {
            iteratee2 = undefined$1;
          }
          return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2)) : [];
        });
        var differenceWith = baseRest(function(array, values2) {
          var comparator = last(values2);
          if (isArrayLikeObject(comparator)) {
            comparator = undefined$1;
          }
          return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true), undefined$1, comparator) : [];
        });
        function drop(array, n, guard) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return [];
          }
          n = guard || n === undefined$1 ? 1 : toInteger(n);
          return baseSlice(array, n < 0 ? 0 : n, length);
        }
        function dropRight(array, n, guard) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return [];
          }
          n = guard || n === undefined$1 ? 1 : toInteger(n);
          n = length - n;
          return baseSlice(array, 0, n < 0 ? 0 : n);
        }
        function dropRightWhile(array, predicate) {
          return array && array.length ? baseWhile(array, getIteratee(predicate, 3), true, true) : [];
        }
        function dropWhile(array, predicate) {
          return array && array.length ? baseWhile(array, getIteratee(predicate, 3), true) : [];
        }
        function fill(array, value, start, end) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return [];
          }
          if (start && typeof start != "number" && isIterateeCall(array, value, start)) {
            start = 0;
            end = length;
          }
          return baseFill(array, value, start, end);
        }
        function findIndex(array, predicate, fromIndex) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return -1;
          }
          var index = fromIndex == null ? 0 : toInteger(fromIndex);
          if (index < 0) {
            index = nativeMax(length + index, 0);
          }
          return baseFindIndex(array, getIteratee(predicate, 3), index);
        }
        function findLastIndex(array, predicate, fromIndex) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return -1;
          }
          var index = length - 1;
          if (fromIndex !== undefined$1) {
            index = toInteger(fromIndex);
            index = fromIndex < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
          }
          return baseFindIndex(array, getIteratee(predicate, 3), index, true);
        }
        function flatten(array) {
          var length = array == null ? 0 : array.length;
          return length ? baseFlatten(array, 1) : [];
        }
        function flattenDeep(array) {
          var length = array == null ? 0 : array.length;
          return length ? baseFlatten(array, INFINITY) : [];
        }
        function flattenDepth(array, depth) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return [];
          }
          depth = depth === undefined$1 ? 1 : toInteger(depth);
          return baseFlatten(array, depth);
        }
        function fromPairs(pairs) {
          var index = -1, length = pairs == null ? 0 : pairs.length, result2 = {};
          while (++index < length) {
            var pair = pairs[index];
            result2[pair[0]] = pair[1];
          }
          return result2;
        }
        function head(array) {
          return array && array.length ? array[0] : undefined$1;
        }
        function indexOf(array, value, fromIndex) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return -1;
          }
          var index = fromIndex == null ? 0 : toInteger(fromIndex);
          if (index < 0) {
            index = nativeMax(length + index, 0);
          }
          return baseIndexOf(array, value, index);
        }
        function initial(array) {
          var length = array == null ? 0 : array.length;
          return length ? baseSlice(array, 0, -1) : [];
        }
        var intersection = baseRest(function(arrays) {
          var mapped = arrayMap(arrays, castArrayLikeObject);
          return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped) : [];
        });
        var intersectionBy = baseRest(function(arrays) {
          var iteratee2 = last(arrays), mapped = arrayMap(arrays, castArrayLikeObject);
          if (iteratee2 === last(mapped)) {
            iteratee2 = undefined$1;
          } else {
            mapped.pop();
          }
          return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, getIteratee(iteratee2, 2)) : [];
        });
        var intersectionWith = baseRest(function(arrays) {
          var comparator = last(arrays), mapped = arrayMap(arrays, castArrayLikeObject);
          comparator = typeof comparator == "function" ? comparator : undefined$1;
          if (comparator) {
            mapped.pop();
          }
          return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, undefined$1, comparator) : [];
        });
        function join2(array, separator) {
          return array == null ? "" : nativeJoin.call(array, separator);
        }
        function last(array) {
          var length = array == null ? 0 : array.length;
          return length ? array[length - 1] : undefined$1;
        }
        function lastIndexOf(array, value, fromIndex) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return -1;
          }
          var index = length;
          if (fromIndex !== undefined$1) {
            index = toInteger(fromIndex);
            index = index < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
          }
          return value === value ? strictLastIndexOf(array, value, index) : baseFindIndex(array, baseIsNaN, index, true);
        }
        function nth(array, n) {
          return array && array.length ? baseNth(array, toInteger(n)) : undefined$1;
        }
        var pull = baseRest(pullAll);
        function pullAll(array, values2) {
          return array && array.length && values2 && values2.length ? basePullAll(array, values2) : array;
        }
        function pullAllBy(array, values2, iteratee2) {
          return array && array.length && values2 && values2.length ? basePullAll(array, values2, getIteratee(iteratee2, 2)) : array;
        }
        function pullAllWith(array, values2, comparator) {
          return array && array.length && values2 && values2.length ? basePullAll(array, values2, undefined$1, comparator) : array;
        }
        var pullAt = flatRest(function(array, indexes) {
          var length = array == null ? 0 : array.length, result2 = baseAt(array, indexes);
          basePullAt(array, arrayMap(indexes, function(index) {
            return isIndex(index, length) ? +index : index;
          }).sort(compareAscending));
          return result2;
        });
        function remove(array, predicate) {
          var result2 = [];
          if (!(array && array.length)) {
            return result2;
          }
          var index = -1, indexes = [], length = array.length;
          predicate = getIteratee(predicate, 3);
          while (++index < length) {
            var value = array[index];
            if (predicate(value, index, array)) {
              result2.push(value);
              indexes.push(index);
            }
          }
          basePullAt(array, indexes);
          return result2;
        }
        function reverse(array) {
          return array == null ? array : nativeReverse.call(array);
        }
        function slice(array, start, end) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return [];
          }
          if (end && typeof end != "number" && isIterateeCall(array, start, end)) {
            start = 0;
            end = length;
          } else {
            start = start == null ? 0 : toInteger(start);
            end = end === undefined$1 ? length : toInteger(end);
          }
          return baseSlice(array, start, end);
        }
        function sortedIndex(array, value) {
          return baseSortedIndex(array, value);
        }
        function sortedIndexBy(array, value, iteratee2) {
          return baseSortedIndexBy(array, value, getIteratee(iteratee2, 2));
        }
        function sortedIndexOf(array, value) {
          var length = array == null ? 0 : array.length;
          if (length) {
            var index = baseSortedIndex(array, value);
            if (index < length && eq(array[index], value)) {
              return index;
            }
          }
          return -1;
        }
        function sortedLastIndex(array, value) {
          return baseSortedIndex(array, value, true);
        }
        function sortedLastIndexBy(array, value, iteratee2) {
          return baseSortedIndexBy(array, value, getIteratee(iteratee2, 2), true);
        }
        function sortedLastIndexOf(array, value) {
          var length = array == null ? 0 : array.length;
          if (length) {
            var index = baseSortedIndex(array, value, true) - 1;
            if (eq(array[index], value)) {
              return index;
            }
          }
          return -1;
        }
        function sortedUniq(array) {
          return array && array.length ? baseSortedUniq(array) : [];
        }
        function sortedUniqBy(array, iteratee2) {
          return array && array.length ? baseSortedUniq(array, getIteratee(iteratee2, 2)) : [];
        }
        function tail(array) {
          var length = array == null ? 0 : array.length;
          return length ? baseSlice(array, 1, length) : [];
        }
        function take(array, n, guard) {
          if (!(array && array.length)) {
            return [];
          }
          n = guard || n === undefined$1 ? 1 : toInteger(n);
          return baseSlice(array, 0, n < 0 ? 0 : n);
        }
        function takeRight(array, n, guard) {
          var length = array == null ? 0 : array.length;
          if (!length) {
            return [];
          }
          n = guard || n === undefined$1 ? 1 : toInteger(n);
          n = length - n;
          return baseSlice(array, n < 0 ? 0 : n, length);
        }
        function takeRightWhile(array, predicate) {
          return array && array.length ? baseWhile(array, getIteratee(predicate, 3), false, true) : [];
        }
        function takeWhile(array, predicate) {
          return array && array.length ? baseWhile(array, getIteratee(predicate, 3)) : [];
        }
        var union = baseRest(function(arrays) {
          return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
        });
        var unionBy = baseRest(function(arrays) {
          var iteratee2 = last(arrays);
          if (isArrayLikeObject(iteratee2)) {
            iteratee2 = undefined$1;
          }
          return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2));
        });
        var unionWith = baseRest(function(arrays) {
          var comparator = last(arrays);
          comparator = typeof comparator == "function" ? comparator : undefined$1;
          return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), undefined$1, comparator);
        });
        function uniq(array) {
          return array && array.length ? baseUniq(array) : [];
        }
        function uniqBy(array, iteratee2) {
          return array && array.length ? baseUniq(array, getIteratee(iteratee2, 2)) : [];
        }
        function uniqWith(array, comparator) {
          comparator = typeof comparator == "function" ? comparator : undefined$1;
          return array && array.length ? baseUniq(array, undefined$1, comparator) : [];
        }
        function unzip(array) {
          if (!(array && array.length)) {
            return [];
          }
          var length = 0;
          array = arrayFilter(array, function(group) {
            if (isArrayLikeObject(group)) {
              length = nativeMax(group.length, length);
              return true;
            }
          });
          return baseTimes(length, function(index) {
            return arrayMap(array, baseProperty(index));
          });
        }
        function unzipWith(array, iteratee2) {
          if (!(array && array.length)) {
            return [];
          }
          var result2 = unzip(array);
          if (iteratee2 == null) {
            return result2;
          }
          return arrayMap(result2, function(group) {
            return apply2(iteratee2, undefined$1, group);
          });
        }
        var without = baseRest(function(array, values2) {
          return isArrayLikeObject(array) ? baseDifference(array, values2) : [];
        });
        var xor = baseRest(function(arrays) {
          return baseXor(arrayFilter(arrays, isArrayLikeObject));
        });
        var xorBy = baseRest(function(arrays) {
          var iteratee2 = last(arrays);
          if (isArrayLikeObject(iteratee2)) {
            iteratee2 = undefined$1;
          }
          return baseXor(arrayFilter(arrays, isArrayLikeObject), getIteratee(iteratee2, 2));
        });
        var xorWith = baseRest(function(arrays) {
          var comparator = last(arrays);
          comparator = typeof comparator == "function" ? comparator : undefined$1;
          return baseXor(arrayFilter(arrays, isArrayLikeObject), undefined$1, comparator);
        });
        var zip = baseRest(unzip);
        function zipObject(props, values2) {
          return baseZipObject(props || [], values2 || [], assignValue);
        }
        function zipObjectDeep(props, values2) {
          return baseZipObject(props || [], values2 || [], baseSet);
        }
        var zipWith = baseRest(function(arrays) {
          var length = arrays.length, iteratee2 = length > 1 ? arrays[length - 1] : undefined$1;
          iteratee2 = typeof iteratee2 == "function" ? (arrays.pop(), iteratee2) : undefined$1;
          return unzipWith(arrays, iteratee2);
        });
        function chain(value) {
          var result2 = lodash2(value);
          result2.__chain__ = true;
          return result2;
        }
        function tap(value, interceptor) {
          interceptor(value);
          return value;
        }
        function thru(value, interceptor) {
          return interceptor(value);
        }
        var wrapperAt = flatRest(function(paths) {
          var length = paths.length, start = length ? paths[0] : 0, value = this.__wrapped__, interceptor = function(object) {
            return baseAt(object, paths);
          };
          if (length > 1 || this.__actions__.length || !(value instanceof LazyWrapper) || !isIndex(start)) {
            return this.thru(interceptor);
          }
          value = value.slice(start, +start + (length ? 1 : 0));
          value.__actions__.push({
            "func": thru,
            "args": [interceptor],
            "thisArg": undefined$1
          });
          return new LodashWrapper(value, this.__chain__).thru(function(array) {
            if (length && !array.length) {
              array.push(undefined$1);
            }
            return array;
          });
        });
        function wrapperChain() {
          return chain(this);
        }
        function wrapperCommit() {
          return new LodashWrapper(this.value(), this.__chain__);
        }
        function wrapperNext() {
          if (this.__values__ === undefined$1) {
            this.__values__ = toArray(this.value());
          }
          var done = this.__index__ >= this.__values__.length, value = done ? undefined$1 : this.__values__[this.__index__++];
          return { "done": done, "value": value };
        }
        function wrapperToIterator() {
          return this;
        }
        function wrapperPlant(value) {
          var result2, parent2 = this;
          while (parent2 instanceof baseLodash) {
            var clone2 = wrapperClone(parent2);
            clone2.__index__ = 0;
            clone2.__values__ = undefined$1;
            if (result2) {
              previous.__wrapped__ = clone2;
            } else {
              result2 = clone2;
            }
            var previous = clone2;
            parent2 = parent2.__wrapped__;
          }
          previous.__wrapped__ = value;
          return result2;
        }
        function wrapperReverse() {
          var value = this.__wrapped__;
          if (value instanceof LazyWrapper) {
            var wrapped = value;
            if (this.__actions__.length) {
              wrapped = new LazyWrapper(this);
            }
            wrapped = wrapped.reverse();
            wrapped.__actions__.push({
              "func": thru,
              "args": [reverse],
              "thisArg": undefined$1
            });
            return new LodashWrapper(wrapped, this.__chain__);
          }
          return this.thru(reverse);
        }
        function wrapperValue() {
          return baseWrapperValue(this.__wrapped__, this.__actions__);
        }
        var countBy = createAggregator(function(result2, value, key) {
          if (hasOwnProperty.call(result2, key)) {
            ++result2[key];
          } else {
            baseAssignValue(result2, key, 1);
          }
        });
        function every(collection, predicate, guard) {
          var func = isArray(collection) ? arrayEvery : baseEvery;
          if (guard && isIterateeCall(collection, predicate, guard)) {
            predicate = undefined$1;
          }
          return func(collection, getIteratee(predicate, 3));
        }
        function filter(collection, predicate) {
          var func = isArray(collection) ? arrayFilter : baseFilter;
          return func(collection, getIteratee(predicate, 3));
        }
        var find2 = createFind(findIndex);
        var findLast = createFind(findLastIndex);
        function flatMap(collection, iteratee2) {
          return baseFlatten(map(collection, iteratee2), 1);
        }
        function flatMapDeep(collection, iteratee2) {
          return baseFlatten(map(collection, iteratee2), INFINITY);
        }
        function flatMapDepth(collection, iteratee2, depth) {
          depth = depth === undefined$1 ? 1 : toInteger(depth);
          return baseFlatten(map(collection, iteratee2), depth);
        }
        function forEach2(collection, iteratee2) {
          var func = isArray(collection) ? arrayEach : baseEach;
          return func(collection, getIteratee(iteratee2, 3));
        }
        function forEachRight(collection, iteratee2) {
          var func = isArray(collection) ? arrayEachRight : baseEachRight;
          return func(collection, getIteratee(iteratee2, 3));
        }
        var groupBy = createAggregator(function(result2, value, key) {
          if (hasOwnProperty.call(result2, key)) {
            result2[key].push(value);
          } else {
            baseAssignValue(result2, key, [value]);
          }
        });
        function includes(collection, value, fromIndex, guard) {
          collection = isArrayLike(collection) ? collection : values(collection);
          fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
          var length = collection.length;
          if (fromIndex < 0) {
            fromIndex = nativeMax(length + fromIndex, 0);
          }
          return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
        }
        var invokeMap = baseRest(function(collection, path, args) {
          var index = -1, isFunc = typeof path == "function", result2 = isArrayLike(collection) ? Array2(collection.length) : [];
          baseEach(collection, function(value) {
            result2[++index] = isFunc ? apply2(path, value, args) : baseInvoke(value, path, args);
          });
          return result2;
        });
        var keyBy = createAggregator(function(result2, value, key) {
          baseAssignValue(result2, key, value);
        });
        function map(collection, iteratee2) {
          var func = isArray(collection) ? arrayMap : baseMap;
          return func(collection, getIteratee(iteratee2, 3));
        }
        function orderBy(collection, iteratees, orders, guard) {
          if (collection == null) {
            return [];
          }
          if (!isArray(iteratees)) {
            iteratees = iteratees == null ? [] : [iteratees];
          }
          orders = guard ? undefined$1 : orders;
          if (!isArray(orders)) {
            orders = orders == null ? [] : [orders];
          }
          return baseOrderBy(collection, iteratees, orders);
        }
        var partition = createAggregator(function(result2, value, key) {
          result2[key ? 0 : 1].push(value);
        }, function() {
          return [[], []];
        });
        function reduce(collection, iteratee2, accumulator) {
          var func = isArray(collection) ? arrayReduce : baseReduce, initAccum = arguments.length < 3;
          return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEach);
        }
        function reduceRight(collection, iteratee2, accumulator) {
          var func = isArray(collection) ? arrayReduceRight : baseReduce, initAccum = arguments.length < 3;
          return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEachRight);
        }
        function reject(collection, predicate) {
          var func = isArray(collection) ? arrayFilter : baseFilter;
          return func(collection, negate(getIteratee(predicate, 3)));
        }
        function sample(collection) {
          var func = isArray(collection) ? arraySample : baseSample;
          return func(collection);
        }
        function sampleSize(collection, n, guard) {
          if (guard ? isIterateeCall(collection, n, guard) : n === undefined$1) {
            n = 1;
          } else {
            n = toInteger(n);
          }
          var func = isArray(collection) ? arraySampleSize : baseSampleSize;
          return func(collection, n);
        }
        function shuffle(collection) {
          var func = isArray(collection) ? arrayShuffle : baseShuffle;
          return func(collection);
        }
        function size(collection) {
          if (collection == null) {
            return 0;
          }
          if (isArrayLike(collection)) {
            return isString(collection) ? stringSize(collection) : collection.length;
          }
          var tag = getTag(collection);
          if (tag == mapTag || tag == setTag) {
            return collection.size;
          }
          return baseKeys(collection).length;
        }
        function some(collection, predicate, guard) {
          var func = isArray(collection) ? arraySome : baseSome;
          if (guard && isIterateeCall(collection, predicate, guard)) {
            predicate = undefined$1;
          }
          return func(collection, getIteratee(predicate, 3));
        }
        var sortBy = baseRest(function(collection, iteratees) {
          if (collection == null) {
            return [];
          }
          var length = iteratees.length;
          if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
            iteratees = [];
          } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
            iteratees = [iteratees[0]];
          }
          return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
        });
        var now = ctxNow || function() {
          return root.Date.now();
        };
        function after(n, func) {
          if (typeof func != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          n = toInteger(n);
          return function() {
            if (--n < 1) {
              return func.apply(this, arguments);
            }
          };
        }
        function ary(func, n, guard) {
          n = guard ? undefined$1 : n;
          n = func && n == null ? func.length : n;
          return createWrap(func, WRAP_ARY_FLAG, undefined$1, undefined$1, undefined$1, undefined$1, n);
        }
        function before(n, func) {
          var result2;
          if (typeof func != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          n = toInteger(n);
          return function() {
            if (--n > 0) {
              result2 = func.apply(this, arguments);
            }
            if (n <= 1) {
              func = undefined$1;
            }
            return result2;
          };
        }
        var bind2 = baseRest(function(func, thisArg, partials) {
          var bitmask = WRAP_BIND_FLAG;
          if (partials.length) {
            var holders = replaceHolders(partials, getHolder(bind2));
            bitmask |= WRAP_PARTIAL_FLAG;
          }
          return createWrap(func, bitmask, thisArg, partials, holders);
        });
        var bindKey = baseRest(function(object, key, partials) {
          var bitmask = WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG;
          if (partials.length) {
            var holders = replaceHolders(partials, getHolder(bindKey));
            bitmask |= WRAP_PARTIAL_FLAG;
          }
          return createWrap(key, bitmask, object, partials, holders);
        });
        function curry(func, arity, guard) {
          arity = guard ? undefined$1 : arity;
          var result2 = createWrap(func, WRAP_CURRY_FLAG, undefined$1, undefined$1, undefined$1, undefined$1, undefined$1, arity);
          result2.placeholder = curry.placeholder;
          return result2;
        }
        function curryRight(func, arity, guard) {
          arity = guard ? undefined$1 : arity;
          var result2 = createWrap(func, WRAP_CURRY_RIGHT_FLAG, undefined$1, undefined$1, undefined$1, undefined$1, undefined$1, arity);
          result2.placeholder = curryRight.placeholder;
          return result2;
        }
        function debounce(func, wait, options) {
          var lastArgs, lastThis, maxWait, result2, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
          if (typeof func != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          wait = toNumber(wait) || 0;
          if (isObject(options)) {
            leading = !!options.leading;
            maxing = "maxWait" in options;
            maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
            trailing = "trailing" in options ? !!options.trailing : trailing;
          }
          function invokeFunc(time) {
            var args = lastArgs, thisArg = lastThis;
            lastArgs = lastThis = undefined$1;
            lastInvokeTime = time;
            result2 = func.apply(thisArg, args);
            return result2;
          }
          function leadingEdge(time) {
            lastInvokeTime = time;
            timerId = setTimeout2(timerExpired, wait);
            return leading ? invokeFunc(time) : result2;
          }
          function remainingWait(time) {
            var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
            return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
          }
          function shouldInvoke(time) {
            var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
            return lastCallTime === undefined$1 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
          }
          function timerExpired() {
            var time = now();
            if (shouldInvoke(time)) {
              return trailingEdge(time);
            }
            timerId = setTimeout2(timerExpired, remainingWait(time));
          }
          function trailingEdge(time) {
            timerId = undefined$1;
            if (trailing && lastArgs) {
              return invokeFunc(time);
            }
            lastArgs = lastThis = undefined$1;
            return result2;
          }
          function cancel() {
            if (timerId !== undefined$1) {
              clearTimeout2(timerId);
            }
            lastInvokeTime = 0;
            lastArgs = lastCallTime = lastThis = timerId = undefined$1;
          }
          function flush() {
            return timerId === undefined$1 ? result2 : trailingEdge(now());
          }
          function debounced() {
            var time = now(), isInvoking = shouldInvoke(time);
            lastArgs = arguments;
            lastThis = this;
            lastCallTime = time;
            if (isInvoking) {
              if (timerId === undefined$1) {
                return leadingEdge(lastCallTime);
              }
              if (maxing) {
                clearTimeout2(timerId);
                timerId = setTimeout2(timerExpired, wait);
                return invokeFunc(lastCallTime);
              }
            }
            if (timerId === undefined$1) {
              timerId = setTimeout2(timerExpired, wait);
            }
            return result2;
          }
          debounced.cancel = cancel;
          debounced.flush = flush;
          return debounced;
        }
        var defer = baseRest(function(func, args) {
          return baseDelay(func, 1, args);
        });
        var delay = baseRest(function(func, wait, args) {
          return baseDelay(func, toNumber(wait) || 0, args);
        });
        function flip(func) {
          return createWrap(func, WRAP_FLIP_FLAG);
        }
        function memoize(func, resolver) {
          if (typeof func != "function" || resolver != null && typeof resolver != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          var memoized = function() {
            var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
            if (cache.has(key)) {
              return cache.get(key);
            }
            var result2 = func.apply(this, args);
            memoized.cache = cache.set(key, result2) || cache;
            return result2;
          };
          memoized.cache = new (memoize.Cache || MapCache)();
          return memoized;
        }
        memoize.Cache = MapCache;
        function negate(predicate) {
          if (typeof predicate != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          return function() {
            var args = arguments;
            switch (args.length) {
              case 0:
                return !predicate.call(this);
              case 1:
                return !predicate.call(this, args[0]);
              case 2:
                return !predicate.call(this, args[0], args[1]);
              case 3:
                return !predicate.call(this, args[0], args[1], args[2]);
            }
            return !predicate.apply(this, args);
          };
        }
        function once(func) {
          return before(2, func);
        }
        var overArgs = castRest(function(func, transforms) {
          transforms = transforms.length == 1 && isArray(transforms[0]) ? arrayMap(transforms[0], baseUnary(getIteratee())) : arrayMap(baseFlatten(transforms, 1), baseUnary(getIteratee()));
          var funcsLength = transforms.length;
          return baseRest(function(args) {
            var index = -1, length = nativeMin(args.length, funcsLength);
            while (++index < length) {
              args[index] = transforms[index].call(this, args[index]);
            }
            return apply2(func, this, args);
          });
        });
        var partial = baseRest(function(func, partials) {
          var holders = replaceHolders(partials, getHolder(partial));
          return createWrap(func, WRAP_PARTIAL_FLAG, undefined$1, partials, holders);
        });
        var partialRight = baseRest(function(func, partials) {
          var holders = replaceHolders(partials, getHolder(partialRight));
          return createWrap(func, WRAP_PARTIAL_RIGHT_FLAG, undefined$1, partials, holders);
        });
        var rearg = flatRest(function(func, indexes) {
          return createWrap(func, WRAP_REARG_FLAG, undefined$1, undefined$1, undefined$1, indexes);
        });
        function rest(func, start) {
          if (typeof func != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          start = start === undefined$1 ? start : toInteger(start);
          return baseRest(func, start);
        }
        function spread(func, start) {
          if (typeof func != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          start = start == null ? 0 : nativeMax(toInteger(start), 0);
          return baseRest(function(args) {
            var array = args[start], otherArgs = castSlice(args, 0, start);
            if (array) {
              arrayPush(otherArgs, array);
            }
            return apply2(func, this, otherArgs);
          });
        }
        function throttle(func, wait, options) {
          var leading = true, trailing = true;
          if (typeof func != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          if (isObject(options)) {
            leading = "leading" in options ? !!options.leading : leading;
            trailing = "trailing" in options ? !!options.trailing : trailing;
          }
          return debounce(func, wait, {
            "leading": leading,
            "maxWait": wait,
            "trailing": trailing
          });
        }
        function unary(func) {
          return ary(func, 1);
        }
        function wrap2(value, wrapper) {
          return partial(castFunction(wrapper), value);
        }
        function castArray() {
          if (!arguments.length) {
            return [];
          }
          var value = arguments[0];
          return isArray(value) ? value : [value];
        }
        function clone(value) {
          return baseClone(value, CLONE_SYMBOLS_FLAG);
        }
        function cloneWith(value, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined$1;
          return baseClone(value, CLONE_SYMBOLS_FLAG, customizer);
        }
        function cloneDeep(value) {
          return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
        }
        function cloneDeepWith(value, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined$1;
          return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG, customizer);
        }
        function conformsTo(object, source) {
          return source == null || baseConformsTo(object, source, keys2(source));
        }
        function eq(value, other) {
          return value === other || value !== value && other !== other;
        }
        var gt = createRelationalOperation(baseGt);
        var gte = createRelationalOperation(function(value, other) {
          return value >= other;
        });
        var isArguments = baseIsArguments(function() {
          return arguments;
        }()) ? baseIsArguments : function(value) {
          return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
        };
        var isArray = Array2.isArray;
        var isArrayBuffer = nodeIsArrayBuffer ? baseUnary(nodeIsArrayBuffer) : baseIsArrayBuffer;
        function isArrayLike(value) {
          return value != null && isLength(value.length) && !isFunction2(value);
        }
        function isArrayLikeObject(value) {
          return isObjectLike(value) && isArrayLike(value);
        }
        function isBoolean(value) {
          return value === true || value === false || isObjectLike(value) && baseGetTag(value) == boolTag;
        }
        var isBuffer = nativeIsBuffer || stubFalse;
        var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;
        function isElement(value) {
          return isObjectLike(value) && value.nodeType === 1 && !isPlainObject2(value);
        }
        function isEmpty2(value) {
          if (value == null) {
            return true;
          }
          if (isArrayLike(value) && (isArray(value) || typeof value == "string" || typeof value.splice == "function" || isBuffer(value) || isTypedArray(value) || isArguments(value))) {
            return !value.length;
          }
          var tag = getTag(value);
          if (tag == mapTag || tag == setTag) {
            return !value.size;
          }
          if (isPrototype(value)) {
            return !baseKeys(value).length;
          }
          for (var key in value) {
            if (hasOwnProperty.call(value, key)) {
              return false;
            }
          }
          return true;
        }
        function isEqual(value, other) {
          return baseIsEqual(value, other);
        }
        function isEqualWith(value, other, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined$1;
          var result2 = customizer ? customizer(value, other) : undefined$1;
          return result2 === undefined$1 ? baseIsEqual(value, other, undefined$1, customizer) : !!result2;
        }
        function isError(value) {
          if (!isObjectLike(value)) {
            return false;
          }
          var tag = baseGetTag(value);
          return tag == errorTag || tag == domExcTag || typeof value.message == "string" && typeof value.name == "string" && !isPlainObject2(value);
        }
        function isFinite(value) {
          return typeof value == "number" && nativeIsFinite(value);
        }
        function isFunction2(value) {
          if (!isObject(value)) {
            return false;
          }
          var tag = baseGetTag(value);
          return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
        }
        function isInteger(value) {
          return typeof value == "number" && value == toInteger(value);
        }
        function isLength(value) {
          return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
        }
        function isObject(value) {
          var type = typeof value;
          return value != null && (type == "object" || type == "function");
        }
        function isObjectLike(value) {
          return value != null && typeof value == "object";
        }
        var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;
        function isMatch(object, source) {
          return object === source || baseIsMatch(object, source, getMatchData(source));
        }
        function isMatchWith(object, source, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined$1;
          return baseIsMatch(object, source, getMatchData(source), customizer);
        }
        function isNaN(value) {
          return isNumber2(value) && value != +value;
        }
        function isNative(value) {
          if (isMaskable(value)) {
            throw new Error2(CORE_ERROR_TEXT);
          }
          return baseIsNative(value);
        }
        function isNull(value) {
          return value === null;
        }
        function isNil(value) {
          return value == null;
        }
        function isNumber2(value) {
          return typeof value == "number" || isObjectLike(value) && baseGetTag(value) == numberTag;
        }
        function isPlainObject2(value) {
          if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
            return false;
          }
          var proto = getPrototype(value);
          if (proto === null) {
            return true;
          }
          var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
          return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
        }
        var isRegExp2 = nodeIsRegExp ? baseUnary(nodeIsRegExp) : baseIsRegExp;
        function isSafeInteger(value) {
          return isInteger(value) && value >= -MAX_SAFE_INTEGER && value <= MAX_SAFE_INTEGER;
        }
        var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;
        function isString(value) {
          return typeof value == "string" || !isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag;
        }
        function isSymbol(value) {
          return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
        }
        var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
        function isUndefined(value) {
          return value === undefined$1;
        }
        function isWeakMap(value) {
          return isObjectLike(value) && getTag(value) == weakMapTag;
        }
        function isWeakSet(value) {
          return isObjectLike(value) && baseGetTag(value) == weakSetTag;
        }
        var lt = createRelationalOperation(baseLt);
        var lte = createRelationalOperation(function(value, other) {
          return value <= other;
        });
        function toArray(value) {
          if (!value) {
            return [];
          }
          if (isArrayLike(value)) {
            return isString(value) ? stringToArray2(value) : copyArray(value);
          }
          if (symIterator && value[symIterator]) {
            return iteratorToArray(value[symIterator]());
          }
          var tag = getTag(value), func = tag == mapTag ? mapToArray : tag == setTag ? setToArray : values;
          return func(value);
        }
        function toFinite(value) {
          if (!value) {
            return value === 0 ? value : 0;
          }
          value = toNumber(value);
          if (value === INFINITY || value === -INFINITY) {
            var sign = value < 0 ? -1 : 1;
            return sign * MAX_INTEGER;
          }
          return value === value ? value : 0;
        }
        function toInteger(value) {
          var result2 = toFinite(value), remainder = result2 % 1;
          return result2 === result2 ? remainder ? result2 - remainder : result2 : 0;
        }
        function toLength(value) {
          return value ? baseClamp(toInteger(value), 0, MAX_ARRAY_LENGTH) : 0;
        }
        function toNumber(value) {
          if (typeof value == "number") {
            return value;
          }
          if (isSymbol(value)) {
            return NAN;
          }
          if (isObject(value)) {
            var other = typeof value.valueOf == "function" ? value.valueOf() : value;
            value = isObject(other) ? other + "" : other;
          }
          if (typeof value != "string") {
            return value === 0 ? value : +value;
          }
          value = baseTrim(value);
          var isBinary = reIsBinary.test(value);
          return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
        }
        function toPlainObject(value) {
          return copyObject(value, keysIn(value));
        }
        function toSafeInteger(value) {
          return value ? baseClamp(toInteger(value), -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER) : value === 0 ? value : 0;
        }
        function toString(value) {
          return value == null ? "" : baseToString(value);
        }
        var assign = createAssigner(function(object, source) {
          if (isPrototype(source) || isArrayLike(source)) {
            copyObject(source, keys2(source), object);
            return;
          }
          for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
              assignValue(object, key, source[key]);
            }
          }
        });
        var assignIn = createAssigner(function(object, source) {
          copyObject(source, keysIn(source), object);
        });
        var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
          copyObject(source, keysIn(source), object, customizer);
        });
        var assignWith = createAssigner(function(object, source, srcIndex, customizer) {
          copyObject(source, keys2(source), object, customizer);
        });
        var at = flatRest(baseAt);
        function create(prototype, properties) {
          var result2 = baseCreate(prototype);
          return properties == null ? result2 : baseAssign(result2, properties);
        }
        var defaults2 = baseRest(function(object, sources) {
          object = Object2(object);
          var index = -1;
          var length = sources.length;
          var guard = length > 2 ? sources[2] : undefined$1;
          if (guard && isIterateeCall(sources[0], sources[1], guard)) {
            length = 1;
          }
          while (++index < length) {
            var source = sources[index];
            var props = keysIn(source);
            var propsIndex = -1;
            var propsLength = props.length;
            while (++propsIndex < propsLength) {
              var key = props[propsIndex];
              var value = object[key];
              if (value === undefined$1 || eq(value, objectProto[key]) && !hasOwnProperty.call(object, key)) {
                object[key] = source[key];
              }
            }
          }
          return object;
        });
        var defaultsDeep = baseRest(function(args) {
          args.push(undefined$1, customDefaultsMerge);
          return apply2(mergeWith, undefined$1, args);
        });
        function findKey(object, predicate) {
          return baseFindKey(object, getIteratee(predicate, 3), baseForOwn);
        }
        function findLastKey(object, predicate) {
          return baseFindKey(object, getIteratee(predicate, 3), baseForOwnRight);
        }
        function forIn(object, iteratee2) {
          return object == null ? object : baseFor(object, getIteratee(iteratee2, 3), keysIn);
        }
        function forInRight(object, iteratee2) {
          return object == null ? object : baseForRight(object, getIteratee(iteratee2, 3), keysIn);
        }
        function forOwn(object, iteratee2) {
          return object && baseForOwn(object, getIteratee(iteratee2, 3));
        }
        function forOwnRight(object, iteratee2) {
          return object && baseForOwnRight(object, getIteratee(iteratee2, 3));
        }
        function functions(object) {
          return object == null ? [] : baseFunctions(object, keys2(object));
        }
        function functionsIn(object) {
          return object == null ? [] : baseFunctions(object, keysIn(object));
        }
        function get(object, path, defaultValue) {
          var result2 = object == null ? undefined$1 : baseGet(object, path);
          return result2 === undefined$1 ? defaultValue : result2;
        }
        function has(object, path) {
          return object != null && hasPath(object, path, baseHas);
        }
        function hasIn(object, path) {
          return object != null && hasPath(object, path, baseHasIn);
        }
        var invert = createInverter(function(result2, value, key) {
          if (value != null && typeof value.toString != "function") {
            value = nativeObjectToString.call(value);
          }
          result2[value] = key;
        }, constant(identity));
        var invertBy = createInverter(function(result2, value, key) {
          if (value != null && typeof value.toString != "function") {
            value = nativeObjectToString.call(value);
          }
          if (hasOwnProperty.call(result2, value)) {
            result2[value].push(key);
          } else {
            result2[value] = [key];
          }
        }, getIteratee);
        var invoke = baseRest(baseInvoke);
        function keys2(object) {
          return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
        }
        function keysIn(object) {
          return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
        }
        function mapKeys(object, iteratee2) {
          var result2 = {};
          iteratee2 = getIteratee(iteratee2, 3);
          baseForOwn(object, function(value, key, object2) {
            baseAssignValue(result2, iteratee2(value, key, object2), value);
          });
          return result2;
        }
        function mapValues(object, iteratee2) {
          var result2 = {};
          iteratee2 = getIteratee(iteratee2, 3);
          baseForOwn(object, function(value, key, object2) {
            baseAssignValue(result2, key, iteratee2(value, key, object2));
          });
          return result2;
        }
        var merge = createAssigner(function(object, source, srcIndex) {
          baseMerge(object, source, srcIndex);
        });
        var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
          baseMerge(object, source, srcIndex, customizer);
        });
        var omit = flatRest(function(object, paths) {
          var result2 = {};
          if (object == null) {
            return result2;
          }
          var isDeep = false;
          paths = arrayMap(paths, function(path) {
            path = castPath(path, object);
            isDeep || (isDeep = path.length > 1);
            return path;
          });
          copyObject(object, getAllKeysIn(object), result2);
          if (isDeep) {
            result2 = baseClone(result2, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, customOmitClone);
          }
          var length = paths.length;
          while (length--) {
            baseUnset(result2, paths[length]);
          }
          return result2;
        });
        function omitBy(object, predicate) {
          return pickBy(object, negate(getIteratee(predicate)));
        }
        var pick = flatRest(function(object, paths) {
          return object == null ? {} : basePick(object, paths);
        });
        function pickBy(object, predicate) {
          if (object == null) {
            return {};
          }
          var props = arrayMap(getAllKeysIn(object), function(prop) {
            return [prop];
          });
          predicate = getIteratee(predicate);
          return basePickBy(object, props, function(value, path) {
            return predicate(value, path[0]);
          });
        }
        function result(object, path, defaultValue) {
          path = castPath(path, object);
          var index = -1, length = path.length;
          if (!length) {
            length = 1;
            object = undefined$1;
          }
          while (++index < length) {
            var value = object == null ? undefined$1 : object[toKey(path[index])];
            if (value === undefined$1) {
              index = length;
              value = defaultValue;
            }
            object = isFunction2(value) ? value.call(object) : value;
          }
          return object;
        }
        function set(object, path, value) {
          return object == null ? object : baseSet(object, path, value);
        }
        function setWith(object, path, value, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined$1;
          return object == null ? object : baseSet(object, path, value, customizer);
        }
        var toPairs = createToPairs(keys2);
        var toPairsIn = createToPairs(keysIn);
        function transform(object, iteratee2, accumulator) {
          var isArr = isArray(object), isArrLike = isArr || isBuffer(object) || isTypedArray(object);
          iteratee2 = getIteratee(iteratee2, 4);
          if (accumulator == null) {
            var Ctor = object && object.constructor;
            if (isArrLike) {
              accumulator = isArr ? new Ctor() : [];
            } else if (isObject(object)) {
              accumulator = isFunction2(Ctor) ? baseCreate(getPrototype(object)) : {};
            } else {
              accumulator = {};
            }
          }
          (isArrLike ? arrayEach : baseForOwn)(object, function(value, index, object2) {
            return iteratee2(accumulator, value, index, object2);
          });
          return accumulator;
        }
        function unset(object, path) {
          return object == null ? true : baseUnset(object, path);
        }
        function update(object, path, updater) {
          return object == null ? object : baseUpdate(object, path, castFunction(updater));
        }
        function updateWith(object, path, updater, customizer) {
          customizer = typeof customizer == "function" ? customizer : undefined$1;
          return object == null ? object : baseUpdate(object, path, castFunction(updater), customizer);
        }
        function values(object) {
          return object == null ? [] : baseValues(object, keys2(object));
        }
        function valuesIn(object) {
          return object == null ? [] : baseValues(object, keysIn(object));
        }
        function clamp(number, lower, upper) {
          if (upper === undefined$1) {
            upper = lower;
            lower = undefined$1;
          }
          if (upper !== undefined$1) {
            upper = toNumber(upper);
            upper = upper === upper ? upper : 0;
          }
          if (lower !== undefined$1) {
            lower = toNumber(lower);
            lower = lower === lower ? lower : 0;
          }
          return baseClamp(toNumber(number), lower, upper);
        }
        function inRange(number, start, end) {
          start = toFinite(start);
          if (end === undefined$1) {
            end = start;
            start = 0;
          } else {
            end = toFinite(end);
          }
          number = toNumber(number);
          return baseInRange(number, start, end);
        }
        function random(lower, upper, floating) {
          if (floating && typeof floating != "boolean" && isIterateeCall(lower, upper, floating)) {
            upper = floating = undefined$1;
          }
          if (floating === undefined$1) {
            if (typeof upper == "boolean") {
              floating = upper;
              upper = undefined$1;
            } else if (typeof lower == "boolean") {
              floating = lower;
              lower = undefined$1;
            }
          }
          if (lower === undefined$1 && upper === undefined$1) {
            lower = 0;
            upper = 1;
          } else {
            lower = toFinite(lower);
            if (upper === undefined$1) {
              upper = lower;
              lower = 0;
            } else {
              upper = toFinite(upper);
            }
          }
          if (lower > upper) {
            var temp = lower;
            lower = upper;
            upper = temp;
          }
          if (floating || lower % 1 || upper % 1) {
            var rand = nativeRandom();
            return nativeMin(lower + rand * (upper - lower + freeParseFloat("1e-" + ((rand + "").length - 1))), upper);
          }
          return baseRandom(lower, upper);
        }
        var camelCase = createCompounder(function(result2, word, index) {
          word = word.toLowerCase();
          return result2 + (index ? capitalize(word) : word);
        });
        function capitalize(string) {
          return upperFirst(toString(string).toLowerCase());
        }
        function deburr(string) {
          string = toString(string);
          return string && string.replace(reLatin, deburrLetter).replace(reComboMark, "");
        }
        function endsWith(string, target, position) {
          string = toString(string);
          target = baseToString(target);
          var length = string.length;
          position = position === undefined$1 ? length : baseClamp(toInteger(position), 0, length);
          var end = position;
          position -= target.length;
          return position >= 0 && string.slice(position, end) == target;
        }
        function escape(string) {
          string = toString(string);
          return string && reHasUnescapedHtml.test(string) ? string.replace(reUnescapedHtml, escapeHtmlChar) : string;
        }
        function escapeRegExp(string) {
          string = toString(string);
          return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, "\\$&") : string;
        }
        var kebabCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? "-" : "") + word.toLowerCase();
        });
        var lowerCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? " " : "") + word.toLowerCase();
        });
        var lowerFirst = createCaseFirst("toLowerCase");
        function pad(string, length, chars) {
          string = toString(string);
          length = toInteger(length);
          var strLength = length ? stringSize(string) : 0;
          if (!length || strLength >= length) {
            return string;
          }
          var mid = (length - strLength) / 2;
          return createPadding(nativeFloor(mid), chars) + string + createPadding(nativeCeil(mid), chars);
        }
        function padEnd(string, length, chars) {
          string = toString(string);
          length = toInteger(length);
          var strLength = length ? stringSize(string) : 0;
          return length && strLength < length ? string + createPadding(length - strLength, chars) : string;
        }
        function padStart(string, length, chars) {
          string = toString(string);
          length = toInteger(length);
          var strLength = length ? stringSize(string) : 0;
          return length && strLength < length ? createPadding(length - strLength, chars) + string : string;
        }
        function parseInt2(string, radix, guard) {
          if (guard || radix == null) {
            radix = 0;
          } else if (radix) {
            radix = +radix;
          }
          return nativeParseInt(toString(string).replace(reTrimStart, ""), radix || 0);
        }
        function repeat(string, n, guard) {
          if (guard ? isIterateeCall(string, n, guard) : n === undefined$1) {
            n = 1;
          } else {
            n = toInteger(n);
          }
          return baseRepeat(toString(string), n);
        }
        function replace2() {
          var args = arguments, string = toString(args[0]);
          return args.length < 3 ? string : string.replace(args[1], args[2]);
        }
        var snakeCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? "_" : "") + word.toLowerCase();
        });
        function split2(string, separator, limit) {
          if (limit && typeof limit != "number" && isIterateeCall(string, separator, limit)) {
            separator = limit = undefined$1;
          }
          limit = limit === undefined$1 ? MAX_ARRAY_LENGTH : limit >>> 0;
          if (!limit) {
            return [];
          }
          string = toString(string);
          if (string && (typeof separator == "string" || separator != null && !isRegExp2(separator))) {
            separator = baseToString(separator);
            if (!separator && hasUnicode(string)) {
              return castSlice(stringToArray2(string), 0, limit);
            }
          }
          return string.split(separator, limit);
        }
        var startCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? " " : "") + upperFirst(word);
        });
        function startsWith(string, target, position) {
          string = toString(string);
          position = position == null ? 0 : baseClamp(toInteger(position), 0, string.length);
          target = baseToString(target);
          return string.slice(position, position + target.length) == target;
        }
        function template(string, options, guard) {
          var settings = lodash2.templateSettings;
          if (guard && isIterateeCall(string, options, guard)) {
            options = undefined$1;
          }
          string = toString(string);
          options = assignInWith({}, options, settings, customDefaultsAssignIn);
          var imports = assignInWith({}, options.imports, settings.imports, customDefaultsAssignIn), importsKeys = keys2(imports), importsValues = baseValues(imports, importsKeys);
          var isEscaping, isEvaluating, index = 0, interpolate = options.interpolate || reNoMatch, source = "__p += '";
          var reDelimiters = RegExp2(
            (options.escape || reNoMatch).source + "|" + interpolate.source + "|" + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + "|" + (options.evaluate || reNoMatch).source + "|$",
            "g"
          );
          var sourceURL = "//# sourceURL=" + (hasOwnProperty.call(options, "sourceURL") ? (options.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++templateCounter + "]") + "\n";
          string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
            interpolateValue || (interpolateValue = esTemplateValue);
            source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);
            if (escapeValue) {
              isEscaping = true;
              source += "' +\n__e(" + escapeValue + ") +\n'";
            }
            if (evaluateValue) {
              isEvaluating = true;
              source += "';\n" + evaluateValue + ";\n__p += '";
            }
            if (interpolateValue) {
              source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
            }
            index = offset + match.length;
            return match;
          });
          source += "';\n";
          var variable = hasOwnProperty.call(options, "variable") && options.variable;
          if (!variable) {
            source = "with (obj) {\n" + source + "\n}\n";
          } else if (reForbiddenIdentifierChars.test(variable)) {
            throw new Error2(INVALID_TEMPL_VAR_ERROR_TEXT);
          }
          source = (isEvaluating ? source.replace(reEmptyStringLeading, "") : source).replace(reEmptyStringMiddle, "$1").replace(reEmptyStringTrailing, "$1;");
          source = "function(" + (variable || "obj") + ") {\n" + (variable ? "" : "obj || (obj = {});\n") + "var __t, __p = ''" + (isEscaping ? ", __e = _.escape" : "") + (isEvaluating ? ", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n" : ";\n") + source + "return __p\n}";
          var result2 = attempt(function() {
            return Function2(importsKeys, sourceURL + "return " + source).apply(undefined$1, importsValues);
          });
          result2.source = source;
          if (isError(result2)) {
            throw result2;
          }
          return result2;
        }
        function toLower(value) {
          return toString(value).toLowerCase();
        }
        function toUpper(value) {
          return toString(value).toUpperCase();
        }
        function trim(string, chars, guard) {
          string = toString(string);
          if (string && (guard || chars === undefined$1)) {
            return baseTrim(string);
          }
          if (!string || !(chars = baseToString(chars))) {
            return string;
          }
          var strSymbols = stringToArray2(string), chrSymbols = stringToArray2(chars), start = charsStartIndex(strSymbols, chrSymbols), end = charsEndIndex(strSymbols, chrSymbols) + 1;
          return castSlice(strSymbols, start, end).join("");
        }
        function trimEnd(string, chars, guard) {
          string = toString(string);
          if (string && (guard || chars === undefined$1)) {
            return string.slice(0, trimmedEndIndex(string) + 1);
          }
          if (!string || !(chars = baseToString(chars))) {
            return string;
          }
          var strSymbols = stringToArray2(string), end = charsEndIndex(strSymbols, stringToArray2(chars)) + 1;
          return castSlice(strSymbols, 0, end).join("");
        }
        function trimStart(string, chars, guard) {
          string = toString(string);
          if (string && (guard || chars === undefined$1)) {
            return string.replace(reTrimStart, "");
          }
          if (!string || !(chars = baseToString(chars))) {
            return string;
          }
          var strSymbols = stringToArray2(string), start = charsStartIndex(strSymbols, stringToArray2(chars));
          return castSlice(strSymbols, start).join("");
        }
        function truncate(string, options) {
          var length = DEFAULT_TRUNC_LENGTH, omission = DEFAULT_TRUNC_OMISSION;
          if (isObject(options)) {
            var separator = "separator" in options ? options.separator : separator;
            length = "length" in options ? toInteger(options.length) : length;
            omission = "omission" in options ? baseToString(options.omission) : omission;
          }
          string = toString(string);
          var strLength = string.length;
          if (hasUnicode(string)) {
            var strSymbols = stringToArray2(string);
            strLength = strSymbols.length;
          }
          if (length >= strLength) {
            return string;
          }
          var end = length - stringSize(omission);
          if (end < 1) {
            return omission;
          }
          var result2 = strSymbols ? castSlice(strSymbols, 0, end).join("") : string.slice(0, end);
          if (separator === undefined$1) {
            return result2 + omission;
          }
          if (strSymbols) {
            end += result2.length - end;
          }
          if (isRegExp2(separator)) {
            if (string.slice(end).search(separator)) {
              var match, substring = result2;
              if (!separator.global) {
                separator = RegExp2(separator.source, toString(reFlags.exec(separator)) + "g");
              }
              separator.lastIndex = 0;
              while (match = separator.exec(substring)) {
                var newEnd = match.index;
              }
              result2 = result2.slice(0, newEnd === undefined$1 ? end : newEnd);
            }
          } else if (string.indexOf(baseToString(separator), end) != end) {
            var index = result2.lastIndexOf(separator);
            if (index > -1) {
              result2 = result2.slice(0, index);
            }
          }
          return result2 + omission;
        }
        function unescape(string) {
          string = toString(string);
          return string && reHasEscapedHtml.test(string) ? string.replace(reEscapedHtml, unescapeHtmlChar) : string;
        }
        var upperCase = createCompounder(function(result2, word, index) {
          return result2 + (index ? " " : "") + word.toUpperCase();
        });
        var upperFirst = createCaseFirst("toUpperCase");
        function words(string, pattern, guard) {
          string = toString(string);
          pattern = guard ? undefined$1 : pattern;
          if (pattern === undefined$1) {
            return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
          }
          return string.match(pattern) || [];
        }
        var attempt = baseRest(function(func, args) {
          try {
            return apply2(func, undefined$1, args);
          } catch (e) {
            return isError(e) ? e : new Error2(e);
          }
        });
        var bindAll = flatRest(function(object, methodNames) {
          arrayEach(methodNames, function(key) {
            key = toKey(key);
            baseAssignValue(object, key, bind2(object[key], object));
          });
          return object;
        });
        function cond(pairs) {
          var length = pairs == null ? 0 : pairs.length, toIteratee = getIteratee();
          pairs = !length ? [] : arrayMap(pairs, function(pair) {
            if (typeof pair[1] != "function") {
              throw new TypeError2(FUNC_ERROR_TEXT);
            }
            return [toIteratee(pair[0]), pair[1]];
          });
          return baseRest(function(args) {
            var index = -1;
            while (++index < length) {
              var pair = pairs[index];
              if (apply2(pair[0], this, args)) {
                return apply2(pair[1], this, args);
              }
            }
          });
        }
        function conforms(source) {
          return baseConforms(baseClone(source, CLONE_DEEP_FLAG));
        }
        function constant(value) {
          return function() {
            return value;
          };
        }
        function defaultTo(value, defaultValue) {
          return value == null || value !== value ? defaultValue : value;
        }
        var flow = createFlow();
        var flowRight = createFlow(true);
        function identity(value) {
          return value;
        }
        function iteratee(func) {
          return baseIteratee(typeof func == "function" ? func : baseClone(func, CLONE_DEEP_FLAG));
        }
        function matches2(source) {
          return baseMatches(baseClone(source, CLONE_DEEP_FLAG));
        }
        function matchesProperty(path, srcValue) {
          return baseMatchesProperty(path, baseClone(srcValue, CLONE_DEEP_FLAG));
        }
        var method = baseRest(function(path, args) {
          return function(object) {
            return baseInvoke(object, path, args);
          };
        });
        var methodOf = baseRest(function(object, args) {
          return function(path) {
            return baseInvoke(object, path, args);
          };
        });
        function mixin(object, source, options) {
          var props = keys2(source), methodNames = baseFunctions(source, props);
          if (options == null && !(isObject(source) && (methodNames.length || !props.length))) {
            options = source;
            source = object;
            object = this;
            methodNames = baseFunctions(source, keys2(source));
          }
          var chain2 = !(isObject(options) && "chain" in options) || !!options.chain, isFunc = isFunction2(object);
          arrayEach(methodNames, function(methodName) {
            var func = source[methodName];
            object[methodName] = func;
            if (isFunc) {
              object.prototype[methodName] = function() {
                var chainAll = this.__chain__;
                if (chain2 || chainAll) {
                  var result2 = object(this.__wrapped__), actions = result2.__actions__ = copyArray(this.__actions__);
                  actions.push({ "func": func, "args": arguments, "thisArg": object });
                  result2.__chain__ = chainAll;
                  return result2;
                }
                return func.apply(object, arrayPush([this.value()], arguments));
              };
            }
          });
          return object;
        }
        function noConflict() {
          if (root._ === this) {
            root._ = oldDash;
          }
          return this;
        }
        function noop2() {
        }
        function nthArg(n) {
          n = toInteger(n);
          return baseRest(function(args) {
            return baseNth(args, n);
          });
        }
        var over = createOver(arrayMap);
        var overEvery = createOver(arrayEvery);
        var overSome = createOver(arraySome);
        function property(path) {
          return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
        }
        function propertyOf(object) {
          return function(path) {
            return object == null ? undefined$1 : baseGet(object, path);
          };
        }
        var range = createRange();
        var rangeRight = createRange(true);
        function stubArray() {
          return [];
        }
        function stubFalse() {
          return false;
        }
        function stubObject() {
          return {};
        }
        function stubString() {
          return "";
        }
        function stubTrue() {
          return true;
        }
        function times(n, iteratee2) {
          n = toInteger(n);
          if (n < 1 || n > MAX_SAFE_INTEGER) {
            return [];
          }
          var index = MAX_ARRAY_LENGTH, length = nativeMin(n, MAX_ARRAY_LENGTH);
          iteratee2 = getIteratee(iteratee2);
          n -= MAX_ARRAY_LENGTH;
          var result2 = baseTimes(length, iteratee2);
          while (++index < n) {
            iteratee2(index);
          }
          return result2;
        }
        function toPath(value) {
          if (isArray(value)) {
            return arrayMap(value, toKey);
          }
          return isSymbol(value) ? [value] : copyArray(stringToPath(toString(value)));
        }
        function uniqueId(prefix) {
          var id = ++idCounter;
          return toString(prefix) + id;
        }
        var add = createMathOperation(function(augend, addend) {
          return augend + addend;
        }, 0);
        var ceil = createRound("ceil");
        var divide = createMathOperation(function(dividend, divisor) {
          return dividend / divisor;
        }, 1);
        var floor = createRound("floor");
        function max(array) {
          return array && array.length ? baseExtremum(array, identity, baseGt) : undefined$1;
        }
        function maxBy(array, iteratee2) {
          return array && array.length ? baseExtremum(array, getIteratee(iteratee2, 2), baseGt) : undefined$1;
        }
        function mean(array) {
          return baseMean(array, identity);
        }
        function meanBy(array, iteratee2) {
          return baseMean(array, getIteratee(iteratee2, 2));
        }
        function min(array) {
          return array && array.length ? baseExtremum(array, identity, baseLt) : undefined$1;
        }
        function minBy(array, iteratee2) {
          return array && array.length ? baseExtremum(array, getIteratee(iteratee2, 2), baseLt) : undefined$1;
        }
        var multiply = createMathOperation(function(multiplier, multiplicand) {
          return multiplier * multiplicand;
        }, 1);
        var round = createRound("round");
        var subtract = createMathOperation(function(minuend, subtrahend) {
          return minuend - subtrahend;
        }, 0);
        function sum(array) {
          return array && array.length ? baseSum(array, identity) : 0;
        }
        function sumBy(array, iteratee2) {
          return array && array.length ? baseSum(array, getIteratee(iteratee2, 2)) : 0;
        }
        lodash2.after = after;
        lodash2.ary = ary;
        lodash2.assign = assign;
        lodash2.assignIn = assignIn;
        lodash2.assignInWith = assignInWith;
        lodash2.assignWith = assignWith;
        lodash2.at = at;
        lodash2.before = before;
        lodash2.bind = bind2;
        lodash2.bindAll = bindAll;
        lodash2.bindKey = bindKey;
        lodash2.castArray = castArray;
        lodash2.chain = chain;
        lodash2.chunk = chunk;
        lodash2.compact = compact;
        lodash2.concat = concat;
        lodash2.cond = cond;
        lodash2.conforms = conforms;
        lodash2.constant = constant;
        lodash2.countBy = countBy;
        lodash2.create = create;
        lodash2.curry = curry;
        lodash2.curryRight = curryRight;
        lodash2.debounce = debounce;
        lodash2.defaults = defaults2;
        lodash2.defaultsDeep = defaultsDeep;
        lodash2.defer = defer;
        lodash2.delay = delay;
        lodash2.difference = difference;
        lodash2.differenceBy = differenceBy;
        lodash2.differenceWith = differenceWith;
        lodash2.drop = drop;
        lodash2.dropRight = dropRight;
        lodash2.dropRightWhile = dropRightWhile;
        lodash2.dropWhile = dropWhile;
        lodash2.fill = fill;
        lodash2.filter = filter;
        lodash2.flatMap = flatMap;
        lodash2.flatMapDeep = flatMapDeep;
        lodash2.flatMapDepth = flatMapDepth;
        lodash2.flatten = flatten;
        lodash2.flattenDeep = flattenDeep;
        lodash2.flattenDepth = flattenDepth;
        lodash2.flip = flip;
        lodash2.flow = flow;
        lodash2.flowRight = flowRight;
        lodash2.fromPairs = fromPairs;
        lodash2.functions = functions;
        lodash2.functionsIn = functionsIn;
        lodash2.groupBy = groupBy;
        lodash2.initial = initial;
        lodash2.intersection = intersection;
        lodash2.intersectionBy = intersectionBy;
        lodash2.intersectionWith = intersectionWith;
        lodash2.invert = invert;
        lodash2.invertBy = invertBy;
        lodash2.invokeMap = invokeMap;
        lodash2.iteratee = iteratee;
        lodash2.keyBy = keyBy;
        lodash2.keys = keys2;
        lodash2.keysIn = keysIn;
        lodash2.map = map;
        lodash2.mapKeys = mapKeys;
        lodash2.mapValues = mapValues;
        lodash2.matches = matches2;
        lodash2.matchesProperty = matchesProperty;
        lodash2.memoize = memoize;
        lodash2.merge = merge;
        lodash2.mergeWith = mergeWith;
        lodash2.method = method;
        lodash2.methodOf = methodOf;
        lodash2.mixin = mixin;
        lodash2.negate = negate;
        lodash2.nthArg = nthArg;
        lodash2.omit = omit;
        lodash2.omitBy = omitBy;
        lodash2.once = once;
        lodash2.orderBy = orderBy;
        lodash2.over = over;
        lodash2.overArgs = overArgs;
        lodash2.overEvery = overEvery;
        lodash2.overSome = overSome;
        lodash2.partial = partial;
        lodash2.partialRight = partialRight;
        lodash2.partition = partition;
        lodash2.pick = pick;
        lodash2.pickBy = pickBy;
        lodash2.property = property;
        lodash2.propertyOf = propertyOf;
        lodash2.pull = pull;
        lodash2.pullAll = pullAll;
        lodash2.pullAllBy = pullAllBy;
        lodash2.pullAllWith = pullAllWith;
        lodash2.pullAt = pullAt;
        lodash2.range = range;
        lodash2.rangeRight = rangeRight;
        lodash2.rearg = rearg;
        lodash2.reject = reject;
        lodash2.remove = remove;
        lodash2.rest = rest;
        lodash2.reverse = reverse;
        lodash2.sampleSize = sampleSize;
        lodash2.set = set;
        lodash2.setWith = setWith;
        lodash2.shuffle = shuffle;
        lodash2.slice = slice;
        lodash2.sortBy = sortBy;
        lodash2.sortedUniq = sortedUniq;
        lodash2.sortedUniqBy = sortedUniqBy;
        lodash2.split = split2;
        lodash2.spread = spread;
        lodash2.tail = tail;
        lodash2.take = take;
        lodash2.takeRight = takeRight;
        lodash2.takeRightWhile = takeRightWhile;
        lodash2.takeWhile = takeWhile;
        lodash2.tap = tap;
        lodash2.throttle = throttle;
        lodash2.thru = thru;
        lodash2.toArray = toArray;
        lodash2.toPairs = toPairs;
        lodash2.toPairsIn = toPairsIn;
        lodash2.toPath = toPath;
        lodash2.toPlainObject = toPlainObject;
        lodash2.transform = transform;
        lodash2.unary = unary;
        lodash2.union = union;
        lodash2.unionBy = unionBy;
        lodash2.unionWith = unionWith;
        lodash2.uniq = uniq;
        lodash2.uniqBy = uniqBy;
        lodash2.uniqWith = uniqWith;
        lodash2.unset = unset;
        lodash2.unzip = unzip;
        lodash2.unzipWith = unzipWith;
        lodash2.update = update;
        lodash2.updateWith = updateWith;
        lodash2.values = values;
        lodash2.valuesIn = valuesIn;
        lodash2.without = without;
        lodash2.words = words;
        lodash2.wrap = wrap2;
        lodash2.xor = xor;
        lodash2.xorBy = xorBy;
        lodash2.xorWith = xorWith;
        lodash2.zip = zip;
        lodash2.zipObject = zipObject;
        lodash2.zipObjectDeep = zipObjectDeep;
        lodash2.zipWith = zipWith;
        lodash2.entries = toPairs;
        lodash2.entriesIn = toPairsIn;
        lodash2.extend = assignIn;
        lodash2.extendWith = assignInWith;
        mixin(lodash2, lodash2);
        lodash2.add = add;
        lodash2.attempt = attempt;
        lodash2.camelCase = camelCase;
        lodash2.capitalize = capitalize;
        lodash2.ceil = ceil;
        lodash2.clamp = clamp;
        lodash2.clone = clone;
        lodash2.cloneDeep = cloneDeep;
        lodash2.cloneDeepWith = cloneDeepWith;
        lodash2.cloneWith = cloneWith;
        lodash2.conformsTo = conformsTo;
        lodash2.deburr = deburr;
        lodash2.defaultTo = defaultTo;
        lodash2.divide = divide;
        lodash2.endsWith = endsWith;
        lodash2.eq = eq;
        lodash2.escape = escape;
        lodash2.escapeRegExp = escapeRegExp;
        lodash2.every = every;
        lodash2.find = find2;
        lodash2.findIndex = findIndex;
        lodash2.findKey = findKey;
        lodash2.findLast = findLast;
        lodash2.findLastIndex = findLastIndex;
        lodash2.findLastKey = findLastKey;
        lodash2.floor = floor;
        lodash2.forEach = forEach2;
        lodash2.forEachRight = forEachRight;
        lodash2.forIn = forIn;
        lodash2.forInRight = forInRight;
        lodash2.forOwn = forOwn;
        lodash2.forOwnRight = forOwnRight;
        lodash2.get = get;
        lodash2.gt = gt;
        lodash2.gte = gte;
        lodash2.has = has;
        lodash2.hasIn = hasIn;
        lodash2.head = head;
        lodash2.identity = identity;
        lodash2.includes = includes;
        lodash2.indexOf = indexOf;
        lodash2.inRange = inRange;
        lodash2.invoke = invoke;
        lodash2.isArguments = isArguments;
        lodash2.isArray = isArray;
        lodash2.isArrayBuffer = isArrayBuffer;
        lodash2.isArrayLike = isArrayLike;
        lodash2.isArrayLikeObject = isArrayLikeObject;
        lodash2.isBoolean = isBoolean;
        lodash2.isBuffer = isBuffer;
        lodash2.isDate = isDate;
        lodash2.isElement = isElement;
        lodash2.isEmpty = isEmpty2;
        lodash2.isEqual = isEqual;
        lodash2.isEqualWith = isEqualWith;
        lodash2.isError = isError;
        lodash2.isFinite = isFinite;
        lodash2.isFunction = isFunction2;
        lodash2.isInteger = isInteger;
        lodash2.isLength = isLength;
        lodash2.isMap = isMap;
        lodash2.isMatch = isMatch;
        lodash2.isMatchWith = isMatchWith;
        lodash2.isNaN = isNaN;
        lodash2.isNative = isNative;
        lodash2.isNil = isNil;
        lodash2.isNull = isNull;
        lodash2.isNumber = isNumber2;
        lodash2.isObject = isObject;
        lodash2.isObjectLike = isObjectLike;
        lodash2.isPlainObject = isPlainObject2;
        lodash2.isRegExp = isRegExp2;
        lodash2.isSafeInteger = isSafeInteger;
        lodash2.isSet = isSet;
        lodash2.isString = isString;
        lodash2.isSymbol = isSymbol;
        lodash2.isTypedArray = isTypedArray;
        lodash2.isUndefined = isUndefined;
        lodash2.isWeakMap = isWeakMap;
        lodash2.isWeakSet = isWeakSet;
        lodash2.join = join2;
        lodash2.kebabCase = kebabCase;
        lodash2.last = last;
        lodash2.lastIndexOf = lastIndexOf;
        lodash2.lowerCase = lowerCase;
        lodash2.lowerFirst = lowerFirst;
        lodash2.lt = lt;
        lodash2.lte = lte;
        lodash2.max = max;
        lodash2.maxBy = maxBy;
        lodash2.mean = mean;
        lodash2.meanBy = meanBy;
        lodash2.min = min;
        lodash2.minBy = minBy;
        lodash2.stubArray = stubArray;
        lodash2.stubFalse = stubFalse;
        lodash2.stubObject = stubObject;
        lodash2.stubString = stubString;
        lodash2.stubTrue = stubTrue;
        lodash2.multiply = multiply;
        lodash2.nth = nth;
        lodash2.noConflict = noConflict;
        lodash2.noop = noop2;
        lodash2.now = now;
        lodash2.pad = pad;
        lodash2.padEnd = padEnd;
        lodash2.padStart = padStart;
        lodash2.parseInt = parseInt2;
        lodash2.random = random;
        lodash2.reduce = reduce;
        lodash2.reduceRight = reduceRight;
        lodash2.repeat = repeat;
        lodash2.replace = replace2;
        lodash2.result = result;
        lodash2.round = round;
        lodash2.runInContext = runInContext2;
        lodash2.sample = sample;
        lodash2.size = size;
        lodash2.snakeCase = snakeCase;
        lodash2.some = some;
        lodash2.sortedIndex = sortedIndex;
        lodash2.sortedIndexBy = sortedIndexBy;
        lodash2.sortedIndexOf = sortedIndexOf;
        lodash2.sortedLastIndex = sortedLastIndex;
        lodash2.sortedLastIndexBy = sortedLastIndexBy;
        lodash2.sortedLastIndexOf = sortedLastIndexOf;
        lodash2.startCase = startCase;
        lodash2.startsWith = startsWith;
        lodash2.subtract = subtract;
        lodash2.sum = sum;
        lodash2.sumBy = sumBy;
        lodash2.template = template;
        lodash2.times = times;
        lodash2.toFinite = toFinite;
        lodash2.toInteger = toInteger;
        lodash2.toLength = toLength;
        lodash2.toLower = toLower;
        lodash2.toNumber = toNumber;
        lodash2.toSafeInteger = toSafeInteger;
        lodash2.toString = toString;
        lodash2.toUpper = toUpper;
        lodash2.trim = trim;
        lodash2.trimEnd = trimEnd;
        lodash2.trimStart = trimStart;
        lodash2.truncate = truncate;
        lodash2.unescape = unescape;
        lodash2.uniqueId = uniqueId;
        lodash2.upperCase = upperCase;
        lodash2.upperFirst = upperFirst;
        lodash2.each = forEach2;
        lodash2.eachRight = forEachRight;
        lodash2.first = head;
        mixin(lodash2, function() {
          var source = {};
          baseForOwn(lodash2, function(func, methodName) {
            if (!hasOwnProperty.call(lodash2.prototype, methodName)) {
              source[methodName] = func;
            }
          });
          return source;
        }(), { "chain": false });
        lodash2.VERSION = VERSION;
        arrayEach(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(methodName) {
          lodash2[methodName].placeholder = lodash2;
        });
        arrayEach(["drop", "take"], function(methodName, index) {
          LazyWrapper.prototype[methodName] = function(n) {
            n = n === undefined$1 ? 1 : nativeMax(toInteger(n), 0);
            var result2 = this.__filtered__ && !index ? new LazyWrapper(this) : this.clone();
            if (result2.__filtered__) {
              result2.__takeCount__ = nativeMin(n, result2.__takeCount__);
            } else {
              result2.__views__.push({
                "size": nativeMin(n, MAX_ARRAY_LENGTH),
                "type": methodName + (result2.__dir__ < 0 ? "Right" : "")
              });
            }
            return result2;
          };
          LazyWrapper.prototype[methodName + "Right"] = function(n) {
            return this.reverse()[methodName](n).reverse();
          };
        });
        arrayEach(["filter", "map", "takeWhile"], function(methodName, index) {
          var type = index + 1, isFilter2 = type == LAZY_FILTER_FLAG || type == LAZY_WHILE_FLAG;
          LazyWrapper.prototype[methodName] = function(iteratee2) {
            var result2 = this.clone();
            result2.__iteratees__.push({
              "iteratee": getIteratee(iteratee2, 3),
              "type": type
            });
            result2.__filtered__ = result2.__filtered__ || isFilter2;
            return result2;
          };
        });
        arrayEach(["head", "last"], function(methodName, index) {
          var takeName = "take" + (index ? "Right" : "");
          LazyWrapper.prototype[methodName] = function() {
            return this[takeName](1).value()[0];
          };
        });
        arrayEach(["initial", "tail"], function(methodName, index) {
          var dropName = "drop" + (index ? "" : "Right");
          LazyWrapper.prototype[methodName] = function() {
            return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
          };
        });
        LazyWrapper.prototype.compact = function() {
          return this.filter(identity);
        };
        LazyWrapper.prototype.find = function(predicate) {
          return this.filter(predicate).head();
        };
        LazyWrapper.prototype.findLast = function(predicate) {
          return this.reverse().find(predicate);
        };
        LazyWrapper.prototype.invokeMap = baseRest(function(path, args) {
          if (typeof path == "function") {
            return new LazyWrapper(this);
          }
          return this.map(function(value) {
            return baseInvoke(value, path, args);
          });
        });
        LazyWrapper.prototype.reject = function(predicate) {
          return this.filter(negate(getIteratee(predicate)));
        };
        LazyWrapper.prototype.slice = function(start, end) {
          start = toInteger(start);
          var result2 = this;
          if (result2.__filtered__ && (start > 0 || end < 0)) {
            return new LazyWrapper(result2);
          }
          if (start < 0) {
            result2 = result2.takeRight(-start);
          } else if (start) {
            result2 = result2.drop(start);
          }
          if (end !== undefined$1) {
            end = toInteger(end);
            result2 = end < 0 ? result2.dropRight(-end) : result2.take(end - start);
          }
          return result2;
        };
        LazyWrapper.prototype.takeRightWhile = function(predicate) {
          return this.reverse().takeWhile(predicate).reverse();
        };
        LazyWrapper.prototype.toArray = function() {
          return this.take(MAX_ARRAY_LENGTH);
        };
        baseForOwn(LazyWrapper.prototype, function(func, methodName) {
          var checkIteratee = /^(?:filter|find|map|reject)|While$/.test(methodName), isTaker = /^(?:head|last)$/.test(methodName), lodashFunc = lodash2[isTaker ? "take" + (methodName == "last" ? "Right" : "") : methodName], retUnwrapped = isTaker || /^find/.test(methodName);
          if (!lodashFunc) {
            return;
          }
          lodash2.prototype[methodName] = function() {
            var value = this.__wrapped__, args = isTaker ? [1] : arguments, isLazy = value instanceof LazyWrapper, iteratee2 = args[0], useLazy = isLazy || isArray(value);
            var interceptor = function(value2) {
              var result3 = lodashFunc.apply(lodash2, arrayPush([value2], args));
              return isTaker && chainAll ? result3[0] : result3;
            };
            if (useLazy && checkIteratee && typeof iteratee2 == "function" && iteratee2.length != 1) {
              isLazy = useLazy = false;
            }
            var chainAll = this.__chain__, isHybrid = !!this.__actions__.length, isUnwrapped = retUnwrapped && !chainAll, onlyLazy = isLazy && !isHybrid;
            if (!retUnwrapped && useLazy) {
              value = onlyLazy ? value : new LazyWrapper(this);
              var result2 = func.apply(value, args);
              result2.__actions__.push({ "func": thru, "args": [interceptor], "thisArg": undefined$1 });
              return new LodashWrapper(result2, chainAll);
            }
            if (isUnwrapped && onlyLazy) {
              return func.apply(this, args);
            }
            result2 = this.thru(interceptor);
            return isUnwrapped ? isTaker ? result2.value()[0] : result2.value() : result2;
          };
        });
        arrayEach(["pop", "push", "shift", "sort", "splice", "unshift"], function(methodName) {
          var func = arrayProto[methodName], chainName = /^(?:push|sort|unshift)$/.test(methodName) ? "tap" : "thru", retUnwrapped = /^(?:pop|shift)$/.test(methodName);
          lodash2.prototype[methodName] = function() {
            var args = arguments;
            if (retUnwrapped && !this.__chain__) {
              var value = this.value();
              return func.apply(isArray(value) ? value : [], args);
            }
            return this[chainName](function(value2) {
              return func.apply(isArray(value2) ? value2 : [], args);
            });
          };
        });
        baseForOwn(LazyWrapper.prototype, function(func, methodName) {
          var lodashFunc = lodash2[methodName];
          if (lodashFunc) {
            var key = lodashFunc.name + "";
            if (!hasOwnProperty.call(realNames, key)) {
              realNames[key] = [];
            }
            realNames[key].push({ "name": methodName, "func": lodashFunc });
          }
        });
        realNames[createHybrid(undefined$1, WRAP_BIND_KEY_FLAG).name] = [{
          "name": "wrapper",
          "func": undefined$1
        }];
        LazyWrapper.prototype.clone = lazyClone;
        LazyWrapper.prototype.reverse = lazyReverse;
        LazyWrapper.prototype.value = lazyValue;
        lodash2.prototype.at = wrapperAt;
        lodash2.prototype.chain = wrapperChain;
        lodash2.prototype.commit = wrapperCommit;
        lodash2.prototype.next = wrapperNext;
        lodash2.prototype.plant = wrapperPlant;
        lodash2.prototype.reverse = wrapperReverse;
        lodash2.prototype.toJSON = lodash2.prototype.valueOf = lodash2.prototype.value = wrapperValue;
        lodash2.prototype.first = lodash2.prototype.head;
        if (symIterator) {
          lodash2.prototype[symIterator] = wrapperToIterator;
        }
        return lodash2;
      };
      var _ = runInContext();
      if (freeModule) {
        (freeModule.exports = _)._ = _;
        freeExports._ = _;
      } else {
        root._ = _;
      }
    }).call(commonjsGlobal);
  })(lodash, lodash.exports);
  const findBlock = findParentNode(
    (node) => node.type.name === "blockContainer"
  );
  function findCommandBeforeCursor(char, selection) {
    if (!selection.empty) {
      return void 0;
    }
    const node = selection.$anchor.nodeBefore;
    if (!node || !node.text) {
      return void 0;
    }
    const regex = new RegExp(`${lodash.exports.escapeRegExp(char)}([^${lodash.exports.escapeRegExp(char)}]*)$`);
    const match = node.text.match(regex);
    if (!match) {
      return void 0;
    }
    return {
      query: match[1],
      range: {
        from: selection.$anchor.pos - match[1].length - char.length,
        to: selection.$anchor.pos
      }
    };
  }
  class SuggestionPluginView {
    constructor({
      editor,
      pluginKey,
      onSelectItem: selectItemCallback = () => {
      },
      suggestionsMenuFactory
    }) {
      __publicField(this, "editor");
      __publicField(this, "pluginKey");
      __publicField(this, "suggestionsMenu");
      __publicField(this, "pluginState");
      __publicField(this, "itemCallback");
      this.editor = editor;
      this.pluginKey = pluginKey;
      this.pluginState = {
        active: false,
        range: null,
        query: null,
        notFoundCount: 0,
        items: [],
        selectedItemIndex: 0,
        type: "slash",
        decorationId: null
      };
      this.itemCallback = (item) => selectItemCallback({
        item,
        editor,
        range: this.pluginState.range
      });
      this.suggestionsMenu = suggestionsMenuFactory(this.getStaticParams());
    }
    update(view, prevState) {
      const prev = this.pluginKey.getState(prevState);
      const next = this.pluginKey.getState(view.state);
      const started = !prev.active && next.active;
      const stopped = prev.active && !next.active;
      const changed = prev.active && next.active;
      if (!started && !changed && !stopped) {
        return;
      }
      this.pluginState = stopped ? prev : next;
      if (stopped) {
        this.suggestionsMenu.hide();
        this.suggestionsMenu.element.removeEventListener(
          "mousedown",
          (event) => event.preventDefault()
        );
      }
      if (changed) {
        this.suggestionsMenu.render(this.getDynamicParams(), false);
      }
      if (started) {
        this.suggestionsMenu.render(this.getDynamicParams(), true);
        this.suggestionsMenu.element.addEventListener(
          "mousedown",
          (event) => event.preventDefault()
        );
      }
    }
    getStaticParams() {
      return {
        itemCallback: (item) => this.itemCallback(item)
      };
    }
    getDynamicParams() {
      const decorationNode = document.querySelector(
        `[data-decoration-id="${this.pluginState.decorationId}"]`
      );
      return {
        items: this.pluginState.items,
        selectedItemIndex: this.pluginState.selectedItemIndex,
        referenceRect: decorationNode.getBoundingClientRect()
      };
    }
  }
  function createSuggestionPlugin({
    pluginKey,
    editor,
    char,
    suggestionsMenuFactory,
    onSelectItem: selectItemCallback = () => {
    },
    items = () => []
  }) {
    if (char.length !== 1) {
      throw new Error("'char' should be a single character");
    }
    const deactivate = (view) => {
      view.dispatch(view.state.tr.setMeta(pluginKey, { deactivate: true }));
    };
    return new Plugin({
      key: pluginKey,
      view: (view) => new SuggestionPluginView({
        editor,
        pluginKey,
        onSelectItem: (props) => {
          deactivate(view);
          selectItemCallback(props);
        },
        suggestionsMenuFactory
      }),
      state: {
        init() {
          return {
            active: false,
            range: null,
            query: null,
            notFoundCount: 0,
            items: [],
            selectedItemIndex: 0,
            type: "slash",
            decorationId: null
          };
        },
        apply(transaction, prev, _oldState, newState) {
          var _a, _b, _c, _d;
          const { selection } = transaction;
          const next = { ...prev };
          if (transaction.getMeta("numberedListIndexing") !== void 0) {
            return next;
          }
          if (((_a = transaction.getMeta(pluginKey)) == null ? void 0 : _a.selectedItemIndexChanged) !== void 0) {
            let newIndex = transaction.getMeta(pluginKey).selectedItemIndexChanged;
            if (newIndex < 0) {
              newIndex = prev.items.length - 1;
            }
            if (newIndex >= prev.items.length) {
              newIndex = 0;
            }
            next.selectedItemIndex = newIndex;
            return next;
          }
          if (selection.from === selection.to && !((_b = transaction.getMeta(pluginKey)) == null ? void 0 : _b.deactivate) && !transaction.getMeta("focus") && !transaction.getMeta("blur") && !transaction.getMeta("pointer")) {
            if (prev.active && selection.from <= prev.range.from) {
              next.active = false;
            } else if ((_c = transaction.getMeta(pluginKey)) == null ? void 0 : _c.activate) {
              const newDecorationId = `id_${Math.floor(
                Math.random() * 4294967295
              )}`;
              next.decorationId = newDecorationId;
              next.range = {
                from: selection.from - 1,
                to: selection.to
              };
              next.query = "";
              next.active = true;
              next.type = (_d = transaction.getMeta(pluginKey)) == null ? void 0 : _d.type;
              next.selectedItemIndex = 0;
            } else if (prev.active) {
              const match = findCommandBeforeCursor(
                prev.type === "slash" ? char : "",
                newState.selection
              );
              if (!match) {
                throw new Error("active but no match (suggestions)");
              }
              next.range = match.range;
              next.active = true;
              next.decorationId = prev.decorationId;
              next.query = match.query;
              next.selectedItemIndex = 0;
            }
          } else {
            next.active = false;
          }
          if (next.active) {
            next.items = items(next.query);
            if (next.items.length) {
              next.notFoundCount = 0;
            } else {
              if (next.range.to > prev.range.to) {
                next.notFoundCount = prev.notFoundCount + 1;
              } else {
                next.notFoundCount = prev.notFoundCount;
              }
            }
            if (next.notFoundCount > 3) {
              next.active = false;
            }
          }
          if (!next.active) {
            next.decorationId = null;
            next.range = null;
            next.query = null;
            next.notFoundCount = 0;
            next.items = [];
          }
          return next;
        }
      },
      props: {
        handleKeyDown(view, event) {
          const { active } = this.getState(view.state);
          if (!active) {
            if (event.key === char) {
              view.dispatch(
                view.state.tr.insertText(char).scrollIntoView().setMeta(pluginKey, { activate: true, type: "slash" })
              );
              return true;
            }
          } else {
            const { items: items2, range, selectedItemIndex } = pluginKey.getState(
              view.state
            );
            if (event.key === "ArrowUp") {
              view.dispatch(
                view.state.tr.setMeta(pluginKey, {
                  selectedItemIndexChanged: selectedItemIndex - 1
                })
              );
              return true;
            }
            if (event.key === "ArrowDown") {
              view.dispatch(
                view.state.tr.setMeta(pluginKey, {
                  selectedItemIndexChanged: selectedItemIndex + 1
                })
              );
              return true;
            }
            if (event.key === "Enter") {
              deactivate(view);
              selectItemCallback({
                item: items2[selectedItemIndex],
                editor,
                range
              });
              return true;
            }
            if (event.key === "Escape") {
              deactivate(view);
              return true;
            }
          }
          return false;
        },
        handleClick(view) {
          deactivate(view);
        },
        decorations(state) {
          const { active, range, decorationId, type } = this.getState(
            state
          );
          if (!active) {
            return null;
          }
          if (type === "drag") {
            const blockNode = findBlock(state.selection);
            if (blockNode) {
              return DecorationSet.create(state.doc, [
                Decoration.node(
                  blockNode.pos,
                  blockNode.pos + blockNode.node.nodeSize,
                  {
                    nodeName: "span",
                    class: "suggestion-decorator",
                    "data-decoration-id": decorationId
                  }
                )
              ]);
            }
          }
          return DecorationSet.create(state.doc, [
            Decoration.inline(range.from, range.to, {
              nodeName: "span",
              class: "suggestion-decorator",
              "data-decoration-id": decorationId
            })
          ]);
        }
      }
    });
  }
  const isAppleOS = () => /Mac/.test(navigator.platform) || /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
  function formatKeyboardShortcut(shortcut) {
    if (isAppleOS()) {
      return shortcut.replace("Mod", "\u2318");
    } else {
      return shortcut.replace("Mod", "Ctrl");
    }
  }
  var SlashMenuGroups = /* @__PURE__ */ ((SlashMenuGroups2) => {
    SlashMenuGroups2["HEADINGS"] = "Headings";
    SlashMenuGroups2["BASIC_BLOCKS"] = "Basic Blocks";
    SlashMenuGroups2["CODE"] = "Code Blocks";
    SlashMenuGroups2["INLINE"] = "Inline";
    SlashMenuGroups2["EMBED"] = "Embed";
    SlashMenuGroups2["PLUGIN"] = "Plugin";
    return SlashMenuGroups2;
  })(SlashMenuGroups || {});
  class SlashMenuItem {
    constructor(name, group, execute, aliases = [], hint, shortcut) {
      __publicField(this, "groupName");
      this.name = name;
      this.group = group;
      this.execute = execute;
      this.aliases = aliases;
      this.hint = hint;
      this.shortcut = shortcut;
      this.groupName = group;
    }
    match(query) {
      return this.name.toLowerCase().startsWith(query.toLowerCase()) || this.aliases.filter(
        (alias) => alias.toLowerCase().startsWith(query.toLowerCase())
      ).length !== 0;
    }
  }
  const defaultCommands = {
    heading: new SlashMenuItem(
      "Heading",
      SlashMenuGroups.HEADINGS,
      (editor, range) => {
        return editor.chain().focus().deleteRange(range).BNCreateOrUpdateBlock(range.from, {
          type: "heading",
          props: {
            level: "1"
          }
        }).run();
      },
      ["h", "heading1", "h1"],
      "Used for a top-level heading",
      formatKeyboardShortcut("Mod-Alt-1")
    ),
    heading2: new SlashMenuItem(
      "Heading 2",
      SlashMenuGroups.HEADINGS,
      (editor, range) => {
        return editor.chain().focus().deleteRange(range).BNCreateOrUpdateBlock(range.from, {
          type: "heading",
          props: {
            level: "2"
          }
        }).run();
      },
      ["h2", "heading2", "subheading"],
      "Used for key sections",
      formatKeyboardShortcut("Mod-Alt-2")
    ),
    heading3: new SlashMenuItem(
      "Heading 3",
      SlashMenuGroups.HEADINGS,
      (editor, range) => {
        return editor.chain().focus().deleteRange(range).BNCreateOrUpdateBlock(range.from, {
          type: "heading",
          props: {
            level: "3"
          }
        }).run();
      },
      ["h3", "heading3", "subheading"],
      "Used for subsections and group headings",
      formatKeyboardShortcut("Mod-Alt-3")
    ),
    numberedList: new SlashMenuItem(
      "Numbered List",
      SlashMenuGroups.BASIC_BLOCKS,
      (editor, range) => {
        return editor.chain().focus().deleteRange(range).BNCreateOrUpdateBlock(range.from, {
          type: "numberedListItem",
          props: {}
        }).run();
      },
      ["li", "list", "numberedlist", "numbered list"],
      "Used to display a numbered list",
      formatKeyboardShortcut("Mod-Shift-7")
    ),
    bulletList: new SlashMenuItem(
      "Bullet List",
      SlashMenuGroups.BASIC_BLOCKS,
      (editor, range) => {
        return editor.chain().focus().deleteRange(range).BNCreateOrUpdateBlock(range.from, {
          type: "bulletListItem",
          props: {}
        }).run();
      },
      ["ul", "list", "bulletlist", "bullet list"],
      "Used to display an unordered list",
      formatKeyboardShortcut("Mod-Shift-8")
    ),
    paragraph: new SlashMenuItem(
      "Paragraph",
      SlashMenuGroups.BASIC_BLOCKS,
      (editor, range) => {
        return editor.chain().focus().deleteRange(range).BNCreateOrUpdateBlock(range.from, {
          type: "paragraph",
          props: {}
        }).run();
      },
      ["p"],
      "Used for the body of your document",
      formatKeyboardShortcut("Mod-Alt-0")
    )
  };
  const SlashMenuPluginKey = new PluginKey("suggestions-slash-commands");
  const SlashMenuExtension = Extension.create({
    name: "slash-command",
    addOptions() {
      return {
        commands: defaultCommands,
        slashMenuFactory: void 0
      };
    },
    addProseMirrorPlugins() {
      if (!this.options.slashMenuFactory) {
        throw new Error("UI Element factory not defined for SlashMenuExtension");
      }
      return [
        createSuggestionPlugin({
          pluginKey: SlashMenuPluginKey,
          editor: this.editor,
          char: "/",
          suggestionsMenuFactory: this.options.slashMenuFactory,
          items: (query) => {
            const commands2 = [];
            for (const key in this.options.commands) {
              commands2.push(this.options.commands[key]);
            }
            return commands2.filter((cmd) => cmd.match(query));
          },
          onSelectItem: ({ item, editor, range }) => {
            item.execute(editor, range);
          }
        })
      ];
    }
  });
  class MultipleNodeSelection extends Selection {
    constructor($anchor, $head) {
      super($anchor, $head);
      __publicField(this, "nodes");
      const parentNode2 = $anchor.node();
      this.nodes = [];
      $anchor.doc.nodesBetween($anchor.pos, $head.pos, (node, _pos, parent) => {
        if (parent !== null && parent.eq(parentNode2)) {
          this.nodes.push(node);
          return false;
        }
        return;
      });
    }
    static create(doc2, from, to = from) {
      return new MultipleNodeSelection(doc2.resolve(from), doc2.resolve(to));
    }
    content() {
      return new Slice(Fragment.from(this.nodes), 0, 0);
    }
    eq(selection) {
      if (!(selection instanceof MultipleNodeSelection)) {
        return false;
      }
      if (this.nodes.length !== selection.nodes.length) {
        return false;
      }
      if (this.from !== selection.from || this.to !== selection.to) {
        return false;
      }
      for (let i2 = 0; i2 < this.nodes.length; i2++) {
        if (!this.nodes[i2].eq(selection.nodes[i2])) {
          return false;
        }
      }
      return true;
    }
    map(doc2, mapping) {
      let fromResult = mapping.mapResult(this.from);
      let toResult = mapping.mapResult(this.to);
      if (toResult.deleted) {
        return Selection.near(doc2.resolve(fromResult.pos));
      }
      if (fromResult.deleted) {
        return Selection.near(doc2.resolve(toResult.pos));
      }
      return new MultipleNodeSelection(
        doc2.resolve(fromResult.pos),
        doc2.resolve(toResult.pos)
      );
    }
    toJSON() {
      return { type: "node", anchor: this.anchor, head: this.head };
    }
  }
  const serializeForClipboard = __serializeForClipboard;
  let horizontalAnchor;
  let dragImageElement;
  function getHorizontalAnchor() {
    const firstBlockGroup = document.querySelector(
      ".ProseMirror > [class*='blockGroup']"
    );
    if (firstBlockGroup) {
      horizontalAnchor = absoluteRect(firstBlockGroup).left;
    }
    return horizontalAnchor;
  }
  function createRect(rect) {
    let newRect = {
      left: rect.left + document.body.scrollLeft,
      top: rect.top + document.body.scrollTop,
      width: rect.width,
      height: rect.height,
      bottom: 0,
      right: 0
    };
    newRect.bottom = newRect.top + newRect.height;
    newRect.right = newRect.left + newRect.width;
    return newRect;
  }
  function absoluteRect(element) {
    return createRect(element.getBoundingClientRect());
  }
  function getDraggableBlockFromCoords(coords, view) {
    var _a;
    let pos = view.posAtCoords(coords);
    if (!pos) {
      return void 0;
    }
    let node = view.domAtPos(pos.pos).node;
    if (node === view.dom) {
      return void 0;
    }
    while (node && node.parentNode && node.parentNode !== view.dom && !((_a = node.hasAttribute) == null ? void 0 : _a.call(node, "data-id"))) {
      node = node.parentNode;
    }
    if (!node) {
      return void 0;
    }
    return { node, id: node.getAttribute("data-id") };
  }
  function blockPositionFromCoords(coords, view) {
    let block2 = getDraggableBlockFromCoords(coords, view);
    if (block2 && block2.node.nodeType === 1) {
      const docView = view.docView;
      let desc = docView.nearestDesc(block2.node, true);
      if (!desc || desc === docView) {
        return null;
      }
      return desc.posBefore;
    }
    return null;
  }
  function blockPositionsFromSelection(selection, doc2) {
    let beforeFirstBlockPos;
    let afterLastBlockPos;
    const selectionStartInBlockContent = doc2.resolve(selection.from).node().type.spec.group === "blockContent";
    const selectionEndInBlockContent = doc2.resolve(selection.to).node().type.spec.group === "blockContent";
    const minDepth = Math.min(selection.$anchor.depth, selection.$head.depth);
    if (selectionStartInBlockContent && selectionEndInBlockContent) {
      const startFirstBlockPos = selection.$from.start(minDepth - 1);
      const endLastBlockPos = selection.$to.end(minDepth - 1);
      beforeFirstBlockPos = doc2.resolve(startFirstBlockPos - 1).pos;
      afterLastBlockPos = doc2.resolve(endLastBlockPos + 1).pos;
    } else {
      beforeFirstBlockPos = selection.from;
      afterLastBlockPos = selection.to;
    }
    return { from: beforeFirstBlockPos, to: afterLastBlockPos };
  }
  function setDragImage(view, from, to = from) {
    if (from === to) {
      to += view.state.doc.resolve(from + 1).node().nodeSize;
    }
    const parentClone = view.domAtPos(from).node.cloneNode(true);
    const parent = view.domAtPos(from).node;
    const getElementIndex = (parentElement, targetElement) => Array.prototype.indexOf.call(parentElement.children, targetElement);
    const firstSelectedBlockIndex = getElementIndex(
      parent,
      view.domAtPos(from + 1).node.parentElement
    );
    const lastSelectedBlockIndex = getElementIndex(
      parent,
      view.domAtPos(to - 1).node.parentElement
    );
    for (let i2 = parent.childElementCount - 1; i2 >= 0; i2--) {
      if (i2 > lastSelectedBlockIndex || i2 < firstSelectedBlockIndex) {
        parentClone.removeChild(parentClone.children[i2]);
      }
    }
    dragImageElement = parentClone;
    dragImageElement.className = styles.dragPreview;
    document.body.appendChild(dragImageElement);
  }
  function unsetDragImage() {
    if (dragImageElement !== void 0) {
      document.body.removeChild(dragImageElement);
      dragImageElement = void 0;
    }
  }
  function dragStart(e, view) {
    if (!e.dataTransfer) {
      return;
    }
    const editorBoundingBox = view.dom.getBoundingClientRect();
    let coords = {
      left: editorBoundingBox.left + editorBoundingBox.width / 2,
      top: e.clientY
    };
    let pos = blockPositionFromCoords(coords, view);
    if (pos != null) {
      const selection = view.state.selection;
      const doc2 = view.state.doc;
      const { from, to } = blockPositionsFromSelection(selection, doc2);
      const draggedBlockInSelection = from <= pos && pos < to;
      const multipleBlocksSelected = !selection.$anchor.node().eq(selection.$head.node());
      if (draggedBlockInSelection && multipleBlocksSelected) {
        view.dispatch(
          view.state.tr.setSelection(MultipleNodeSelection.create(doc2, from, to))
        );
        setDragImage(view, from, to);
      } else {
        view.dispatch(
          view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos))
        );
        setDragImage(view, pos);
      }
      let slice = view.state.selection.content();
      let { dom, text: text2 } = serializeForClipboard(view, slice);
      e.dataTransfer.clearData();
      e.dataTransfer.setData("text/html", dom.innerHTML);
      e.dataTransfer.setData("text/plain", text2);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setDragImage(dragImageElement, 0, 0);
      view.dragging = { slice, move: true };
    }
  }
  class BlockMenuView {
    constructor({
      editor,
      blockMenuFactory,
      horizontalPosAnchoredAtRoot
    }) {
      __publicField(this, "editor");
      __publicField(this, "horizontalPosAnchoredAtRoot");
      __publicField(this, "blockMenu");
      __publicField(this, "hoveredBlock");
      __publicField(this, "menuOpen", false);
      __publicField(this, "menuFrozen", false);
      this.editor = editor;
      this.horizontalPosAnchoredAtRoot = horizontalPosAnchoredAtRoot;
      this.blockMenu = blockMenuFactory(this.getStaticParams());
      document.body.addEventListener(
        "mousemove",
        (event) => {
          var _a, _b;
          if (this.menuFrozen) {
            return;
          }
          const editorBoundingBox = this.editor.view.dom.getBoundingClientRect();
          const coords = {
            left: editorBoundingBox.left + editorBoundingBox.width / 2,
            top: event.clientY
          };
          const block2 = getDraggableBlockFromCoords(coords, this.editor.view);
          if (!block2) {
            if (this.menuOpen) {
              this.menuOpen = false;
              this.blockMenu.hide();
            }
            return;
          }
          if (this.menuOpen && ((_a = this.hoveredBlock) == null ? void 0 : _a.hasAttribute("data-id")) && ((_b = this.hoveredBlock) == null ? void 0 : _b.getAttribute("data-id")) === block2.id) {
            return;
          }
          const blockContent2 = block2.node.firstChild;
          this.hoveredBlock = blockContent2;
          if (!blockContent2) {
            return;
          }
          if (!this.menuOpen) {
            this.menuOpen = true;
            this.blockMenu.render(this.getDynamicParams(), true);
          } else {
            this.blockMenu.render(this.getDynamicParams(), false);
          }
        },
        true
      );
      document.body.addEventListener(
        "mousedown",
        (event) => {
          var _a;
          if ((_a = this.blockMenu.element) == null ? void 0 : _a.contains(event.target)) {
            return;
          }
          if (this.menuOpen) {
            this.menuOpen = false;
            this.blockMenu.hide();
          }
          this.menuFrozen = false;
        },
        true
      );
      document.body.addEventListener(
        "keydown",
        () => {
          if (this.menuOpen) {
            this.menuOpen = false;
            this.blockMenu.hide();
          }
          this.menuFrozen = false;
        },
        true
      );
    }
    destroy() {
      if (this.menuOpen) {
        this.menuOpen = false;
        this.blockMenu.hide();
      }
    }
    addBlock() {
      this.menuOpen = false;
      this.menuFrozen = true;
      this.blockMenu.hide();
      const blockBoundingBox = this.hoveredBlock.getBoundingClientRect();
      const pos = this.editor.view.posAtCoords({
        left: blockBoundingBox.left,
        top: blockBoundingBox.top
      });
      if (!pos) {
        return;
      }
      const blockInfo = getBlockInfoFromPos(this.editor.state.doc, pos.pos);
      if (blockInfo === void 0) {
        return;
      }
      const { contentNode, endPos } = blockInfo;
      if (contentNode.textContent.length !== 0) {
        const newBlockInsertionPos = endPos + 1;
        const newBlockContentPos = newBlockInsertionPos + 2;
        this.editor.chain().BNCreateBlock(newBlockInsertionPos).BNUpdateBlock(newBlockContentPos, { type: "paragraph", props: {} }).setTextSelection(newBlockContentPos).run();
      }
      this.editor.view.focus();
      this.editor.view.dispatch(
        this.editor.view.state.tr.scrollIntoView().setMeta(SlashMenuPluginKey, {
          activate: true,
          type: "drag"
        })
      );
    }
    deleteBlock() {
      this.menuOpen = false;
      this.blockMenu.hide();
      const blockBoundingBox = this.hoveredBlock.getBoundingClientRect();
      const pos = this.editor.view.posAtCoords({
        left: blockBoundingBox.left,
        top: blockBoundingBox.top
      });
      if (!pos) {
        return;
      }
      this.editor.commands.BNDeleteBlock(pos.pos);
    }
    getStaticParams() {
      return {
        addBlock: () => this.addBlock(),
        deleteBlock: () => this.deleteBlock(),
        blockDragStart: (event) => dragStart(event, this.editor.view),
        blockDragEnd: () => unsetDragImage(),
        freezeMenu: () => {
          this.menuFrozen = true;
        },
        unfreezeMenu: () => {
          this.menuFrozen = false;
        }
      };
    }
    getDynamicParams() {
      const blockBoundingBox = this.hoveredBlock.getBoundingClientRect();
      return {
        referenceRect: new DOMRect(
          this.horizontalPosAnchoredAtRoot ? getHorizontalAnchor() : blockBoundingBox.x,
          blockBoundingBox.y,
          blockBoundingBox.width,
          blockBoundingBox.height
        )
      };
    }
  }
  const createDraggableBlocksPlugin = (options) => {
    return new Plugin({
      key: new PluginKey("DraggableBlocksPlugin"),
      view: () => new BlockMenuView({
        editor: options.editor,
        blockMenuFactory: options.blockSideMenuFactory,
        horizontalPosAnchoredAtRoot: true
      })
    });
  };
  const DraggableBlocksExtension = Extension.create({
    name: "DraggableBlocksExtension",
    priority: 1e3,
    addProseMirrorPlugins() {
      if (!this.options.blockSideMenuFactory) {
        throw new Error(
          "UI Element factory not defined for DraggableBlocksExtension"
        );
      }
      return [
        createDraggableBlocksPlugin({
          editor: this.editor,
          blockSideMenuFactory: this.options.blockSideMenuFactory
        })
      ];
    }
  });
  function State(token) {
    this.j = {};
    this.jr = [];
    this.jd = null;
    this.t = token;
  }
  State.prototype = {
    accepts: function accepts() {
      return !!this.t;
    },
    tt: function tt(input, tokenOrState) {
      if (tokenOrState && tokenOrState.j) {
        this.j[input] = tokenOrState;
        return tokenOrState;
      }
      var token = tokenOrState;
      var nextState = this.j[input];
      if (nextState) {
        if (token) {
          nextState.t = token;
        }
        return nextState;
      }
      nextState = makeState();
      var templateState = takeT(this, input);
      if (templateState) {
        Object.assign(nextState.j, templateState.j);
        nextState.jr.append(templateState.jr);
        nextState.jr = templateState.jd;
        nextState.t = token || templateState.t;
      } else {
        nextState.t = token;
      }
      this.j[input] = nextState;
      return nextState;
    }
  };
  var makeState = function makeState2() {
    return new State();
  };
  var makeAcceptingState = function makeAcceptingState2(token) {
    return new State(token);
  };
  var makeT = function makeT2(startState, input, nextState) {
    if (!startState.j[input]) {
      startState.j[input] = nextState;
    }
  };
  var makeRegexT = function makeRegexT2(startState, regex, nextState) {
    startState.jr.push([regex, nextState]);
  };
  var takeT = function takeT2(state, input) {
    var nextState = state.j[input];
    if (nextState) {
      return nextState;
    }
    for (var i2 = 0; i2 < state.jr.length; i2++) {
      var regex = state.jr[i2][0];
      var _nextState = state.jr[i2][1];
      if (regex.test(input)) {
        return _nextState;
      }
    }
    return state.jd;
  };
  var makeMultiT = function makeMultiT2(startState, chars, nextState) {
    for (var i2 = 0; i2 < chars.length; i2++) {
      makeT(startState, chars[i2], nextState);
    }
  };
  var makeBatchT = function makeBatchT2(startState, transitions) {
    for (var i2 = 0; i2 < transitions.length; i2++) {
      var input = transitions[i2][0];
      var nextState = transitions[i2][1];
      makeT(startState, input, nextState);
    }
  };
  var makeChainT = function makeChainT2(state, str, endState, defaultStateFactory) {
    var i2 = 0, len = str.length, nextState;
    while (i2 < len && (nextState = state.j[str[i2]])) {
      state = nextState;
      i2++;
    }
    if (i2 >= len) {
      return [];
    }
    while (i2 < len - 1) {
      nextState = defaultStateFactory();
      makeT(state, str[i2], nextState);
      state = nextState;
      i2++;
    }
    makeT(state, str[len - 1], endState);
  };
  var DOMAIN = "DOMAIN";
  var LOCALHOST = "LOCALHOST";
  var TLD = "TLD";
  var NUM = "NUM";
  var PROTOCOL = "PROTOCOL";
  var MAILTO = "MAILTO";
  var WS = "WS";
  var NL = "NL";
  var OPENBRACE = "OPENBRACE";
  var OPENBRACKET = "OPENBRACKET";
  var OPENANGLEBRACKET = "OPENANGLEBRACKET";
  var OPENPAREN = "OPENPAREN";
  var CLOSEBRACE = "CLOSEBRACE";
  var CLOSEBRACKET = "CLOSEBRACKET";
  var CLOSEANGLEBRACKET = "CLOSEANGLEBRACKET";
  var CLOSEPAREN = "CLOSEPAREN";
  var AMPERSAND = "AMPERSAND";
  var APOSTROPHE = "APOSTROPHE";
  var ASTERISK = "ASTERISK";
  var AT = "AT";
  var BACKSLASH = "BACKSLASH";
  var BACKTICK = "BACKTICK";
  var CARET = "CARET";
  var COLON = "COLON";
  var COMMA = "COMMA";
  var DOLLAR = "DOLLAR";
  var DOT = "DOT";
  var EQUALS = "EQUALS";
  var EXCLAMATION = "EXCLAMATION";
  var HYPHEN = "HYPHEN";
  var PERCENT = "PERCENT";
  var PIPE = "PIPE";
  var PLUS = "PLUS";
  var POUND = "POUND";
  var QUERY = "QUERY";
  var QUOTE = "QUOTE";
  var SEMI = "SEMI";
  var SLASH = "SLASH";
  var TILDE = "TILDE";
  var UNDERSCORE = "UNDERSCORE";
  var SYM = "SYM";
  var text = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    DOMAIN,
    LOCALHOST,
    TLD,
    NUM,
    PROTOCOL,
    MAILTO,
    WS,
    NL,
    OPENBRACE,
    OPENBRACKET,
    OPENANGLEBRACKET,
    OPENPAREN,
    CLOSEBRACE,
    CLOSEBRACKET,
    CLOSEANGLEBRACKET,
    CLOSEPAREN,
    AMPERSAND,
    APOSTROPHE,
    ASTERISK,
    AT,
    BACKSLASH,
    BACKTICK,
    CARET,
    COLON,
    COMMA,
    DOLLAR,
    DOT,
    EQUALS,
    EXCLAMATION,
    HYPHEN,
    PERCENT,
    PIPE,
    PLUS,
    POUND,
    QUERY,
    QUOTE,
    SEMI,
    SLASH,
    TILDE,
    UNDERSCORE,
    SYM
  });
  var tlds = "aaa aarp abarth abb abbott abbvie abc able abogado abudhabi ac academy accenture accountant accountants aco actor ad adac ads adult ae aeg aero aetna af afamilycompany afl africa ag agakhan agency ai aig airbus airforce airtel akdn al alfaromeo alibaba alipay allfinanz allstate ally alsace alstom am amazon americanexpress americanfamily amex amfam amica amsterdam analytics android anquan anz ao aol apartments app apple aq aquarelle ar arab aramco archi army arpa art arte as asda asia associates at athleta attorney au auction audi audible audio auspost author auto autos avianca aw aws ax axa az azure ba baby baidu banamex bananarepublic band bank bar barcelona barclaycard barclays barefoot bargains baseball basketball bauhaus bayern bb bbc bbt bbva bcg bcn bd be beats beauty beer bentley berlin best bestbuy bet bf bg bh bharti bi bible bid bike bing bingo bio biz bj black blackfriday blockbuster blog bloomberg blue bm bms bmw bn bnpparibas bo boats boehringer bofa bom bond boo book booking bosch bostik boston bot boutique box br bradesco bridgestone broadway broker brother brussels bs bt budapest bugatti build builders business buy buzz bv bw by bz bzh ca cab cafe cal call calvinklein cam camera camp cancerresearch canon capetown capital capitalone car caravan cards care career careers cars casa case cash casino cat catering catholic cba cbn cbre cbs cc cd center ceo cern cf cfa cfd cg ch chanel channel charity chase chat cheap chintai christmas chrome church ci cipriani circle cisco citadel citi citic city cityeats ck cl claims cleaning click clinic clinique clothing cloud club clubmed cm cn co coach codes coffee college cologne com comcast commbank community company compare computer comsec condos construction consulting contact contractors cooking cookingchannel cool coop corsica country coupon coupons courses cpa cr credit creditcard creditunion cricket crown crs cruise cruises csc cu cuisinella cv cw cx cy cymru cyou cz dabur dad dance data date dating datsun day dclk dds de deal dealer deals degree delivery dell deloitte delta democrat dental dentist desi design dev dhl diamonds diet digital direct directory discount discover dish diy dj dk dm dnp do docs doctor dog domains dot download drive dtv dubai duck dunlop dupont durban dvag dvr dz earth eat ec eco edeka edu education ee eg email emerck energy engineer engineering enterprises epson equipment er ericsson erni es esq estate et etisalat eu eurovision eus events exchange expert exposed express extraspace fage fail fairwinds faith family fan fans farm farmers fashion fast fedex feedback ferrari ferrero fi fiat fidelity fido film final finance financial fire firestone firmdale fish fishing fit fitness fj fk flickr flights flir florist flowers fly fm fo foo food foodnetwork football ford forex forsale forum foundation fox fr free fresenius frl frogans frontdoor frontier ftr fujitsu fujixerox fun fund furniture futbol fyi ga gal gallery gallo gallup game games gap garden gay gb gbiz gd gdn ge gea gent genting george gf gg ggee gh gi gift gifts gives giving gl glade glass gle global globo gm gmail gmbh gmo gmx gn godaddy gold goldpoint golf goo goodyear goog google gop got gov gp gq gr grainger graphics gratis green gripe grocery group gs gt gu guardian gucci guge guide guitars guru gw gy hair hamburg hangout haus hbo hdfc hdfcbank health healthcare help helsinki here hermes hgtv hiphop hisamitsu hitachi hiv hk hkt hm hn hockey holdings holiday homedepot homegoods homes homesense honda horse hospital host hosting hot hoteles hotels hotmail house how hr hsbc ht hu hughes hyatt hyundai ibm icbc ice icu id ie ieee ifm ikano il im imamat imdb immo immobilien in inc industries infiniti info ing ink institute insurance insure int international intuit investments io ipiranga iq ir irish is ismaili ist istanbul it itau itv iveco jaguar java jcb je jeep jetzt jewelry jio jll jm jmp jnj jo jobs joburg jot joy jp jpmorgan jprs juegos juniper kaufen kddi ke kerryhotels kerrylogistics kerryproperties kfh kg kh ki kia kim kinder kindle kitchen kiwi km kn koeln komatsu kosher kp kpmg kpn kr krd kred kuokgroup kw ky kyoto kz la lacaixa lamborghini lamer lancaster lancia land landrover lanxess lasalle lat latino latrobe law lawyer lb lc lds lease leclerc lefrak legal lego lexus lgbt li lidl life lifeinsurance lifestyle lighting like lilly limited limo lincoln linde link lipsy live living lixil lk llc llp loan loans locker locus loft lol london lotte lotto love lpl lplfinancial lr ls lt ltd ltda lu lundbeck luxe luxury lv ly ma macys madrid maif maison makeup man management mango map market marketing markets marriott marshalls maserati mattel mba mc mckinsey md me med media meet melbourne meme memorial men menu merckmsd mg mh miami microsoft mil mini mint mit mitsubishi mk ml mlb mls mm mma mn mo mobi mobile moda moe moi mom monash money monster mormon mortgage moscow moto motorcycles mov movie mp mq mr ms msd mt mtn mtr mu museum mutual mv mw mx my mz na nab nagoya name nationwide natura navy nba nc ne nec net netbank netflix network neustar new news next nextdirect nexus nf nfl ng ngo nhk ni nico nike nikon ninja nissan nissay nl no nokia northwesternmutual norton now nowruz nowtv np nr nra nrw ntt nu nyc nz obi observer off office okinawa olayan olayangroup oldnavy ollo om omega one ong onl online onyourside ooo open oracle orange org organic origins osaka otsuka ott ovh pa page panasonic paris pars partners parts party passagens pay pccw pe pet pf pfizer pg ph pharmacy phd philips phone photo photography photos physio pics pictet pictures pid pin ping pink pioneer pizza pk pl place play playstation plumbing plus pm pn pnc pohl poker politie porn post pr pramerica praxi press prime pro prod productions prof progressive promo properties property protection pru prudential ps pt pub pw pwc py qa qpon quebec quest qvc racing radio raid re read realestate realtor realty recipes red redstone redumbrella rehab reise reisen reit reliance ren rent rentals repair report republican rest restaurant review reviews rexroth rich richardli ricoh ril rio rip rmit ro rocher rocks rodeo rogers room rs rsvp ru rugby ruhr run rw rwe ryukyu sa saarland safe safety sakura sale salon samsclub samsung sandvik sandvikcoromant sanofi sap sarl sas save saxo sb sbi sbs sc sca scb schaeffler schmidt scholarships school schule schwarz science scjohnson scot sd se search seat secure security seek select sener services ses seven sew sex sexy sfr sg sh shangrila sharp shaw shell shia shiksha shoes shop shopping shouji show showtime si silk sina singles site sj sk ski skin sky skype sl sling sm smart smile sn sncf so soccer social softbank software sohu solar solutions song sony soy spa space sport spot spreadbetting sr srl ss st stada staples star statebank statefarm stc stcgroup stockholm storage store stream studio study style su sucks supplies supply support surf surgery suzuki sv swatch swiftcover swiss sx sy sydney systems sz tab taipei talk taobao target tatamotors tatar tattoo tax taxi tc tci td tdk team tech technology tel temasek tennis teva tf tg th thd theater theatre tiaa tickets tienda tiffany tips tires tirol tj tjmaxx tjx tk tkmaxx tl tm tmall tn to today tokyo tools top toray toshiba total tours town toyota toys tr trade trading training travel travelchannel travelers travelersinsurance trust trv tt tube tui tunes tushu tv tvs tw tz ua ubank ubs ug uk unicom university uno uol ups us uy uz va vacations vana vanguard vc ve vegas ventures verisign versicherung vet vg vi viajes video vig viking villas vin vip virgin visa vision viva vivo vlaanderen vn vodka volkswagen volvo vote voting voto voyage vu vuelos wales walmart walter wang wanggou watch watches weather weatherchannel webcam weber website wed wedding weibo weir wf whoswho wien wiki williamhill win windows wine winners wme wolterskluwer woodside work works world wow ws wtc wtf xbox xerox xfinity xihuan xin xxx xyz yachts yahoo yamaxun yandex ye yodobashi yoga yokohama you youtube yt yun za zappos zara zero zip zm zone zuerich zw verm\xF6gensberater-ctb verm\xF6gensberatung-pwb \u03B5\u03BB \u03B5\u03C5 \u0431\u0433 \u0431\u0435\u043B \u0434\u0435\u0442\u0438 \u0435\u044E \u043A\u0430\u0442\u043E\u043B\u0438\u043A \u043A\u043E\u043C \u049B\u0430\u0437 \u043C\u043A\u0434 \u043C\u043E\u043D \u043C\u043E\u0441\u043A\u0432\u0430 \u043E\u043D\u043B\u0430\u0439\u043D \u043E\u0440\u0433 \u0440\u0443\u0441 \u0440\u0444 \u0441\u0430\u0439\u0442 \u0441\u0440\u0431 \u0443\u043A\u0440 \u10D2\u10D4 \u0570\u0561\u0575 \u05D9\u05E9\u05E8\u05D0\u05DC \u05E7\u05D5\u05DD \u0627\u0628\u0648\u0638\u0628\u064A \u0627\u062A\u0635\u0627\u0644\u0627\u062A \u0627\u0631\u0627\u0645\u0643\u0648 \u0627\u0644\u0627\u0631\u062F\u0646 \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629 \u0627\u0644\u0639\u0644\u064A\u0627\u0646 \u0627\u0644\u0645\u063A\u0631\u0628 \u0627\u0645\u0627\u0631\u0627\u062A \u0627\u06CC\u0631\u0627\u0646 \u0628\u0627\u0631\u062A \u0628\u0627\u0632\u0627\u0631 \u0628\u06BE\u0627\u0631\u062A \u0628\u064A\u062A\u0643 \u067E\u0627\u06A9\u0633\u062A\u0627\u0646 \u0680\u0627\u0631\u062A \u062A\u0648\u0646\u0633 \u0633\u0648\u062F\u0627\u0646 \u0633\u0648\u0631\u064A\u0629 \u0634\u0628\u0643\u0629 \u0639\u0631\u0627\u0642 \u0639\u0631\u0628 \u0639\u0645\u0627\u0646 \u0641\u0644\u0633\u0637\u064A\u0646 \u0642\u0637\u0631 \u0643\u0627\u062B\u0648\u0644\u064A\u0643 \u0643\u0648\u0645 \u0645\u0635\u0631 \u0645\u0644\u064A\u0633\u064A\u0627 \u0645\u0648\u0631\u064A\u062A\u0627\u0646\u064A\u0627 \u0645\u0648\u0642\u0639 \u0647\u0645\u0631\u0627\u0647 \u0915\u0949\u092E \u0928\u0947\u091F \u092D\u093E\u0930\u0924 \u092D\u093E\u0930\u0924\u092E\u094D \u092D\u093E\u0930\u094B\u0924 \u0938\u0902\u0917\u0920\u0928 \u09AC\u09BE\u0982\u09B2\u09BE \u09AD\u09BE\u09B0\u09A4 \u09AD\u09BE\u09F0\u09A4 \u0A2D\u0A3E\u0A30\u0A24 \u0AAD\u0ABE\u0AB0\u0AA4 \u0B2D\u0B3E\u0B30\u0B24 \u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BAF\u0BBE \u0B87\u0BB2\u0B99\u0BCD\u0B95\u0BC8 \u0B9A\u0BBF\u0B99\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0BC2\u0BB0\u0BCD \u0C2D\u0C3E\u0C30\u0C24\u0C4D \u0CAD\u0CBE\u0CB0\u0CA4 \u0D2D\u0D3E\u0D30\u0D24\u0D02 \u0DBD\u0D82\u0D9A\u0DCF \u0E04\u0E2D\u0E21 \u0E44\u0E17\u0E22 \u0EA5\u0EB2\u0EA7 \uB2F7\uB137 \uB2F7\uCEF4 \uC0BC\uC131 \uD55C\uAD6D \u30A2\u30DE\u30BE\u30F3 \u30B0\u30FC\u30B0\u30EB \u30AF\u30E9\u30A6\u30C9 \u30B3\u30E0 \u30B9\u30C8\u30A2 \u30BB\u30FC\u30EB \u30D5\u30A1\u30C3\u30B7\u30E7\u30F3 \u30DD\u30A4\u30F3\u30C8 \u307F\u3093\u306A \u4E16\u754C \u4E2D\u4FE1 \u4E2D\u56FD \u4E2D\u570B \u4E2D\u6587\u7F51 \u4E9A\u9A6C\u900A \u4F01\u4E1A \u4F5B\u5C71 \u4FE1\u606F \u5065\u5EB7 \u516B\u5366 \u516C\u53F8 \u516C\u76CA \u53F0\u6E7E \u53F0\u7063 \u5546\u57CE \u5546\u5E97 \u5546\u6807 \u5609\u91CC \u5609\u91CC\u5927\u9152\u5E97 \u5728\u7EBF \u5927\u4F17\u6C7D\u8F66 \u5927\u62FF \u5929\u4E3B\u6559 \u5A31\u4E50 \u5BB6\u96FB \u5E7F\u4E1C \u5FAE\u535A \u6148\u5584 \u6211\u7231\u4F60 \u624B\u673A \u62DB\u8058 \u653F\u52A1 \u653F\u5E9C \u65B0\u52A0\u5761 \u65B0\u95FB \u65F6\u5C1A \u66F8\u7C4D \u673A\u6784 \u6DE1\u9A6C\u9521 \u6E38\u620F \u6FB3\u9580 \u70B9\u770B \u79FB\u52A8 \u7EC4\u7EC7\u673A\u6784 \u7F51\u5740 \u7F51\u5E97 \u7F51\u7AD9 \u7F51\u7EDC \u8054\u901A \u8BFA\u57FA\u4E9A \u8C37\u6B4C \u8D2D\u7269 \u901A\u8CA9 \u96C6\u56E2 \u96FB\u8A0A\u76C8\u79D1 \u98DE\u5229\u6D66 \u98DF\u54C1 \u9910\u5385 \u9999\u683C\u91CC\u62C9 \u9999\u6E2F".split(" ");
  var LETTER = /(?:[A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])/;
  var EMOJI = /(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEDD-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDDFF\uDE70-\uDE74\uDE78-\uDE7C\uDE80-\uDE86\uDE90-\uDEAC\uDEB0-\uDEBA\uDEC0-\uDEC5\uDED0-\uDED9\uDEE0-\uDEE7\uDEF0-\uDEF6])/;
  var EMOJI_VARIATION = /\uFE0F/;
  var DIGIT = /\d/;
  var SPACE = /\s/;
  function init$2() {
    var customProtocols = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
    var S_START = makeState();
    var S_NUM = makeAcceptingState(NUM);
    var S_DOMAIN = makeAcceptingState(DOMAIN);
    var S_DOMAIN_HYPHEN = makeState();
    var S_WS = makeAcceptingState(WS);
    var DOMAIN_REGEX_TRANSITIONS = [[DIGIT, S_DOMAIN], [LETTER, S_DOMAIN], [EMOJI, S_DOMAIN], [EMOJI_VARIATION, S_DOMAIN]];
    var makeDomainState = function makeDomainState2() {
      var state = makeAcceptingState(DOMAIN);
      state.j = {
        "-": S_DOMAIN_HYPHEN
      };
      state.jr = [].concat(DOMAIN_REGEX_TRANSITIONS);
      return state;
    };
    var makeNearDomainState = function makeNearDomainState2(token) {
      var state = makeDomainState();
      state.t = token;
      return state;
    };
    makeBatchT(S_START, [["'", makeAcceptingState(APOSTROPHE)], ["{", makeAcceptingState(OPENBRACE)], ["[", makeAcceptingState(OPENBRACKET)], ["<", makeAcceptingState(OPENANGLEBRACKET)], ["(", makeAcceptingState(OPENPAREN)], ["}", makeAcceptingState(CLOSEBRACE)], ["]", makeAcceptingState(CLOSEBRACKET)], [">", makeAcceptingState(CLOSEANGLEBRACKET)], [")", makeAcceptingState(CLOSEPAREN)], ["&", makeAcceptingState(AMPERSAND)], ["*", makeAcceptingState(ASTERISK)], ["@", makeAcceptingState(AT)], ["`", makeAcceptingState(BACKTICK)], ["^", makeAcceptingState(CARET)], [":", makeAcceptingState(COLON)], [",", makeAcceptingState(COMMA)], ["$", makeAcceptingState(DOLLAR)], [".", makeAcceptingState(DOT)], ["=", makeAcceptingState(EQUALS)], ["!", makeAcceptingState(EXCLAMATION)], ["-", makeAcceptingState(HYPHEN)], ["%", makeAcceptingState(PERCENT)], ["|", makeAcceptingState(PIPE)], ["+", makeAcceptingState(PLUS)], ["#", makeAcceptingState(POUND)], ["?", makeAcceptingState(QUERY)], ['"', makeAcceptingState(QUOTE)], ["/", makeAcceptingState(SLASH)], [";", makeAcceptingState(SEMI)], ["~", makeAcceptingState(TILDE)], ["_", makeAcceptingState(UNDERSCORE)], ["\\", makeAcceptingState(BACKSLASH)]]);
    makeT(S_START, "\n", makeAcceptingState(NL));
    makeRegexT(S_START, SPACE, S_WS);
    makeT(S_WS, "\n", makeState());
    makeRegexT(S_WS, SPACE, S_WS);
    for (var i2 = 0; i2 < tlds.length; i2++) {
      makeChainT(S_START, tlds[i2], makeNearDomainState(TLD), makeDomainState);
    }
    var S_PROTOCOL_FILE = makeDomainState();
    var S_PROTOCOL_FTP = makeDomainState();
    var S_PROTOCOL_HTTP = makeDomainState();
    var S_MAILTO = makeDomainState();
    makeChainT(S_START, "file", S_PROTOCOL_FILE, makeDomainState);
    makeChainT(S_START, "ftp", S_PROTOCOL_FTP, makeDomainState);
    makeChainT(S_START, "http", S_PROTOCOL_HTTP, makeDomainState);
    makeChainT(S_START, "mailto", S_MAILTO, makeDomainState);
    var S_PROTOCOL_SECURE = makeDomainState();
    var S_FULL_PROTOCOL = makeAcceptingState(PROTOCOL);
    var S_FULL_MAILTO = makeAcceptingState(MAILTO);
    makeT(S_PROTOCOL_FTP, "s", S_PROTOCOL_SECURE);
    makeT(S_PROTOCOL_FTP, ":", S_FULL_PROTOCOL);
    makeT(S_PROTOCOL_HTTP, "s", S_PROTOCOL_SECURE);
    makeT(S_PROTOCOL_HTTP, ":", S_FULL_PROTOCOL);
    makeT(S_PROTOCOL_FILE, ":", S_FULL_PROTOCOL);
    makeT(S_PROTOCOL_SECURE, ":", S_FULL_PROTOCOL);
    makeT(S_MAILTO, ":", S_FULL_MAILTO);
    var S_CUSTOM_PROTOCOL = makeDomainState();
    for (var _i = 0; _i < customProtocols.length; _i++) {
      makeChainT(S_START, customProtocols[_i], S_CUSTOM_PROTOCOL, makeDomainState);
    }
    makeT(S_CUSTOM_PROTOCOL, ":", S_FULL_PROTOCOL);
    makeChainT(S_START, "localhost", makeNearDomainState(LOCALHOST), makeDomainState);
    makeRegexT(S_START, DIGIT, S_NUM);
    makeRegexT(S_START, LETTER, S_DOMAIN);
    makeRegexT(S_START, EMOJI, S_DOMAIN);
    makeRegexT(S_START, EMOJI_VARIATION, S_DOMAIN);
    makeRegexT(S_NUM, DIGIT, S_NUM);
    makeRegexT(S_NUM, LETTER, S_DOMAIN);
    makeRegexT(S_NUM, EMOJI, S_DOMAIN);
    makeRegexT(S_NUM, EMOJI_VARIATION, S_DOMAIN);
    makeT(S_NUM, "-", S_DOMAIN_HYPHEN);
    makeT(S_DOMAIN, "-", S_DOMAIN_HYPHEN);
    makeT(S_DOMAIN_HYPHEN, "-", S_DOMAIN_HYPHEN);
    makeRegexT(S_DOMAIN, DIGIT, S_DOMAIN);
    makeRegexT(S_DOMAIN, LETTER, S_DOMAIN);
    makeRegexT(S_DOMAIN, EMOJI, S_DOMAIN);
    makeRegexT(S_DOMAIN, EMOJI_VARIATION, S_DOMAIN);
    makeRegexT(S_DOMAIN_HYPHEN, DIGIT, S_DOMAIN);
    makeRegexT(S_DOMAIN_HYPHEN, LETTER, S_DOMAIN);
    makeRegexT(S_DOMAIN_HYPHEN, EMOJI, S_DOMAIN);
    makeRegexT(S_DOMAIN_HYPHEN, EMOJI_VARIATION, S_DOMAIN);
    S_START.jd = makeAcceptingState(SYM);
    return S_START;
  }
  function run$1(start, str) {
    var iterable = stringToArray(str.replace(/[A-Z]/g, function(c) {
      return c.toLowerCase();
    }));
    var charCount = iterable.length;
    var tokens = [];
    var cursor = 0;
    var charCursor = 0;
    while (charCursor < charCount) {
      var state = start;
      var nextState = null;
      var tokenLength = 0;
      var latestAccepting = null;
      var sinceAccepts = -1;
      var charsSinceAccepts = -1;
      while (charCursor < charCount && (nextState = takeT(state, iterable[charCursor]))) {
        state = nextState;
        if (state.accepts()) {
          sinceAccepts = 0;
          charsSinceAccepts = 0;
          latestAccepting = state;
        } else if (sinceAccepts >= 0) {
          sinceAccepts += iterable[charCursor].length;
          charsSinceAccepts++;
        }
        tokenLength += iterable[charCursor].length;
        cursor += iterable[charCursor].length;
        charCursor++;
      }
      cursor -= sinceAccepts;
      charCursor -= charsSinceAccepts;
      tokenLength -= sinceAccepts;
      tokens.push({
        t: latestAccepting.t,
        v: str.substr(cursor - tokenLength, tokenLength),
        s: cursor - tokenLength,
        e: cursor
      });
    }
    return tokens;
  }
  function stringToArray(str) {
    var result = [];
    var len = str.length;
    var index = 0;
    while (index < len) {
      var first2 = str.charCodeAt(index);
      var second = void 0;
      var char = first2 < 55296 || first2 > 56319 || index + 1 === len || (second = str.charCodeAt(index + 1)) < 56320 || second > 57343 ? str[index] : str.slice(index, index + 2);
      result.push(char);
      index += char.length;
    }
    return result;
  }
  function _typeof(obj) {
    "@babel/helpers - typeof";
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function(obj2) {
        return typeof obj2;
      };
    } else {
      _typeof = function(obj2) {
        return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
      };
    }
    return _typeof(obj);
  }
  var defaults = {
    defaultProtocol: "http",
    events: null,
    format: noop,
    formatHref: noop,
    nl2br: false,
    tagName: "a",
    target: null,
    rel: null,
    validate: true,
    truncate: 0,
    className: null,
    attributes: null,
    ignoreTags: []
  };
  function Options(opts) {
    opts = opts || {};
    this.defaultProtocol = "defaultProtocol" in opts ? opts.defaultProtocol : defaults.defaultProtocol;
    this.events = "events" in opts ? opts.events : defaults.events;
    this.format = "format" in opts ? opts.format : defaults.format;
    this.formatHref = "formatHref" in opts ? opts.formatHref : defaults.formatHref;
    this.nl2br = "nl2br" in opts ? opts.nl2br : defaults.nl2br;
    this.tagName = "tagName" in opts ? opts.tagName : defaults.tagName;
    this.target = "target" in opts ? opts.target : defaults.target;
    this.rel = "rel" in opts ? opts.rel : defaults.rel;
    this.validate = "validate" in opts ? opts.validate : defaults.validate;
    this.truncate = "truncate" in opts ? opts.truncate : defaults.truncate;
    this.className = "className" in opts ? opts.className : defaults.className;
    this.attributes = opts.attributes || defaults.attributes;
    this.ignoreTags = [];
    var ignoredTags = "ignoreTags" in opts ? opts.ignoreTags : defaults.ignoreTags;
    for (var i2 = 0; i2 < ignoredTags.length; i2++) {
      this.ignoreTags.push(ignoredTags[i2].toUpperCase());
    }
  }
  Options.prototype = {
    resolve: function resolve(token) {
      var href = token.toHref(this.defaultProtocol);
      return {
        formatted: this.get("format", token.toString(), token),
        formattedHref: this.get("formatHref", href, token),
        tagName: this.get("tagName", href, token),
        className: this.get("className", href, token),
        target: this.get("target", href, token),
        rel: this.get("rel", href, token),
        events: this.getObject("events", href, token),
        attributes: this.getObject("attributes", href, token),
        truncate: this.get("truncate", href, token)
      };
    },
    check: function check(token) {
      return this.get("validate", token.toString(), token);
    },
    get: function get(key, operator, token) {
      var option = this[key];
      if (!option) {
        return option;
      }
      var optionValue;
      switch (_typeof(option)) {
        case "function":
          return option(operator, token.t);
        case "object":
          optionValue = token.t in option ? option[token.t] : defaults[key];
          return typeof optionValue === "function" ? optionValue(operator, token.t) : optionValue;
      }
      return option;
    },
    getObject: function getObject(key, operator, token) {
      var option = this[key];
      return typeof option === "function" ? option(operator, token.t) : option;
    }
  };
  function noop(val) {
    return val;
  }
  function inherits(parent, child) {
    var props = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var extended = Object.create(parent.prototype);
    for (var p in props) {
      extended[p] = props[p];
    }
    extended.constructor = child;
    child.prototype = extended;
    return child;
  }
  function MultiToken() {
  }
  MultiToken.prototype = {
    t: "token",
    isLink: false,
    toString: function toString() {
      return this.v;
    },
    toHref: function toHref() {
      return this.toString();
    },
    startIndex: function startIndex() {
      return this.tk[0].s;
    },
    endIndex: function endIndex() {
      return this.tk[this.tk.length - 1].e;
    },
    toObject: function toObject() {
      var protocol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : defaults.defaultProtocol;
      return {
        type: this.t,
        value: this.v,
        isLink: this.isLink,
        href: this.toHref(protocol),
        start: this.startIndex(),
        end: this.endIndex()
      };
    }
  };
  function createTokenClass(type, props) {
    function Token(value, tokens) {
      this.t = type;
      this.v = value;
      this.tk = tokens;
    }
    inherits(MultiToken, Token, props);
    return Token;
  }
  var MailtoEmail = createTokenClass("email", {
    isLink: true
  });
  var Email = createTokenClass("email", {
    isLink: true,
    toHref: function toHref() {
      return "mailto:" + this.toString();
    }
  });
  var Text = createTokenClass("text");
  var Nl = createTokenClass("nl");
  var Url = createTokenClass("url", {
    isLink: true,
    toHref: function toHref() {
      var protocol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : defaults.defaultProtocol;
      var tokens = this.tk;
      var hasProtocol = false;
      var hasSlashSlash = false;
      var result = [];
      var i2 = 0;
      while (tokens[i2].t === PROTOCOL) {
        hasProtocol = true;
        result.push(tokens[i2].v);
        i2++;
      }
      while (tokens[i2].t === SLASH) {
        hasSlashSlash = true;
        result.push(tokens[i2].v);
        i2++;
      }
      for (; i2 < tokens.length; i2++) {
        result.push(tokens[i2].v);
      }
      result = result.join("");
      if (!(hasProtocol || hasSlashSlash)) {
        result = "".concat(protocol, "://").concat(result);
      }
      return result;
    },
    hasProtocol: function hasProtocol() {
      return this.tk[0].t === PROTOCOL;
    }
  });
  var multi = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    MultiToken,
    Base: MultiToken,
    createTokenClass,
    MailtoEmail,
    Email,
    Text,
    Nl,
    Url
  });
  function init$1() {
    var S_START = makeState();
    var S_PROTOCOL = makeState();
    var S_MAILTO = makeState();
    var S_PROTOCOL_SLASH = makeState();
    var S_PROTOCOL_SLASH_SLASH = makeState();
    var S_DOMAIN = makeState();
    var S_DOMAIN_DOT = makeState();
    var S_TLD = makeAcceptingState(Url);
    var S_TLD_COLON = makeState();
    var S_TLD_PORT = makeAcceptingState(Url);
    var S_URL = makeAcceptingState(Url);
    var S_URL_NON_ACCEPTING = makeState();
    var S_URL_OPENBRACE = makeState();
    var S_URL_OPENBRACKET = makeState();
    var S_URL_OPENANGLEBRACKET = makeState();
    var S_URL_OPENPAREN = makeState();
    var S_URL_OPENBRACE_Q = makeAcceptingState(Url);
    var S_URL_OPENBRACKET_Q = makeAcceptingState(Url);
    var S_URL_OPENANGLEBRACKET_Q = makeAcceptingState(Url);
    var S_URL_OPENPAREN_Q = makeAcceptingState(Url);
    var S_URL_OPENBRACE_SYMS = makeState();
    var S_URL_OPENBRACKET_SYMS = makeState();
    var S_URL_OPENANGLEBRACKET_SYMS = makeState();
    var S_URL_OPENPAREN_SYMS = makeState();
    var S_EMAIL_DOMAIN = makeState();
    var S_EMAIL_DOMAIN_DOT = makeState();
    var S_EMAIL = makeAcceptingState(Email);
    var S_EMAIL_COLON = makeState();
    var S_EMAIL_PORT = makeAcceptingState(Email);
    var S_MAILTO_EMAIL = makeAcceptingState(MailtoEmail);
    var S_MAILTO_EMAIL_NON_ACCEPTING = makeState();
    var S_LOCALPART = makeState();
    var S_LOCALPART_AT = makeState();
    var S_LOCALPART_DOT = makeState();
    var S_NL = makeAcceptingState(Nl);
    makeT(S_START, NL, S_NL);
    makeT(S_START, PROTOCOL, S_PROTOCOL);
    makeT(S_START, MAILTO, S_MAILTO);
    makeT(S_PROTOCOL, SLASH, S_PROTOCOL_SLASH);
    makeT(S_PROTOCOL_SLASH, SLASH, S_PROTOCOL_SLASH_SLASH);
    makeT(S_START, TLD, S_DOMAIN);
    makeT(S_START, DOMAIN, S_DOMAIN);
    makeT(S_START, LOCALHOST, S_TLD);
    makeT(S_START, NUM, S_DOMAIN);
    makeT(S_PROTOCOL_SLASH_SLASH, TLD, S_URL);
    makeT(S_PROTOCOL_SLASH_SLASH, DOMAIN, S_URL);
    makeT(S_PROTOCOL_SLASH_SLASH, NUM, S_URL);
    makeT(S_PROTOCOL_SLASH_SLASH, LOCALHOST, S_URL);
    makeT(S_DOMAIN, DOT, S_DOMAIN_DOT);
    makeT(S_EMAIL_DOMAIN, DOT, S_EMAIL_DOMAIN_DOT);
    makeT(S_DOMAIN_DOT, TLD, S_TLD);
    makeT(S_DOMAIN_DOT, DOMAIN, S_DOMAIN);
    makeT(S_DOMAIN_DOT, NUM, S_DOMAIN);
    makeT(S_DOMAIN_DOT, LOCALHOST, S_DOMAIN);
    makeT(S_EMAIL_DOMAIN_DOT, TLD, S_EMAIL);
    makeT(S_EMAIL_DOMAIN_DOT, DOMAIN, S_EMAIL_DOMAIN);
    makeT(S_EMAIL_DOMAIN_DOT, NUM, S_EMAIL_DOMAIN);
    makeT(S_EMAIL_DOMAIN_DOT, LOCALHOST, S_EMAIL_DOMAIN);
    makeT(S_TLD, DOT, S_DOMAIN_DOT);
    makeT(S_EMAIL, DOT, S_EMAIL_DOMAIN_DOT);
    makeT(S_TLD, COLON, S_TLD_COLON);
    makeT(S_TLD, SLASH, S_URL);
    makeT(S_TLD_COLON, NUM, S_TLD_PORT);
    makeT(S_TLD_PORT, SLASH, S_URL);
    makeT(S_EMAIL, COLON, S_EMAIL_COLON);
    makeT(S_EMAIL_COLON, NUM, S_EMAIL_PORT);
    var qsAccepting = [AMPERSAND, ASTERISK, AT, BACKSLASH, BACKTICK, CARET, DOLLAR, DOMAIN, EQUALS, HYPHEN, LOCALHOST, NUM, PERCENT, PIPE, PLUS, POUND, PROTOCOL, SLASH, SYM, TILDE, TLD, UNDERSCORE];
    var qsNonAccepting = [APOSTROPHE, CLOSEANGLEBRACKET, CLOSEBRACE, CLOSEBRACKET, CLOSEPAREN, COLON, COMMA, DOT, EXCLAMATION, OPENANGLEBRACKET, OPENBRACE, OPENBRACKET, OPENPAREN, QUERY, QUOTE, SEMI];
    makeT(S_URL, OPENBRACE, S_URL_OPENBRACE);
    makeT(S_URL, OPENBRACKET, S_URL_OPENBRACKET);
    makeT(S_URL, OPENANGLEBRACKET, S_URL_OPENANGLEBRACKET);
    makeT(S_URL, OPENPAREN, S_URL_OPENPAREN);
    makeT(S_URL_NON_ACCEPTING, OPENBRACE, S_URL_OPENBRACE);
    makeT(S_URL_NON_ACCEPTING, OPENBRACKET, S_URL_OPENBRACKET);
    makeT(S_URL_NON_ACCEPTING, OPENANGLEBRACKET, S_URL_OPENANGLEBRACKET);
    makeT(S_URL_NON_ACCEPTING, OPENPAREN, S_URL_OPENPAREN);
    makeT(S_URL_OPENBRACE, CLOSEBRACE, S_URL);
    makeT(S_URL_OPENBRACKET, CLOSEBRACKET, S_URL);
    makeT(S_URL_OPENANGLEBRACKET, CLOSEANGLEBRACKET, S_URL);
    makeT(S_URL_OPENPAREN, CLOSEPAREN, S_URL);
    makeT(S_URL_OPENBRACE_Q, CLOSEBRACE, S_URL);
    makeT(S_URL_OPENBRACKET_Q, CLOSEBRACKET, S_URL);
    makeT(S_URL_OPENANGLEBRACKET_Q, CLOSEANGLEBRACKET, S_URL);
    makeT(S_URL_OPENPAREN_Q, CLOSEPAREN, S_URL);
    makeT(S_URL_OPENBRACE_SYMS, CLOSEBRACE, S_URL);
    makeT(S_URL_OPENBRACKET_SYMS, CLOSEBRACKET, S_URL);
    makeT(S_URL_OPENANGLEBRACKET_SYMS, CLOSEANGLEBRACKET, S_URL);
    makeT(S_URL_OPENPAREN_SYMS, CLOSEPAREN, S_URL);
    makeMultiT(S_URL_OPENBRACE, qsAccepting, S_URL_OPENBRACE_Q);
    makeMultiT(S_URL_OPENBRACKET, qsAccepting, S_URL_OPENBRACKET_Q);
    makeMultiT(S_URL_OPENANGLEBRACKET, qsAccepting, S_URL_OPENANGLEBRACKET_Q);
    makeMultiT(S_URL_OPENPAREN, qsAccepting, S_URL_OPENPAREN_Q);
    makeMultiT(S_URL_OPENBRACE, qsNonAccepting, S_URL_OPENBRACE_SYMS);
    makeMultiT(S_URL_OPENBRACKET, qsNonAccepting, S_URL_OPENBRACKET_SYMS);
    makeMultiT(S_URL_OPENANGLEBRACKET, qsNonAccepting, S_URL_OPENANGLEBRACKET_SYMS);
    makeMultiT(S_URL_OPENPAREN, qsNonAccepting, S_URL_OPENPAREN_SYMS);
    makeMultiT(S_URL_OPENBRACE_Q, qsAccepting, S_URL_OPENBRACE_Q);
    makeMultiT(S_URL_OPENBRACKET_Q, qsAccepting, S_URL_OPENBRACKET_Q);
    makeMultiT(S_URL_OPENANGLEBRACKET_Q, qsAccepting, S_URL_OPENANGLEBRACKET_Q);
    makeMultiT(S_URL_OPENPAREN_Q, qsAccepting, S_URL_OPENPAREN_Q);
    makeMultiT(S_URL_OPENBRACE_Q, qsNonAccepting, S_URL_OPENBRACE_Q);
    makeMultiT(S_URL_OPENBRACKET_Q, qsNonAccepting, S_URL_OPENBRACKET_Q);
    makeMultiT(S_URL_OPENANGLEBRACKET_Q, qsNonAccepting, S_URL_OPENANGLEBRACKET_Q);
    makeMultiT(S_URL_OPENPAREN_Q, qsNonAccepting, S_URL_OPENPAREN_Q);
    makeMultiT(S_URL_OPENBRACE_SYMS, qsAccepting, S_URL_OPENBRACE_Q);
    makeMultiT(S_URL_OPENBRACKET_SYMS, qsAccepting, S_URL_OPENBRACKET_Q);
    makeMultiT(S_URL_OPENANGLEBRACKET_SYMS, qsAccepting, S_URL_OPENANGLEBRACKET_Q);
    makeMultiT(S_URL_OPENPAREN_SYMS, qsAccepting, S_URL_OPENPAREN_Q);
    makeMultiT(S_URL_OPENBRACE_SYMS, qsNonAccepting, S_URL_OPENBRACE_SYMS);
    makeMultiT(S_URL_OPENBRACKET_SYMS, qsNonAccepting, S_URL_OPENBRACKET_SYMS);
    makeMultiT(S_URL_OPENANGLEBRACKET_SYMS, qsNonAccepting, S_URL_OPENANGLEBRACKET_SYMS);
    makeMultiT(S_URL_OPENPAREN_SYMS, qsNonAccepting, S_URL_OPENPAREN_SYMS);
    makeMultiT(S_URL, qsAccepting, S_URL);
    makeMultiT(S_URL_NON_ACCEPTING, qsAccepting, S_URL);
    makeMultiT(S_URL, qsNonAccepting, S_URL_NON_ACCEPTING);
    makeMultiT(S_URL_NON_ACCEPTING, qsNonAccepting, S_URL_NON_ACCEPTING);
    makeT(S_MAILTO, TLD, S_MAILTO_EMAIL);
    makeT(S_MAILTO, DOMAIN, S_MAILTO_EMAIL);
    makeT(S_MAILTO, NUM, S_MAILTO_EMAIL);
    makeT(S_MAILTO, LOCALHOST, S_MAILTO_EMAIL);
    makeMultiT(S_MAILTO_EMAIL, qsAccepting, S_MAILTO_EMAIL);
    makeMultiT(S_MAILTO_EMAIL, qsNonAccepting, S_MAILTO_EMAIL_NON_ACCEPTING);
    makeMultiT(S_MAILTO_EMAIL_NON_ACCEPTING, qsAccepting, S_MAILTO_EMAIL);
    makeMultiT(S_MAILTO_EMAIL_NON_ACCEPTING, qsNonAccepting, S_MAILTO_EMAIL_NON_ACCEPTING);
    var localpartAccepting = [AMPERSAND, APOSTROPHE, ASTERISK, BACKSLASH, BACKTICK, CARET, CLOSEBRACE, DOLLAR, DOMAIN, EQUALS, HYPHEN, NUM, OPENBRACE, PERCENT, PIPE, PLUS, POUND, QUERY, SLASH, SYM, TILDE, TLD, UNDERSCORE];
    makeMultiT(S_DOMAIN, localpartAccepting, S_LOCALPART);
    makeT(S_DOMAIN, AT, S_LOCALPART_AT);
    makeMultiT(S_TLD, localpartAccepting, S_LOCALPART);
    makeT(S_TLD, AT, S_LOCALPART_AT);
    makeMultiT(S_DOMAIN_DOT, localpartAccepting, S_LOCALPART);
    makeMultiT(S_LOCALPART, localpartAccepting, S_LOCALPART);
    makeT(S_LOCALPART, AT, S_LOCALPART_AT);
    makeT(S_LOCALPART, DOT, S_LOCALPART_DOT);
    makeMultiT(S_LOCALPART_DOT, localpartAccepting, S_LOCALPART);
    makeT(S_LOCALPART_AT, TLD, S_EMAIL_DOMAIN);
    makeT(S_LOCALPART_AT, DOMAIN, S_EMAIL_DOMAIN);
    makeT(S_LOCALPART_AT, NUM, S_EMAIL_DOMAIN);
    makeT(S_LOCALPART_AT, LOCALHOST, S_EMAIL);
    return S_START;
  }
  function run(start, input, tokens) {
    var len = tokens.length;
    var cursor = 0;
    var multis = [];
    var textTokens = [];
    while (cursor < len) {
      var state = start;
      var secondState = null;
      var nextState = null;
      var multiLength = 0;
      var latestAccepting = null;
      var sinceAccepts = -1;
      while (cursor < len && !(secondState = takeT(state, tokens[cursor].t))) {
        textTokens.push(tokens[cursor++]);
      }
      while (cursor < len && (nextState = secondState || takeT(state, tokens[cursor].t))) {
        secondState = null;
        state = nextState;
        if (state.accepts()) {
          sinceAccepts = 0;
          latestAccepting = state;
        } else if (sinceAccepts >= 0) {
          sinceAccepts++;
        }
        cursor++;
        multiLength++;
      }
      if (sinceAccepts < 0) {
        for (var i2 = cursor - multiLength; i2 < cursor; i2++) {
          textTokens.push(tokens[i2]);
        }
      } else {
        if (textTokens.length > 0) {
          multis.push(parserCreateMultiToken(Text, input, textTokens));
          textTokens = [];
        }
        cursor -= sinceAccepts;
        multiLength -= sinceAccepts;
        var Multi = latestAccepting.t;
        var subtokens = tokens.slice(cursor - multiLength, cursor);
        multis.push(parserCreateMultiToken(Multi, input, subtokens));
      }
    }
    if (textTokens.length > 0) {
      multis.push(parserCreateMultiToken(Text, input, textTokens));
    }
    return multis;
  }
  function parserCreateMultiToken(Multi, input, tokens) {
    var startIdx = tokens[0].s;
    var endIdx = tokens[tokens.length - 1].e;
    var value = input.substr(startIdx, endIdx - startIdx);
    return new Multi(value, tokens);
  }
  var warn = typeof console !== "undefined" && console && console.warn || function() {
  };
  var INIT = {
    scanner: null,
    parser: null,
    pluginQueue: [],
    customProtocols: [],
    initialized: false
  };
  function reset() {
    INIT.scanner = null;
    INIT.parser = null;
    INIT.pluginQueue = [];
    INIT.customProtocols = [];
    INIT.initialized = false;
  }
  function registerCustomProtocol(protocol) {
    if (INIT.initialized) {
      warn('linkifyjs: already initialized - will not register custom protocol "'.concat(protocol, '" until you manually call linkify.init(). To avoid this warning, please register all custom protocols before invoking linkify the first time.'));
    }
    if (!/^[a-z-]+$/.test(protocol)) {
      throw Error("linkifyjs: protocols containing characters other than a-z or - (hyphen) are not supported");
    }
    INIT.customProtocols.push(protocol);
  }
  function init() {
    INIT.scanner = {
      start: init$2(INIT.customProtocols),
      tokens: text
    };
    INIT.parser = {
      start: init$1(),
      tokens: multi
    };
    var utils = {
      createTokenClass
    };
    for (var i2 = 0; i2 < INIT.pluginQueue.length; i2++) {
      INIT.pluginQueue[i2][1]({
        scanner: INIT.scanner,
        parser: INIT.parser,
        utils
      });
    }
    INIT.initialized = true;
  }
  function tokenize(str) {
    if (!INIT.initialized) {
      init();
    }
    return run(INIT.parser.start, str, run$1(INIT.scanner.start, str));
  }
  function find(str) {
    var type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    var tokens = tokenize(str);
    var filtered = [];
    for (var i2 = 0; i2 < tokens.length; i2++) {
      var token = tokens[i2];
      if (token.isLink && (!type || token.t === type)) {
        filtered.push(token.toObject());
      }
    }
    return filtered;
  }
  function test(str) {
    var type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    var tokens = tokenize(str);
    return tokens.length === 1 && tokens[0].isLink && (!type || tokens[0].t === type);
  }
  function autolink(options) {
    return new Plugin({
      key: new PluginKey("autolink"),
      appendTransaction: (transactions, oldState, newState) => {
        const docChanges = transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
        const preventAutolink = transactions.some((transaction) => transaction.getMeta("preventAutolink"));
        if (!docChanges || preventAutolink) {
          return;
        }
        const { tr } = newState;
        const transform = combineTransactionSteps(oldState.doc, [...transactions]);
        const { mapping } = transform;
        const changes = getChangedRanges(transform);
        changes.forEach(({ oldRange, newRange }) => {
          getMarksBetween(oldRange.from, oldRange.to, oldState.doc).filter((item) => item.mark.type === options.type).forEach((oldMark) => {
            const newFrom = mapping.map(oldMark.from);
            const newTo = mapping.map(oldMark.to);
            const newMarks = getMarksBetween(newFrom, newTo, newState.doc).filter((item) => item.mark.type === options.type);
            if (!newMarks.length) {
              return;
            }
            const newMark = newMarks[0];
            const oldLinkText = oldState.doc.textBetween(oldMark.from, oldMark.to, void 0, " ");
            const newLinkText = newState.doc.textBetween(newMark.from, newMark.to, void 0, " ");
            const wasLink = test(oldLinkText);
            const isLink = test(newLinkText);
            if (wasLink && !isLink) {
              tr.removeMark(newMark.from, newMark.to, options.type);
            }
          });
          const nodesInChangedRanges = findChildrenInRange(newState.doc, newRange, (node) => node.isTextblock);
          let textBlock;
          let textBeforeWhitespace;
          if (nodesInChangedRanges.length > 1) {
            textBlock = nodesInChangedRanges[0];
            textBeforeWhitespace = newState.doc.textBetween(textBlock.pos, textBlock.pos + textBlock.node.nodeSize, void 0, " ");
          } else if (nodesInChangedRanges.length && newState.doc.textBetween(newRange.from, newRange.to, " ", " ").endsWith(" ")) {
            textBlock = nodesInChangedRanges[0];
            textBeforeWhitespace = newState.doc.textBetween(textBlock.pos, newRange.to, void 0, " ");
          }
          if (textBlock && textBeforeWhitespace) {
            const wordsBeforeWhitespace = textBeforeWhitespace.split(" ").filter((s) => s !== "");
            if (wordsBeforeWhitespace.length <= 0) {
              return false;
            }
            const lastWordBeforeSpace = wordsBeforeWhitespace[wordsBeforeWhitespace.length - 1];
            const lastWordAndBlockOffset = textBlock.pos + textBeforeWhitespace.lastIndexOf(lastWordBeforeSpace);
            if (!lastWordBeforeSpace) {
              return false;
            }
            find(lastWordBeforeSpace).filter((link) => link.isLink).filter((link) => {
              if (options.validate) {
                return options.validate(link.value);
              }
              return true;
            }).map((link) => ({
              ...link,
              from: lastWordAndBlockOffset + link.start + 1,
              to: lastWordAndBlockOffset + link.end + 1
            })).forEach((link) => {
              tr.addMark(link.from, link.to, options.type.create({
                href: link.href
              }));
            });
          }
        });
        if (!tr.steps.length) {
          return;
        }
        return tr;
      }
    });
  }
  function clickHandler(options) {
    return new Plugin({
      key: new PluginKey("handleClickLink"),
      props: {
        handleClick: (view, pos, event) => {
          var _a;
          const attrs = getAttributes(view.state, options.type.name);
          const link = (_a = event.target) === null || _a === void 0 ? void 0 : _a.closest("a");
          if (link && attrs.href) {
            window.open(attrs.href, attrs.target);
            return true;
          }
          return false;
        }
      }
    });
  }
  function pasteHandler(options) {
    return new Plugin({
      key: new PluginKey("handlePasteLink"),
      props: {
        handlePaste: (view, event, slice) => {
          const { state } = view;
          const { selection } = state;
          const { empty: empty2 } = selection;
          if (empty2) {
            return false;
          }
          let textContent = "";
          slice.content.forEach((node) => {
            textContent += node.textContent;
          });
          const link = find(textContent).find((item) => item.isLink && item.value === textContent);
          if (!textContent || !link) {
            return false;
          }
          options.editor.commands.setMark(options.type, {
            href: link.href
          });
          return true;
        }
      }
    });
  }
  const Link = Mark.create({
    name: "link",
    priority: 1e3,
    keepOnSplit: false,
    onCreate() {
      this.options.protocols.forEach(registerCustomProtocol);
    },
    onDestroy() {
      reset();
    },
    inclusive() {
      return this.options.autolink;
    },
    addOptions() {
      return {
        openOnClick: true,
        linkOnPaste: true,
        autolink: true,
        protocols: [],
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer nofollow",
          class: null
        },
        validate: void 0
      };
    },
    addAttributes() {
      return {
        href: {
          default: null
        },
        target: {
          default: this.options.HTMLAttributes.target
        },
        class: {
          default: this.options.HTMLAttributes.class
        }
      };
    },
    parseHTML() {
      return [
        { tag: 'a[href]:not([href *= "javascript:" i])' }
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        "a",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        0
      ];
    },
    addCommands() {
      return {
        setLink: (attributes) => ({ chain }) => {
          return chain().setMark(this.name, attributes).setMeta("preventAutolink", true).run();
        },
        toggleLink: (attributes) => ({ chain }) => {
          return chain().toggleMark(this.name, attributes, { extendEmptyMarkRange: true }).setMeta("preventAutolink", true).run();
        },
        unsetLink: () => ({ chain }) => {
          return chain().unsetMark(this.name, { extendEmptyMarkRange: true }).setMeta("preventAutolink", true).run();
        }
      };
    },
    addPasteRules() {
      return [
        markPasteRule({
          find: (text2) => find(text2).filter((link) => {
            if (this.options.validate) {
              return this.options.validate(link.value);
            }
            return true;
          }).filter((link) => link.isLink).map((link) => ({
            text: link.value,
            index: link.start,
            data: link
          })),
          type: this.type,
          getAttributes: (match) => {
            var _a;
            return {
              href: (_a = match.data) === null || _a === void 0 ? void 0 : _a.href
            };
          }
        })
      ];
    },
    addProseMirrorPlugins() {
      const plugins = [];
      if (this.options.autolink) {
        plugins.push(autolink({
          type: this.type,
          validate: this.options.validate
        }));
      }
      if (this.options.openOnClick) {
        plugins.push(clickHandler({
          type: this.type
        }));
      }
      if (this.options.linkOnPaste) {
        plugins.push(pasteHandler({
          editor: this.editor,
          type: this.type
        }));
      }
      return plugins;
    }
  });
  const PLUGIN_KEY$1 = new PluginKey("HyperlinkToolbarPlugin");
  class HyperlinkToolbarView {
    constructor({ editor, hyperlinkToolbarFactory }) {
      __publicField(this, "editor");
      __publicField(this, "hyperlinkToolbar");
      __publicField(this, "menuUpdateTimer");
      __publicField(this, "startMenuUpdateTimer");
      __publicField(this, "stopMenuUpdateTimer");
      __publicField(this, "mouseHoveredHyperlinkMark");
      __publicField(this, "mouseHoveredHyperlinkMarkRange");
      __publicField(this, "keyboardHoveredHyperlinkMark");
      __publicField(this, "keyboardHoveredHyperlinkMarkRange");
      __publicField(this, "hyperlinkMark");
      __publicField(this, "hyperlinkMarkRange");
      this.editor = editor;
      this.hyperlinkToolbar = hyperlinkToolbarFactory(this.getStaticParams());
      this.startMenuUpdateTimer = () => {
        this.menuUpdateTimer = setTimeout(() => {
          this.update();
        }, 250);
      };
      this.stopMenuUpdateTimer = () => {
        if (this.menuUpdateTimer) {
          clearTimeout(this.menuUpdateTimer);
          this.menuUpdateTimer = void 0;
        }
        return false;
      };
      editor.view.dom.addEventListener("mouseover", (event) => {
        this.mouseHoveredHyperlinkMark = void 0;
        this.mouseHoveredHyperlinkMarkRange = void 0;
        this.stopMenuUpdateTimer();
        if (event.target instanceof HTMLAnchorElement && event.target.nodeName === "A") {
          const hoveredHyperlinkElement = event.target;
          const posInHoveredHyperlinkMark = editor.view.posAtDOM(hoveredHyperlinkElement, 0) + 1;
          const resolvedPosInHoveredHyperlinkMark = editor.state.doc.resolve(
            posInHoveredHyperlinkMark
          );
          const marksAtPos = resolvedPosInHoveredHyperlinkMark.marks();
          for (const mark of marksAtPos) {
            if (mark.type.name === editor.schema.mark("link").type.name) {
              this.mouseHoveredHyperlinkMark = mark;
              this.mouseHoveredHyperlinkMarkRange = getMarkRange(
                resolvedPosInHoveredHyperlinkMark,
                mark.type,
                mark.attrs
              ) || void 0;
              break;
            }
          }
        }
        this.startMenuUpdateTimer();
        return false;
      });
    }
    update() {
      var _a, _b, _c, _d;
      if (!this.editor.view.hasFocus()) {
        return;
      }
      const prevHyperlinkMark = this.hyperlinkMark;
      this.hyperlinkMark = void 0;
      this.hyperlinkMarkRange = void 0;
      this.keyboardHoveredHyperlinkMark = void 0;
      this.keyboardHoveredHyperlinkMarkRange = void 0;
      if (this.editor.state.selection.empty) {
        const marksAtPos = this.editor.state.selection.$from.marks();
        for (const mark of marksAtPos) {
          if (mark.type.name === this.editor.schema.mark("link").type.name) {
            this.keyboardHoveredHyperlinkMark = mark;
            this.keyboardHoveredHyperlinkMarkRange = getMarkRange(
              this.editor.state.selection.$from,
              mark.type,
              mark.attrs
            ) || void 0;
            break;
          }
        }
      }
      if (this.mouseHoveredHyperlinkMark) {
        this.hyperlinkMark = this.mouseHoveredHyperlinkMark;
        this.hyperlinkMarkRange = this.mouseHoveredHyperlinkMarkRange;
      }
      if (this.keyboardHoveredHyperlinkMark) {
        this.hyperlinkMark = this.keyboardHoveredHyperlinkMark;
        this.hyperlinkMarkRange = this.keyboardHoveredHyperlinkMarkRange;
      }
      if (this.hyperlinkMark) {
        this.getDynamicParams();
        if (!prevHyperlinkMark) {
          this.hyperlinkToolbar.render(this.getDynamicParams(), true);
          (_a = this.hyperlinkToolbar.element) == null ? void 0 : _a.addEventListener(
            "mouseleave",
            this.startMenuUpdateTimer
          );
          (_b = this.hyperlinkToolbar.element) == null ? void 0 : _b.addEventListener(
            "mouseenter",
            this.stopMenuUpdateTimer
          );
          return;
        }
        this.hyperlinkToolbar.render(this.getDynamicParams(), false);
        return;
      }
      if (!this.hyperlinkMark && prevHyperlinkMark) {
        (_c = this.hyperlinkToolbar.element) == null ? void 0 : _c.removeEventListener(
          "mouseleave",
          this.startMenuUpdateTimer
        );
        (_d = this.hyperlinkToolbar.element) == null ? void 0 : _d.removeEventListener(
          "mouseenter",
          this.stopMenuUpdateTimer
        );
        this.hyperlinkToolbar.hide();
        return;
      }
    }
    getStaticParams() {
      return {
        editHyperlink: (url, text2) => {
          const tr = this.editor.view.state.tr.insertText(
            text2,
            this.hyperlinkMarkRange.from,
            this.hyperlinkMarkRange.to
          );
          tr.addMark(
            this.hyperlinkMarkRange.from,
            this.hyperlinkMarkRange.from + text2.length,
            this.editor.schema.mark("link", { href: url })
          );
          this.editor.view.dispatch(tr);
          this.editor.view.focus();
          this.hyperlinkToolbar.hide();
        },
        deleteHyperlink: () => {
          this.editor.view.dispatch(
            this.editor.view.state.tr.removeMark(
              this.hyperlinkMarkRange.from,
              this.hyperlinkMarkRange.to,
              this.hyperlinkMark.type
            ).setMeta("preventAutolink", true)
          );
          this.editor.view.focus();
          this.hyperlinkToolbar.hide();
        }
      };
    }
    getDynamicParams() {
      return {
        url: this.hyperlinkMark.attrs.href,
        text: this.editor.view.state.doc.textBetween(
          this.hyperlinkMarkRange.from,
          this.hyperlinkMarkRange.to
        ),
        referenceRect: posToDOMRect(
          this.editor.view,
          this.hyperlinkMarkRange.from,
          this.hyperlinkMarkRange.to
        )
      };
    }
  }
  const createHyperlinkToolbarPlugin = (editor, options) => {
    return new Plugin({
      key: PLUGIN_KEY$1,
      view: () => new HyperlinkToolbarView({
        editor,
        hyperlinkToolbarFactory: options.hyperlinkToolbarFactory
      })
    });
  };
  const Hyperlink = Link.extend({
    priority: 500,
    addProseMirrorPlugins() {
      var _a;
      if (!this.options.hyperlinkToolbarFactory) {
        throw new Error("UI Element factory not defined for HyperlinkMark");
      }
      return [
        ...((_a = this.parent) == null ? void 0 : _a.call(this)) || [],
        createHyperlinkToolbarPlugin(this.editor, {
          hyperlinkToolbarFactory: this.options.hyperlinkToolbarFactory
        })
      ];
    }
  });
  const PLUGIN_KEY = new PluginKey(`blocknote-placeholder`);
  const Placeholder = Extension.create({
    name: "placeholder",
    addOptions() {
      return {
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
        isFilterClass: "is-filter",
        hasAnchorClass: "has-anchor",
        placeholder: "Write something \u2026",
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
        includeChildren: false
      };
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: PLUGIN_KEY,
          props: {
            decorations: (state) => {
              const { doc: doc2, selection } = state;
              const menuState = SlashMenuPluginKey.getState(state);
              const active = this.editor.isEditable || !this.options.showOnlyWhenEditable;
              const { anchor } = selection;
              const decorations = [];
              if (!active) {
                return;
              }
              doc2.descendants((node, pos) => {
                const hasAnchor2 = anchor >= pos && anchor <= pos + node.nodeSize;
                const isEmpty2 = !node.isLeaf && !node.childCount;
                if ((hasAnchor2 || !this.options.showOnlyCurrent) && isEmpty2) {
                  const classes = [this.options.emptyNodeClass];
                  if (this.editor.isEmpty) {
                    classes.push(this.options.emptyEditorClass);
                  }
                  if (hasAnchor2) {
                    classes.push(this.options.hasAnchorClass);
                  }
                  if ((menuState == null ? void 0 : menuState.type) === "drag" && (menuState == null ? void 0 : menuState.active)) {
                    classes.push(this.options.isFilterClass);
                  }
                  const decoration = Decoration.node(pos, pos + node.nodeSize, {
                    class: classes.join(" ")
                  });
                  decorations.push(decoration);
                }
                return this.options.includeChildren;
              });
              return DecorationSet.create(doc2, decorations);
            }
          }
        })
      ];
    }
  });
  const TrailingNode = Extension.create({
    name: "trailingNode",
    addProseMirrorPlugins() {
      const plugin = new PluginKey(this.name);
      return [
        new Plugin({
          key: plugin,
          appendTransaction: (_, __, state) => {
            const { doc: doc2, tr, schema } = state;
            const shouldInsertNodeAtEnd = plugin.getState(state);
            const endPosition = doc2.content.size - 2;
            const type = schema.nodes["blockContainer"];
            const contentType = schema.nodes["paragraph"];
            if (!shouldInsertNodeAtEnd) {
              return;
            }
            return tr.insert(
              endPosition,
              type.create(void 0, contentType.create())
            );
          },
          state: {
            init: (_, _state) => {
            },
            apply: (tr, value) => {
              if (!tr.docChanged) {
                return value;
              }
              let lastNode = tr.doc.lastChild;
              if (!lastNode || lastNode.type.name !== "blockGroup") {
                throw new Error("Expected blockGroup");
              }
              lastNode = lastNode.lastChild;
              if (!lastNode || lastNode.type.name !== "blockContainer") {
                throw new Error("Expected blockContainer");
              }
              return lastNode.nodeSize > 4;
            }
          }
        })
      ];
    }
  });
  var getRandomValues;
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== "undefined" && typeof msCrypto.getRandomValues === "function" && msCrypto.getRandomValues.bind(msCrypto);
      if (!getRandomValues) {
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      }
    }
    return getRandomValues(rnds8);
  }
  const REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
  function validate(uuid) {
    return typeof uuid === "string" && REGEX.test(uuid);
  }
  var byteToHex = [];
  for (var i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).substr(1));
  }
  function stringify(arr) {
    var offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
    if (!validate(uuid)) {
      throw TypeError("Stringified UUID is invalid");
    }
    return uuid;
  }
  function v4(options, buf, offset) {
    options = options || {};
    var rnds = options.random || (options.rng || rng)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (var i2 = 0; i2 < 16; ++i2) {
        buf[offset + i2] = rnds[i2];
      }
      return buf;
    }
    return stringify(rnds);
  }
  function removeDuplicates(array, by = JSON.stringify) {
    const seen = {};
    return array.filter((item) => {
      const key = by(item);
      return Object.prototype.hasOwnProperty.call(seen, key) ? false : seen[key] = true;
    });
  }
  function findDuplicates(items) {
    const filtered = items.filter(
      (el, index) => items.indexOf(el) !== index
    );
    const duplicates = removeDuplicates(filtered);
    return duplicates;
  }
  const UniqueID = Extension.create({
    name: "uniqueID",
    priority: 1e4,
    addOptions() {
      return {
        attributeName: "id",
        types: [],
        generateID: () => {
          if (window.__TEST_OPTIONS) {
            if (window.__TEST_OPTIONS.mockID === void 0) {
              window.__TEST_OPTIONS.mockID = 0;
            } else {
              window.__TEST_OPTIONS.mockID++;
            }
            return parseInt(window.__TEST_OPTIONS.mockID);
          }
          return v4();
        },
        filterTransaction: null
      };
    },
    addGlobalAttributes() {
      return [
        {
          types: this.options.types,
          attributes: {
            [this.options.attributeName]: {
              default: null,
              parseHTML: (element) => element.getAttribute(`data-${this.options.attributeName}`),
              renderHTML: (attributes) => ({
                [`data-${this.options.attributeName}`]: attributes[this.options.attributeName]
              })
            }
          }
        }
      ];
    },
    onCreate() {
      if (this.editor.extensionManager.extensions.find(
        (extension) => extension.name === "collaboration"
      )) {
        return;
      }
      const { view, state } = this.editor;
      const { tr, doc: doc2 } = state;
      const { types, attributeName, generateID } = this.options;
      const nodesWithoutId = findChildren(doc2, (node) => {
        return types.includes(node.type.name) && node.attrs[attributeName] === null;
      });
      nodesWithoutId.forEach(({ node, pos }) => {
        tr.setNodeMarkup(pos, void 0, {
          ...node.attrs,
          [attributeName]: generateID()
        });
      });
      tr.setMeta("addToHistory", false);
      view.dispatch(tr);
    },
    addProseMirrorPlugins() {
      let dragSourceElement = null;
      let transformPasted = false;
      return [
        new Plugin({
          key: new PluginKey("uniqueID"),
          appendTransaction: (transactions, oldState, newState) => {
            console.log("appendTransaction");
            const docChanges = transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
            const filterTransactions = this.options.filterTransaction && transactions.some((tr2) => {
              var _a, _b;
              return !((_b = (_a = this.options).filterTransaction) === null || _b === void 0 ? void 0 : _b.call(_a, tr2));
            });
            if (!docChanges || filterTransactions) {
              return;
            }
            const { tr } = newState;
            const { types, attributeName, generateID } = this.options;
            const transform = combineTransactionSteps(
              oldState.doc,
              transactions
            );
            const { mapping } = transform;
            const changes = getChangedRanges(transform);
            changes.forEach(({ newRange }) => {
              const newNodes = findChildrenInRange(
                newState.doc,
                newRange,
                (node) => {
                  return types.includes(node.type.name);
                }
              );
              const newIds = newNodes.map(({ node }) => node.attrs[attributeName]).filter((id) => id !== null);
              const duplicatedNewIds = findDuplicates(newIds);
              newNodes.forEach(({ node, pos }) => {
                var _a;
                const id = (_a = tr.doc.nodeAt(pos)) === null || _a === void 0 ? void 0 : _a.attrs[attributeName];
                if (id === null) {
                  tr.setNodeMarkup(pos, void 0, {
                    ...node.attrs,
                    [attributeName]: generateID()
                  });
                  return;
                }
                const { deleted } = mapping.invert().mapResult(pos);
                const newNode = deleted && duplicatedNewIds.includes(id);
                if (newNode) {
                  tr.setNodeMarkup(pos, void 0, {
                    ...node.attrs,
                    [attributeName]: generateID()
                  });
                }
              });
            });
            if (!tr.steps.length) {
              return;
            }
            return tr;
          },
          view(view) {
            const handleDragstart = (event) => {
              var _a;
              dragSourceElement = ((_a = view.dom.parentElement) === null || _a === void 0 ? void 0 : _a.contains(event.target)) ? view.dom.parentElement : null;
            };
            window.addEventListener("dragstart", handleDragstart);
            return {
              destroy() {
                window.removeEventListener("dragstart", handleDragstart);
              }
            };
          },
          props: {
            handleDOMEvents: {
              drop: (view, event) => {
                var _a;
                if (dragSourceElement !== view.dom.parentElement || ((_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.effectAllowed) === "copy") {
                  dragSourceElement = null;
                  transformPasted = true;
                }
                return false;
              },
              paste: () => {
                transformPasted = true;
                return false;
              }
            },
            transformPasted: (slice) => {
              if (!transformPasted) {
                return slice;
              }
              const { types, attributeName } = this.options;
              const removeId = (fragment) => {
                const list = [];
                fragment.forEach((node) => {
                  if (node.isText) {
                    list.push(node);
                    return;
                  }
                  if (!types.includes(node.type.name)) {
                    list.push(node.copy(removeId(node.content)));
                    return;
                  }
                  const nodeWithoutId = node.type.create(
                    {
                      ...node.attrs,
                      [attributeName]: null
                    },
                    removeId(node.content),
                    node.marks
                  );
                  list.push(nodeWithoutId);
                });
                return Fragment.from(list);
              };
              transformPasted = false;
              return new Slice(
                removeId(slice.content),
                slice.openStart,
                slice.openEnd
              );
            }
          }
        })
      ];
    }
  });
  const getBlockNoteExtensions = (uiFactories) => {
    const ret = [
      extensions.ClipboardTextSerializer,
      extensions.Commands,
      extensions.Editable,
      extensions.FocusEvents,
      extensions.Tabindex,
      Gapcursor,
      Placeholder.configure({
        emptyNodeClass: blockStyles.isEmpty,
        hasAnchorClass: blockStyles.hasAnchor,
        isFilterClass: blockStyles.isFilter,
        includeChildren: true,
        showOnlyCurrent: false
      }),
      UniqueID.configure({
        types: ["blockContainer"]
      }),
      HardBreak,
      Text$1,
      Bold,
      Code,
      Italic,
      Strike,
      Underline,
      ...blocks,
      Dropcursor.configure({ width: 5, color: "#ddeeff" }),
      History,
      TrailingNode
    ];
    if (uiFactories.blockSideMenuFactory) {
      ret.push(
        DraggableBlocksExtension.configure({
          blockSideMenuFactory: uiFactories.blockSideMenuFactory
        })
      );
    }
    if (uiFactories.formattingToolbarFactory) {
      ret.push(
        FormattingToolbarExtension.configure({
          formattingToolbarFactory: uiFactories.formattingToolbarFactory
        })
      );
    }
    if (uiFactories.hyperlinkToolbarFactory) {
      ret.push(
        Hyperlink.configure({
          hyperlinkToolbarFactory: uiFactories.hyperlinkToolbarFactory
        })
      );
    } else {
      ret.push(Link);
    }
    if (uiFactories.slashMenuFactory) {
      ret.push(
        SlashMenuExtension.configure({
          slashMenuFactory: uiFactories.slashMenuFactory
        })
      );
    }
    return ret;
  };
  const blockNoteOptions = {
    enableInputRules: true,
    enablePasteRules: true,
    enableCoreExtensions: false
  };
  class BlockNoteEditor {
    constructor(options = {}) {
      __publicField(this, "tiptapEditor");
      var _a, _b, _c;
      const blockNoteExtensions = getBlockNoteExtensions(
        options.uiFactories || {}
      );
      let extensions2 = options.disableHistoryExtension ? blockNoteExtensions.filter((e) => e.name !== "history") : blockNoteExtensions;
      const tiptapOptions = {
        ...blockNoteOptions,
        ...options,
        extensions: options.enableBlockNoteExtensions === false ? options.extensions : [...options.extensions || [], ...extensions2],
        editorProps: {
          attributes: {
            ...((_a = options.editorProps) == null ? void 0 : _a.attributes) || {},
            class: [
              styles.bnEditor,
              styles.bnRoot,
              ((_c = (_b = options.editorProps) == null ? void 0 : _b.attributes) == null ? void 0 : _c.class) || ""
            ].join(" ")
          }
        }
      };
      this.tiptapEditor = new Editor(tiptapOptions);
    }
  }
  exports2.BlockNoteEditor = BlockNoteEditor;
  exports2.SlashMenuGroups = SlashMenuGroups;
  exports2.SlashMenuItem = SlashMenuItem;
  exports2.getBlockNoteExtensions = getBlockNoteExtensions;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
});
//# sourceMappingURL=blocknote.bundled.umd.cjs.map
