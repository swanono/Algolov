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

/**
 * DAO base class used as basic middleware between server and database
 */
class DAO {
    sessionId;
    database;
    clientConnexion;
    collectionName;
    logId;

    constructor (collectionName, sessionId = 0, callback = () => {}, url = config.dbUrl, dbName = config.dbName) {
        this.collectionName = collectionName;

        mongo.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err, db) => {
            if (err) {
                console.error('Une erreur est survenue lors de la création de la base de données : ' + err);
                return;
            }

            this.clientConnexion = db;
            this.database = db.db(dbName);

            console.log('new connection to database "' + this.database.databaseName + '" established. ID : ' + sessionId);

            this.sessionId = sessionId;

            this.logId = '[Connection ' + sessionId + '] ';

            callback();
        });
    }

    _insert (data) { return this.database.collection(this.collectionName).insertOne(data); }

    _find (query, one) {
        let resPromise;

        if (one)
            resPromise = this.database.collection(this.collectionName).findOne(query);
        else
            resPromise = this.database.collection(this.collectionName).find(query);

        return resPromise;
    }

    _update (query, newData, one) {
        let resPromise;

        if (one)
            resPromise = this.database.collection(this.collectionName).updateOne(query, newData);
        else
            resPromise = this.database.collection(this.collectionName).updateMany(query, newData);

        return resPromise;
    }

    _delete (query, one) {
        let resPromise;

        if (one)
            resPromise = this.database.collection(this.collectionName).deleteOne(query);
        else
            resPromise = this.database.collection(this.collectionName).deleteMany(query);

        return resPromise;
    }

    dropCollection () {
        return this.database.collection(this.collectionName).drop();
    }

    closeConnexion () {
        this.clientConnexion.close();
    }
}

/**
 * DAO subclass used as accessor for the Users collection
 */
class DAOUsers extends DAO {
    static nameDbUser = 'Users';

    constructor (sessionId, callback, url, dbName) {
        super(DAOUsers.nameDbUser, sessionId, callback, url, dbName);
    }

    insert (user) {
        // TODO : tester si le self marche
        const self = this;

        return new Promise(function (resolve, reject) {
            checker.checkNewUser(user)
                .then(validUser => self._insert(validUser))
                .then(result => {
                    console.log(self.logId + 'Inserted ' + result.insertedCount +
                        ' in ' + self.collectionName);
                    resolve(result);
                })
                .catch(err => {
                    console.error(err);
                    reject(err);
                });
        });
    }
}

module.exports.DAOUsers = DAOUsers;
