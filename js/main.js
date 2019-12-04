/* main JS file */

// Initializing the data
var dataAllYears;
var globalFilteredData;
var globalByYearQBData;
var globalByPlayerQBData;
var eventData;

// Init Constants
var minGames = 10;
var minAttempts = 10;

// Initializing a way to get the sliders
var sliders = {};

// Getting the inserted data
d3.csv("data/Timeline.csv", function(error, dataCsv) {
    if (!error) {
        eventData = dataCsv
        console.log(eventData)
    }
})

// Getting the data
d3.csv("data/QBStats_all.csv", function(error, dataCsv) {
    if (!error) {
        // Saving out the data
        dataAllYears = dataCsv;

        // Initialize the data sets
        globalFilteredData = [];
        globalByYearQBData = [];
        globalByPlayerQBData = [];

        // GENERALLY CLEAN THE DATA

        // Fill up the data sets with the relevant dictionary terms
        for (var i = 1996; i < 2017; i++) {
            // Creating the dictionary that goes at each index in filtered data
            var dic = {};

            // Adding the year information
            dic['year'] = i;

            // Adding all the data for all the different features
            for (var key in dataAllYears[0]) {
                if (key !== 'qb' && key !== 'home_away' && key !== 'year') {
                    dic[key] = {'best' : [-Infinity, NaN], 'worst' : [Infinity, NaN],
                        'std' : [], 'total' : 0, 'number' : 0, 'average' : NaN}}
            }

            // Pushing the dictionary to the globalFilteredData and an empty dictionary to by
            globalFilteredData.push(dic);
            globalByYearQBData.push({})
            globalByPlayerQBData.push({})
        }

        // Filling up filtered Data and QB by year data
        for (var i = 0; i < dataAllYears.length; i++) {

            // The index for globalFilteredData
            var index = dataAllYears[i]['year'] - 1996;

            // Placeholder for the relevant data to be inserted
            var data = dataAllYears[i]

            // Update the QB stats by year dataset
            var qb = dataAllYears[i]['qb'];

            // Adding the current data to the existing data for ByYearQBData
            if (qb in globalByYearQBData[index]) {
                for (key in dataAllYears[i]) {
                    if (key !== 'qb' && key !== 'home_away' && key !== 'year') {
                        var val = data[key].replace(/[a-z-A-z]/g,'')
                        globalByYearQBData[index][qb][key] += +val
                    }
                } globalByYearQBData[index][qb]['count'] += 1}

            // If there is no existing data adding the new data
            else {
                // Only if they threw the ball more than 8 times
                if (dataAllYears[i]['att'] > minAttempts) {
                    // Creating a new empty dictionary for the information
                    globalByYearQBData[index][qb] = {}

                    // Going through all of their stats
                    for (key in dataAllYears[i]) {
                        // Adding all of the information to the dictionary
                        if (key !== 'qb' && key !== 'home_away' && key !== 'year') {
                            globalByYearQBData[index][qb][key] = +data[key]}}

                    // Incrementing the number of games started
                    globalByYearQBData[index][qb]['count'] = 1}}

            // Adding the current data to the existing data for ByPlayerQbData
            if (data['att'] > 8) {
                if (qb in globalByPlayerQBData[index]) {
                    globalByPlayerQBData[index][qb].push(data)
                } else {
                    globalByPlayerQBData[index][qb] = [data]
                }
            }

        }

        // Fill out the best and worst statistic
        for (var i = 0; i < globalByYearQBData.length; i++) {
            // Iterating through all QB's for a year
            for (key in globalByYearQBData[i]) {
                // Seeing how many times they played
                var count = globalByYearQBData[i][key]['count'];
                if (count >= minGames) {
                    // Iterating through all their relevant stats
                    for (key2 in globalByYearQBData[i][key]) {
                        if (key2 !== 'qb' && key2 !== 'home_away' && key2 !== 'year' && key2 !== 'count') {
                            // Getting the statistic
                            var stat = globalByYearQBData[i][key][key2];
                            var statPercent = stat/count;

                            // Getting the total and the count
                            globalFilteredData[i][key2]['total'] += stat;
                            globalFilteredData[i][key2]['number'] += count;

                            // Adding to all
                            globalFilteredData[i][key2]['std'].push(statPercent);

                            // Seeing if it is a max or a min
                            if (statPercent > globalFilteredData[i][key2]['best'][0]) {
                                globalFilteredData[i][key2]['best'] = [statPercent, key]
                            }
                            if (statPercent < globalFilteredData[i][key2]['worst'][0]) {
                                globalFilteredData[i][key2]['worst'] = [statPercent, key]
                            }}}}}}

        // Fill out the average statistic
        for (var i = 0; i < globalFilteredData.length; i++) {
            for (var key in globalFilteredData[i]) {
                if (key !== 'qb' && key !== 'home_away' && key !== 'year') {
                    globalFilteredData[i][key]['average'] = [globalFilteredData[i][key]['total']/globalFilteredData[i][key]['number']]
                    globalFilteredData[i][key]['std'] = math.std(globalFilteredData[i][key]['std'])}}};

        makeVis();
    }
});

// Initializes the data itself
function makeVis() {
    StatsOverTime = new StatsOverTime("stats_over_time", globalFilteredData, globalByYearQBData, globalByPlayerQBData);
    Slider = new Slider('slider', globalFilteredData, globalByYearQBData, globalByPlayerQBData);
    Spider = new Spider("spider");
    ScatterOverTime = new ScatterOverTime("scatter_over_time", globalFilteredData, globalByYearQBData, globalByPlayerQBData);
    Timeline = new Timeline("timeline", globalFilteredData, globalByYearQBData, globalByPlayerQBData);

}

