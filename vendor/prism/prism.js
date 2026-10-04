/* ==========================================================================
   PRISM JS (Self-Hosted Standalone Core + Languages: markup, css, clike, javascript, json, python, bash)
   MIT License - https://prismjs.com
   ========================================================================== */
(function (global) {
  'use strict';

  var _self = typeof window !== 'undefined'
    ? window
    : typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope
    ? self
    : {};

  var Prism = (function (_self) {
    var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
    var uniqueId = 0;

    var _ = {
      manual: _self.Prism && _self.Prism.manual,
      disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
      util: {
        encode: function encode(tokens) {
          if (tokens instanceof Token) {
            return new Token(tokens.type, encode(tokens.content), tokens.alias);
          } else if (Array.isArray(tokens)) {
            return tokens.map(encode);
          } else {
            return tokens
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/\u00a0/g, ' ');
          }
        },
        type: function (o) {
          return Object.prototype.toString.call(o).slice(8, -1);
        },
        objId: function (obj) {
          if (!obj['__id']) {
            Object.defineProperty(obj, '__id', { value: ++uniqueId });
          }
          return obj['__id'];
        },
        clone: function deepClone(o, visited) {
          visited = visited || {};
          var clone, id;
          switch (_.util.type(o)) {
            case 'Object':
              id = _.util.objId(o);
              if (visited[id]) return visited[id];
              clone = {};
              visited[id] = clone;
              for (var key in o) {
                if (o.hasOwnProperty(key)) {
                  clone[key] = deepClone(o[key], visited);
                }
              }
              return clone;
            case 'Array':
              id = _.util.objId(o);
              if (visited[id]) return visited[id];
              clone = [];
              visited[id] = clone;
              o.forEach(function (v, i) {
                clone[i] = deepClone(v, visited);
              });
              return clone;
            default:
              return o;
          }
        },
      },
      languages: {
        plain: {},
        plaintext: {},
        text: {},
        txt: {},
        extend: function (id, redef) {
          var lang = _.util.clone(_.languages[id]);
          for (var key in redef) {
            lang[key] = redef[key];
          }
          return lang;
        },
        insertBefore: function (inside, before, insert, root) {
          root = root || _.languages;
          var grammar = root[inside];
          var ret = {};
          for (var token in grammar) {
            if (grammar.hasOwnProperty(token)) {
              if (token === before) {
                for (var newToken in insert) {
                  if (insert.hasOwnProperty(newToken)) {
                    ret[newToken] = insert[newToken];
                  }
                }
              }
              if (!insert.hasOwnProperty(token)) {
                ret[token] = grammar[token];
              }
            }
          }
          var old = root[inside];
          root[inside] = ret;
          _.languages.DFS(_.languages, function (key, value) {
            if (value === old && key !== inside) {
              this[key] = ret;
            }
          });
          return ret;
        },
        DFS: function DFS(o, callback, type, visited) {
          visited = visited || {};
          var objId = _.util.objId;
          for (var i in o) {
            if (o.hasOwnProperty(i)) {
              callback.call(o, i, o[i], type || i);
              var property = o[i],
                propertyType = _.util.type(property);
              if (propertyType === 'Object' && !visited[objId(property)]) {
                visited[objId(property)] = true;
                DFS(property, callback, null, visited);
              } else if (propertyType === 'Array' && !visited[objId(property)]) {
                visited[objId(property)] = true;
                DFS(property, callback, i, visited);
              }
            }
          }
        },
      },
      plugins: {},
      highlightAll: function (async, callback) {
        _.highlightAllUnder(document, async, callback);
      },
      highlightAllUnder: function (container, async, callback) {
        var env = {
          callback: callback,
          container: container,
          selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code',
        };
        var elements = env.container.querySelectorAll(env.selector);
        for (var i = 0, element; (element = elements[i++]); ) {
          _.highlightElement(element, async === true, env.callback);
        }
      },
      highlightElement: function (element, async, callback) {
        var language = 'none',
          grammar,
          parent = element;
        while (parent && !lang.test(parent.className)) {
          parent = parent.parentElement;
        }
        if (parent) {
          language = (parent.className.match(lang) || [, 'none'])[1].toLowerCase();
          grammar = _.languages[language];
        }
        element.className =
          element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
        if (element.parentElement) {
          parent = element.parentElement;
          if (/pre/i.test(parent.nodeName)) {
            parent.className =
              parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
          }
        }
        var code = element.textContent;
        var env = {
          element: element,
          language: language,
          grammar: grammar,
          code: code,
        };
        function insertHighlightedCode(highlightedCode) {
          env.highlightedCode = highlightedCode;
          env.element.innerHTML = env.highlightedCode;
          if (callback) callback.call(env.element);
        }
        if (!env.code) {
          return;
        }
        if (!env.grammar) {
          insertHighlightedCode(_.util.encode(env.code));
          return;
        }
        insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
      },
      highlight: function (text, grammar, language) {
        var env = { code: text, grammar: grammar, language: language };
        var tokens = _.tokenize(env.code, env.grammar);
        return Token.stringify(_.util.encode(tokens), env.language);
      },
      tokenize: function (text, grammar) {
        var rest = grammar.rest;
        if (rest) {
          for (var token in rest) {
            grammar[token] = rest[token];
          }
          delete grammar.rest;
        }
        var tokenList = new LinkedList();
        addAfter(tokenList, tokenList.head, text);
        matchGrammar(text, tokenList, grammar, tokenList.head, 0);
        return toArray(tokenList);
      },
      Token: Token,
    };

    function Token(type, content, alias, matchedStr) {
      this.type = type;
      this.content = content;
      this.alias = alias;
      this.length = (matchedStr || '').length | 0;
    }

    Token.stringify = function stringify(o, language) {
      if (typeof o == 'string') {
        return o;
      }
      if (Array.isArray(o)) {
        var s = '';
        o.forEach(function (e) {
          s += stringify(e, language);
        });
        return s;
      }
      var env = {
        type: o.type,
        content: stringify(o.content, language),
        tag: 'span',
        classes: ['token', o.type],
        attributes: {},
        language: language,
      };
      var aliases = o.alias;
      if (aliases) {
        if (Array.isArray(aliases)) {
          Array.prototype.push.apply(env.classes, aliases);
        } else {
          env.classes.push(aliases);
        }
      }
      var attributes = '';
      for (var name in env.attributes) {
        attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
      }
      return (
        '<' +
        env.tag +
        ' class="' +
        env.classes.join(' ') +
        '"' +
        attributes +
        '>' +
        env.content +
        '</' +
        env.tag +
        '>'
      );
    };

    function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
      for (var token in grammar) {
        if (!grammar.hasOwnProperty(token) || !grammar[token]) {
          continue;
        }
        var patterns = grammar[token];
        patterns = Array.isArray(patterns) ? patterns : [patterns];
        for (var j = 0; j < patterns.length; ++j) {
          if (rematch && rematch.cause == token + ',' + j) {
            return;
          }
          var patternObj = patterns[j],
            inside = patternObj.inside,
            lookbehind = !!patternObj.lookbehind,
            greedy = !!patternObj.greedy,
            alias = patternObj.alias;
          if (greedy && !patternObj.pattern.global) {
            var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
            patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
          }
          var pattern = patternObj.pattern || patternObj;
          for (
            var currentNode = startNode.next, pos = startPos;
            currentNode !== tokenList.tail;
            pos += currentNode.value.length, currentNode = currentNode.next
          ) {
            if (rematch && pos >= rematch.reach) {
              break;
            }
            var str = currentNode.value;
            if (tokenList.length > text.length) {
              return;
            }
            if (str instanceof Token) {
              continue;
            }
            var removeCount = 1;
            var match;
            if (greedy) {
              pattern.lastIndex = pos;
              match = pattern.exec(text);
              if (!match || match.index >= pos + str.length) {
                break;
              }
              var from = match.index;
              var to = match.index + match[0].length;
              var p = pos;
              p += currentNode.value.length;
              while (from >= p) {
                currentNode = currentNode.next;
                p += currentNode.value.length;
              }
              p -= currentNode.value.length;
              pos = p;
              if (currentNode.value instanceof Token) {
                continue;
              }
              for (
                var k = currentNode;
                k !== tokenList.tail && (p < to || typeof k.value === 'string');
                k = k.next
              ) {
                removeCount++;
                p += k.value.length;
              }
              removeCount--;
              str = text.slice(pos, p);
              match.index -= pos;
            } else {
              pattern.lastIndex = 0;
              match = pattern.exec(str);
            }
            if (!match) {
              continue;
            }
            if (lookbehind) {
              lookbehindLength = match[1] ? match[1].length : 0;
            }
            var lookbehindLength = lookbehind ? (match[1] ? match[1].length : 0) : 0;
            var matchStr = match[0].slice(lookbehindLength);
            var matchLength = matchStr.length;
            var from = match.index + lookbehindLength;
            var before = str.slice(0, from);
            var after = str.slice(from + matchLength);
            var reach = pos + str.length;
            if (rematch && reach > rematch.reach) {
              rematch.reach = reach;
            }
            var removeFrom = currentNode.prev;
            if (before) {
              removeFrom = addAfter(tokenList, removeFrom, before);
              pos += before.length;
            }
            removeRange(tokenList, removeFrom, removeCount);
            var wrapped = new Token(
              token,
              inside ? _.tokenize(matchStr, inside) : matchStr,
              alias,
              matchStr
            );
            currentNode = addAfter(tokenList, removeFrom, wrapped);
            if (after) {
              addAfter(tokenList, currentNode, after);
            }
            if (removeCount > 1) {
              var nestedRematch = { cause: token + ',' + j, reach: reach };
              matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);
              if (rematch && nestedRematch.reach > rematch.reach) {
                rematch.reach = nestedRematch.reach;
              }
            }
          }
        }
      }
    }

    function LinkedList() {
      var head = { value: null, prev: null, next: null };
      var tail = { value: null, prev: head, next: null };
      head.next = tail;
      this.head = head;
      this.tail = tail;
      this.length = 0;
    }

    function addAfter(list, node, value) {
      var next = node.next;
      var newNode = { value: value, prev: node, next: next };
      node.next = newNode;
      next.prev = newNode;
      list.length++;
      return newNode;
    }

    function removeRange(list, node, count) {
      var next = node.next;
      for (var i = 0; i < count && next !== list.tail; i++) {
        next = next.next;
      }
      node.next = next;
      next.prev = node;
      list.length -= i;
    }

    function toArray(list) {
      var array = [];
      var node = list.head.next;
      while (node !== list.tail) {
        array.push(node.value);
        node = node.next;
      }
      return array;
    }

    return _;
  })(_self);

  /* Language: JSON */
  Prism.languages.json = {
    property: { pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/, lookbehind: true, greedy: true },
    string: { pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/, lookbehind: true, greedy: true },
    comment: { pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/, greedy: true },
    number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
    punctuation: /[{}[\],]/,
    operator: /:/,
    boolean: /\b(?:false|true)\b/,
    null: { pattern: /\bnull\b/, alias: 'keyword' },
  };

  /* Language: Markup (HTML/XML) */
  Prism.languages.markup = {
    comment: { pattern: /<!--(?:(?!<!--)[\s\S])*?-->/, greedy: true },
    prolog: { pattern: /<\?[\s\S]+?\?>/, greedy: true },
    doctype: {
      pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:(?!<!--)[\s\S])*?-->)*\]\s*)?>/i,
      greedy: true,
      inside: {
        'internal-subset': {
          pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
          lookbehind: true,
          inside: 'markup',
        },
        string: { pattern: /"[^"]*"|'[^']*'/, greedy: true },
        punctuation: /^<!|>$|[[\]]/,
        'doctype-tag': /^DOCTYPE/i,
        name: /[^\s<>'"]+/,
      },
    },
    cdata: { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, greedy: true },
    tag: {
      pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?!\s*[^\s>\/=])))+)?\s*\/?>/,
      greedy: true,
      inside: {
        tag: { pattern: /^<\/?[^\s>\/]+/, inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ } },
        'special-attr': [],
        'attr-value': {
          pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
          inside: { punctuation: [{ pattern: /^=/, alias: 'attr-equals' }, /"|'/] },
        },
        punctuation: /\/?>/,
        'attr-name': { pattern: /[^\s>\/]+/, inside: { namespace: /^[^\s>\/:]+:/ } },
      },
    },
    entity: [
      { pattern: /&[\da-z]{1,8};/i, alias: 'named-entity' },
      /&#x?[\da-f]{1,8};/i,
    ],
  };

  /* Language: JavaScript / TypeScript */
  Prism.languages.clike = {
    comment: [
      { pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: true, greedy: true },
      { pattern: /(^|[^\\:])\/\/.*/, lookbehind: true, greedy: true },
    ],
    string: { pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: true },
    'class-name': {
      pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
      lookbehind: true,
      inside: { punctuation: /[.\\]/ },
    },
    keyword: /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
    boolean: /\b(?:false|true)\b/,
    function: /\b\w+(?=\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    punctuation: /[{}[\];(),.:]/,
  };

  Prism.languages.javascript = Prism.languages.extend('clike', {
    'class-name': [
      Prism.languages.clike['class-name'],
      { pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/, lookbehind: true },
    ],
    keyword: [
      { pattern: /((?:^|\})\s*)catch\b/, lookbehind: true },
      { pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try(?=\s*(?:\{|$))|typeof|undefined|var|void|while|with|yield)\b/, lookbehind: true },
    ],
  });

  /* Language: Python */
  Prism.languages.python = {
    comment: { pattern: /(^|[^\\])#.*/, lookbehind: true, greedy: true },
    'string-interpolation': {
      pattern: /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
      greedy: true,
      inside: {
        interpolation: {
          pattern: /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{[^{}]*\})+\}/,
          lookbehind: true,
          inside: { 'rest': null },
        },
        string: /[\s\S]+/,
      },
    },
    'triple-quoted-string': {
      pattern: /(?:[rub]|br)?("""|''')[\s\S]*?\1/i,
      greedy: true,
      alias: 'string',
    },
    string: { pattern: /(?:[rub]|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i, greedy: true },
    function: { pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g, lookbehind: true },
    'class-name': { pattern: /(\bclass\s+)\w+/i, lookbehind: true },
    decorator: {
      pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
      lookbehind: true,
      alias: ['annotation', 'punctuation'],
      inside: { punctuation: /\./ },
    },
    keyword: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
    builtin: /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
    boolean: /\b(?:False|None|True)\b/,
    number: /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
    operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
    punctuation: /[{}[\];(),.:]/,
  };

  /* Auto-Highlight on DOMContentLoaded */
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        Prism.highlightAll();
      });
    } else {
      setTimeout(function () {
        Prism.highlightAll();
      }, 0);
    }
  }

  global.Prism = Prism;
})(typeof window !== 'undefined' ? window : this);
