/* String streams are the things fed to parsers (which can feed them
 * to a tokenizer if they want). They provide peek and next methods
 * for looking at the current character (next 'consumes' this
 * character, peek does not), and a get method for retrieving all the
 * text that was consumed since the last time get was called.
 *
 * An easy mistake to make is to let a StopIteration exception finish
 * the token stream while there are still characters pending in the
 * string stream (hitting the end of the buffer while parsing a
 * token). To make it easier to detect such errors, the strings throw
 * an exception when this happens.
 */

(function(){
  // Generic operations that apply to stringstreams.
  var base = {
    more: function() {
      return this.peek() !== null;
    },
    applies: function(test) {
      var next = this.peek();
      return (next !== null && test(next));
    },
    nextWhile: function(test) {
      while (this.applies(test))
        this.next();
    },
    equals: function(ch) {
      return ch === this.peek();
    },
    endOfLine: function() {
      var next = this.peek();
      return next == null || next == "\n";
    },
    matches: function(string, caseSensitive) {
      for (var i = 0; i < string.length; i++) {
        var ch = this.peek();
        if (!ch || string.charAt(i) != (caseSensitive ? ch : ch.toLowerCase()))
          return false;
        this.next();
      }
      return true;
    }
  };

  // Make a stream out of a single string.
  Editor.rainbowStream = function(string) {
    var data = {
        pos: 0,
        start: 0,
        string: string
    };
    return update({
      reinit: function(string) {
        data.pos = 0;
        data.start = 0;
        data.string = string;
      },
      reset: function() {
        data.pos = data.start;
      },
      peek: function() {
        if (data.pos < data.string.length)
          return data.string.charAt(data.pos);
        else
          return null;
      },
      next: function() {
        if (data.pos >= data.string.length) {
          if (data.pos < data.start)
            throw "End of stringstream reached without emptying buffer.";
          else
            throw StopIteration;
        }
        return data.string.charAt(data.pos++);
      },
      get: function() {
        var result = data.string.slice(data.start, data.pos);
        data.start = data.pos;
        return result;
      },
      push: function(str) {
        data.string = data.string.slice(0, data.pos) + str + data.string.slice(data.pos);
      }
    }, base);
  }
})();
