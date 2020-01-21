const userInsert = {
    "window":{"x":1366,"y":632},
    "features":[
        {"id":1,"text":"Signes particuliers (grains de beauté, taches de rousseur, bronzage, tatouages, piercings...)","type":"physique-1"},
        {"id":2,"text":"Sous-vêtements","type":"physique-1"},
        {"id":3,"text":"Couleur des yeux","type":"physique-1"},
        {"id":4,"text":"Longueur des cheveux","type":"physique-1"},
        {"id":5,"text":"Couleur de cheveux","type":"physique-1"},
        {"id":6,"text":"Style de cheveux","type":"physique-1"},
        {"id":7,"text":"Silhouette (mince, sportif.ve, ronde, costaud, body builder…)","type":"physique-1"},
        {"id":8,"text":"Origines","type":"physique-1"},
        {"id":9,"text":"Taille","type":"physique-1"},
        {"id":10,"text":"Poids","type":"physique-1"},
        {"id":11,"text":"Pilosité (rasé.e, imberbe, juste ce qu'il faut, ours...)","type":"physique-2"},
        {"id":12,"text":"Perception de l'aspect physique (très agréable à regarder, agréable à regarder, dans la moyenne…)","type":"physique-2"},
        {"id":13,"text":"Taille du pénis","type":"physique-2"},
        {"id":14,"text":"Circoncision","type":"physique-2"},
        {"id":15,"text":"Taille de la poitrine","type":"physique-2"},
        {"id":16,"text":"Taille de bonnet (A, B, C, D, DD…)","type":"physique-2"},
        {"id":17,"text":"Parties du corps considérées des zones érogènes","type":"physique-2"},
        {"id":18,"text":"Importance de la taille (hauteur)","type":"physique-2"},
        {"id":19,"text":"Sexe","type":"physique-2"},
        {"id":20,"text":"Age","type":"physique-2"},
        {"id":21,"text":"Style d'habillement du jour","type":"physique-2"},
        {"id":22,"text":"Style d'habillement du soir","type":"physique-2"},
        {"id":23,"text":"Style de vêtement en lien avec la personnalité (bab, cutester, BCBG, bohème, chic, classique, décontracté, electro, excentrique, fluo)","type":"attitude"},
        {"id":24,"text":"Consommation d'alcool et fréquence","type":"attitude"},
        {"id":25,"text":"Consommation du tabac et fréquence","type":"attitude"},
        {"id":26,"text":"Régime alimentaire, habitudes, plats préférés, importance accordée aux repas","type":"attitude"},
        {"id":27,"text":"S'exposer en photos","type":"attitude"},
        {"id":28,"text":"S'exposer en vidéos","type":"attitude"},
        {"id":29,"text":"Orientation sexuelle (hétéro, homo, bi, trans)","type":"attitude"},
        {"id":30,"text":"Fétichisme avec des vêtements (cuir, équipement de sports, skateur.se, caoutchouc, sous-vêtements, peaux et punks, bottes, lycra, uniforme, robe de soirée, raver, bas et bas, jeans, lingerie, travailleur)","type":"attitude"},
        {"id":31,"text":"Genre (agender, androgyne, asexué, bigender, cisgender, cisgender...)","type":"attitude"},
        {"id":32,"text":"Genre (agender, androgyne, asexué, bigender, cisgender, cisgender...)","type":"attitude"},
        {"id":33,"text":"Talents culinaires","type":"autres"},{"id":34,"text":"Statut VIH","type":"autres"},
        {"id":35,"text":"Lunettes ou lentilles de contact","type":"autres"},
        {"id":36,"text":"Maladies sexuellement transmissibles (Verrues génitales, Herpès type I, Herpès type II…)","type":"autres"},
        {"id":37,"text":"S'exposer en Webcam","type":"autres"},{"id":38,"text":"Mode et marques","type":"autres"},
        {"id":39,"text":"Sports préférés, sports pratiqués, fréquence de la pratique","type":"autres"},
        {"id":40,"text":"Satisfaction de l'apparence physique","type":"autres"},
        {"id":41,"text":"L'âge dans la tête","type":"autres"},
        {"id":42,"text":"Dates de rappels de pistage","type":"autres"}
    ],
    "beginQuestions":[
        {"descName":"soi","choice":"Homme","idQuestion":"1","idChoice":"1","questionText":"quel est votre sexe ?"},
        {"descName":"autre","choice":"Femme","idQuestion":"2","idChoice":"2","questionText":"quel est le sexe par lequel vous êtes attiré.e ?"}
    ],
    "rankingResult":[
        {"id":1,"type":"physique-1","ranks":{
            "0":[{"id":7,"text":"Silhouette (mince, sportif.ve, ronde, costaud, body builder…)"},{"id":8,"text":"Origines"}],
            "1":[{"id":5,"text":"Couleur de cheveux"},{"id":2,"text":"Sous-vêtements"}],
            "2":[],
            "3":[],
            "-3":[{"id":3,"text":"Couleur des yeux"},{"id":10,"text":"Poids"}],
            "-2":[{"id":4,"text":"Longueur des cheveux"},{"id":6,"text":"Style de cheveux"}],
            "-1":[{"id":9,"text":"Taille"},{"id":1,"text":"Signes particuliers (grains de beauté, taches de rousseur, bronzage, tatouages, piercings...)"}]
        }},
        {"id":2,"type":"physique-2","ranks":{
            "0":[{"id":20,"text":"Age"},{"id":12,"text":"Perception de l'aspect physique (très agréable à regarder, agréable à regarder, dans la moyenne…)"}],
            "1":[{"id":18,"text":"Importance de la taille (hauteur)"},{"id":19,"text":"Sexe"}],
            "2":[],
            "3":[],
            "-3":[{"id":21,"text":"Style d'habillement du jour"},{"id":22,"text":"Style d'habillement du soir"}],
            "-2":[{"id":14,"text":"Circoncision"},{"id":11,"text":"Pilosité (rasé.e, imberbe, juste ce qu'il faut, ours...)"}],
            "-1":[{"id":13,"text":"Taille du pénis"},{"id":17,"text":"Parties du corps considérées des zones érogènes"}]
        }},
        {"id":3,"type":"attitude","ranks":{
            "0":[{"id":27,"text":"S'exposer en photos"},{"id":30,"text":"Fétichisme avec des vêtements (cuir, équipement de sports, skateur.se, caoutchouc, sous-vêtements, peaux et punks, bottes, lycra, uniforme, robe de soirée, raver, bas et bas, jeans, lingerie, travailleur)"}],
            "1":[{"id":26,"text":"Régime alimentaire, habitudes, plats préférés, importance accordée aux repas"},{"id":29,"text":"Orientation sexuelle (hétéro, homo, bi, trans)"}],
            "2":[],
            "3":[],
            "-3":[{"id":28,"text":"S'exposer en vidéos"},{"id":31,"text":"Genre (agender, androgyne, asexué, bigender, cisgender, cisgender...)"}],
            "-2":[{"id":23,"text":"Style de vêtement en lien avec la personnalité (bab, cutester, BCBG, bohème, chic, classique, décontracté, electro, excentrique, fluo)"},{"id":32,"text":"Genre (agender, androgyne, asexué, bigender, cisgender, cisgender...)"}],
            "-1":[{"id":24,"text":"Consommation d'alcool et fréquence"},{"id":25,"text":"Consommation du tabac et fréquence"}]
        }},
        {"id":4,"type":"autres","ranks":{
            "0":[{"id":38,"text":"Mode et marques"},{"id":40,"text":"Satisfaction de l'apparence physique"}],
            "1":[{"id":42,"text":"Dates de rappels de pistage"},{"id":37,"text":"S'exposer en Webcam"}],
            "2":[],
            "3":[],
            "-3":[{"id":33,"text":"Talents culinaires"},{"id":41,"text":"L'âge dans la tête"}],
            "-2":[{"id":35,"text":"Lunettes ou lentilles de contact"},{"id":39,"text":"Sports préférés, sports pratiqués, fréquence de la pratique"}],
            "-1":[{"id":34,"text":"Statut VIH"},{"id":36,"text":"Maladies sexuellement transmissibles (Verrues génitales, Herpès type I, Herpès type II…)"}]
        }},
        {"id":1,"type":"physique-1","ranks":{
            "0":[{"id":10,"text":"Poids"},{"id":7,"text":"Silhouette (mince, sportif.ve, ronde, costaud, body builder…)"}],
            "1":[{"id":6,"text":"Style de cheveux"},{"id":3,"text":"Couleur des yeux"}],
            "2":[],
            "3":[],
            "-3":[{"id":5,"text":"Couleur de cheveux"},{"id":8,"text":"Origines"}],
            "-2":[{"id":1,"text":"Signes particuliers (grains de beauté, taches de rousseur, bronzage, tatouages, piercings...)"},{"id":4,"text":"Longueur des cheveux"}],
            "-1":[{"id":2,"text":"Sous-vêtements"},{"id":9,"text":"Taille"}]
        }},
        {"id":2,"type":"physique-2","ranks":{
            "0":[{"id":12,"text":"Perception de l'aspect physique (très agréable à regarder, agréable à regarder, dans la moyenne…)"},{"id":19,"text":"Sexe"}],
            "1":[{"id":20,"text":"Age"},{"id":18,"text":"Importance de la taille (hauteur)"}],
            "2":[],
            "3":[],
            "-3":[{"id":15,"text":"Taille de la poitrine"},{"id":11,"text":"Pilosité (rasé.e, imberbe, juste ce qu'il faut, ours...)"}],
            "-2":[{"id":17,"text":"Parties du corps considérées des zones érogènes"},{"id":21,"text":"Style d'habillement du jour"}],
            "-1":[{"id":22,"text":"Style d'habillement du soir"},{"id":16,"text":"Taille de bonnet (A, B, C, D, DD…)"}]
        }},
        {"id":3,"type":"attitude","ranks":{
            "0":[{"id":23,"text":"Style de vêtement en lien avec la personnalité (bab, cutester, BCBG, bohème, chic, classique, décontracté, electro, excentrique, fluo)"},{"id":25,"text":"Consommation du tabac et fréquence"}],
            "1":[{"id":30,"text":"Fétichisme avec des vêtements (cuir, équipement de sports, skateur.se, caoutchouc, sous-vêtements, peaux et punks, bottes, lycra, uniforme, robe de soirée, raver, bas et bas, jeans, lingerie, travailleur)"},{"id":31,"text":"Genre (agender, androgyne, asexué, bigender, cisgender, cisgender...)"}],
            "2":[],
            "3":[],
            "-3":[{"id":24,"text":"Consommation d'alcool et fréquence"},{"id":29,"text":"Orientation sexuelle (hétéro, homo, bi, trans)"}],
            "-2":[{"id":28,"text":"S'exposer en vidéos"},{"id":32,"text":"Genre (agender, androgyne, asexué, bigender, cisgender, cisgender...)"}],
            "-1":[{"id":27,"text":"S'exposer en photos"},{"id":26,"text":"Régime alimentaire, habitudes, plats préférés, importance accordée aux repas"}]
        }},
        {"id":4,"type":"autres","ranks":{
            "0":[{"id":40,"text":"Satisfaction de l'apparence physique"},{"id":33,"text":"Talents culinaires"}],
            "1":[{"id":39,"text":"Sports préférés, sports pratiqués, fréquence de la pratique"},{"id":37,"text":"S'exposer en Webcam"}],
            "2":[],
            "3":[],
            "-3":[{"id":35,"text":"Lunettes ou lentilles de contact"},{"id":41,"text":"L'âge dans la tête"}],
            "-2":[{"id":42,"text":"Dates de rappels de pistage"},{"id":34,"text":"Statut VIH"}],
            "-1":[{"id":36,"text":"Maladies sexuellement transmissibles (Verrues génitales, Herpès type I, Herpès type II…)"},{"id":38,"text":"Mode et marques"}]
        }}
    ],
    "endQuestions":[
        {"idQuestion":"11","idChoice":"1","questionText":"quel est votre age ?","choiceText":"22"},
        {"idQuestion":"10","idChoice":"1","questionText":"quel est votre numéro de téléphone ? (Format internationnal, commençant par +33 pour la France ou +41 pour la Suisse)","choiceText":"+33649980536"},
        {"idQuestion":"9","idChoice":"1","questionText":"quelle est votre adresse mail ?","choiceText":"ulysse.guyon@gmail.com"},
        {"idQuestion":"8","idChoice":"1","questionText":"pourrions-nous vous contacter plus tard pour participer à un entretien d'environ 45min afin d'approfondir l'étude quantitative à laquelle vous participez actuellement ?","choiceText":"oui"},
        {"idQuestion":"7","idChoice":"3","questionText":"avez-vous eu dans le passé ou avez-vous actuellement une relation à long terme (petit.e ami.e, conjoint.e) ou à court terme (rencontre sexuelle) ?","choiceText":"non, je n'ai aucune experience dans les relations (amoureuse ou sexuelle)"},
        {"idQuestion":"3","idChoice":"3","questionText":"avez-vous utilisé une application de rencontres dans le passé ou utilisez-vous actuellement une application de rencontres ?","choiceText":"non, je n'ai jamais utilisé d'applications de rencontres"}
    ],
    "traces":[],
    "terminated": null
};

const adminInsert = {
    "username": "Test",
    "email": "ulysse.guyon@gmail.com",
    "password": "TestTest123"
};

const adminFind = {
    "username": "Name",
    "email": "ulysse.guyon@gmail.com",
    "password": "Test"
};

module.exports = {
    userInsert,
    adminInsert,
    adminFind
};
