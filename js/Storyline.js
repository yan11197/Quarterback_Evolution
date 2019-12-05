Storyline = function(_parentElement, _eventData, _filteredData){
    this.parentElement = _parentElement;
    this.eventData = _eventData;
    this.filteredData = _filteredData;
    this.clicker = -1;

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
};

Storyline.prototype.initStoryline = function() {
    var vis = this;

    // Date parsers
    vis.parseYear = d3.timeParse("%Y");
    vis.parseMonth = d3.timeParse("%m-%Y")

    // Create list of years
    vis.years = [];
    for (var i = 0; i < vis.filteredData.length; i++) {
        vis.years.push(vis.filteredData[i]['year'])
    }

    // Get the year's range
    var range_year = d3.extent(vis.years)

    //Create Scale
    vis.x = d3.scaleTime()
        .domain([vis.parseYear(range_year[1] + 1), vis.parseYear(range_year[0])])
        .rangeRound([vis.width, 0]);

    // Add Ticks
    vis.svg.append("g")
        .attr("class", "axis axis--grid")
        .call(d3.axisTop(vis.x)
        .ticks(20)
        .tickSize(-vis.height));

    vis.populateStoryline();
};


Storyline.prototype.populateStoryline = function() {
    var vis = this;

    // Getting all the data
    vis.events = vis.svg.selectAll().data(vis.eventData)

    // Color
    fill_color = {
        Rule : "red",
        Record : "green"
    };

    // Radius
    vis.r = 7;

    // Adding the lines
    vis.events.enter().append('rect')
        .attr("class", function(d, i) {return "event_line " + "item_" + i + " line_" + i})
        .attr("x", function(d) {
            var v = yearCount[d['Year']]
            return vis.x(vis.parseMonth(1+12/(v+1) * d['count'] + '-' + d['Year']))})
        .attr("y", 0)
        .attr("width", 3)
        .attr("height", vis.height/2)
        .attr("fill", function(d) {return fill_color[d['Category']]})
        .on("mouseover", function(d, i) {
            // d3.selectAll('.item_' + i).attr("fill", "#2E86C1")
        })
        .on("mouseout", function(d, i) {
            // d3.selectAll('.item_' + i).attr("fill", function(d) {return fill_color[d['Category']]})
        });

    // Adding the circles
    vis.events.enter().append('circle')
        .attr("class", function(d, i) {return "event_circle " + "item_" + i + " circle_" + i})
        .attr("cx", function(d) {
            var v = yearCount[d['Year']]
            return vis.x(vis.parseMonth(1+12/(v+1) * d['count'] + '-' + d['Year']))})
        .attr("cy", vis.height/2 - vis.r/2)
        .attr("r", vis.r)
        .attr("fill", function(d) {return fill_color[d['Category']]})
        .on("mouseover", function(d, i) {
            // d3.selectAll('.item_' + i).attr("fill", "#2E86C1")
        })
        .on("mouseout", function(d, i) {
            // d3.selectAll('.item_' + i).attr("fill", function(d) {return fill_color[d['Category']]})
        });

    vis.updateVis()
};

Storyline.prototype.updateVis = function() {
    var vis = this;

    vis.svg.selectAll('.event_line, .event_circle')
        .on("click", function(d) {
            var index = d['index'];
            var old_index = vis.clicker;
            vis.clicker = index;

            if (old_index >= 0) {
                // Adding the rect
                var old_event_rect = vis.svg.selectAll(".line_" + old_index);

                old_event_rect.enter().append("rect")
                    .merge(old_event_rect)
                    .transition().duration(400)
                    .attr("height", vis.height/2)

                old_event_rect.exit().remove();

                // Adding the dots
                var old_event_circ = vis.svg.selectAll(".circle_" + old_index);

                old_event_circ.enter().append("circle")
                    .merge(old_event_circ)
                    .transition().duration(400)
                    .attr("cy", vis.height/2 - vis.r/2)

                old_event_circ.exit().remove();
            }

            // Adding the rect
            var event_rect = vis.svg.selectAll(".line_" + index);

            event_rect.enter().append("rect")
                .merge(event_rect)
                .transition().duration(400)
                .attr("height", vis.height)

            event_rect.exit().remove();

            // Adding the dots
            var event_circ = vis.svg.selectAll(".circle_" + index);

            event_circ.enter().append("circle")
                .merge(event_circ)
                .transition().duration(400)
                .attr("cy", vis.height - vis.r/2)
                .attr("r", vis.r)

            event_circ.exit().remove();

            // Updating the image and the text
            document.getElementById("story_img").src = d['Square_Image']
            document.getElementById("story_title").innerHTML = d['Title']
            document.getElementById("story_desc").innerHTML = d['Description']
        })
};
