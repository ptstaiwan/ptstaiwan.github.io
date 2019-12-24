// Generated by LiveScript 1.3.1
(function(){
  var re, NumStr;
  re = /-?(\d+\.?|\.)(\d+)?(e-?\d+)?/;
  NumStr = function(d){
    import$(this, this.parse(d));
    return this;
  };
  import$(NumStr, {
    interpolate: function(s, d, t){
      var v;
      v = d.v.map(function(v, i){
        return (d.v[i] - s.v[i]) * t + s.v[i];
      });
      return d.o.map(function(it){
        if (typeof it === 'number') {
          return v[it];
        } else {
          return it;
        }
      }).join('');
    }
  });
  NumStr.prototype = import$(Object.create(Object.prototype), {
    parse: function(d){
      var ref$, o, v, ret;
      ref$ = [[], []], o = ref$[0], v = ref$[1];
      for (;;) {
        ret = re.exec(d);
        if (!ret) {
          break;
        }
        o.push(d.substring(0, ret.index));
        o.push(v.length);
        v.push(+ret[0]);
        d = d.substring(ret.index + ret[0].length);
      }
      o.push(d);
      return {
        o: o,
        v: v
      };
    }
  });
  if (typeof window != 'undefined' && window !== null) {
    window.NumStr = NumStr;
  }
  if (typeof module != 'undefined' && module !== null) {
    return module.exports = NumStr;
  }
})();
/*
ret1 = new NumStr "translate(100.5, -2.345e-12)"
ret2 = new NumStr "translate(210.5, 30)"
for i from 0 to 10 =>
  ret = NumStr.interpolate ret1, ret2, i/10
  console.log ret
*/
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}