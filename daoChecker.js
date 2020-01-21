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

This module is used for checking the validity of the data passed to the dao
*/
'use strict';

const config = require('./config');
const util = require('util');
const JsonValidator = require('@hapi/joi');

const anyNumberSchema = JsonValidator.alternatives().try(
    JsonValidator.string().pattern(/^[0-9]+$/),
    JsonValidator.number()
);
const questionSchema = JsonValidator.object({
    choice: JsonValidator.string(),
    choiceText: JsonValidator.string(),
    questionText: JsonValidator.string(),
    idChoice: anyNumberSchema,
    idQuestion: anyNumberSchema
}).xor('choice', 'choiceText');

const userSchema = JsonValidator.object({
    window: JsonValidator.object({
        x: anyNumberSchema,
        y: anyNumberSchema
    }),

    features: JsonValidator.array().items(JsonValidator.object({
        id: anyNumberSchema,
        text: JsonValidator.string(),
        type: JsonValidator.string()
    })),

    beginQuestions: JsonValidator.array().items(
        questionSchema.append({ descName: JsonValidator.string().optional() })
    ).unique(),

    rankingResult: JsonValidator.array().items(JsonValidator.object({
        id: anyNumberSchema,
        type: JsonValidator.string(),
        ranks: JsonValidator.object().pattern(/^-*[0-9]+$/,
            JsonValidator.array().items(JsonValidator.object({
                id: anyNumberSchema,
                text: JsonValidator.string()
            })))
    })),

    endQuestions: JsonValidator.array().items(questionSchema).unique(),

    traces: JsonValidator.array().items(JsonValidator.object({
        name: JsonValidator.string(),
        data: JsonValidator.array().items(JsonValidator.object({
            t: anyNumberSchema
        }).unknown().allow(null))
    })),

    terminated: JsonValidator.alternatives().try(JsonValidator.boolean(), null).optional()
});

const adminSchema = JsonValidator.object({
    username: JsonValidator.string(),
    email: JsonValidator.string().email(),
    password: JsonValidator.string()
});

function isString (v) {
    return Object.prototype.toString.call(v) === '[object String]';
}

const checkers = {};

checkers.checkNewUser = async (userData) => userSchema.validateAsync(userData);

checkers.checkNewAdmin = async (adminData) => adminSchema.validateAsync(adminData);

checkers.checkAdminName = (adminName) => new Promise(function (resolve, reject) {
    if (isString(adminName)) {
        if (adminName.match(config.adminNameRegex))
            resolve(adminName);
        else
            reject(new Error('Given username is not a valid : id = ' + adminName));
    } else
        reject(new TypeError('The username given is not a strings : id = ' + adminName));
});

module.exports = checkers;
