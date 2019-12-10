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

This module is used to launch unit tests with jest
*/
'use strict';

// const DOMGenerator = require('../public/survey/js/DOMGenerator');

// Test de lancement de serveur avant les autres tests
describe('Testing server launching', () => {
    let serv;

    test('Server launched', done => {
        const server = require('../server.js');
        serv = server.app.listen(require('../config.js').port, () => {
            expect(serv.listening).toBe(true);
            done();
        });
    });

    afterAll(() => {
        serv.close();
    });
});

// Tests sur les fonctions du serveur
describe('Testing server related functions', () => {
    let server;
    let serv;

    beforeAll(() => {
        server = require('../server.js');
        serv = server.main();
    });

    afterAll(() => {
        serv.close();
    });
});

/* test('Colspan attributed correctly', () => {
    const inouts = [
        {
            nbCells: 1,
            indexCell: 0,
            scaleSize: 2,
            out: 2
        },
        {
            nbCells: 1,
            indexCell: 3,
            scaleSize: 8,
            out: undefined
        },
        {
            nbCells: 2,
            indexCell: 2,
            scaleSize: 6,
            out: 1
        },
        {
            nbCells: 2,
            indexCell: 1,
            scaleSize: 6,
            out: 4
        },
        {
            nbCells: 3,
            indexCell: 1,
            scaleSize: 7,
            out: 5
        },
        {
            nbCells: 4,
            indexCell: 2,
            scaleSize: 4,
            out: 1
        },
        {
            nbCells: 4,
            indexCell: 2,
            scaleSize: 9,
            out: 1
        },
        {
            nbCells: 4,
            indexCell: 3,
            scaleSize: 9,
            out: 3
        },
        {
            nbCells: 5,
            indexCell: 3,
            scaleSize: 10,
            out: 3
        },
        {
            nbCells: 6,
            indexCell: 2,
            scaleSize: 8,
            out: 1
        }
    ];

    inouts.forEach((inout) => {
        expect(DOMGenerator._getColSpan(inout.nbCells, inout.indexCell, inout.scaleSize)).toBe(inout.out);
    });
});
*/

// TODO : unit test on server.testFunc.isAdmin
// TODO : unit test on DOMGenerator._getColSpan
