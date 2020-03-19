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

let featFormVue = null;
let questFormVue = null;
let statsWindow = null;

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

function parseDataFiles (docsFetch) {
    return docsFetch.sort((d1, d2) => new Date(d2.modifDate) - new Date(d1.modifDate)).map((doc, i) => {
        const asString = JSON.stringify(doc);
        doc.index = i;
        doc.asString = asString;
        doc.classAdd = doc.isUsed ? 'used-file' : '';
        return doc;
    });
}

async function fillForm (id, path) {
    const fetchRes = await fetch(path, { method: 'GET' });

    if (!fetchRes.ok) {
        console.error('Une erreur est survenue lors de la récupération des données : ' + fetchRes.statusText);
        return;
    }

    const docs = await fetchRes.json();
    if (!Array.isArray(docs)) {
        console.error('le serveur a envoyé des informations incorrectes : ' + JSON.stringify(docs));
        return;
    }

    const dataVue = parseDataFiles(docs);

    return new Vue({
        el: id,
        data: {
            files: dataVue,
            select: dataVue.find(doc => doc.isUsed).asString
        },
        methods: {
            update () {
                this.files.forEach(doc => {
                    const isSelected = (doc.asString === this.select);
                    doc.isUsed = isSelected;
                    doc.classAdd = isSelected ? 'used-file' : '';
                });
            },
            async updateFileList () {
                const fetchRes = await fetch(path, { method: 'GET' });
            
                if (!fetchRes.ok) {
                    console.error('Une erreur est survenue lors de la récupération des données : ' + fetchRes.statusText);
                    return;
                }
            
                const docs = await fetchRes.json();
                if (!Array.isArray(docs)) {
                    console.error('le serveur a envoyé des informations incorrectes : ' + JSON.stringify(docs));
                    return;
                }
            
                this.files = parseDataFiles(docs);
            }
        }
    });
}

async function sendSelectDoc (formTag) {
    const path = formTag.getAttribute('action');
    const formData = new FormData(formTag);
    const body = {};
    for (const pair of formData)
        body[pair[0]] = pair[1];

    const fetchRes = await fetch(path, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: new Headers({ 'Content-type': 'application/json' })
    });

    const res = await fetchRes.json();

    const innerHTML = res.message.split('/').map((m) => m.trim()).join('<br/>');

    // eslint-disable-next-line no-undef
    setAlertMessage(innerHTML, res.ok);

    if (res.ok) {
        if (path.toLowerCase().includes('feature'))
            featFormVue.update();
        else
            questFormVue.update();
    }
}

async function sendDeleteDoc (fileName, dirName) {
    const fetchRes = await fetch(`/api/admin/deleteExcel/${dirName}/${fileName}`, {
        method: 'DELETE',
        headers: new Headers({ 'Content-type': 'application/json' })
    });
    
    const res = await fetchRes.json();

    // eslint-disable-next-line no-undef
    setAlertMessage(res.message, res.ok);

    if (res.ok) {
        if (dirName === 'features')
            featFormVue.updateFileList();
        else
            questFormVue.updateFileList();
    }
}

async function fillPage () {
    fillStatsTable();
    featFormVue = await fillForm('#formFeatureFiles', '/api/admin/historicFeatures');
    questFormVue = await fillForm('#formQuestionFiles', '/api/admin/historicQuestions');
}
