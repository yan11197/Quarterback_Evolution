/*
 * Matrix - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data						-- the dataset 'household characteristics'
 */

StatsOverTime = function(_parentElement, _filteredData, _byYearQBData, _byPlayerQBData){
    this.parentElement = _parentElement;
    this.filteredData = _filteredData;
    this.byYearQBData = _byYearQBData;
    this.byPlayerQBData = _byPlayerQBData;
    this.transition_count = 0;
    this.year1 = 1996;
    this.year2 = 2016;
    this.mouseclick = 0;

    this.initVis();
};

StatsOverTime.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 40, right: 30, bottom: 15, left: 35};


    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

    // Creating the svg
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height +  vis.margin.top + vis.margin.bottom)
        .attr("class", "StatsOverTime_svg");

    // Initialize the scales
    vis.x = d3.scaleLinear()
        .range([vis.margin.left, vis.width - vis.margin.right]);

    vis.y = d3.scaleLinear()
        .range([vis.height, vis.margin.top]);

    // Initialize the axis
    vis.xAxis= d3.axisBottom()
        .tickFormat(d3.format("d"))
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    // Adding the y axis legend
    vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .merge(vis.svg.select(".y_label"))
        .attr("class", 'y_label')
        .attr("y", -2)
        .attr("x",0 - (vis.height / 2))
        .attr("dy", "1em")
        .style("font-size", 12)
        .style("text-anchor", "middle");

    // Adding the x axis legend
    vis.svg.append("text")
        .attr("class", "x_label")
        .attr("transform",
            "translate(" + ((vis.width + vis.margin.left + vis.margin.right)/2) + " ," +
                          (vis.height + vis.margin.top + 5) + ")")
        .style("text-anchor", "middle")
        .style("font-size", 12);

    // Adding the legend
    vis.svg.append("text")
        .attr("class", "title")
        .attr("transform", "translate(" + ((vis.width + vis.margin.left + vis.margin.right)/2) +
                                            " ," + (vis.margin.top ) + ")")
        .style("text-anchor", "middle")
        .style("font-size", 12);

    // Append the axis to the svg
    vis.svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y_axis")
        .attr("transform", "translate(" + vis.margin.left + ", 0)");

    // (Filter, aggregate, modify data)
    vis.wrangleData();
};

StatsOverTime.prototype.wrangleData = function() {
    var vis = this;

    vis.updateVis(vis.year1, vis.year2);
};


StatsOverTime.prototype.updateVis = function(year1, year2) {
    var vis = this;

    if (year1 === 0) {year1 = vis.year1; year2 = vis.year2}
    else {vis.year1 = year1; vis.year2 = year2}

    // Making on click do nothing
    vis.clickCounter = 0;
    vis.svg.on("click", function(d) {});

    // Making the average line opaque
    vis.svg.selectAll(".year_average")
        .transition().duration(300)
        .style("opacity", 0);

    // Getting the statistic of focus
    var Stat = d3.select("#stats_over_time_filter").property("value");

    // Getting the x scale domain
    vis.x.domain([year1, year2]);

    // Get the correct number of ticks
    var yearTicks = Math.min(10, year2-year1)

    // Calling the x scale on the xAxis
    vis.xAxis
        .ticks(yearTicks)
        .tickFormat(function(d) {return d});

    vis.svg.select(".x_axis")
        .transition().duration(vis.transition_count)
        .call(vis.xAxis);

    // Getting the y scale domain
    var y_max;

    if (Stat === 'int') {y_max = 5;}
    else if (Stat === 'td') {y_max = 7;}
    else if (Stat === 'game_points') {y_max = 60}
    else {y_max = d3.max(vis.filteredData, function(d) {
            var val = d[Stat]['best'][0];
            return (val + val*.4)})}

    vis.y.domain([0, y_max]);

    // Calling the y scale on the yAxis
    vis.svg.select(".y_axis")
        .transition().duration(vis.transition_count)
        .call(vis.yAxis);

    // Getting the correct y label
    var y_label_d = {
        'att' : 'Attempts',
        'cmp' : 'Completions',
        'td' : 'Touchdowns',
        'int' : 'Interceptions',
        'rate' : 'Quarterback Rating',
        'game_points' : 'Game Points'
    }

    // Adding the y label
    vis.svg.select('.y_label')
        .text(y_label_d[Stat])
        .style("font-size", 12);

    // Adding the x label
    vis.svg.select('.x_label')
        .text('Year')
        .style("font-size", 12);

    // Adding the title
    vis.svg.select('.title')
        .text(' ')
        .style("font-size", 12);

    // Adding the shading function
    var shading_function = d3.area()
        .defined(function(d) {
            return d['year'] >= year1 && d['year'] <= year2;
        })
        .x(function(d) {return vis.x(d['year']) + 1 })
        .y0(function(d) {
            var val = d[Stat]['average'][0] - d[Stat]['std'];
            return vis.y(val) })
        .y1(function(d) {
            var val = d[Stat]['average'][0] + d[Stat]['std'];
            return vis.y(val) });

    // Adding the shaded region
    var shaded = vis.svg.selectAll(".shaded")
        .data(vis.filteredData);

    shaded.enter().append("path")
        .merge(shaded)
        .transition().duration(vis.transition_count)
        .attr("class", "data1 shaded")
        .attr("fill", "grey")
        .attr("fill-opacity", .1)
        .style("opacity", .2)
        .attr("d", shading_function(vis.filteredData));

    shaded.exit().remove();

    function insert_line(Line_class, Circle_class, worst_average_best, t) {
        // Preparing color
        var color;
        var color2;

        if (worst_average_best === 'average') {
            color = 'black';
            color2 = 'black'}
        else {
            if ((Stat === 'int' && worst_average_best === 'best') || (Stat !== 'int' && worst_average_best === 'worst')) {
                color = 'red'
                color2 = 'red'
            } else {
                color = 'green'
                color2 = 'green'
            }
        }

        // Adding the average line
        var line_function = d3.line()
            .defined(function(d) {
                return d['year'] >= year1 && d['year'] <= year2;
            })
            .x(function(d) { return vis.x((d['year'])); })
            .y(function(d) { return vis.y(d[Stat][worst_average_best][0]); })
            .curve(d3.curveCatmullRom.alpha(0.5));

        // Entering the average line
        var line = vis.svg.selectAll("." + Line_class)
            .data(vis.filteredData);

        var line_width = 3
        if (worst_average_best === 'average') {line_width = 2}

        line.enter().append("path")
            .datum(vis.filteredData)
            .merge(line)
            .transition().duration(t)
            .attr("class", "data1 line " + Line_class)
            .attr("fill", "none")
            .attr("stroke", color)
            .style("stroke-width", line_width)
            .style("opacity", 1)
            .attr("d", line_function(vis.filteredData));

        line.exit().remove();

        // Entering the average circles
        var points = vis.svg.selectAll("." + Circle_class)
            .data(vis.filteredData.slice(year1-1996, year2-1996+1));

        if (color === 'black') {
            points.style("opacity", 0)
                .transition().duration(700);
            points.enter().append("circle")
                .style("opacity", 0)
                .attr("class", "circle " + Circle_class)
                .merge(points)
                .transition().duration(t)
                .attr("cx", function(d) { return vis.x((d['year'])); })
                .attr("cy", function(d) { return vis.y(d[Stat][worst_average_best][0]); })
                .style("stroke", "white")
                .style("stroke-width", 2)
                .attr("r", 0)
                .style("fill", color2);
        } else {
            points.enter().append("circle")
                .attr("class", "data1 circle " + Circle_class)
                .merge(points)
                .transition().duration(t)
                .attr("cx", function(d) { return vis.x((d['year'])); })
                .attr("cy", function(d) { return vis.y(d[Stat][worst_average_best][0]); })
                .style("stroke", "white")
                .style("stroke-width", 2)
                .attr("r", 6)
                .style("fill", color2)
                .style("opacity", 1);
        }

        points.exit().remove();
    }

    insert_line("average_line", "average_circle", "average", vis.transition_count);
    insert_line("best_line", "best_circle", "best", vis.transition_count);
    insert_line("worst_line", "worst_circle", "worst", vis.transition_count);

    // Creating the tooltip and opacity combo
    function tool_tip_best_worst(d, x_y, best_worst) {

        // Updating the opacity
        vis.svg.selectAll(".best_circle, .worst_circle").style("opacity", 0);
        vis.svg.selectAll(".best_line, .worst_line, .average_line").style("opacity", .01);
        vis.svg.selectAll(".shaded").style("opacity", .02);

        // To split the name to only get the full name
        var qb = d[Stat][best_worst][1];
        var qb_name = qb.slice(0, qb.lastIndexOf(".")-1);

        // Getting the statistics
        var qb_stats = vis.byYearQBData[d['year']-1996][qb];
        var att = qb_stats['att']/qb_stats['count'];
        att = att.toFixed(2);

        var cmp = qb_stats['cmp']/qb_stats['count'];
        cmp = cmp.toFixed(2);

        var td = qb_stats['td']/qb_stats['count'].toFixed(2);
        td = td.toFixed(2);

        var int = qb_stats['int']/qb_stats['count'].toFixed(2);
        int = int.toFixed(2);

        // Return
        var qb_tip_stats = [qb_name, 'Attempts: ' + att, 'Completions: ' + cmp,
            'Touchdowns: ' + td, 'Interceptions : ' + int];

        // Setting the x axis so doesn't get cut off
        x_y[0] = Math.max(x_y[0], vis.margin.left*2.6);
        x_y[0] = Math.min(x_y[0], vis.width - vis.margin.right * 2.5);

        // Tooltip above
        for (var i = 0; i < qb_tip_stats.length; i++) {
            vis.svg.append("text")
                .attr("class", "tooltip_text")
                .attr("x", x_y[0])
                .attr("y", x_y[1] - (qb_tip_stats.length - i) * 18 + 2)
                .attr("font-size", 12)
                .attr("text-anchor", "middle")
                .attr("font-weight", function (d) {
                    if (i === 0) {
                        return "bold"
                    } else {
                        return "regular"
                    }
                })
                .html(qb_tip_stats[i])
        }
    }

    vis.svg.selectAll(".best_circle")
        .on('mouseover', function(d) {
            // Getting the position
            var x_y = d3.mouse(this)

            // Updating the tool tip
            tool_tip_best_worst(d, x_y, 'best');

            // Ensuring the one we're on remains red and with high opacity
            d3.select(this).style("fill", "#2E86C1").style("opacity", 1);

            vis.mouseclick = 0
        })
        .on('click', function(d) {
            vis.mouseclick = 1;

            // Removing the text
            var text = vis.svg.selectAll(".tooltip_text")
            text.remove()

            vis.makeLegend(0)
            vis.svg.selectAll(".average_line").style("opacity", 1)
            vis.updateClick(d, Stat, true, year1, year2)});

    vis.svg.selectAll(".worst_circle")
        .on('mouseover', function(d) {
            // Getting the position
            var x_y = d3.mouse(this)

            // Updating the tool tip
            tool_tip_best_worst(d, x_y, 'worst');

            // Ensuring the one we're on remains red and with high opacity
            d3.select(this).style("fill", "#2E86C1").style("opacity", 1);

            vis.mouseclick = 0
        })
        .on('click', function(d) {
            vis.mouseclick = 1;

            // Removing the text
            var text = vis.svg.selectAll(".tooltip_text")
            text.remove()

            // Updating the vis
            vis.makeLegend(0)
            vis.svg.selectAll(".average_line").style("opacity", 1)
            vis.updateClick(d, Stat, false, year1, year2)});

    vis.svg.selectAll(".best_circle, .worst_circle")
        .on('mouseout', function(d) {
            // Only if havn't clicked
            if (vis.mouseclick === 0) {
                // Getting all the points
                var best_points = vis.svg.selectAll(".best_circle")
                var worst_points = vis.svg.selectAll(".worst_circle")

                // Ensuring that it is the correct color and opacity
                best_points
                    .style("fill", "green")
                    .style("opacity", 1);

                // Ensuring that it is the correct color and opacity
                worst_points
                    .style("fill", "red")
                    .style("opacity", 1);

                // Updating the opacity
                vis.svg.selectAll(".best_line, .worst_line, .average_line").style("opacity", 1);
                vis.svg.selectAll(".shaded").style("opacity", .3);

                // Removing the text
                var text = vis.svg.selectAll(".tooltip_text")
                text.remove()
            }
        });

    vis.svg.selectAll(".average_circle")
        .on('mouseover', function(d) {})

    // Update legend to normal vis
    vis.makeLegend(1);

    vis.transition_count = 800
};

StatsOverTime.prototype.updateClick = function(d, Stat, best_worst, year1, year2) {
    var vis = this;

    // Removing the tool tips
    d3.select(".d3-tip.n").remove();

    // Making on click return to update
    vis.svg.on("click", function(d) {
        vis.clickCounter += 1;
        if (vis.clickCounter === 2) {
            vis.clickCounter = 0;

            vis.updateVis(year1, year2)
            vis.makeLegend(1)
        }});

    // Making it all opaque
    vis.svg.selectAll('.data1')
        .transition()
        .duration(700)
        .ease(d3.easeLinear)
        .style("opacity", 0);

    // Getting the qb who's stats we want to collect
    var qb;
    var qb_stat_list = [];
    var y_max = 0;

    if (best_worst === true) {qb = d[Stat]['best'][1]}
    else {qb = d[Stat]['worst'][1]}

    // Getting the actual qb stats for that season
    var qb_stats = vis.byPlayerQBData[d['year'] - 1996][qb];
    for (var i = 0; i < qb_stats.length; i++) {
        var s = +qb_stats[i][Stat];

        // Setting the maximum and adding to the list
        if (s > y_max) {y_max = s}
        qb_stat_list.push([s, i])
    }

    // Adding the x axis
    vis.svg.select('.x_label')
        .text("Game Number")
        .style("font-size", 12);

    // Adding the title
    vis.svg.select('.title')
        .text(qb.slice(0, qb.lastIndexOf(".")-1) + ', ' + d['year'])
        .style("font-size", 12);

    // Getting the x scale domain
    vis.x.domain([0, qb_stats.length - 1]);

    // Calling the x scale on the xAxis
    var ticknumber = Math.min(10, qb_stat_list.length)

    vis.xAxis
        .ticks(ticknumber)
        .tickFormat(function(d) {return d+1})

    vis.svg.select(".x_axis")
        .transition().duration(1000)
        .attr("ticks", 5)
        .call(vis.xAxis);

    // Adding the per game line
    var line_function = d3.line()
        .x(function(d) { return vis.x((d[1])); })
        .y(function(d) { return vis.y(d[0]); })
        .curve(d3.curveCatmullRom.alpha(0.5));

    // Entering the per game line
    var line = vis.svg.selectAll(".average_line")
        .data(vis.filteredData);

    line.enter().append("path")
        .datum(qb_stat_list)
        .merge(line)
        .transition().duration(1000)
        .attr("class", "average_line")
        .attr("stroke", "#2E86C1")
        .style("stroke-width", 3)
        .attr("fill", "none")
        .attr("d", line_function(qb_stat_list));

    line.exit().remove();

    // Entering the average line
    var average_val = d[Stat]['average'][0]
    var year_line_function = d3.line()
        .x(function(d) { return vis.x((d[1])); })
        .y(function(d) {return vis.y(average_val); });

    var year_line = vis.svg.selectAll(".year_average")
        .data(vis.filteredData);

    year_line.enter().append("path")
        .datum(qb_stat_list)
        .merge(year_line)
        .attr("class", "year_average")
        .attr("stroke", "grey")
        .style("stroke-dasharray", ("3, 3"))
        .style("opacity", 1)
        .style("stroke-width", 3.5)
        .attr("d", year_line_function(qb_stat_list));

    year_line.exit().remove();

    // Entering the average circles
    var points = vis.svg.selectAll(".average_circle")
        .data(qb_stat_list);

    points.enter().append("circle")
        .attr("class", "circle average_circle")
        .merge(points)
        .transition().duration(1000)
        .style("opacity", 0)
        .attr("cx", function(d) { return vis.x(d[1]); })
        .attr("cy", function(d) { return vis.y(d[0]); })
        .attr("r", 6)
        .style("fill", "#2E86C1")
        .style("stroke", "white")
        .style("stroke-width", 2)
        .style("opacity", 1);

    points.exit().remove();

    // Removing the tooltips
    vis.svg.selectAll(".circle")
        .on('mouseover', function(d) {});

    // Creating the tooltip and opacity combo
    function tool_tip_focus(d, x_y) {

        // Updating the opacity
        vis.svg.selectAll(".average_line, .average_circle, .year_average").style("opacity", .01);

        // Get the text
        var s_qb_stats = qb_stats[d[1]]
        var qb_tip_stats = ['Attempts: ' + s_qb_stats['att'], 'Completions: ' + s_qb_stats['cmp'],
            'Touchdowns: ' + s_qb_stats['td'], 'Interceptions : ' + s_qb_stats['int']];

        // Setting the x axis so doesn't get cut off
        x_y[0] = Math.max(x_y[0], vis.margin.left*2.6);
        x_y[0] = Math.min(x_y[0], vis.width - vis.margin.right * 2.5);

        // Tooltip above
        for (var i = 0; i < qb_tip_stats.length; i++) {
            vis.svg.append("text")
                .attr("class", "tooltip_text")
                .attr("x", x_y[0])
                .attr("y", x_y[1] - (qb_tip_stats.length - i) * 18 + 2)
                .attr("font-size", 12)
                .attr("text-anchor", "middle")
                .html(qb_tip_stats[i])
        }
    }

    vis.svg.selectAll(".average_circle")
        .on('mouseover', function(d) {
            // Getting the position
            var x_y = d3.mouse(this)

            // Updating the tool tip
            tool_tip_focus(d, x_y, 'best');

            // Ensuring the one we're on remains blue and with high opacity
            d3.select(this).style("fill", "#2E86C1").style("opacity", 1);
        })
        .on('mouseout', function(d) {
            // Getting all the right opacity
            vis.svg.selectAll(".average_circle").style("opacity", 1).style("fill", "#2E86C1")
            vis.svg.selectAll(".average_line").style("opacity", 1)
            vis.svg.selectAll(".year_average").style("opacity", .3);

            // Removing the text
            var text = vis.svg.selectAll(".tooltip_text")
            text.remove()
        })
        .on('click', function(d) {
            // Removing the text
            var text = vis.svg.selectAll(".tooltip_text")
            text.remove()
        });

    // Updating the transition time
    vis.transition_count = 800
};

StatsOverTime.prototype.makeLegend = function(leg_num) {
    var vis = this;

    var circle_data;
    var rect_data;

    if (leg_num === 1) {
        circle_data = [['green', 'Best QB', 1], ['red', 'Worst QB', 1]]
        rect_data = [['black', 'Average', 1], ['grey', '1 STD DV', 1]]
    } else {
        circle_data = [['green', 'Best QB', 0], ['#2E86C1', 'Game Stat', 1]]
        rect_data = [['grey', 'Year Average', 1], ['grey', '1 STD DV', 0]]
    }

    // Adding the circle

    var circle = vis.svg.selectAll('.circle_legend')
        .data(circle_data);

    circle.enter().append("circle")
        .attr("cx", vis.width - vis.margin.right + 20)
        .attr("class", "circle_legend")
        .merge(circle)
        .transition().duration(vis.transition_count)
        .attr("cy",  function(d, index) {
            return vis.margin.top*3 + index*20
        })
        .attr("r", 3)
        .attr("fill", function(d) {return d[0]})
        .style("opacity", function(d) {return d[2]});

    circle.exit().remove()

    // Adding the text

    var circle2 = vis.svg.selectAll('.circle_legend2')
        .data(circle_data);

    circle2.enter().append("text")
        .attr("x", vis.width - vis.margin.right + 20 + 10)
        .attr("class", "circle_legend2")
        .merge(circle2)
        .transition().duration(vis.transition_count)
        .attr("y",  function(d, index) {
            return vis.margin.top*3 + index*20
        })
        .attr("dy", ".35em")
        .style("font-size", 10)
        .text(function(d){return d[1]})
        .style("opacity", function(d) {return d[2]});


    circle2.exit().remove();

    // Adding the rectangles

    var rect = vis.svg.selectAll('.rect_legend')
        .data(rect_data)

    rect.enter().append('rect')
        .merge(rect)
        .transition().duration(vis.transition_count)
        .attr("class", "rect_legend")
        .attr("x", vis.width - vis.margin.right + 20 - 4.5)
        .attr("y",  function(d, index) {
            if (d[0] === 'black') {
                return vis.margin.top*3 + (index+2)*20 - 1
            } else {
                return vis.margin.top*3 + (index+2)*20 - 5
            }
        })
        .attr("width", 10)
        .attr('height', function(d) {
            if (d[0] === 'black') {
                return 2
            } else {
                return 10
            }
        })
        .attr("fill", function(d) {return d[0]})
        .style("opacity", function(d) {return d[2]});;

    rect.exit().remove();

    // Adding the rectangle text
    var rect2 = vis.svg.selectAll('.rect_legend2')
        .data(rect_data);

    rect2.enter().append("text")
        .attr("class", "rect_legend2")
        .merge(rect2)
        .transition().duration(vis.transition_count)
        .attr("dy", ".35em")
        .style("font-size", 10)
        .text(function(d){
            return d[1]})
        .style("opacity", function(d) {return d[2]});

    rect2.exit().remove();

    // Fixing weird location issues
    vis.svg.selectAll('.rect_legend2')
        .data([['black', 'Average'], ['grey', 'One Standard Deviation']])
        .attr("x", vis.width - vis.margin.right + 20 + 10)
        .attr("y",  function(d, index) {
            return vis.margin.top*3 + (index+2)*20
        })

};
