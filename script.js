var data = [
  {
    category: 'Using less water, energy or fuel',
    stats: [0.22,0.37,0.44,0.45]
  },
  {
    category: 'Buying cheaper products',
    stats: [0.36,0.43,0.50,0.49]
  },
  {
    category: 'Using free transport',
    stats: [0.26,0.27,0.26,0.21]
  },
  {
    category: 'Buying less food and essentials',
    stats: [0.21,0.26,0.35,0.31]
  },
  {
    category: 'Looking for a better-paying job',
    stats: [0.16,0.12,0.12,0.10]
  }
];

var ids = ['jan22', 'may22', 'sept22', 'jan23'];
var monthNames = ['Jan 2022', 'May 2022', 'Sept 2022', 'Jan 2023'];

// Populate the categoeries checkboxes
d3.select('.categories').selectAll('.checkbox')
  .data(ids)
  .enter()
  .append('div')
  .attr('class', 'checkbox')
  .append('label').html(function(id, index) {
    var checkbox = '<input id="' + id + '" type="checkbox" class="category">';
    return checkbox + monthNames[index];
  });

// Declare variables
var margin = {top: 40, right: 20, bottom: 30, left: 220},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// The scale for the percentage value of sample population
var x = d3.scale.linear().range([0, width]);

// The scale for each category
var y0 = d3.scale.ordinal().rangeBands([0, height], .1);
// The scale for each category's percentage value
var y1 = d3.scale.ordinal();

// The scale of colors
var color = d3.scale.ordinal()
    .range(["#001181", "#FFC900", "#D287FF", "#DBE4FF"]);

// Adapted from https://stackoverflow.com/questions/10201841/display-y-axis-as-percentages
var formatPercent = d3.format(".0%");

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(formatPercent);

var yAxis = d3.svg.axis()
    .scale(y0)
    .orient("left");

var svg = d3.select(".graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.select('.categories').selectAll('.category').on('change', function() {
  var x = d3.select('.categories').selectAll('.category:checked');
  var ids = x[0].map(function(category) {
    return category.id;
  });
  updateGraph(ids);
});
renderGraph();

function renderGraph() {
  x.domain([0, 0]);
  
  // y0 domain is all the category names
  y0.domain(data.map(function(d) { return d.category; }));
  // y1 domain is all the month names, we limit the range to from 0 to a y0 band
  y1.domain(monthNames).rangeRoundBands([0, y0.rangeBand()]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
}

function updateGraph(selectedIds) {
  var categoriesData = data.map(function(categoryData) {
    return {
      category: categoryData.category,
      months: selectedIds.map(function(selectedId) {
        var index = ids.findIndex(function(id) {
          return selectedId === id;
        });
        return {
          id: ids[index],
          name: monthNames[index],
          value: categoryData.stats[index]
        };
      })
    }
  });

  // x domain is between 0 and the maximun value in any months.value
  x.domain([0, d3.max(categoriesData, function(d) { return d3.max(d.months, function(d) { return d.value }); })]);
  
  // y0 domain is all the category names
  y0.domain(categoriesData.map(function(d) { return d.category; }));
  // y1 domain is all the month names, we limit the range to from 0 to a y0 band
  y1.domain(ids).rangeRoundBands([0, y0.rangeBand()]);

  svg.selectAll('.axis.x').call(xAxis);
  svg.selectAll('.axis.y').call(yAxis);

  var category = svg.selectAll(".category")
    .data(categoriesData);
  category.enter().append("g")
    .attr("class", "category")
    .attr("transform", function(d) { return "translate(0, " + y0(d.category) + ")"; });

  var month = category.selectAll("rect")
    .data(function(d) { return d.months; });
  // Append a new rect every time we have an extra data vs dom element
  month.enter().append("rect")
    .attr('width', 0);
  // These updates will happen either inserting new elements or updating them
  month
    .attr("x", 0)
    .attr("y", function(d, index) { return y1(ids[index]); })
    .attr("id", function(d) { return d.id; })
    .style("fill", function(d) { return color(d.name); })
    .text(function(d) { return d.name })
    .transition()
    .attr("width", function(d) { return x(d.value); })
    .attr("height", y1.rangeBand());
  month.exit().transition().attr("width", 0).remove();

  var legend = svg.selectAll(".legend")
      .data(categoriesData[0].months.map(function(month) { return month.name; }));
  legend.enter().append("g");
  legend
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + (200 + i * 20) + ")"; });

  var legendColor = legend.selectAll('.legend-color').data(function(d) { return [d]; });
  legendColor.enter().append("rect");
  legendColor
    .attr('class', 'legend-color')
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

  var legendText = legend.selectAll('.legend-text').data(function(d) { return [d]; });;
  legendText.enter().append("text");
  legendText
    .attr('class', 'legend-text')
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function(d) { return d; });

  legend.exit().remove();
}

// Add title of the grouped bar chart
// Adapted from http://www.d3noob.org/2013/01/adding-title-to-your-d3js-graph.html
svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("font-weight", "bold")  
        .text("Several ways Londoners tackle the cost-of-living crisis");