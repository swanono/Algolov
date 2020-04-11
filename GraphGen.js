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

class SerieBar {
    constructor (name, data) {
        this.name = name;
        this.data = data;
    }

    toObj () {
        return {
            name: this.name,
            data: this.data
        };
    }
}

function createGraph (chartOptions, title = 'graph-image') {
    return new Promise(function (resolve, reject) {
        chartExporter.initPool();
        chartExporter.export(chartOptions, (err, res) => {
            if (err) { reject(err); return; }

            // Search for existing files with the same name, and change it if necessary
            const tryPath = () => path.resolve(`./tmp/${title}-${suffix}.png`);
            let suffix = 1;
            let pathToPng = tryPath();
            while (fs.existsSync(pathToPng)) {
                suffix++;
                pathToPng = tryPath();
            }

            // When we have the good name, write the file and return its path
            fs.writeFileSync(pathToPng, res.data, 'base64');
            chartExporter.killPool();
            resolve(pathToPng);
        });
    });
}

function createGraphBar (series, labels, xName, yName, title, subTitle) {

    if (series.reduce((prev, curr) => prev || (curr.data.length !== labels.length), false))
        return Promise.reject(new Error(`A serie of data doesn't have the same length as the labels (here : ${labels.length})`));

    const chartOptions = {
        type: 'png',
        options: {
            chart: { type: 'column' },
            title: { text: title },
            subtitle: { text: subTitle },
            xAxis: { categories: labels, title: { text: xName } },
            yAxis: { min: 0, title: { text: yName } },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            series: series.map(serie => serie.toObj())
        }
    };

    return createGraph(chartOptions, `graph-bar-${title}`);
}

module.exports = {
    SerieBar,
    createGraphBar
};