/* eslint-disable no-undef */
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
    static get TYPE_UNCHANGABLE () { return 'else'; }
    static get TYPE_QUEST_BEGIN () { return 'questBegin'; }
    static get TYPE_BLOC () { return 'bloc'; }
    static get TYPE_QUEST_END () { return 'questEnd'; }

    constructor (id, type, isActive, isShown, creator) {
        this.id = id;
        this.type = type;
        this.isActive = isActive;
        this.isShown = isShown;
        this.create = creator; // function to use in vue.mounted {this.$nextTick {**here**}}
    }
}

function createPageList (config) {
    const pageList = [];
    let i = 0;
    pageList.push(new PageCarac(++i, PageCarac.TYPE_UNCHANGABLE, true, true, () => {/* Create RGPD Page */}));
    pageList.push(new PageCarac(++i, PageCarac.TYPE_UNCHANGABLE, true, false, () => {/* Create Begin Page */}));
    const questBegin = config.QCM.begin;
    const blocList = config.surveyConfiguration.blocThemes;
    const questEnd = config.QCM.end;

    if (questBegin.fragmented) {
        questBegin.list.forEach(question => pageList.push(
            new PageCarac(++i, PageCarac.TYPE_QUEST_BEGIN, false, false, () => {/* Create quest page with only [question] */})
        ));
    } else
        pageList.push(new PageCarac(++i, PageCarac.TYPE_QUEST_BEGIN, false, false, () => {/* Create quest page with questBegin.list */}));

    blocList.forEach(bloc => {
        pageList.push(new PageCarac(++i, PageCarac.TYPE_BLOC, false, false, () => {/* Create bloc with the right features */}));
    });

    if (questEnd.fragmented) {
        questEnd.list.forEach(question => pageList.push(
            new PageCarac(++i, PageCarac.TYPE_QUEST_END, false, false, () => {/* Create quest page with only [question] */})
        ));
    } else
        pageList.push(new PageCarac(++i, PageCarac.TYPE_QUEST_END, false, false, () => {/* Create quest page with questBegin.list */}));

    return pageList;
}

/* Créer tout le DOM d'un coup et ne l'afficher qu'en fonction des boutons cliqués */

let menuVue = null;
let bodyVue = null;

function setUpMenu (config) {
    const strCombinList = createCombinList(config.surveyConfiguration.descNames);

    menuVue = new Vue({
        el: '', // TODO get the right div
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
        el: '', // TODO get the right div
        data: {
            pageList: createPageList(config),
            shown: 0
        },
        methods: {
            showPage (pageId) {
                pageList = pageList.map(page => {
                    if (page.isShown)
                        page.isShown = false;
                    if (page.id === pageId)
                        page.isShown = true;
                    return page;
                });

                this.shown = pageList.filter(page => page.isShown).id;
            }
        },
        mounted () {
            this.$nextTick(() => {
                // TODO pages here
                this.pageList.forEach(page => page.create());
            });
        }
    });
}
