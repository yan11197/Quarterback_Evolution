/*
 * Matrix - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data						-- the dataset 'household characteristics'
 */

// Note that a decent chunk of code was incorporated from
// https://gist.github.com/nbremer/21746a9668ffdf6d8242#file-radarchart-js
// but several changes had to be made in order for this to fit our project

Spider = function(_parentElement){
    this.parentElement = _parentElement;

    this.initVis();
};

Spider.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 45, right: 0, bottom: 25, left: 25};

    vis.width = $("#" + vis.parentElement).width();
    vis.height = $("#" + vis.parentElement).height();

    vis.cfg = {
        w: vis.width,				//Width of the circle
        h: vis.height,				//Height of the circle
        margin: vis.margin, //The margins of the SVG
        levels: 3,				//How many levels or inner circles should there be drawn
        maxValue: 0, 			//What is the value that the biggest circle will represent
        labelFactor: 1.1, 	//How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35, 	//The opacity of the area of the blob
        dotRadius: 4, 			//The size of the colored circles of each blog
        opacityCircles: 0.1, 	//The opacity of the circles of each blob
        strokeWidth: 2, 		//The width of the stroke around each blob
        roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
        color: d3.scaleOrdinal().range(["red", "green"]), //Color function
        format:'.0f'
    };

};

Spider.prototype.wrangleData = function(playerName, playerQBData) {
    var vis = this;

    // create a list of stats that we want to consider
    var spiderStats = ['rate', 'game_points', 'td', 'yds', 'att', 'cmp', 'int'];
    var spiderStatsLookup = {};

    for (var i = 0; i < spiderStats.length; i++) {
        var attr = spiderStats[i];

        // Get the index for them all
        spiderStatsLookup[attr] = i;
    }

    // Get the player and average stats
    var player_stats = [];
    var average_stats = [];

    // Get the extreme stats
    var best_stats = [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity];
    var worst_stats = [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity];

    // Create the general dictionary style
    var count = 0;

    for (key in spiderStatsLookup) {
        // Filling up the player_stats and average_stats
        var dict1 = {'axis' : 0, 'value': 0};
        var dict2 = {'axis' : 0, 'value': 0};

        dict1['axis'] = key;
        dict2['axis'] = key;

        player_stats.push(dict1);
        average_stats.push(dict2)
    }

    for (var j = 0; j < playerQBData.length; j++) {
        // Get the qb and the player data for the qb
        var qb = playerQBData[j][0];
        var playerData = playerQBData[j][1];

        // Update the average
        for (var i = 0; i < spiderStats.length; i++) {
            average_stats[i]['value'] += playerData[spiderStats[i]]*1.0;

            best_stats[i] = Math.max(playerData[spiderStats[i]]*1.0/playerData['count'], best_stats[i]);
            worst_stats[i] = Math.min(playerData[spiderStats[i]]*1.0/playerData['count'], worst_stats[i]);
        }

        if (qb === playerName) {
            for (var i = 0; i < spiderStats.length; i++) {
                player_stats[i]['value'] = playerData[spiderStats[i]]*1.0/playerData['count'];
            }
        }

        // Get the count
        count += playerData['count'];
    }

    for (var k = 0; k < average_stats.length; k++) {
        average_stats[k]['value'] = average_stats[k]['value']/count;
    }

    var norm_average_stats = [];
    var norm_player_stats = [];

    for (var i = 0; i < spiderStats.length; i++){
        var normed_avg_stat;
        var normed_player_stat;
        if (spiderStats[i] === "int"){
            normed_avg_stat = {axis: spiderStats[i], value: 1 - ((average_stats[i].value - worst_stats[i]) / (best_stats[i] - worst_stats[i]))};
            normed_player_stat = {axis: spiderStats[i], value: 1 - ((player_stats[i].value - worst_stats[i]) / (best_stats[i] - worst_stats[i]))};
        }
        else{
            normed_avg_stat = {axis: spiderStats[i], value: (average_stats[i].value - worst_stats[i]) / (best_stats[i] - worst_stats[i])};
            normed_player_stat = {axis: spiderStats[i], value: (player_stats[i].value - worst_stats[i]) / (best_stats[i] - worst_stats[i])};

        }
        norm_average_stats.push(normed_avg_stat);
        norm_player_stats.push(normed_player_stat);
    }

    // get the original spider data for the tooltip
    vis.spiderData = [average_stats, player_stats];

    // get the normed spider data so that we can correctly scale the spider plot
    vis.normSpiderData = [norm_average_stats, norm_player_stats];

    // get the best and the worst stats over the time period (for the tooltip creation)
    vis.best_stats = best_stats;
    vis.worst_stats = worst_stats;

    // get the names to display on the legend
    vis.names = ["Average Player", playerName.slice(0, playerName.lastIndexOf(".")-1)];

    vis.updateVis();
};



Spider.prototype.updateVis = function() {
    var vis = this;

    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    var maxValue = 1;

    var allAxis = ['QB Rating', 'Game Points', 'Touchdowns', 'Yards', 'Attempts', 'Completions', 'Interceptions'], //Names of each axis
        total = allAxis.length,					//The number of different axes
        radius = Math.min(vis.cfg.w/2, vis.cfg.h/2), 	//Radius of the outermost circle
        angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

    //Scale for the radius
    var rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);


    // create the svg and the g
    //Remove whatever chart with the same id/class was present before
    d3.select("#spider").select("svg").remove();

    //Initiate the radar chart SVG
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width",  vis.cfg.w + vis.cfg.margin.left + vis.cfg.margin.right)
        .attr("height", vis.cfg.h + vis.cfg.margin.top + vis.cfg.margin.bottom)
        .attr("class", "radar.spider");

    // Add the legend
    vis.makeLegendRadar();

    //Append a g element
    var g = vis.svg.append("g")
        .attr("transform", "translate(" + (vis.cfg.w/2 + vis.cfg.margin.left) + "," + (vis.cfg.h/2 + vis.cfg.margin.top) + ")");


    // add the glow on the areas
    //Filter for the outside glow
    var filter = g.append('defs').append('filter').attr('id','glow'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

    // create the circular grid
    //Wrapper for the grid & axes
    var axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    axisGrid.selectAll(".levels")
        .data(d3.range(1,(vis.cfg.levels+1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", function(d, i){return radius/vis.cfg.levels*d;})
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", vis.cfg.opacityCircles)
        .style("filter" , "url(#glow)");

    //Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1,(vis.cfg.levels+1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", function(d){return -d*radius/vis.cfg.levels;})
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#737373")
        .text(function(d,i) { if (d === vis.cfg.levels) {return "Best";} else {return ""}})


    // draw the axes
    //Create the straight lines radiating outward from the center
    var axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i){ return rScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("y2", function(d, i){ return rScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    //Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function(d, i){ return rScale(maxValue * vis.cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("y", function(d, i){ return rScale(maxValue * vis.cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
        .text(function(d){return d})
        .call(wrap, vis.cfg.wrapWidth);


    // draw the actual blobs for the radar chart
    //The radial line function
    var radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(function(d) { return rScale(d.value); })
        .angle(function(d,i) {	return i*angleSlice; });

    //Create a wrapper for the blobs
    var blobWrapper = g.selectAll(".radarWrapper")
        .data(vis.normSpiderData)
        .enter().append("g")
        .attr("class", "radarWrapper");


    //Append the backgrounds
    blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", function(d,i) { return radarLine(d); })
        .style("fill", function(d,i) { return vis.cfg.color(i); })
        .style("fill-opacity", vis.cfg.opacityArea)
        .on('mouseover', function (d,i){
            //Dim all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);
            //Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on('mouseout', function(){
            //Bring back all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", vis.cfg.opacityArea);
        });

    //Create the outlines
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function(d,i) { return radarLine(d); })
        .style("stroke-width", vis.cfg.strokeWidth + "px")
        .style("stroke", function(d,i) {return vis.cfg.color(i); })
        .style("fill", "none")
        .style("filter" , "url(#glow)");

    //Append the circles
    var colorCounter = 0;
    blobWrapper.selectAll(".radarCircle")
        .data(function(d, i){ return d; })
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", vis.cfg.dotRadius)
        .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
        .style("fill", function(d,i,j) {colorCounter++; if (colorCounter < allAxis.length + 1) {return vis.cfg.color(0)} else {return vis.cfg.color(1)};})
        .style("fill-opacity", 0.8);


    // add circles for tooltips
    //Wrapper for the invisible circles on top
    var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(vis.normSpiderData)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");

    //Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(function(d, i){ return d; })
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", vis.cfg.dotRadius*1.5)
        .attr("cx", function(d,i){return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(d,i,j) {
            var whichPlayer = 0;
            var compareValue = (vis.spiderData[whichPlayer][i].value - vis.worst_stats[i]) / (vis.best_stats[i] - vis.worst_stats[i]);
            if (vis.spiderData[whichPlayer][i].axis === "int"){
                compareValue = 1 - compareValue;
            }
            if (d.value !== compareValue){
                whichPlayer = 1;
            }
            var dataGrab = vis.spiderData[whichPlayer];
            newX =  parseFloat(d3.select(this).attr('cx')) - 15;
            newY =  parseFloat(d3.select(this).attr('cy')) - 10;
            tooltip
                .attr('x', newX)
                .attr('y', newY)
                .text(d3.format(",.2f")(dataGrab[i].value))
                .style('font-size', 11)
                .transition().duration(200)
                .style('opacity', 1);
        })
        .on("mouseout", function(){
            tooltip.transition().duration(200)
                .style("opacity", 0);
        });

    //Set up the small tooltip for when you hover over a circle
    var tooltip = g.append("text")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // helper function
    //Taken from http://bl.ocks.org/mbostock/7555321
    //Wraps SVG text
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.4, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }

};

Spider.prototype.makeLegendRadar = function() {
    var vis = this;

    // Adding the circles
    var spider_circle = vis.svg.selectAll('.spider_circle')
        .data([vis.names[1], vis.names[0]]);

    spider_circle.enter().append("circle")
        .attr("cx", 50)
        .attr("class", "spider_circle")
        .merge(spider_circle)
        .attr("cy",  function(d, index) {return 50 + index*20})
        .attr("r", 5)
        .attr("fill", function(d) {
            if (d === 'Average Player') {return 'red'}
            else {return 'green'}
        });

    spider_circle.exit().remove();

    // Adding the text
    var spider_label = vis.svg.selectAll('.spider_label')
        .data([vis.names[1], vis.names[0]]);

    spider_label.enter().append("text")
        .attr("x", 57)
        .attr("class", "spider_label")
        .merge(spider_label)
        .attr("y",  function(d, index) {return 50 + index*20})
        .attr("dy", ".35em")
        .style("font-size", 10)
        .text(function(d){return d});

    spider_label.exit().remove()
}




