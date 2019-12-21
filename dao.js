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

This module is used as an interface with the database
*/
'use strict';

const config = require('./config');
const checker = require('./daoChecker');
const mongo = require('mongodb').MongoClient;

const dbURL = 'mongodb://localhost:' + config.dbPort + '/';

// Database Object
let database;

// Collection names
const nameDbUser = 'Users';

// DAO Objects used as middleware between server and DB
const users = {};

mongo.connect(dbURL, (err, db) => {
    if (err) {
        console.error('Une erreur est survenue lors de la création de la base de données : ' + err);
        return;
    }

    database = db.db('db-algolov');

    console.log('Connected to database : ' + database.databaseName);
});

/**
 * --- Basic functions for DB access ---
 */

const dbInsert = (coll, data) => new Promise(function (resolve, reject) {
    database.collection(coll).insertOne(data, function (err, res) {
        if (err)
            console.error('Error during insertion in collection "' + coll + '" : ' + err);
    });
});

/**
 * --- Accessors for Users collection ---
 */

users.insert = (userObj) => new Promise(function (resolve, reject) {
    checker.checkNewUser(userObj)
        .then(user => dbInsert(nameDbUser, user))
        .then(() => {
            console.log('Inserted new user in Database');
            resolve();
        })
        .catch(err => reject(err));
});

module.exports.users = users;
