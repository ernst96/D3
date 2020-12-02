const margin = { t: 50, r: 50, b: 50, l: 50 };

var scale = {
  x: d3.scaleLinear(),
  y: d3.scaleLinear(),
};

var chart = {
  data: null,
  xAxis: d3.axisBottom().scale(scale.x).tickFormat(d3.format(",d")),
  yAxis: d3.axisLeft().scale(scale.y),
  svg: d3.select("#outliers")
    .append("svg")
    // FF does not allow resizing of the svg canvas
    // as a work around we can simply create a very large canvas
    // and then position the visualization with the correct width/height beased on the available screen space
    .attr("width", 10000)
    .attr("height", 10000)
    .append("g")
    .attr("class", "chart")
    .attr("transform", "translate(" + margin.l + "," + margin.t + ")")
};

/**
 * Initialize the visualization
 */
function initChart() {
  // Create x-axis and label objects.
  d3.select(".chart")
    .append("g")
    .attr("class", "x axis")
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", getSize().width)
    .attr("y", -6)
    .text("XAXIS");

  // Add the y-axis and label objects.
  d3.select(".chart")
    .append("g")
    .attr("class", "y axis")
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("x", 100)
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Y-AXIS");

  // add container for the plot
  d3.select(".chart")
    .append("g")
    .attr("class", "plot")
    .attr("transform", "translate(" + margin.l + "," + margin.t + ")")

  // load the intial dataset
  loadData("stats.json");
}

/**
 * Draw the visualization
 */
function drawChart() {
  var w = getSize().width - margin.l - margin.r;
  var h = getSize().height - margin.t - margin.b;
  var t = chart.svg.transition().duration(1500).ease(d3.easeExpOut);
  const g = chart.svg.select(".plot");
  const cutoff = 4;

  // do nothing if there is no data
  if (!chart.data) {
    return;
  }

  var data = chart.data;

  // UPDATE the scales
  scale.x.range([0 - margin.l, w]);
  scale.y.range([h, 0]);

  chart.xAxis.tickSize(5);
  chart.yAxis.tickSize(5);

  // UPDATE x/y axis
  d3.select(".x.axis")
    .attr("transform", "translate(" + margin.l + "," + h + ")")
    .call(chart.xAxis);

  // position x-axis label
  t.select(".x.label").attr("x", w - 6);

  // resize y-axis
  t.select(".y.axis").call(chart.yAxis);

  // clean up previously rendered paths
  g.selectAll("path").remove();

  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => scale.x(d.t))
    .attr("cy", (d) => scale.y(d.y))
    .attr("r", (d, i) => (data[i].outlierScore > 1.0 ? 3 : 1.5))
    .attr("fill", (d, i) =>
      data[i].outlierScore > 1.0 ? "orange" : "rgba(32, 220, 157, 1)"
    );


  g.append("path")
    .datum(data)
    .attr(
      "d",
      d3
        .line()
        .x((d) => scale.x(d.t))
        .y((d) => scale.y(d.mean))
    )
    .attr("stroke", "rgba(32, 220, 157, 0.7)")
    .attr("stroke-width", 3)
    .attr("fill", "none");

  var band = data.concat(
    data
      .slice()
      .reverse()
      .map((d) => {
        return Object.assign({}, d, { factor: -1 });
      })
  );

  g.append("path")
    .datum(band)
    .attr(
      "d",
      d3
        .line()
        .x((d) => scale.x(d.t))
        .y((d) =>
          scale.y(d.mean + cutoff * Math.sqrt(d.variance) * (d.factor || 1))
        )
    )
    .attr("stroke-width", 0)
    .attr("fill", "rgba(32, 220, 157, 0.3)");
}

/**
 * Load the data
 * @param {String} dataUrl ... local path to JSON data file
 */
function loadData(dataUrl) {
  d3.json(dataUrl).then(function (data) {
    chart.data = data;

    var min = Math.min.apply(
      null,
      data.map((d) => d.y)
    );
    var max = Math.max.apply(
      null,
      data.map((d) => d.y)
    );
    var avg = 0.5 * (max + min);
    var rng = 0.5 * (max - min);

    // calibrate the scale to ranges of data (sales and sla compliance)
    scale.x.domain([data[0].t, data[data.length - 1].t]);

    scale.y.domain([Math.min(0, avg - rng * 2), Math.max(0, avg + rng * 2)]);

    setChartSize();
    drawChart();
  });
}

/**
 * Set the chart container size
 */
function setChartSize() {
  var h = $(window).height();
  $("#outliers").height(h);
}

/**
 * Return the size of the visualization container
 */
function getSize() {
  return {
    width: $("#outliers").width(),
    height: $("#outliers").height(),
  };
}

/**
 * Resize visualization when browser window size changes
 */
$(window).resize(function () {
  setChartSize();
  drawChart();
});

$(document).ready(function () {
  initChart();
});
