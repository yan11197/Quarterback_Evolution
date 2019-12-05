Timeline = function(_parentElement, _filteredData){
    this.parentElement = _parentElement;
    this.filteredData = _filteredData;

    this.initVis();
};

Timeline.prototype.initVis = function() {
    var vis = this;

    var window_width = $(".timeline").width()
    var window_height = $(".timeline").height() - $(".h5_title").height() - 20

    // Create SVG
    vis.margin = {top: 40, right: 40, bottom: 40, left: 40},
        vis.width = window_width - vis.margin.left - vis.margin.right,
        vis.height = window_height - vis.margin.top - vis.margin.bottom;

    // Create list of years
    vis.years = [];

    for (var i = 0; i < vis.filteredData.length; i++) {
        vis.years.push(vis.filteredData[i]['year'])
    }

    var range_year = d3.extent(vis.years)

    //Create Scale
    vis.x = d3.scaleLinear()
        .domain([range_year[1], range_year[0]])
        .rangeRound([vis.height, 0]);

    // Create the timeline
    vis.svg = d3.select(".timeline").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Add Ticks
    vis.svg.append("g")
        .attr("class", "axis axis--grid")
        .attr("transform", "translate(" + vis.width + ",0)")
        .call(d3.axisRight(vis.x)
        .ticks(20)
        .tickSize(-vis.width)
        .tickFormat(function (d) {
            return d;
        }))
        .on('mouseover', function (d) {
            // console.log(d)
        });

    // Call it
    vis.svg.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", "translate(" + vis.width + ",0)")
        .call(d3.axisRight(vis.x)
            .ticks(vis.years)
            .tickPadding(0))
        .attr("text-anchor", null)
        .selectAll("text")
        .attr("y", 6);

    // Add the brush
    vis.svg.append("g")
        .attr("class", "brush timeline_legend")
        .call(d3.brushY()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("end", brushended));

    //Create brushed function
    function brushended() {
        if (!d3.event.sourceEvent) return; // Only transition after input.
        if (!d3.event.selection) return; // Ignore empty selections.
        var d0 = d3.event.selection.map(vis.x.invert),
            d1 = [math.floor(d0[0]), math.ceil(d0[1])]

        Slider.wrangleData(d1[0]-1996,d1[1]-1996)
        ScatterOverTime.wrangleData(d1[0], d1[1])
        StatsOverTime.updateVis(d1[0], d1[1])


        d3.select(this).transition().call(d3.event.target.move, d1.map(vis.x));
     }
};
