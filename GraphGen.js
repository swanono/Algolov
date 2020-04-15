/*
-------------------------------------------------------------------------------------------------
<Une ligne décrivant le nom du programme et ce qu’il fait>
Copyright © <Année> <Nom de l’auteur>
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see < https://www.gnu.org/licenses/ >.
-------------------------------------------------------------------------------------------------

This module is used to generate the graphs to put in the report
*/
'use strict';

const path = require('path');
const chartExporter = require('highcharts-export-server');
const fs = require('fs');

process.setMaxListeners(0);

chartExporter.initPool({
    queueSize: 25,
    timeoutThreshold: 5000
});

class SerieBar {
    constructor (name, data) {
        this.name = name;
        this.data = data;
    }

    toObj () {
        return {
            name: this.name.substring(0, 20),
            data: this.data
        };
    }
}

function createGraph (chartOptions, title = 'graph image', reverse = false) {

    if (reverse) {
        const newLabels = chartOptions.options.series.map(s => s.name);
        const newSeries = chartOptions.options.xAxis.categories.map((label, iLabel) => {
            return {
                name: label.substring(0, 20),
                data: chartOptions.options.series.map(s => s.data[iLabel])
            };
        });

        chartOptions.options.series = newSeries;
        chartOptions.options.xAxis.categories = newLabels;
    }

    return new Promise(function (resolve, reject) {
        chartExporter.export(chartOptions, (err, res) => {
            if (err) {
                console.log('ERROR : ', err);
                console.log('-----------');
                console.log('combin :', chartOptions.options.subtitle.text);
                console.log('type :', chartOptions.options.xAxis.title.text);
            }

            if (err) { reject(err); return; }

            // Search for existing files with the same name, and change it if necessary
            let suffix = 1;
            const tryPath = () => path.resolve(`./tmp/${title} ${suffix}.png`);
            let pathToPng = tryPath();
            while (fs.existsSync(pathToPng)) {
                suffix++;
                pathToPng = tryPath();
            }
            // When we have the good name, write the file and return its path
            fs.writeFileSync(pathToPng, res.data, 'base64');
            resolve(pathToPng);
        });
    });
}

/**
 * 
 * @param {Array<number>} highlights List of label indexes to highlight
 * 
 * @return {Array<any>} The list of Highcharts band plot to use
 */
function calculatePlotBandBounds (highlights, bandColor = '#FCFFC5') {
    if (!highlights)
        return [];

    return highlights.map(h => new Object({
        color: bandColor,
        from: h - 0.4,
        to: h + 0.4
    }));
}

function createGraphBar (series, labels, xName, yName, title, subTitle, decimals, reverse, highlights) {

    if (series.reduce((prev, curr) => prev || (curr.data.length !== labels.length), false))
        return Promise.reject(new Error(`A serie of data doesn't have the same length as the labels (here : ${labels.length})`));

    const chartOptions = {
        type: 'png',
        options: {
            chart: { type: 'column' },
            title: { text: title },
            subtitle: { text: subTitle },
            xAxis: {
                categories: labels,
                title: { text: xName },
                plotBands: calculatePlotBandBounds(highlights)
            },
            yAxis: { min: 0, title: { text: yName }, allowDecimals: decimals },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            series: series.map(serie => serie.toObj())
        }
    };

    return createGraph(chartOptions, `graph bar ${title}`, reverse);
}

function createGraphBox (boxes, scattered, labels, xName, yName, title, subTitle, globalMean, globalMeanTitle, highlights) {
    if (boxes.length !== labels.length || boxes.reduce((prev, curr) => prev || curr.length !== 5, false))
        return Promise.reject(new Error(`The serie of data doesn't have the same length as the labels (here : ${labels.length}) or is not a box : ${boxes}`));

    const chartOptions = {
        type: 'png',
        options: {
            chart: { type: 'boxplot' },
            title: { text: title },
            subtitle: { text: subTitle },
            legend: { enabled: false },
            xAxis: {
                categories: labels,
                title: { text: xName },
                plotBands: calculatePlotBandBounds(highlights)
            },
            yAxis: {
                title: { text: yName },
                plotLines: [
                    {
                        value: globalMean,
                        color: 'red',
                        width: 1,
                        label: {
                            text: globalMeanTitle,
                            align: 'center',
                            style: { color: 'gray' }
                        },
                        zIndex: 5
                    }
                ]
            },
            series: [
                {
                    // Plot the boxes
                    name: 'Observations',
                    data: boxes
                },
                {
                    // Plot the points outside the boxes
                    name: 'Outliers',
                    color: 'black',
                    type: 'scatter',
                    data: scattered,
                    marker: {
                        fillColor: 'white',
                        lineWidth: 1,
                        lineColor: 'black'
                    }
                }
            ]
        }
    };

    return createGraph(chartOptions, `graph box ${title}`);
}

module.exports = {
    SerieBar,
    createGraphBar,
    createGraphBox
};