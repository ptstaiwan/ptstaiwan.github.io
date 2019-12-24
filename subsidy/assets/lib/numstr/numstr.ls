(->
  re = /-?(\d+\.?|\.)(\d+)?(e-?\d+)?/
  NumStr = (d) -> @ <<< @parse d; return @
  NumStr <<< do
    interpolate: (s, d, t) ->
      v = d.v.map (v,i) -> (d.v[i] - s.v[i]) * t + s.v[i]
      return d.o
        .map -> if typeof(it) == \number => v[it] else it
        .join('')
  NumStr.prototype = Object.create(Object.prototype) <<< do
    parse: (d) ->
      [o,v] = [[],[]]
      while true =>
        ret = re.exec(d)
        if !ret => break
        o.push d.substring 0, ret.index
        o.push v.length
        v.push +ret.0
        d = d.substring ret.index + ret.0.length
      o.push d
      return {o, v}
  if window? => window.NumStr = NumStr
  if module? => module.exports = NumStr
)!
# sample code
/*
ret1 = new NumStr "translate(100.5, -2.345e-12)"
ret2 = new NumStr "translate(210.5, 30)"
for i from 0 to 10 =>
  ret = NumStr.interpolate ret1, ret2, i/10
  console.log ret
*/
