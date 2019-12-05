ScatterOverTime = function(_parentElement, _filteredData, _byYearQBData, _byPlayerQBData){
    this.parentElement = _parentElement;
    // this.filteredData = _filteredData;
    this.byYearQBData = _byYearQBData;
    this.byPlayerQBData = _byPlayerQBData;
    this.transition_count = 0;
    this.start = 0

    this.initVis();
};

ScatterOverTime.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 20, right: 0, bottom: 20, left: 60};

    var window_width = $("#" + vis.parentElement).width()
    var window_height = $("#" + vis.parentElement).height()

    vis.width = window_width - vis.margin.left - vis.margin.right;
    vis.height = window_height - vis.margin.top - vis.margin.bottom;

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
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    // Adding the y axis legend
    vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .merge(vis.svg.select(".y_label"))
        .attr("class", 'y_label')
        .attr("y", 15)
        .attr("x",0 - (vis.height / 2))
        .attr("dy", "1em")
        .style("font-size", 12)
        .style("text-anchor", "middle");

    // Adding the x axis legend
    vis.svg.append("text")
        .attr("class", "x_label")
        .attr("transform",
            "translate(" + (vis.width/2 + vis.margin.left) + " ," +
            (vis.height + vis.margin.bottom + 10) + ")")
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
    vis.wrangleData(1996, 2016);
};

ScatterOverTime.prototype.wrangleData = function(Start_year, End_year) {
    var vis = this;

    // Filling out the year filtered data set
    vis.byPlayerQBData_YearFiltered = {}

    // Adding all of the quarterbacks
    for (var i = Start_year - 1996; i < End_year + 1 - 1996; i++) {
        for (qb_name in vis.byYearQBData[i]) {
            if (qb_name in vis.byPlayerQBData_YearFiltered) {
                for (att in vis.byPlayerQBData_YearFiltered[qb_name]) {
                    vis.byPlayerQBData_YearFiltered[qb_name][att] += vis.byYearQBData[i][qb_name][att]
                }

            } else {
                vis.byPlayerQBData_YearFiltered[qb_name] = vis.byYearQBData[i][qb_name]
            }
        }
    }

    vis.updateVis();
};


ScatterOverTime.prototype.updateVis = function() {
    var vis = this;

    // Creating the attributes
    var attributes = ['rate', 'game_points', 'td', 'yds', 'att', 'cmp', 'int'];
    var attribute_ranges = {}

    // Making a dictionary of the attribute ranges
    for (var i = 0; i < attributes.length; i++) {
        // Getting the attribute name
        att = attributes[i]

        // Getting the information
        var slider = document.getElementById('slider-' + att);
        var slider_range = slider.noUiSlider.get()

        // Adding the information to the attribute_ranges
        attribute_ranges[att] = slider_range
    }

    // Getting the QB's who fall into the slider range
    var byPlayerQBData_StatFiltered = []

    var byPlayerQBData_SpiderInput = []

    // Filtering based on the sliders
    for (qb_name in vis.byPlayerQBData_YearFiltered) {
        var pass = 1

        // Getting the important data
        var games_played = vis.byPlayerQBData_YearFiltered[qb_name]['count']
        var qb_data = vis.byPlayerQBData_YearFiltered[qb_name]

        for (var i = 0; i < attributes.length; i++) {
            // Getting the attribute name and the specific statistic
            var att = attributes[i]
            var qb_stat = qb_data[att] / games_played

            if (Number.isNaN(qb_stat)) {
                pass = 2;
            } else if (qb_stat > attribute_ranges[att][1] || qb_stat < attribute_ranges[att][0]) {
                pass = 0;
            }
        }

        // If it fulfils the basic statistical requirements, add to the spider stats
        if (qb_data['att'] / games_played > minAttempts && pass < 2) {
            byPlayerQBData_SpiderInput.push([qb_name, qb_data])
        }

        // If fulfils all the categories, put him in the main file
        if (pass === 1) {
            byPlayerQBData_StatFiltered.push([qb_name, qb_data])
        }

        if (qb_name.substring(0, 13) === 'Aaron Rodgers') {qb_spider = qb_name}
    }

    // Calling Spider only once
    if (vis.start === 0) {
        Spider.wrangleData(qb_spider, byPlayerQBData_SpiderInput)
        vis.start = 1
    }

    // Getting the statistic of focus
    var Stat_x = d3.select("#scatter_over_time_x").property("value");
    var Stat_y = d3.select("#scatter_over_time_y").property("value");

    // Getting the x and the y range
    var slider_x = document.getElementById('slider-' + Stat_x);
    var xRange = slider_x.noUiSlider.get()
    xRange[1] = xRange[1]

    // Getting the x and the y range
    var slider_y = document.getElementById('slider-' + Stat_y);
    var yRange = slider_y.noUiSlider.get();
    yRange[1] = yRange[1]

    // Getting the x scale domain
    vis.x.domain(xRange);

    // // Calling the x scale on the xAxis
    vis.svg.select(".x_axis")
        .transition().duration(vis.transition_count)
        .call(vis.xAxis);

    // Getting the y scale domain
    vis.y.domain(yRange)

    // Calling the y scale on the yAxis
    vis.svg.select(".y_axis")
        .transition().duration(vis.transition_count)
        .call(vis.yAxis);

    // Getting the correct y label
    var label_d = {
        'att': 'Attempts',
        'cmp': 'Completions',
        'td': 'Touchdowns',
        'int': 'Interceptions',
        'rate': 'Quarterback Rating',
        'game_points': 'Game Points'
    }

    // Adding the y label
    vis.svg.select('.y_label')
        .text(label_d[Stat_y])
        .style("font-size", 12);

    // Adding the x label
    vis.svg.select('.x_label')
        .text(label_d[Stat_x])
        .style("font-size", 12);

    var points = vis.svg.selectAll(".player_points")
        .data(byPlayerQBData_StatFiltered, function (d) {return d[0]});


    // Adding the dots
    points.enter().append("circle")
        .attr("class", "player_points")
        .merge(points)
        .transition().duration(800)
        .attr("cx", function (d) {
            return vis.x(d[1][Stat_x] / d[1]['count']);
        })
        .attr("cy", function (d) {
            return vis.y(d[1][Stat_y] / d[1]['count']);
        })
        .attr("r", 4)
        .style("fill", "black")
        .style("opacity", .3);

    points.exit().remove();

    // Creating the tooltip and opacity combo
    function tool_tip_player_details(d, x_y) {
        // Updating the opacity
        var all_points = vis.svg.selectAll(".player_points")

        all_points.style("opacity", .1)

        // Getting the html text part
        var qb_stats = d[1]
        // To split the name to only get the full name
        var qb = d[0];
        var qb_name = qb.slice(0, qb.lastIndexOf(".") - 1);

        // Getting the statistics
        var att = qb_stats['att'] / qb_stats['count'];
        att = att.toFixed(2);
        var cmp = qb_stats['cmp'] / qb_stats['count'];
        cmp = cmp.toFixed(2);
        var td = qb_stats['td'] / qb_stats['count'].toFixed(2);
        td = td.toFixed(2);
        var int = qb_stats['int'] / qb_stats['count'].toFixed(2);
        int = int.toFixed(2);

        var qb_tip_stats = [qb_name, 'Attempts: ' + att, 'Completions: ' + cmp,
            'Touchdowns: ' + td, 'Interceptions : ' + int]

        // Setting the x axis so doesn't get cut off
        x_y[0] = Math.max(x_y[0], vis.margin.left*2);
        x_y[0] = Math.min(x_y[0], vis.width - vis.margin.right * 2);

        // Tooltip above
        if (x_y[1] > vis.height*.25) {
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
            }}

        // Tooltip below
        else {
            for (var i = 0; i < qb_tip_stats.length; i++) {
                vis.svg.append("text")
                    .attr("class", "tooltip_text")
                    .attr("x", x_y[0])
                    .attr("y", x_y[1] + (qb_tip_stats.length - i) * 18 + 10)
                    .attr("font-size", 12)
                    .attr("text-anchor", "middle")
                    .attr("font-weight", function (d) {
                        if (i === qb_tip_stats.length - 1) {
                            return "bold"
                        } else {
                            return "regular"
                        }
                    })
                    .html(qb_tip_stats[qb_tip_stats.length - i - 1])
            }}
    }

    vis.svg.selectAll(".player_points")
        .on('mouseover', function(d) {
            // Getting the position
            var x_y = d3.mouse(this)

            // Updating the tool tip
            tool_tip_player_details(d, x_y);

            // Ensuring the one we're on remains red and with high opacity
            d3.select(this).style("fill", "red").style("opacity", 1);
        })
        // .on('mouseout', tool_tip_player_details.hide)
        .on('mouseout', function(d) {
            // Getting all the points
            var all_points = vis.svg.selectAll(".player_points")

            // Ensuring that it is the correct color and opacity
            all_points
                .style("fill", "black")
                .style("opacity", .3)

            // Removing the text
            var text = vis.svg.selectAll(".tooltip_text")
            text.remove()
        })
        .on('click', function (d) {
            var qb = d[0]
            Spider.wrangleData(qb, byPlayerQBData_SpiderInput)
        })
};
