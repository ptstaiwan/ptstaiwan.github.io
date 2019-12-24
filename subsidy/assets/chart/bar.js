var bar = {
  sample: function() {
    var barCount = 5 + Math.round(Math.random() * 3);
    var stackCount = 5 + Math.round(Math.random() * 2);
    return {
      order: [{name: "Order", data: plotdb.data.sample.category.order(barCount)}],
      value: plotdb.data.sample.fruit.order(stackCount).map(function(d,i) {
        return {
          name: d,
          data: d3.range(barCount).map(function(d,i) {
            var rate = (barCount - Math.abs(d - barCount/2)) / (barCount/2);
            return Math.round(Math.random() * barCount + barCount * rate * rate + 1);
          })
        }
      })
    };
  },
  dimension: {
    value: { type: [plotdb.Number], multiple: true, require: true, desc: "y axis value" },
    order: { type: [plotdb.Order], require: true, desc: "x axis index" },
  },
  config: {
    fontFamily: {},
    background: {},
    textFill: {},
    boxRoundness: {},
    fontSize: {},
    margin: {},
    padding: {},
    palette: {},
    labelShow: {},
    legendLabel: {},
    legendShow: {},
    xAxisShow: {},
    xAxisLabel: {},
    xAxisTickSizeInner: {},
    xAxisTickSizeOuter: {},
    xAxisTickPadding: {},
    xAxisShowDomain: {default: true},
    xAxisTickCount: {default: 0},
    xAxisStroke: {}
  },
  init: function() {
    var that = this;
    this.svg = d3.select(this.root).append("svg");
    this.legendGroup = this.svg.append("g").attr({class: "legend-group"});
    this.xAxisGroup = this.svg.append("g").attr({class: "axis horizontal"});
    this.popup = plotd3.html.tooltip(this.root).on("mouseover", function(d,i,popup) {
      popup.select(".title").text(
        d.name +
        (that.parsed.order[d.order] ? (" (" + that.parsed.order[d.order].value + ")"): "")
      );
      popup.select(".value").text(d.value);
    });
  },
  parse: function() {
    var that = this;
    if(!this.dimension.order.fields.length) this.data.map(function(d,i) { d.order = i; });
    this.categories = this.dimension.value.fieldName;
    this.maxsum = 0;
    var p = this.parsed = { bars: [], order: [], group: [], values: [] };
    var list = null;
    if(this.data.length) {
      plotdb.Order.sort(this.data, "order", true);
      //isOrderDate = (plotdb.Date.test(this.data[0].order));
      p.order = this.data.map(function(it) { return {
        idx: 0,
        value: it.order,
        parsed: it.order//(isOrderDate?new Date(it.order).getTime()/1000:it.oredr)
      };});
      /*p.order.sort(function(a,b){
        if(a.parsed > b.parsed) { return 1; }
        else if (a.parsed < b.parsed) { return -1; }
        return 0;
      });*/
      p.order.forEach(function(d,i) { d.idx = i; });
      for(var j=0;j < this.data[0].value.length; j++) {
        p.group.push({
          name: (this.dimension.value && this.dimension.value.fieldName
                 ?(this.dimension.value.fieldName[j] || j):j),
          idx: j
        });
        p.values = this.data.map(function(it) { return it.value; }).reduce(function(a,b) { return a.concat(b); }, []);
      }
      var maxsum = 0;
      for(var j=0; j < this.data.length; j++) {
        /* order of "order" might be re-arranged so we have to lookup again */        
        var orderIdx = (p.order.filter(function(it) { return it.value == that.data[j].order; })[0] || {idx: -1}).idx;
        p.bars.push(bars = {order: orderIdx, data: []});
        bars.data = this.data[j].value.map(function(d,i) {
          return {
            name: (that.dimension.value && that.dimension.value.fieldName
                   ?(that.dimension.value.fieldName[i] || i):i),
            order: orderIdx,
            value: d,
            group: i
          };
        });
        bars.data.sort(function(a,b) { return b.order - a.order;});
        var sum = 0;
        for(var i=0;i<bars.data.length;i++) {
          bars.data[i].sum = sum;
          sum += bars.data[i].value;
        }
        if(sum > maxsum) maxsum = sum;
      }
      this.maxsum = maxsum;
    }
  },
  bind: function() {
    var that = this, sel;
    sel = this.svg.selectAll("g.data-group").data(this.parsed.bars);
    sel.exit().remove();
    sel = sel.enter().append("g").attr({class: "data-group"});
    this.svg.selectAll("g.data-group").each(function(d,i) {
      var sel,node = d3.select(this);
      sel = node.selectAll("rect.data").data(d.data);
      sel.exit().remove();
      sel.enter().append("rect").attr({
        class: "data",
        y: function(d,i) {
          return that.yScale(d.sum + d.value);
        },
      });
      that.popup.nodes(sel);
      sel.on("click", function(d,i) {
        that.active = !!!that.active;
        that.render();
      });
      sel = node.selectAll("text.label.data").data(d.data);
      sel.exit().remove();
      sel.enter().append("text").attr({
        class: "label data",
        y: function(d,i) { return that.yScale(d.sum + d.value); }
      });
    });
  },
  resize: function() {
    var that = this;
    var box = this.root.getBoundingClientRect();
    var width = this.width = box.width;
    var height = this.height = box.height;
    this.svg.attr({
      width: width + "px", height: height + "px",
      viewBox: [0,0,width,height].join(" "),
      preserveAspectRatio: "xMidYMid"
    });
    this.popup.fontSize(this.config.fontSize);
    this.cScale = plotdb.Palette.scale.ordinal(this.config.palette);
    this.legend = plotd3.rwd.legend()
      .scale(this.cScale).orient("bottom").tickValues(this.categories)
      .size([this.width - 2 * this.config.margin, 100])
      .fontSize(this.config.fontSize);
    this.legend.label(this.config.legendLabel || " ");
    this.legendGroup.call(this.legend).selectAll(".legend").on("mouseover", function(d,i) {
      that.activeGroup = d; that.render(); 
    }).on("mouseout", function(d,i) { that.activeGroup = null; that.render(); });
    this.legendSize = (this.config.legendShow ? this.legend.offset() : [0,0]);
    this.yScale = d3.scale.linear()
      .domain([0, this.maxsum || 1])
      .range([
        height - this.config.margin - (this.config.legendShow ? this.legendSize[1] + this.config.fontSize : 0),
        this.config.margin + this.categories.length * 10
      ]);    

    var step = (width - 2 * this.config.margin) / this.data.length;
    var rate = that.config.padding / step;
    if(step - that.config.padding < 3) rate = (step - 3)/step;
    this.xScale = d3.scale.ordinal()
      .domain(this.parsed.order.map(function(it) { return it.idx; }))
      .rangeBands(
        [this.config.margin + 2, width - this.config.margin ],
        rate, rate
      )
    this.barWidth = this.xScale.rangeBand();
    this.xAxis = plotd3.rwd.axis()
      .scale(this.xScale)
      .orient("bottom")
      .label(this.config.xAxisLabel || "")
      .tickSize(this.config.xAxisTickSizeInner, this.config.xAxisTickSizeOuter)
      .tickPadding(this.config.xAxisTickPadding)
      .ticks(this.config.xAxisTickCount)
      .fontSize(this.config.fontSize)
      .tickFormat(function(it) { return that.parsed.order[it].value; });
    this.xAxisGroup.call(this.xAxis);
    this.xAxisHeight = (this.config.xAxisShow ? this.xAxis.offset() : 0);
    this.yScale.range([
      height - this.config.margin - (this.config.legendShow ? this.legendSize[1] + this.config.fontSize : 0) - this.xAxisHeight - 2,
      this.config.margin + this.categories.length * 10
    ]);
    var range = this.yScale.range();
    this.heightRange = range[0] - range[1] + this.categories.length * 10;
  },
  render: function() {
    var that = this;
    var range = this.xScale.range();
    if(this.config.fontFamily) d3.select(this.root).style("font-family", this.config.fontFamily);
    d3.select(this.root).style("background-color", this.config.background);
    this.svg.selectAll("text").attr({
      "font-size": that.config.fontSize,
      "fill": that.config.textFill
    });
    this.legendGroup.attr({ transform: [
      "translate(",
      (this.width - this.legendSize[0])/2,
      (this.height - this.legendSize[1] - this.config.margin),
      ")"].join(" "),
      display: (this.config.legendShow ? "block" : "none")
    });
    this.xAxisGroup.attr({
      transform: "translate(0 " + (this.height - this.xAxisHeight - this.config.margin - (this.config.legendShow ? this.config.fontSize + this.legendSize[1] : 0)) + ")",
      display: (this.config.xAxisShow ? "block" : "none")
    });
    this.xAxisGroup.selectAll(".domain").attr({ display: (this.config.xAxisShowDomain ? "block" : "none")});
    this.xAxisGroup.selectAll("path,line").attr({ stroke: that.config.xAxisStroke });
    this.svg.selectAll("g.data-group").each(function(d,i) {
      var sel,node = d3.select(this);
      if(node.attr("transform")) sel = node.transition("move").duration(500); else sel = node;
      sel.attr({
        transform: function(d,i) {
          return ["translate(", that.xScale(d.order), 0, ")"].join(" ")
        }
      });
      node.selectAll("rect.data").attr({
        x: 0,
        "stroke-width": 2, stroke: "#fff",
        fill: function(d) { return that.cScale(d.name); },
      });
      node.selectAll("rect.data").transition().attr({
        opacity: function(d,i) {
          return (!that.activeGroup || that.activeGroup == d.name ? 1 : 0.1);
        },
        y: function(d,i) {
          if(that.active) {
            return (that.heightRange * (that.categories.length - i) / that.categories.length -
              (that.yScale(d.sum) - that.yScale(d.sum + d.value)) + that.config.margin);
          } else {
            return that.yScale(d.sum + d.value);
          }
        },
        width: that.barWidth,
        height: function(d,i) {
          return that.yScale(d.sum) - that.yScale(d.sum + d.value);
        },
        rx: that.config.boxRoundness,
        ry: that.config.boxRoundness,

      });
      var textDX = (that.config.fontSize + that.config.boxRoundness/3)/2;
      var textDY = (that.config.fontSize*2 + that.config.boxRoundness/3)/2;
      var config = {
        dx: ((that.barWidth/2 < textDX ? that.barWidth/2 : textDX)/that.config.fontSize) + "em",
        dy: "0.5em",
        y: function(d,i) {
          var ret;
          var h = that.yScale(d.sum) - that.yScale(d.sum + d.value);
          if(that.active) {
            ret = (that.heightRange * (that.categories.length - i) / that.categories.length + that.config.margin);
          } else {
            ret = that.yScale(d.sum);
          }
          if(h/2 < textDY) ret -= h/2; else ret -= textDY;
          return ret;
        }
      };

      node.selectAll("text.label.data").attr({
        x: 0,
        "font-size": that.config.fontSize,
        fill: function(d,i) {
          var c = d3.hsl(that.cScale(d.name));
          return (c.l > 0.65 ? "#000" : "#fff");
        },
      }).text(function(d,i) { return d.value; }).style({
        display: function() {
          if(that.width < 400 || !that.config.labelShow) return "none"; else return "inline";
        }
      }).transition("opacity").duration(500).attr({
        opacity: function(d,i) {
          return (!that.activeGroup || that.activeGroup == d.name ? 1 : 0.1);
        }
      });
      node.selectAll("text.label.data").transition("move").duration(function(d,i) {
        return d3.select(this).attr("dy") ? 500 : 0;
      }).attr(config);
    });
  }
}
