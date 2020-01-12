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
'use strict';

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

    if (res.ok)
        appendArrowToChecked();
}

function fillPage () {
    fillFeatureDocForm();
    fillStats();
}

async function fillStats () {
    const fetchRes = await fetch('/api/admin/basicStats', { method: 'GET' });

    if (!fetchRes.ok) {
        console.error('Une erreur est survenue lors de la récupération des données : ' + fetchRes.statusText);
        return;
    }

    const stats = await fetchRes.json();
    
    const divStats = document.getElementById('stats-div');

    const ageP = document.createElement('p');
    ageP.appendChild(document.createTextNode(`Age moyen des répondants : ${stats.ageMean} ans`));
    divStats.appendChild(ageP);

    const tabStats = document.createElement('table');
    tabStats.setAttribute('id', 'tab-stats');
    divStats.appendChild(tabStats);

    const header = tabStats.createTHead().insertRow().insertCell();
    header.appendChild(document.createTextNode('Répondants'));

    const tabBody = tabStats.createTBody();
    let colspan = 0;
    const bodyHeaders = [];
    stats.desc.forEach((desc, i) => {
        if (i !== 0)
            return;
            
        let currentSpan = 0;

        const h = tabBody.insertRow().insertCell();
        h.appendChild(document.createTextNode('Sexes' /* desc.name */));
        bodyHeaders.push(h);

        const rowName = tabBody.insertRow();
        const rowVal = tabBody.insertRow();
        desc.combin.forEach((comb) => {
            rowName.insertCell().appendChild(document.createTextNode(comb.name));
            rowVal.insertCell().appendChild(document.createTextNode(comb.value));
            currentSpan++;
        });

        colspan = Math.max(colspan, currentSpan);
    });

    header.setAttribute('colspan', colspan);
    bodyHeaders.forEach((head) => head.setAttribute('colspan', colspan));
}

async function fillFeatureDocForm () {
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

    const formFeatures = document.getElementById('formFeatureFiles');
    docs.sort((d1, d2) => new Date(d2.modifDate) - new Date(d1.modifDate)).forEach((doc, i) => {
        const newContainer = document.createElement('div');
        newContainer.setAttribute('class', 'download-bar-container');

        const newLink = document.createElement('a');
        newLink.setAttribute('class', 'download-bar bouton');
        newLink.setAttribute('href', doc.path);

        const newLogo = document.createElement('img');
        newLogo.setAttribute('src', '../images/logo-excel.png');
        newLogo.setAttribute('alt', 'logo excel');
        newLogo.setAttribute('width', '30px');
        newLogo.setAttribute('height', '30px');

        const newDiv = document.createElement('div');
        newDiv.appendChild(document.createTextNode(doc.name));

        const newInput = document.createElement('input');
        newInput.setAttribute('id', 'feature_file_' + i);
        newInput.setAttribute('type', 'radio');
        newInput.setAttribute('name', 'select_feature_file');
        newInput.setAttribute('value', JSON.stringify(doc));
        newInput.setAttribute('required', 'true');
        if (doc.isUsed)
            newInput.checked = true;

        newLink.appendChild(newLogo);
        newLink.appendChild(newDiv);

        newContainer.appendChild(newLink);

        newContainer.appendChild(newInput);

        formFeatures.appendChild(newContainer);
    });

    appendArrowToChecked();
}

function appendArrowToChecked () {
    const cbs = document.querySelectorAll('[name="select_feature_file"]');
    for (const input of cbs) {
        if (input.checked && input.parentElement.firstElementChild.getAttribute('class') !== 'arrow') {
            const arrow = document.createElement('div');
            arrow.setAttribute('class', 'arrow');
            arrow.innerHTML = '&rarr;';
            input.parentElement.prepend(arrow);
        } else if (!input.checked) {
            const maybeArrow = input.parentElement.firstElementChild;
            if (maybeArrow.getAttribute('class') === 'arrow')
                maybeArrow.remove();
        }
    }
}
