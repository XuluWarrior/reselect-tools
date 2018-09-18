'use strict';

exports.__esModule = true;
exports.createSelectorWithDependencies = createSelectorWithDependencies;
exports.registerSelectors = registerSelectors;
exports.reset = reset;
exports.checkSelector = checkSelector;
exports.getStateWith = getStateWith;
exports.selectorGraph = selectorGraph;

var _reselect = require('reselect');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _getState = null;
var _allSelectors = new Set();

var _isFunction = function _isFunction(func) {
  return typeof func === 'function';
};

function createSelectorWithDependencies() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  var resultFunc = funcs.pop();
  var dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs;
  var selector = _reselect.createSelector.apply(undefined, _toConsumableArray(dependencies).concat([resultFunc]));
  selector.dependencies = dependencies;
  _allSelectors.add(selector);
  return selector;
}

var _isSelector = function _isSelector(selector) {
  return selector && selector.resultFunc || _isFunction(selector);
};

function registerSelectors(selectors) {
  Object.keys(selectors).forEach(function (name) {
    var selector = selectors[name];
    if (_isSelector(selector)) {
      selector.selectorName = name;
      _allSelectors.add(selector);
    }
  });
}

function reset() {
  _getState = null;
  _allSelectors = new Set();
}

function checkSelector(selector) {
  if (typeof selector === 'string') {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _allSelectors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var possibleSelector = _step.value;

        if (possibleSelector.selectorName === selector) {
          selector = possibleSelector;
          break;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  if (!_isFunction(selector)) {
    throw new Error('Selector ' + selector + ' is not a function...has it been registered?');
  }

  var _selector = selector,
      _selector$dependencie = _selector.dependencies,
      dependencies = _selector$dependencie === undefined ? [] : _selector$dependencie,
      _selector$selectorNam = _selector.selectorName,
      selectorName = _selector$selectorNam === undefined ? null : _selector$selectorNam;

  var isNamed = typeof selectorName === 'string';
  var recomputations = selector.recomputations ? selector.recomputations() : null;

  var ret = { dependencies: dependencies, recomputations: recomputations, isNamed: isNamed, selectorName: selectorName };
  if (_getState) {
    var state = _getState();
    var inputs = dependencies.map(function (parentSelector) {
      var input = parentSelector(state);
      if (input && input.toJS) {
        input = input.toJS();
      }
      return input;
    });
    var output = selector(state);
    if (output && output.toJS) {
      output = output.toJS();
    }
    Object.assign(ret, { inputs: inputs, output: output });
  }

  return ret;
}

function getStateWith(stateGetter) {
  _getState = stateGetter;
}

function _sumString(str) {
  return Array.from(str.toString()).reduce(function (sum, char) {
    return char.charCodeAt(0) + sum;
  }, 0);
}

var defaultSelectorKey = function defaultSelectorKey(selector) {
  if (selector.selectorName) {
    return selector.selectorName;
  }

  if (selector.name) {
    // if it's a vanilla function, it will have a name.
    return selector.name;
  }

  return (selector.dependencies || []).reduce(function (base, dep) {
    return base + _sumString(dep);
  }, (selector.resultFunc ? selector.resultFunc : selector).toString());
};

function selectorGraph() {
  var selectorKey = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultSelectorKey;

  var graph = { nodes: {}, edges: [] };
  var addToGraph = function addToGraph(selector) {
    var name = selectorKey(selector);
    if (graph.nodes[name]) return;

    var _checkSelector = checkSelector(selector),
        recomputations = _checkSelector.recomputations,
        isNamed = _checkSelector.isNamed;

    graph.nodes[name] = {
      recomputations: recomputations,
      isNamed: isNamed,
      name: name
    };

    var dependencies = selector.dependencies || [];
    dependencies.forEach(function (dependency) {
      addToGraph(dependency);
      graph.edges.push({ from: name, to: selectorKey(dependency) });
    });
  };

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = _allSelectors[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var selector = _step2.value;

      addToGraph(selector);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return graph;
}

// hack for devtools
/* istanbul ignore if */
if (typeof window !== 'undefined') {
  window.__RESELECT_TOOLS__ = {
    selectorGraph: selectorGraph,
    checkSelector: checkSelector
  };
}