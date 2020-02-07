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

This module is used for the interactivity of the previsualisation page
*/

/* globals Vue */
'use strict';

const combinSepar = ' - ';

async function getConfig () {
    const fetchedConfig = await fetch('../../public/survey/config.json', { method: 'GET' });

    if (fetchedConfig.ok) {
        const config = await fetchedConfig.json();
        setUpMenu(config);
        setUpPreviz(config);
    } else
        console.error(fetchedConfig.statusText);
}

function createCombinList (descList) {
    const firstDesc = descList.pop();
    if (!firstDesc)
        return [];
    else {
        const recurRes = createCombinList(descList);
        const res = [];
        if (recurRes === [])
            firstDesc.combin.forEach((comb) => res.push(comb));
        else {
            for (const comb of firstDesc.combin) {
                for (let r of recurRes)
                    res.push(comb + combinSepar + r);
            }
        }
        return res;
    }
}

class PageCarac {
    constructor (id, type, isActive = false, isShown = false) {
        this.id = id;
        this.type = type;
        this.isActive = isActive;
        this.isShown = isShown;
    }
}

class BlocCarac extends PageCarac {
    static get TYPE () { return 'bloc'; }
    constructor (id, bloc, desc, featureList, isActive = false, isShown = false) {
        super(id, BlocCarac.TYPE, isActive, isShown);
        this.bloc = bloc;
        this.description = desc;
        this.featureList = featureList;
    }
}

class QuestCarac extends PageCarac {
    static get TYPE_BEGIN () { return 'questBegin'; }
    static get TYPE_END () { return 'questEnd'; }
    constructor (id, type, questionList, isActive = false, isShown = false) {
        super(id, type, isActive, isShown);
        this.questionList = questionList;
    }
}

class UnchangeCarac extends PageCarac {
    static get TYPE () { return 'else'; }
    constructor (id, text, isActive = false, isShown = false) {
        super(id, UnchangeCarac.TYPE, isActive, isShown);
        this.text = text;
    }
}

function createPageList (config) {
    const pageList = [];
    let i = 0;
    pageList.push(new UnchangeCarac(++i, config.RGPDText, true, true));
    pageList.push(new UnchangeCarac(++i, config.surveyExplain, true));
    const questBegin = config.QCM.begin;
    const blocList = config.surveyConfiguration.blocThemes;
    const questEnd = config.QCM.end;

    if (questBegin.fragmented) {
        questBegin.list.forEach(question => pageList.push(
            new QuestCarac(++i, QuestCarac.TYPE_BEGIN, [question])
        ));
    } else
        pageList.push(new QuestCarac(++i, QuestCarac.TYPE_BEGIN, questBegin.list));

    config.surveyConfiguration.descNames.forEach(desc => {
        blocList.forEach(bloc => {
            pageList.push(new BlocCarac(++i, bloc, desc,
                selectFeatures(bloc, { name: desc.name, choice: desc.combin[0] }, config.features)));
        });
    });

    if (questEnd.fragmented) {
        questEnd.list.forEach(question => pageList.push(
            new QuestCarac(++i, QuestCarac.TYPE_END, [question])
        ));
    } else
        pageList.push(new QuestCarac(++i, QuestCarac.TYPE_END, questBegin.list));

    return pageList;
}

/**
 * 
 * Function used to select the right features to shox in a bloc
 * considering the blocs type and a chosed description
 * 
 * @param {Object} bloc An object containing the same key/values as the blocs stored in config.json
 * @param {Object} description An object containing :
 *      "name": Name of the description / "choice": Chosed description to be used for this name
 * @param {Array} allFeatures A list of all the features to chose from,
 *      with same format as the features stored in config.json
 * @returns {Array} A list of the features selected to be in the bloc
 * 
 */
function selectFeatures (bloc, description, allFeatures) {
    const usedFeatures = [];

    allFeatures.forEach((feature) => {
        if (bloc.type === feature.type) {
            // we search in the combinatory object if the current feature is compatible
            const found = feature.combin.find(
                f => description.name === f.descName && f[description.choice]
            );

            // if we found a combinatory that matched the description and bloc, we add the feature
            if (found)
                usedFeatures.push(feature);
        }
    });

    return usedFeatures;
}

/* Créer tout le DOM d'un coup et ne l'afficher qu'en fonction des boutons cliqués */

let menuVue = null;
let bodyVue = null;

function setUpMenu (config) {
    const strCombinList = createCombinList(config.surveyConfiguration.descNames);

    menuVue = new Vue({
        el: '#menu',
        data: {
            combinList: strCombinList,
            selectCombin: strCombinList[0],
            showCombin: false
        },
        methods: {
            changeActive (targetCB) {
                const typeToChange = targetCB.getAttribute('name');
                bodyVue.$data.pageList.forEach((page, i, listPage) => {
                    if (page.type === typeToChange && i !== 0)
                        page.isActive = !page.isActive;
                    
                    if (page.isShown && !page.isActive) {
                        page.isShown = false;
                        listPage[0].isShown = true;
                    }
                });

                // if we check the "bloc" checkbox, then change the disabled of the combinatories radios
                if (typeToChange === PageCarac.TYPE_BLOC)
                    this.showCombin = !this.showCombin;
            },

            goToPage (targetLink) {
                const targetPageId = targetLink.getAttribute('target-page-id');
                bodyVue.showPage(targetPageId);
            }
        }
    });
}

function setUpPreviz (config) {
    bodyVue = new Vue({
        el: '#pages',
        data: {
            pageList: createPageList(config),
            shown: 0
        },
        methods: {
            showPage (pageId) {
                this.pageList = this.pageList.map(page => {
                    if (page.isShown)
                        page.isShown = false;
                    if (page.id === pageId)
                        page.isShown = true;
                    return page;
                });

                this.shown = this.pageList.filter(page => page.isShown).id;
            },
            getColspan (nbCells, indexCell, scaleSize) {
                const specialCase = (nbCells % 2 === 0 && scaleSize % 2 === 1);
                if (nbCells > scaleSize)
                    return undefined;
                if (nbCells === 2 || nbCells === 3) {
                    if (indexCell === 0 || indexCell === 2)
                        return 1;
                    else if (indexCell >= 3)
                        return undefined;
                    else
                        return scaleSize - 2;
                } 
                if (indexCell >= nbCells + (specialCase ? 1 : 0))
                    return undefined;
                if (nbCells === scaleSize)
                    return 1;
                if (nbCells === 1)
                    return scaleSize;
                if (indexCell === 0)
                    return 1;
                if (specialCase && (indexCell === Math.floor(nbCells / 2) || indexCell === nbCells))
                    return 1;
                if (!specialCase && indexCell === nbCells - 1)
                    return 1;
        
                const remainingRanks = scaleSize - 2 - (specialCase ? 1 : 0);
                const remainingCells = nbCells - 2;
                const adaptedIndex = indexCell - (indexCell > nbCells / 2 && specialCase ? 1 : 0);
        
                return Math.round((remainingRanks / remainingCells) * adaptedIndex) -
                    Math.round((remainingRanks / remainingCells) * (adaptedIndex - 1));
            }
        },
        mounted () {
            this.$nextTick(() => {
                // TODO pages here
                this.pageList.forEach(page => page.create());
                this.showPage(1);
                
            });
        }
    });
}
