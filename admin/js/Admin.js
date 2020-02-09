/* eslint-disable no-unused-vars */
/*
-------------------------------------------------------------------------------------------------
<Une ligne décrivant le nom du programme et ce qu’il fait>
Copyright © 2019 Ulysse GUYON Sacha WANONO Eléa THUILIER
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

This module is used for the interactivity of the Admin page
*/

/* globals Vue */
'use strict';

let formVue = null;
let statsWindow = null;

async function sendSelectFeatureDoc (formTag) {
    const formData = new FormData(formTag);
    const body = {};
    for (const pair of formData)
        body[pair[0]] = pair[1];

    const fetchRes = await fetch('/api/admin/selectFeatures', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: new Headers({ 'Content-type': 'application/json' })
    });

    const res = await fetchRes.json();

    const innerHTML = res.message.split('/').map((m) => m.trim()).join('<br/>');

    // eslint-disable-next-line no-undef
    setAlertMessage(innerHTML, res.ok);

    if (res.ok) {
        formVue.update();
        fillStatsTable();
    }
}

/**********  VUE  *********/
async function fillFeaturesForm () {
    const fetchRes = await fetch('/api/admin/historicFeatures', { method: 'GET' });

    if (!fetchRes.ok) {
        console.error('Une erreur est survenue lors de la récupération des données : ' + fetchRes.statusText);
        return;
    }

    const docs = await fetchRes.json();
    if (!Array.isArray(docs)) {
        console.error('le serveur a envoyé des informations incorrectes : ' + JSON.stringify(docs));
        return;
    }

    const dataVue = docs.sort((d1, d2) => new Date(d2.modifDate) - new Date(d1.modifDate)).map((doc, i) => {
        const asString = JSON.stringify(doc);
        doc.index = i;
        doc.asString = asString;
        doc.classAdd = doc.isUsed ? 'used-file' : '';
        return doc;
    });

    formVue = new Vue({
        el: '#formFeatureFiles',
        data: {
            featureFiles: dataVue,
            featureSelect: dataVue.find(doc => doc.isUsed).asString
        },
        methods: {
            update () {
                this.featureFiles.forEach(doc => {
                    const isSelected = (doc.asString === this.featureSelect);
                    doc.isUsed = isSelected;
                    doc.classAdd = isSelected ? 'used-file' : '';
                });
            }
        }
    });
}

async function fillStatsTable () {
    const fetchRes = await fetch('/api/admin/basicStats', { method: 'GET' });

    if (!fetchRes.ok) {
        console.error('Une erreur est survenue lors de la récupération des données : ' + (fetchRes.statusText || fetchRes.message));
        return;
    }

    const stats = await fetchRes.json();

    /* DELETE THESE TWO LINES IF YOU WANT THE FULL COMBINATORY STATS */
    stats.desc = [stats.desc[0]];
    stats.desc[0].name = 'Sexe';
    /* DELETE THESE TWO LINES IF YOU WANT THE FULL COMBINATORY STATS */

    const colspanMax = stats.desc.reduce(
        (prevDesc, descr) => Math.max(prevDesc, descr.combin.reduce(
            (prevComb, _) => prevComb + 1,
            0
        )),
        0
    );

    if (!statsWindow) {
        statsWindow = new Vue({
            el: '#stats-div',
            data: {
                stats: stats,
                statsColspan: colspanMax
            }
        });
    } else {
        statsWindow.stats = stats;
        statsWindow.statsColspan = colspanMax;
    }
}
/**********  FIN VUE  *********/

function fillPage () {
    fillFeaturesForm();
    fillStatsTable();
}
