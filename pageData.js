/*
-------------------------------------------------------------------------------------------------
<Une ligne décrivant le nom du programme et ce qu’il fait>
Copyright © 2019 Ulysse GUYON
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

This module is used for retrieving simple data for the admin pages to be filled properly
*/
'use strict';

const fs = require('fs');

class DataGetter {
    static getFeatureDocsHist () {
        const docs = [];

        const featuresDir = fs.readdirSync('./admin/features_files/historic');

        featuresDir.forEach(featuresFile => {
            const newDoc = {};

            newDoc.path = '../features_files/historic/' + featuresFile;
            newDoc.name = featuresFile;

            docs.push(newDoc);
        });

        // TODO : récupérer le nom du fichier actuellement utilisé (BDD ?)

        return docs;
    }
}

module.exports = DataGetter;
