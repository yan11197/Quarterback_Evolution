Slider = function(_parentElement, _filteredData){
    this.parentElement = _parentElement;
    this.filteredData = _filteredData;
    this.count = 0;
    this.d;

    this.initVis();
};

Slider.prototype.initVis = function() {
    var vis = this;

    //stats in question
    var sliderStats = ['rate', 'game_points', 'td', 'yds', 'att', 'cmp', 'int'];

    // Create the slider for each stat in question
    for (var i = 0; i < sliderStats.length; i++) {
        var slider = document.getElementById('slider-' + sliderStats[i]);

        noUiSlider.create(slider, {
            range: {
                min: -1,
                max: 1
            },
            start: [-1, 1],
            step: 0.1,
            connect: true,
            behaviour: 'drag',
            tooltips: [true, true],
        });

        // update scatter plot when moving slider
        slider.noUiSlider.on("update", function(d) {
            if (vis.count > 0) {
                ScatterOverTime.updateVis()
            }
        })

    }
    // initialize to all 20 years
    vis.wrangleData(0, 20);
};

// Create data for given year range
Slider.prototype.wrangleData = function(year_1, year_2) {
    var vis = this;

    vis.d = {
        'att' : [Infinity, -Infinity],
        'cmp' : [Infinity, -Infinity],
        'rate' : [Infinity, -Infinity],
        'game_points' : [Infinity, -Infinity],
        'int' : [Infinity, -Infinity],
        'td' : [Infinity, -Infinity],
        'yds' : [Infinity, -Infinity],
    }

    for (var i = year_1; i < year_2+1; i++) {
        for (key in vis.filteredData[i]) {
            if (key in vis.d) {
                var worst_stat = vis.filteredData[i][key]['worst'][0]
                var best_stat = vis.filteredData[i][key]['best'][0]

                if (worst_stat < vis.d[key][0]) {
                    vis.d[key][0] = worst_stat
                }
                if (best_stat > vis.d[key][1]) {
                    vis.d[key][1] = best_stat
                }
            }
        }
    }

    vis.updateVis();
};


// update the sliders given the slider information
Slider.prototype.updateVis = function() {
    var vis = this;

    var sliderStats = ['rate', 'game_points', 'td', 'yds', 'att', 'cmp', 'int'];

    for (var i = 0; i < sliderStats.length; i++) {
        var slider = document.getElementById('slider-' + sliderStats[i]);
        //update min and max
        var min = vis.d[sliderStats[i]][0];
        var max = vis.d[sliderStats[i]][1];

        slider.noUiSlider.updateOptions({
            range: {
                'min': min,
                'max': max
            },
            start: [min, max]
        });

    }

    vis.count += 1;
};

