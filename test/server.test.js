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

This module is used to launch unit tests with jest on the server functions
*/
'use strict';

// Test de lancement de serveur avant les autres tests
describe('Testing server launching', () => {
    let serv;

    test('Server launched', done => {
        const server = require('../server');
        serv = server.app.listen(require('../config').port, () => {
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

// TODO : unit test on server.testFunc.isAdmin
