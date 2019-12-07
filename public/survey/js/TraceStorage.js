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

This module is used to declare the class handling the information storage
*/

'use strict';

class TraceStorage {

    
    
    static GenerateJSON() 
    {
        let json='{ "userid":'+userid
            +', "window": { "x":'
            + window.innerWidth 
            +', "y":'+window.innerHeight 
            + '}, "statements":[';
        
        for(let key in randoms) 
		{
			json+=randoms[key];
			if(key<randoms.length-1)
				json+=',';
		}
		json+='], ';
		//...
		/*if(state>3&&configuration.threestate)
			json+=QTraceStorage.GenerateThreeState()+',';*/
		if(state>5)
			json+=QTraceStorage.GenerateQSortState()+',';
		if(state>6)
		{
			json+='"postdata": [';
			json+=QTraceStorage.GetJSONFromStore("interview");
			if(state>10)
				json+=","+QTraceStorage.GetJSONFromStore("exogen");
			json+='], '
		}
		//ajout des trace
		json+=QTraceStorage.GenerateTrace();
		json+='}';
        //console.log(json);
        return json;
    }


}
