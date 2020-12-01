/**
 * Data Utilities
 */
function getX(d) {
  return d.s;
}
function getY(d) {
  return -1 * d.cmp;
}
function getR(d) {
  return d.cat / 10000;
}
function getC(d) {
  return d.t !== 0 ? d.mis : -1;
}
function getShortNm(d) {
  var str = "";
  if (d.aid) {
    str = d.aid.substring(0, getR(d) / 4);
  }
  return str;
}
function getFullNm(d) {
  return d.aid;
}
function getId(d) {
  return d.aid;
}
function order(a, b) {
  return getR(b) - getR(a);
}

/**
 * Globals
 */
const margin = { t: 50, r: 50, b: 50, l: 50 };

var highlightedDspId = "";

var scale = {
  x: d3.scalePow().exponent(0.6),
  y: d3.scalePow().exponent(3),
  r: d3.scaleLinear().range([5, 50]),
  pnmFontSize: d3.scaleLinear().range([7, 13]),
  color: d3
    .scaleThreshold()
    .domain([0, 5, 10, 15, 20, 25])
    .range([
      "#666666",
      "#2DB200",
      "#78E900",
      "#C2F400",
      "#FAE600",
      "#ED9E00",
      "#DA3E00",
    ]),
  lblcolor: d3
    .scaleThreshold()
    .domain([0, 5, 10, 15, 20, 25])
    .range([
      "#333333",
      "#005E00",
      "#249500",
      "#749F00",
      "#A99100",
      "#9C4A00",
      "#B30000",
    ]),
};

var viz = {
  // dimensions
  width: getSize().width,
  height: getSize().height - margin.t - margin.b,
  chartData: null,
  // axis
  xAxis: d3.axisBottom().scale(scale.x).tickFormat(d3.format(",d")),
  yAxis: d3.axisLeft().scale(scale.y),
  // tooltip
  tooltip: d3.select("body").append("div").attr("class", "tooltip"),
  // svg container
  svg: d3
    .select("#visualization")
    .append("svg")
    // FF does not allow resizing of the svg canvas
    // as a work around we can simply create a very large canvas
    // and then position the visualization with the correct width/height beased on the available screen space
    .attr("width", 10000)
    .attr("height", 10000)
    .on("mouseover", onVizMouseOver)
    .append("g")
    .attr("class", "partners")
    .attr("transform", "translate(" + margin.l + "," + margin.t + ")"),
};

/**
 * Initialize the visualization
 */
function initViz() {
  // Create x-axis and label objects.
  viz.svg
    .append("g")
    .attr("class", "x axis")
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", viz.width - margin.l - margin.r - 6)
    .attr("y", -6)
    .text("Global");

  // Add the y-axis and label objects.
  viz.svg
    .append("g")
    .attr("class", "y axis")
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("x", -6)
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Compliance %");

  // load the intial dataset
  loadData("data/one.json");
}

/**
 * Draw the visualization
 */
function drawViz() {
  var w = getSize().width - margin.t - margin.b;
  var h = getSize().height - margin.t - margin.b;
  var vw = w + margin.l + margin.r;
  var vh = h + margin.t + margin.b;
  var t = viz.svg.transition().duration(1500).ease(d3.easeExpOut);
  var partners;
  var p;

  // do nothing if there is no data
  if (!viz.chartData) {
    return;
  }

  // UPDATE the scales
  scale.x.range([0, w]);
  scale.y.range([h, 0]);

  viz.xAxis.tickSize(-h);
  viz.yAxis.tickSize(-w);

  // UPDATE x/y axis
  d3.select(".x.axis")
    .attr("transform", "translate(0," + h + ")")
    .call(viz.xAxis);

  t.select(".x.label").attr("x", w - 6);

  t.select(".y.axis").call(viz.yAxis);

  partners = viz.svg.selectAll(".partner").data(viz.chartData, function (d) {
    return getId(d);
  });

  // CREATE nodes for each partners
  p = partners
    .enter()
    .append("g")
    .attr("class", "partner")
    .attr("dspid", function (d) {
      return getId(d);
    })
    .on("mouseover", showTooltip)
    .on("mousemove", positionTooltip)
    .on("mouseout", hideTooltip)
    .call(position);

  // add a visible bubble
  p.append("circle")
    .attr("class", "bubble")
    .style("fill", function (d) {
      return scale.color(getC(d));
    })
    .attr("r", function (d) {
      return scale.r(getR(d));
    });

  // add the partner name
  p.append("text")
    .attr("dy", ".3em") // shift the text down a bit
    .style("text-anchor", "middle")
    .style("font-size", function (d) {
      return scale.pnmFontSize(getR(d)) + "px";
    })
    .style("fill", function (d) {
      return scale.lblcolor(getC(d));
    })
    .text(function (d) {
      return getShortNm(d);
    });

  // add a mask so we get clean mouse events
  p.append("circle")
    .attr("class", "mask")
    .attr("r", function (d) {
      return scale.r(getR(d));
    });

  // DELETE un-needed partner nodes
  partners.exit().remove();

  // UPDATE partner nodes that had been created previously
  partners.transition().duration(1500).ease(d3.easeExpOut).call(position);

  partners
    .select(".bubble")
    .attr("r", function (d) {
      return scale.r(getR(d));
    })
    .style("fill", function (d) {
      return scale.color(getC(d));
    });

  partners.select(".mask").attr("r", function (d) {
    return scale.r(getR(d));
  });

  partners
    .select("text")
    .style("font-size", function (d) {
      return scale.pnmFontSize(getR(d)) + "px";
    })
    .style("fill", function (d) {
      return scale.lblcolor(getC(d));
    })
    .text(function (d) {
      return getShortNm(d);
    });
}

/**
 * Load the data
 * @param {String} dataUrl ... local path to JSON data file
 */
function loadData(dataUrl) {
  d3.json(dataUrl).then(function (data) {
    viz.chartData = data;

    viz.chartData.sort(order);

    // calibrate the scale to ranges of data (sales and sla compliance)
    scale.x
      .domain(
        d3.extent(data, function (d) {
          return getX(d);
        })
      )
      .nice();
    scale.y
      .domain(
        d3.extent(data, function (d) {
          return getY(d);
        })
      )
      .nice();
    scale.r
      .domain(
        d3.extent(data, function (d) {
          return getR(d);
        })
      )
      .nice();
    scale.pnmFontSize
      .domain(
        d3.extent(data, function (d) {
          return getR(d);
        })
      )
      .nice();

    setVizSize();
    drawViz();
  });
}

/**
 * Positions the partner
 * @param {Object} p ... partner object
 */
function position(p) {
  p.attr("transform", function (d) {
    return "translate(" + scale.x(getX(d)) + "," + scale.y(getY(d)) + ")";
  });
}

/**
 * Handler for 'mouse over' on visualization
 */
function onVizMouseOver() {
  // reset the search input
  var searchInput = $("#search-input");
  searchInput.val(searchInput.data("original-value"));

  // unhighlight partner
  if (highlightedDspId !== "") {
    d3.select(".partner[dspid=" + highlightedDspId + "]").classed(
      "highlight",
      false
    );
  }

  // unfade partners
  d3.select(".partners").classed("faded", false);
}

/*
 * Display the tooltip
 * @param {Object} d ... partner data object
 */
function showTooltip(d) {
  var content;
  var fmt = d3.format(",");

  // highlight partner
  // show full Partner name
  d3.select(this).classed("highlight", true);

  // show the tooltip and set content
  viz.tooltip.style("visibility", "visible");
  viz.tooltip.transition().delay(200).style("opacity", 1);

  content =
    '<span class="title">' +
    getFullNm(d) +
    "</span>" +
    "<table>" +
    "<tr>" +
    '<td class="label">Catalog:</td>' +
    "<td>" +
    fmt(d.cat) +
    "</td>" +
    "</tr>" +
    "<tr>" +
    '<td class="label">Global:</td>' +
    "<td>" +
    fmt(d.s) +
    "</td>" +
    "</tr>" +
    "<tr>" +
    '<td class="label">Missed:</td>' +
    "<td>" +
    fmt(d.mis) +
    "</td>" +
    "</tr>" +
    "<tr>" +
    '<td class="label">Compliance(%):</td>' +
    "<td>" +
    fmt(d.cmp) +
    "</td>" +
    "</tr>" +
    "<tr>" +
    '<td class="label">Delivered:</td>' +
    "<td>" +
    fmt(d.t) +
    "</td>" +
    "</tr>" +
    "</table>";

  viz.tooltip.html(content);
}

/**
 * Position the tooltip
 */
function positionTooltip() {
  var w = getSize().width;
  var h = getSize().height;
  var tw = parseInt(viz.tooltip.style("width"));
  var th = parseInt(viz.tooltip.style("height"));
  var my = event.pageY;
  var mx = event.pageX;

   // determine how the tooltip should be positioned
  var posx = mx < w / 2 ? mx + 5 : mx - tw - 30;
  var posy = my < h / 2 ? my + 5 : my - th - 30;
 
  return viz.tooltip.style("top", posy + "px").style("left", posx + "px");
}

/**
 * Hide the tooltip
 */
function hideTooltip() {
  // undo the highlight effect
  d3.select(this).classed("highlight", false);
  // hide the tooltip
  viz.tooltip.style("opacity", 0);
  viz.tooltip.style("visibility", "hidden");
}

/**
 * Set the visualization container size
 */
function setVizSize() {
  var h = $(window).height() - $("#header-wrapper").height();

  $("#visualization").height(h);
}

/**
 * Return the size of the visualization container
 */
function getSize() {
  return {
    width: $("#visualization").width(),
    height: $("#visualization").height(),
  };
}

/**
 * Find a partner
 */
function doSearch() {
  var dspId = $("#search-input").val().toUpperCase();

  if (dspId !== "") {
    highlightedDspId = dspId;
    // highlight the partner
    d3.select(".partner[dspid=" + dspId + "]").classed("highlight", true);
    // fade other partners
    d3.select(".partners").classed("faded", true);
  }
}

/**
 * Resize visualization when browser window size changes
 */
$(window).resize(function () {
  setVizSize();
  drawViz();
});

/**
 * Handler for click event on data button
 */
$(".data-btn").on("click", function () {
  loadData($(this).find("input").attr("value"));
});

/**
 * Handler for click event on search button
 */
$("#search-btn").on("click", function () {
  doSearch();
});

/**
 * Handler for return even on search field
 */
$("#search-input").keypress(function (e) {
  if (e.which == 13) {
    doSearch();
    return false;
  }
});

$(document).ready(function () {
  initViz();
});
