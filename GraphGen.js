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

/**
 * 
 * @param {Array<number>} data 
 */
function createGraphBar (title, data) {
    data = [12, 19, 3, 5, 2, 3];
    const labels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'];

    return new Promise(function (resolve, reject) {
        chartExporter.initPool();
    
        chartExporter.export({
            type: 'png',
            options: {
                chart: { type: 'column' },
                title: { text: 'Fréquence d\'apparition d\'une couleur' },
                subtitle: { text: 'Source : moi' },
                xAxis: { categories: labels, title: { text: 'Couleurs' } },
                yAxis: { min: 0, title: { text: 'Fréquence' } },
                series: [
                    {
                        data: data
                    }
                ]
            }
        }, (err, res) => {
            const pathToPng = path.resolve(`./tmp/${title}.png`);
            fs.writeFileSync(pathToPng, res.data, 'base64');
            chartExporter.killPool();
            resolve(pathToPng);
        });
    });
}

module.exports = {
    createGraphBar
};