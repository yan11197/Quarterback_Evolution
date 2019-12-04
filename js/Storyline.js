Storyline = function(_parentElement, _eventData, _filteredData){
    this.parentElement = _parentElement;
    this.eventData = _eventData;
    this.filteredData = _filteredData

    this.initVis();
};

Storyline.prototype.initVis = function() {
    var vis = this;


    // Create SVG
    vis.margin = {top: 30, right: 30, bottom: 30, left: 30},
        vis.width = $("#storyline").width() - vis.margin.left - vis.margin.right,
        vis.height = $("#storyline").height() - vis.margin.top - vis.margin.bottom;

    console.log(vis.width, vis.height)

    // Create the timeline
    vis.svg = d3.select("#storyline").append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.initStoryline()
}

Storyline.prototype.initStoryline = function() {
    var vis = this;

    vis.parseYear = d3.timeParse("%Y");


    //var parseDate = d3.timeParse()


    // Create list of years
    vis.years = [];

    for (var i = 0; i < vis.filteredData.length; i++) {
        vis.years.push(vis.filteredData[i]['year'])
    }

    var range_year = d3.extent(vis.years)


    //Create Scale
    vis.x = d3.scaleTime()
        .domain([vis.parseYear(range_year[1]), vis.parseYear(range_year[0])])
        .rangeRound([vis.width, 0]);


    // Add Ticks
    vis.svg.append("g")
        .attr("class", "axis")
        .call(d3.axisTop(vis.x));
            // .ticks(20)
            // .tickSize(-vis.width)
            // .tickFormat(function (d) {
            //     return d;
            // }));

    vis.populateStoryline();
};



Storyline.prototype.populateStoryline = function() {
    var vis = this

    vis.events = vis.svg.selectAll().data(vis.eventData)

    fill_color = {
        Rule : "red",
        Record : "green"
    };

    var r = 15

    vis.events.enter().append('rect')
        .attr("class", function(d, i) {return "event_line " + "item_" + i})
        .attr("x", function(d) {return vis.x(vis.parseYear(d['Year']))})
        .attr("y", 0)
        .attr("width", 3)
        .attr("height", vis.height/2)
        .attr("fill", function(d) {return fill_color[d['Category']]})

    vis.events.enter().append('circle')
        .attr("class", function(d, i) {return "event_circle " + "item_" + i})
        .attr("cx", function(d) {return vis.x(vis.parseYear(d['Year']))})
        .attr("cy", vis.height/2 - r/2)
        .attr("r", r)
        .attr("fill", function(d) {return fill_color[d['Category']]})
        .on("mouseover", function(d, i) {
            d3.selectAll('.item_' + i).attr("fill", "blue")
        })
        .on("mouseout", function(d, i) {
            d3.selectAll('.item_' + i).attr("fill", function(d) {return fill_color[d['Category']]})
        })



};