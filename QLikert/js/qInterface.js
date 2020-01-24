/*
*   Copyright 2019 Aurélien Milliat <aurelien.milliat@gmail.com>
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*
*/


/**
* Server Mode
*/
var isServer=true;
// If true : try to load automatically the file config.json in the root folder.
// If false : genrerate a drop window to select manually the file.


/**
 *  Variables
 */

var userid=0;
var isReplay=false;
var configuration;
var statements;
var randoms=[];
var threestatesresults={agree:[],neutral:[],disagree:[]};
var threestatesMap={agree:0,neutral:1,disagree:2};
var cardsForInterview;
var cardsMovements={};
var cardsDistances={};
var qlikert={};
var state=0;
var isMedia=false;
var baseCardValue={w:0,h:0};
var scaledNode=null;
var text="Configuration file (json)"
var replayScale=0;
var timefactor=1;
var likertIterator=0;
var isVerifing=false;

/**
 * Timming in millisec 
 */

var referenceTime=Date.now();

function ResetReferenceTime(offset)
{
     referenceTime=Date.now();
	 if(offset)
		referenceTime-=offset;
}
 
function GetMillisecSinceRefTime() 
{
    let time=Date.now()-referenceTime;
    //If here something goes wrong, reinit the timer.
    if (time<0) 
    {
        referenceTime=Date.now();
        return 0;
    }
    return time;
}

/**
 * Shuffle
 * 
 * http://jsfromhell.com/array/shuffle [v1.0]
 */

function ShuffleList(list) 
{
    for(let j,x,i=list.length;i;j=Math.floor(Math.random()*i),x=list[--i],list[i]=list[j],list[j]=x){};
    return list;
}

/**
 * Storage
 */
 
class Storage 
{
    static ClearStorage() 
    {
        sessionStorage.clear();
    }

    static CleanStorage(name) 
    {
        sessionStorage.removeItem(name);
    }

    static AppendToStorage(name,data)
    {
        let old=sessionStorage.getItem(name);
        if(old===null||old==="") 
            sessionStorage.setItem(name,data);
        else
            sessionStorage.setItem(name,old+","+data);
    }

    static StoreItem(name,object)
    {
        object.t=GetMillisecSinceRefTime();
        Storage.AppendToStorage(name,JSON.stringify(object));
        //console.log(JSON.stringify(object));
    }

    static GetJSONFromStore(name) 
    {
        let json='{ "name":"'+name+'", "data":[';
        json+=sessionStorage.getItem(name);
        json+=']}';
        return json;
    }

    static StoreThreeStatesValues() 
    {
		threestatesresults.disagree=QInterfaceGenerator.GetChildsIds(document.getElementById("disagree"),function(node){QInterfaceGenerator.RegisterParents("disagree","threestates",node);});
		threestatesresults.neutral=QInterfaceGenerator.GetChildsIds(document.getElementById("neutral"),function(node){QInterfaceGenerator.RegisterParents("neutral","threestates",node);});
		threestatesresults.agree=QInterfaceGenerator.GetChildsIds(document.getElementById("agree"),function(node){QInterfaceGenerator.RegisterParents("agree","threestates",node);});
    }

	static StoreQSortValues()
	{
		let size;
		if('qsort' in configuration.likerts[likertIterator])
			size=Object.keys(configuration.likerts[likertIterator].qsort).length;
		else
			alert(configuration.missingqtableparameters);
		let likert=[];
		let tab=[];
		for(let key in configuration.likerts[likertIterator].qsort)
			tab[tab.length]=Number.parseInt(key);
		tab.sort(function(a,b){return b-a;});
		for(let iterator in tab)
		{
			let object={}
			object.id="tab_"+([tab[iterator]]).toString();
			object.data=QInterfaceGenerator.GetChildsIds(document.getElementById("tab_"+(tab[iterator]).toString()),null,'tab_');
			if(object.data.length===1 && object.data[0].includes("tab_"))
				object.data=[];
			likert.push(object);
		}
		qlikert[likertIterator]=likert;
		return true;
	}

	static StoreTextInterview()
	{
		if(isReplay)
			return;
		let list=document.getElementsByTagName("textarea");
		for(let iterator=0;iterator<list.length;iterator++)
		{
			let object={}
			object.id=list[iterator].name;
			object.class=QInterfaceGenerator.GetParentWithId(list[iterator]).id;
			object.data=list[iterator].value;
			Storage.AppendToStorage("interview",JSON.stringify(object));
		}
	}
	
	static StoreExoResult()
	{
		if(isReplay)
			return;
		let list=document.getElementsByTagName("input");
		for(let iterator=0;iterator<list.length;iterator++)
		{	
			let object={}
			switch(list[iterator].type)
			{
				case "range":
				case "text":
				case "number":
					object.id=list[iterator].id;
					object.value=list[iterator].value;
					break;
				case "radio":
					object.id=list[iterator].name;
					let firstRound=true;
					while(list[iterator].type==="radio" && iterator<list.length && (firstRound || !iterator || list[iterator].parentNode===list[iterator-1].parentNode))
					{
						firstRound=false;
						if(list[iterator].checked)
							object.value=list[iterator].value;
						iterator++;
					}	
					iterator--;
					break;
				case "checkbox":
					object.id=list[iterator].name;
					object.value=[];
					while(list[iterator].type==="checkbox" && iterator<list.length)
					{
						if(list[iterator].checked)
							object.value.push(list[iterator].value);
						iterator++;
					}
					iterator--;
					break;
				default:
				case "button":
					continue;
			}
			if(list[iterator]["required"]&&(!object.value||object.value===""||object.value.length==0))
			{	
				alert(configuration.exoquizznotfull);
				return false;
			}
			if("id" in  object)
				Storage.AppendToStorage("exogen",JSON.stringify(object));
		}
		return true;
	}

    static CleanStorageFormTraces() 
    {
        Storage.CleanStorage("steps");
		Storage.CleanStorage("interview");
		Storage.CleanStorage("exogen");
		Storage.CleanStorage("focus");
		Storage.CleanStorage("change");
		Storage.CleanStorage("range");
		Storage.CleanStorage("keypress");
        Storage.CleanStorage("mousemove");
        Storage.CleanStorage("mouseclick");
        Storage.CleanStorage("scrolling");
		Storage.CleanStorage("zooming");
		Storage.CleanStorage("media");
		Storage.CleanStorage("drag");
		Storage.CleanStorage("drop");
		Storage.CleanStorage("errors");
		Storage.CleanStorage("draggablecontainer");
    }

	static StoreDraggableEvent(id,cardid)
	{
		if(isReplay)
			return;
		let object={};
        object.id=id;
		object.c=cardid;
        Storage.StoreItem('draggablecontainer',object);
	}
	
	static StoreNextStepEvent(step,extra)
    {
		if(isReplay)
			return;
        let object={};
        object.s=step;
		if(extra)
			object.e=extra;
        Storage.StoreItem('steps',object);
    }

	static StoreError(error, extra)
    {
		if(isReplay)
			return;
        let object={};
        object.log=error;
		if(extra)
			object.e=extra;
        Storage.StoreItem('errors',object);
    }

	static StoreOnChangeRadioEvent(event)
    {
		if(isReplay)
			return;
        let object={};
        object.id=event.currentTarget.parentNode.id;
		object.ty="r";
		if(event.currentTarget.checked)
			object.v=event.currentTarget.value;
        Storage.StoreItem('change',object);
    }

	 static StoreOnChangeCheckboxEvent(event)
     {
		if(isReplay)
			return;
        let object={};
        object.id=event.currentTarget.parentNode.id;	
		object.ty="cb";
		object.v=event.currentTarget.value;
		object.ic=event.currentTarget.checked;
        Storage.StoreItem('change',object);
     }

	static StoreFocusEvent(event)
     {
		if(isReplay)
			return;
        let object={};
        object.id=event.currentTarget.id;
        Storage.StoreItem('focus',object);
     }

	 static StoreRangeEvent(event)
     {
		if(isReplay)
			return;
        let object={};
        object.id=event.currentTarget.id;
		object.v=event.currentTarget.value;
        Storage.StoreItem('range',object);
     }

     static StoreKeyEvent(event)
     {
        let object={};
        object.id=event.currentTarget.id;
		object.ty=event.type;
        object.kc=event.code;
		object.ak=event.altKey;
		object.ck=event.ctrlKey;
		object.sk=event.shiftKey;
        Storage.StoreItem('keypress',object);
     }

    static StoreMousePositionData(event)
    {
		if(isReplay)
			return;
        let object={};
        object.x=event.clientX;
        object.y=event.clientY;
        Storage.StoreItem('mousemove',object);
    }

     static StoreMouseClickData(event,element_id)
     {
		if(isReplay)
			return;
        let object={};
		if(element_id)
			object.id=element_id;
        object.mid=event.button;
		object.x=event.clientX;
        object.y=event.clientY;
        Storage.StoreItem('mouseclick',object);
     }

	 static StoreScrollingData(event)
	 {
		if(isReplay)
			return;
		let object={};
		object.x0=document.scrollingElement.scrollLeft;
        object.y0=document.scrollingElement.scrollTop;
		object.w=document.scrollingElement.scrollWidth;
        object.h=document.scrollingElement.scrollHeight;
        Storage.StoreItem('scrolling',object);
     }

    static StoreEvent(event,eventType,element_id,extra)
    {
		if(isReplay)
			return;
        let object={};
        object.id=element_id;
        object.ty=eventType;
        if(extra)
            object.e=extra;
        Storage.StoreItem(event,object);
    }

	static GenerateQSortState()
	{
		let json='"qlikertresult": {';
		for(let likert=0; likert<Object.keys(qlikert).length;likert++)
		{
			json+='"'+likert+'":['
			for(let iterator=0;iterator<qlikert[likert].length;iterator++)
			{
				json+='{ "id": "'+qlikert[likert][iterator].id+'", "data": [';
				for(let key in qlikert[likert][iterator].data) 
				{
					json+=qlikert[likert][iterator].data[key];
					if(key<qlikert[likert][iterator].data.length-1)
						json+=',';
				}
				json+=']}';
				if(iterator<qlikert[likert].length-1)
					json+=',';
			}
			json+=']';
			if(likert<Object.keys(qlikert).length-1)
				json+=',';
		}
		json+=']';
		return json;
	}

	static GenerateThreeState()
	{
		let json='"threestatesresults": {"disagree": [';
		for(let key in threestatesresults.disagree) 
		{
			json+=threestatesresults.disagree[key];
			if(key<threestatesresults.disagree.length-1)
				json+=',';
		}
		json+='], "neutral": [';
		for(let key in threestatesresults.neutral) 
		{
			json+=threestatesresults.neutral[key];
			if(key<threestatesresults.neutral.length-1)
				json+=',';
		}
		json+='], "agree": [';
		for(let key in threestatesresults.agree) 
		{
			json+=threestatesresults.agree[key];
			if(key<threestatesresults.agree.length-1)
				json+=',';
		}

		json+=']}'
		return json;
	}

	static GenerateResultPreview()
	{
		let json='{"statements":[';
		for(let key in randoms) 
		{
			json+=randoms[key];
			if(key<randoms.length-1)
				json+=',';
		}
		json+='], ';
		if(state>3&&configuration.threestate)
			json+=Storage.GenerateThreeState()+',';
		if(state>5)
			json+=Storage.GenerateQSortState()+',';
		json+=Storage.GetJSONFromStore("steps")+',';
        json+=Storage.GetJSONFromStore("mousemove")+',';
        json+=Storage.GetJSONFromStore("mouseclick")+',';
        json+=Storage.GetJSONFromStore("drag")+',';
		json+=Storage.GetJSONFromStore("drop")+',';
		json+=Storage.GetJSONFromStore("draggablecontainer");
		json+='}';
		return json;

	}

	static GenerateTrace()
	{
		let json='"traces":[';
		json+=Storage.GetJSONFromStore("steps")+',';
        json+=Storage.GetJSONFromStore("range")+',';
        json+=Storage.GetJSONFromStore("focus")+',';
		json+=Storage.GetJSONFromStore("change")+',';
        json+=Storage.GetJSONFromStore("keypress")+',';
        json+=Storage.GetJSONFromStore("mousemove")+',';
        json+=Storage.GetJSONFromStore("mouseclick")+',';
		json+=Storage.GetJSONFromStore("scrolling")+',';
		json+=Storage.GetJSONFromStore("zooming")+',';
        json+=Storage.GetJSONFromStore("drag")+',';
		json+=Storage.GetJSONFromStore("drop")+',';
		json+=Storage.GetJSONFromStore("draggablecontainer")+',';
		json+=Storage.GetJSONFromStore("errors");
		if(isMedia)
			json+=','+Storage.GetJSONFromStore("media");
        json+=']';
		return json;
	}

    static SubmitData(filename, text, url, fonctor)
	{
		let data=new FormData();
		data.append("json", text);
		fetch(url,
		{
			method: "POST",
			body: data
		})
		.then(function(res){fonctor(res);});
	}
}

class Processor
{
	static DoCleanUp()
	{
		Storage.CleanStorageFormTraces();
		threestatesresults={agree:[],neutral:[],disagree:[]};
		qlikert=null;
		likertIterator=0;
		isVerifing=false;
	}

	static LoadStatement() 
	{
		//Storage.CleanStorageFormTraces();
		if(!configuration.likerts||configuration.likerts.length<likertIterator)
			return;
		if(configuration.likerts[likertIterator].statementsFile&&configuration.likerts[likertIterator].statementsType)
		{
			if(configuration.statementsType==="xml")
				FileManager.LoadFile(configuration.likerts[likertIterator].statementsFile,function parser(text){try{statements=FileManager.XMLParse(text);return true;}catch(e){console.log(e);return false;}},function(){return Processor.GenerateStatementsList();});
			else if(configuration.statementsType==="json")
				FileManager.LoadFile(configuration.likerts[likertIterator].statementsFile,function parser(text){try{statements=FileManager.JSONParse(text);return true;}catch(e){console.log(e);return false;}},function(){return Processor.GenerateStatementsList();});
			else
				alert(configuration.wrongstatementformatmessage);

		}
		else if(configuration.likerts[likertIterator].statements)
		{
			statements=configuration.likerts[likertIterator].statements;
			Processor.GenerateStatementsList();
		}
		else
			alert(configuration.wrongstatementformatmessage);
	}

	static LoadConfig() 
	{
		FileManager.LoadFile('config.json',function(text){try{configuration=FileManager.JSONParse(text);return true;}catch(e){console.log(e);return false;}},function(){return Processor.LoadStatement();});
	}

	static GenerateStatementsList() 
	{
		randoms=[];
		cardsMovements={};
		cardsDistances={};
		for(let key=0; key<statements.length;key++)
		{
			randoms.push(key);
			cardsMovements[key]=0;
			cardsDistances[key]=0;
		}
		ShuffleList(randoms);
		if(likertIterator===0)
			QInterfaceGenerator.GenerateStartPage();
		else
			QInterfaceGenerator.GenerateStepPage(configuration.likerts[likertIterator].qsorttext,configuration.startbutton,function(){state++;Storage.StoreNextStepEvent(state);QInterfaceGenerator.HideZoom(false);QInterfaceGenerator.GenerateCards();},["pickingZone"]);
	}
	
	static GetStatement(id)
	{
		for(let iterator=0;iterator<statements.length;iterator++)
			if(statements[iterator].id===id)
				return statements[iterator];
		return null;
	}
	
	static GenerateJSON() 
    {
        let json='{ "userid":'+userid+', "window": { "x":'+ window.innerWidth+', "y":'+window.innerHeight+'}, "statements":[';
		for(let key in randoms) 
		{
			json+=randoms[key];
			if(key<randoms.length-1)
				json+=',';
		}
		json+='], ';
		/*if(state>3&&configuration.threestate)
			json+=Storage.GenerateThreeState()+',';
		if(state>5)*/
			json+=Storage.GenerateQSortState()+',';
		if(state>6)
		{
			json+='"postdata": [';
			json+=Storage.GetJSONFromStore("interview");
			if(state>10)
				json+=","+Storage.GetJSONFromStore("exogen");
			json+='], '
		}
		json+=Storage.GenerateTrace();
		json+='}';
        //console.log(json);
        return json;
    }
}

/**
 * IHM
 */ 

class QInterfaceGenerator extends DOMGenerator 
{

	static AppendChildList(nodeid,list,animation)
	{
		let container=document.getElementById(nodeid);
		if(container)
		{
			for(let iterator=0; iterator<list.length;iterator++)
			{
				let card=document.getElementById(list[iterator]);
				//card["location"]=nodeid;
				container.appendChild(card);
				if(animation)
					QInterfaceGenerator.CardScaleOnDrop(list[iterator],nodeid);
			}
		}
	}

	static GetNewOrder(elementid)
	{
		let orderedList;
		if(state>5)
			orderedList=QInterfaceGenerator.GetChildsIds(document.getElementById(elementid),null,'tab_');
		else
			orderedList=QInterfaceGenerator.GetChildsIds(document.getElementById(elementid));
		Storage.StoreEvent("drop","elementslist",elementid,orderedList);
	}

	static RegisterParents(parentID,grandParentID,node)
	{
		node["stateScale"]=1;
		node["parentState"]=parentID;
		node["grandParentState"]=grandParentID;
		node["location"]=grandParentID;
	}

	static CheckState()
	{
		if(isVerifing)
			return QInterfaceGenerator.CheckPickingZoneEmptyFinnish();
		else
			return QInterfaceGenerator.CheckPickingZoneEmpty();
	}

	static CheckPickingZoneEmpty() 
	{
		let zone=document.getElementById("pickingZone");
		if(zone&&zone.childElementCount==0) 
		{
			state++;
			Storage.StoreNextStepEvent(state,"check");
			isVerifing=true;
			if(likertIterator+1<configuration.likerts.length)
				QInterfaceGenerator.AddContinueButton(function(){isVerifing=false;Storage.StoreQSortValues();likertIterator++;state++;Storage.StoreNextStepEvent(state);Processor.LoadStatement()});
			else
				QInterfaceGenerator.AddContinueButton(function(){isVerifing=false;Storage.StoreQSortValues();state++;Storage.StoreNextStepEvent(state);if(configuration.exoquizz)QInterfaceGenerator.GenerateExoQuizz();else QInterfaceGenerator.GenerateFinnishPage();});
		}
		return true;
	}

	static CheckPickingZoneEmptyFinnish() 
	{
		let zone=document.getElementById("pickingZone");
		let continueButton=document.getElementById("button");
		if(zone&&zone.childElementCount==0) 
			continueButton.disabled=false;
		else
			continueButton.disabled=true;
		return true;
	}

	static Check3StatesEmpty()
	{
		let agree=document.getElementById("agree");
		let disagree=document.getElementById("disagree");
		let neutral=document.getElementById("neutral");
		if(agree&&disagree&&neutral&&agree.childNodes.length==0&&disagree.childNodes.length==0&&neutral.childNodes.length==0) 
		{
			state++;
			Storage.StoreNextStepEvent(state,"check");
			QInterfaceGenerator.AddContinueButton(function(){Storage.StoreQSortValues();state++;Storage.StoreNextStepEvent(state);if(!isReplay)Storage.SubmitData("preview.json",Storage.GenerateResultPreview(),configuration.serverurlpreviewsubmit,function(res){if(res.status===200)cardsForInterview=FileManager.ParseJSON(res.responseText);});QInterfaceGenerator.GenerateStepPage(configuration.quizztext,configuration.startbutton,function(){state++;QInterfaceGenerator.GeneratePostInterview();Storage.StoreNextStepEvent(state);});});
			return true;
		}
		return true;
	}

	static Check3StatesEmptyFinnish()
	{
		let agree=document.getElementById("agree");
		let disagree=document.getElementById("disagree");
		let neutral=document.getElementById("neutral");
		let continueButton=document.getElementById("button");
		if(agree&&agree.childElementCount==0&&disagree&&disagree.childElementCount==0&&neutral&&neutral.childElementCount==0) 
			continueButton.disabled=false;
		else
			continueButton.disabled=true;
		return true;
	}

	static HideZoom(set)
	{
		let zoom=document.getElementById("zoomcontainer");
		if(zoom)
		{
			if(set)
				zoom.style.display="none";
			else
			{
				zoom.style.display="initial";
				/*if(document.getElementById("command"))
					zoom.style.bottom="32px";*/
			}
		}
	}

	static AddContinueButton(fonctor)
	{
		let button=document.createElement("button");
		button.id="button";
		button.appendChild(document.createTextNode(configuration.continuebutton));
		button.onclick=function(){fonctor();};
		let main=this.GetMain();
		main.insertBefore(button,main.firstChild);
	}

	static GenerateStepPage(contentpage,buttontext,functor,jokers)
	{
		QInterfaceGenerator.HideZoom(true);
		QInterfaceGenerator.CleanMain(jokers);
		let div=document.createElement("div");
		div.className="presdiv";
		let text=document.createElement("div");
		text.className="prestext noselect";
		text.innerHTML=contentpage;
		if(replayScale)
			text.style.fontSize=(replayScale*1.3)+"em";
		div.appendChild(text);
		let button=document.createElement("button");
		button.id="button";
		text=button.appendChild(document.createTextNode(buttontext));
		button.className="noselect";
		button.onclick=function(){functor();};
		div.appendChild(button);
		QInterfaceGenerator.GetMain().appendChild(div);
	}

	static GenerateZoomSlider()
	{
		let div=document.createElement("div");
		let text=div.appendChild(document.createTextNode(configuration.zoomtitle));
		div.id="zoomcontainer";
		div.className="slidecontainer noselect";
		/*if(document.getElementById("command"))
			div.style.bottom="32px";*/
		let slider=document.createElement("input");
		slider.type="range";
		slider.min=50;
		slider.max=200;
		slider.value=100;
		slider.class="slider";
		slider.id="zoom";
		slider.oninput=function(event){zooming(event);};
		div.appendChild(slider);
		document.body.appendChild(div/*,document.getElementById("main")*/);
	}

	static GeneratePostInterviewTable(labelText,list,id)
	{
		let div=document.createElement("div");
		let label=div.appendChild(document.createElement("div"));
		label.innerHTML=labelText;
		label.className="tabletitle ";
		let table=div.appendChild(document.createElement("table"));
		table.id=id;
		table.style="max-width:99.5%;max-height:20%";
		table.align="center";
		table.className="nestable noselect";
		for(let iterator=0;iterator<list.data.length;iterator++)
		{
			let row=table.insertRow(iterator);
			let li=document.createElement('div');
			li.appendChild(QInterfaceGenerator.GenerateStatement(Processor.GetStatement(parseInt(list.data[iterator]))));
			li.className="nested-item ";
			row.insertCell(0).appendChild(li);
			row.cells[0].className="nestable grey";
			row.cells[0].width="25%";
			let input=document.createElement("textarea");
			input.id="text_"+list.data[iterator];
			input.name=list.data[iterator];
			input.onkeydown=function(event){Storage.StoreKeyEvent(event)};
			input.onkeyup=function(event){Storage.StoreKeyEvent(event)};
			input.onfocus=function(event){Storage.StoreFocusEvent(event)};
			row.insertCell(1).appendChild(input);
		}
		return div;
	}

	static GeneratePostInterview()
	{
		let main=QInterfaceGenerator.GetMain();
		document.body.removeChild(document.getElementById("zoomcontainer"));
		QInterfaceGenerator.CleanMain();
		main.appendChild(document.createElement("br"));
		if(qsort[qsort.length-1].data.length)
		{
			main.appendChild(QInterfaceGenerator.GeneratePostInterviewTable(configuration.disagreeposttext,qsort[qsort.length-1],"disagree"));
			main.appendChild(document.createElement("br"));
		}
		if(qsort[0].data.length)
		{
			main.appendChild(QInterfaceGenerator.GeneratePostInterviewTable(configuration.agreeposttext,qsort[0],"agree"));
			main.appendChild(document.createElement("br"));
		}
		if(!cardsForInterview&&configuration.isDynamicDistance||configuration.isDynamicMovements)
		{
			let tabMouv=[];
			for(let key in cardsMovements)
				tabMouv[key]=[cardsMovements[key],key];
			tabMouv.sort(function(a,b){return b[0]-a[0];});
			let tabDist=[];
			for(let key in cardsDistances)
				tabDist[key]=[cardsDistances[key],key];
			tabDist.sort(function(a,b){return b[0]-a[0];});
			let data=[], iteratorMouv=0, iteratorDist=0;
			for(let iterator=0;iterator<configuration.dynamicStatementNumber;iterator++)
			{
				if(tabMouv[iteratorMouv][0]>0&&tabDist[iteratorDist][0]===0)
				{
					data.push(tabMouv[iteratorMouv][1]);
					iteratorMouv++;
				}
				else if(tabDist[iteratorDist][0]>0&&tabMouv[iteratorMouv][0]===0)
				{
					data.push(tabDist[iteratorDist][1]);
					iteratorDist++;
				}
				else if(tabDist[iteratorDist][0]>tabMouv[iteratorMouv][0])
				{
					data.push(tabDist[iteratorDist][1]);
					iteratorDist++;
				}
				else if(tabDist[iteratorDist][0]<tabMouv[iteratorMouv][0])
				{
					data.push(tabMouv[iteratorMouv][1]);
					iteratorMouv++;
				}
			}
			if(data.length)
			{
				cardsForInterview={};
				cardsForInterview["data"]=data;	
			}
		}
		if(cardsForInterview)
		{
			main.appendChild(QInterfaceGenerator.GeneratePostInterviewTable(configuration.whyposttext,cardsForInterview,"dynamic"));
			main.appendChild(document.createElement("br"));
		}
		let button=document.createElement("button");
		button.appendChild(document.createTextNode(configuration.continuebutton));
		button.className="noselect";
		button.id="button";
		button.onclick=function(){Storage.StoreTextInterview();state++;Storage.StoreNextStepEvent(state);if(configuration.exoquizz)QInterfaceGenerator.GenerateExoQuizz();else QInterfaceGenerator.GenerateFinnishPage();};
		main.appendChild(button);
	}

	static GenerateFinnishPage()
	{
		DragAndDropManager.Stop();
		let main=QInterfaceGenerator.GetMain();
		QInterfaceGenerator.CleanMain();
		QInterfaceGenerator.HideZoom(true);
		let div=document.createElement("div");
		div.appendChild(document.createElement("br"));
		div.appendChild(document.createElement("br"));
		div.id="finish";
		let text=document.createElement("div");
		text.innerHTML=configuration.finishtext;
		text.className="noselect";
		div.appendChild(text);
		div.appendChild(document.createElement("br"));
		div.appendChild(document.createElement("br"));
		div.appendChild(document.createElement("br"));
		div.appendChild(document.createElement("br"));
		div.appendChild(document.createElement("br"));

		let button=div.appendChild(document.createElement("button"));
		button.id="button";
		button.className="noselect";
		button.appendChild(document.createTextNode(configuration.notsendbutton));
		button.onclick=function()
		{
			Processor.DoCleanUp();
			QInterfaceGenerator.CleanMain();
			Processor.GenerateStatementsList();
		};
		button.style="margin-right:20px;"
		button=div.appendChild(document.createElement("button"));
		button.id="button";
		button.className="noselect";
		button.appendChild(document.createTextNode(configuration.sendbutton));
		button.onclick=function()
		{
			FileManager.SubmitFile(userid+".json",Processor.GenerateJSON(),configuration.serverurlsubmit,function(res){if(res.status!=200){if(confirm(configuration.networkerrortext))FileManager.GenerateFile("data.json",Processor.GenerateJSON());}});
			Processor.DoCleanUp();
			QInterfaceGenerator.CleanMain();
			Processor.GenerateStatementsList();
		};
		button.style="margin-left:20px;"
		main.appendChild(div);
	}

	static FindMissingId(parentNode)
	{
		for(let iterator=0;iterator<parentNode['childLimit'];iterator++)
		{
			if(!document.getElementById(div.id+'_'+iterator));
				return div.id+'_'+iterator;
		}
		return "";
	}

	static AddQStateDiv(elementid)
	{
		let name=elementid.substring(0,elementid.lastIndexOf("_"));
		let div=document.getElementById(name);
		if(!div)
			div=document.getElementById(elementid);
		if(!div)
			return;
		let count=div.childElementCount;
		if(div.firstChild.childElementCount>1)
			count+=div.firstChild.childElementCount-1;
		if(div.firstChild["childLimit"]>count)
			document.getElementById(elementid).appendChild(QInterfaceGenerator.CreateQStatediv(true, QInterfaceGenerator.FindMissingId(div)));
	}

	static CheckMissingDrop()
	{
		let divs=document.getElementsByClassName("toCheck");
		for(let iterator=divs.length-1; iterator>0; iterator--)
		{
			if(divs[iterator].firstChild)
			{
				let parentContainer=QInterfaceGenerator.GetParentWithId(divs[iterator].firstChild);
				parentContainer.firstChild.appendChild(divs[iterator].firstChild);
				parentContainer.removeChild(divs[iterator]);
			}
		}
	}

	static SetContainerId(cardid,containerid)
	{
		let card=document.getElementById(cardid);
		card["location"]=containerid;
	}

	static ChangeDropLocation(cardid,containerid)
	{
		if(state!=6&&state!=7)
			return;	
		let container=QInterfaceGenerator.GetParentWithId(document.getElementById(containerid));
		let parentContainer=QInterfaceGenerator.GetParentWithId(container);
		let card=document.getElementById(cardid);
		let tempvalue=0;
		if(parentContainer.id!="qstates")
		{
			if(!("location"in card) || !card["location"] || card["location"]==="threestates")
				return;
			QInterfaceGenerator.AddQStateDiv(card["location"]);
			card["location"]="threestates";
		}
		else
		{	
			if("location" in card && card["location"] && card["location"]!="threestates")
				QInterfaceGenerator.AddQStateDiv(card["location"]);
			if(card.parentNode!=container.firstChild)
				container.firstChild.appendChild(document.getElementById(cardid));
			if((container.firstChild["childLimit"]+1)<(container.firstChild.childElementCount+container.childElementCount))
				container.removeChild(container.childNodes[container.childElementCount-1]);
			card["location"]=containerid;
		}
		QInterfaceGenerator.CheckMissingDrop();
	}

	static GetQSortCheckFunctor(joker)
	{
		return function(){if(document.getElementById("qstates")!=null)return;if(joker)QInterfaceGenerator.CleanMain([joker]);if(document.getElementById("disagree")!=null){/*document.getElementById("disagree")["isFrozen"]=true;document.getElementById("agree")["isFrozen"]=true;document.getElementById("neutral")["isFrozen"]=true;*/}};
	}

	static GetQSortInsertToTitleCellFunctor()
	{
		return function(qConfig,node,iterator,tab){node.innerHTML=qConfig[tab[iterator]].title;};
	}

	static GetQSortInsertFunctor()
	{
		return function(node)
		{
			main.insertBefore(node, main.firstChild);
			QInterfaceGenerator.OpacityAnimation(node,0.0,1.0,configuration.opacityanimationinterval,configuration.opacityanimationduration);
			let name;
			if(configuration.threestate)
			{
				name="threestates";
				document.getElementById("threestates").style="initial";
			}
			else
			{
				name="pickingZone";
				document.getElementById("pickingZone").style="initial";
			}
			QInterfaceGenerator.OpacityAnimation(document.getElementById(name),0.0,1.0,configuration.opacityanimationinterval,configuration.opacityanimationduration);
			DragAndDropManager.Start();
		};
	}

	static GetThreeStatesCheckFunctor()
	{
		return function(){QInterfaceGenerator.CleanMain(["pickingZone"]);};
	}

	static GetThreeStatesInsertToTitleCellFunctor()
	{
		return function(threeStateConfig,div,iterator){div.className="tabletitle";div.innerHTML=threeStateConfig[iterator].text;};
	}

	static GetThreeStatesInsertFunctor()
	{
		return function(node){document.getElementById("pickingZone").style.display="initial";let main=QInterfaceGenerator.GetMain();main.insertBefore(node, main.firstChild);QInterfaceGenerator.OpacityAnimation(node,0.0,1.0,configuration.opacityanimationinterval,configuration.opacityanimationduration);};
	}

	static SetMediaEvent(player)
	{
		isMedia=true;
		if('onwebkitfullscreenchange' in player)
			player.onwebkitfullscreenchange=(function(id){return function(){let media=document.getElementById(id);Storage.StoreEvent("media","fullscreen",id,media.mozFullScreen);};})(player.id);
		player.onpause=(function(id){return function(){let media=document.getElementById(id);Storage.StoreEvent("media","pause",id,media.currentTime);};})(player.id);
		player.onplay=(function(id){ return function(){let media=document.getElementById(id);Storage.StoreEvent("media","play",id,media.currentTime);};})(player.id);
		player.onended=(function(id){return function(){Storage.StoreEvent("media","end",id);};})(player.id);
		player.onseeking=(function(id){return function(){let media=document.getElementById(id);Storage.StoreEvent("media","seeking",id,media.currentTime);};})(player.id);
		player.onvolumechange=(function(id){return function(){let media=document.getElementById(id);Storage.StoreEvent("media","volumechange",id,media.volume);};})(player.id);
		//Behavior correction for chromium.
		//player.onmousedown=function(event){event.stopPropagation();};
	}

	static GenerateStatement(statement) 
	{
		if(!statement)
			return;
		if(statement.type==="text")
		{
			let text=document.createElement("div");
			text.innerHTML=statement.text;
			return text;
		}
		if(statement.type==="image") 
		{
			let image=document.createElement("img");
			image.setAttribute("src",statement.image);
			image.oncontextmenu=function(event){event.preventDefault();event.stopPropagation();QInterfaceGenerator.ScaleElement(event.target.parentNode);};
			return image;
		}
		if(statement.type==="audio") 
		{
			let audio=document.createElement("audio");
			audio.id='audio-player-'+statement.id;
			audio.controls='controls';
			audio.controlsList="nodownload";
			audio.src=statement.audio;
			QInterfaceGenerator.SetMediaEvent(audio);
			if('description' in statement)
			{
				let div=document.createElement("div");
				div.appendChild(audio);
				div.appendChild(document.createTextNode(statement.description));
				return div;
			}
			return audio;
		}
		if(statement.type==="video") 
		{
			let video=document.createElement("video");
			video.id='video-player-'+statement.id;
			video.controls='controls';
			video.src=statement.video;
			video.controlsList="nodownload";
			QInterfaceGenerator.SetMediaEvent(video);
			return video;
		}
		alert(configuration.unknowstatementype);
		return null;
	}

	static GenerateCards() 
	{
		let main=QInterfaceGenerator.GetMain();
		QInterfaceGenerator.CleanMain();
		QInterfaceGenerator.HideZoom(false);
		let button=document.createElement("button");
		button.id="button";
		button.className="noselect";
		button.appendChild(document.createTextNode(configuration.continuebutton));
		if(configuration.threestate)
			button.onclick=function(){state++;Storage.StoreNextStepEvent(state);QInterfaceGenerator.GenerateStepPage(configuration.threestatetext,configuration.startbutton,function(){state++;Storage.StoreNextStepEvent(state);QInterfaceGenerator.GenerateThreeStates(configuration.threestate,QInterfaceGenerator.GetThreeStatesCheckFunctor(),QInterfaceGenerator.GetThreeStatesInsertToTitleCellFunctor(),QInterfaceGenerator.GetThreeStatesInsertFunctor());},["pickingZone"]);};	
		else	
			button.onclick=function(){state++;Storage.StoreNextStepEvent(state);QInterfaceGenerator.GenerateQStates(configuration.likerts[likertIterator].isCrescent,configuration.likerts[likertIterator].statementsAlignement,configuration.likerts[likertIterator].qsort,QInterfaceGenerator.GetQSortCheckFunctor("pickingZone"),QInterfaceGenerator.GetQSortInsertToTitleCellFunctor(),QInterfaceGenerator.GetQSortInsertFunctor());};
		main.appendChild(button);
		let pickingZone=document.createElement("div");
		pickingZone.id="pickingZone";
		pickingZone.className="nestable";
		for(let key in randoms)
		{
			let li=document.createElement('div');
			li.appendChild(QInterfaceGenerator.GenerateStatement(statements[randoms[key]]));
			li.className="nested-item noselect";
			li["location"]="pickingZone";
			li["baseFontSize"]=1.2;
			li.oncontextmenu=function(event){if(!event.target.classList.contains("nested-item"))return;event.preventDefault();QInterfaceGenerator.ScaleElement(event.target);};
			li.id=statements[randoms[key]].id;
			if(replayScale)
			{
				li.style.width=(replayScale*320)+"px";
				li.style.height=(replayScale*190)+"px";
				li.style.fontSize=(replayScale*1.2)+"em";
				li.style.padding=(replayScale*10)+"px";
				li.style.borderRadius=(replayScale*25)+"px";
			}
			pickingZone.appendChild(li);
		}
		main.appendChild(pickingZone);

		DragAndDropManager.Start();
		QInterfaceGenerator.OpacityAnimation(pickingZone,0.0,1.0,configuration.opacityanimationinterval,configuration.opacityanimationduration);
	}

	static ChangeCardScale(card,scale)
	{	
		if(!card["baseWidth"])
			card["baseWidth"]=card.scrollWidth>0?card.scrollWidth:baseCardValue.w;
		else if(!baseCardValue.w)
			baseCardValue.w=card["baseWidth"];
		if(!card["baseHeight"])
			card["baseHeight"]=card.scrollHeight>0?card.scrollHeight:baseCardValue.h;
		else if(!baseCardValue.h)
			baseCardValue.h=card["baseHeight"];
		if(!card["baseFontSize"])
			card["baseFontSize"]=parseFloat(card.style.fontSize);
		if(!card["stateScale"])
			card["stateScale"]=1;
		if(!scale)
		{
			if(!card["baseScale"])
				card["baseScale"]=1;
			scale=card["baseScale"];
		}
		else
			card["baseScale"]=scale;
		card.style.width=Math.ceil(card["baseWidth"]*scale*card["stateScale"])+"px";
		card.style.height=Math.ceil(card["baseHeight"]*scale*card["stateScale"])+"px";
		card.style.fontSize=card["baseFontSize"]*scale*card["stateScale"]+"em";
	}

	static CardScaleOnDrop(cardid,containerid)
	{
		let card=document.getElementById(cardid);
		let container;
		if(!containerid)
			container=document.getElementById(cardid).parentNode;
		else
			container=document.getElementById(containerid);
		let parentContainer=QInterfaceGenerator.GetParentWithId(container.parentNode);
		let location=null;
		if(parentContainer.id=="body")
			parentContainer=container;
		if(!card)
			return;
		let smaller=false;
		let realstate=state;
		let origin="threestates";
		if(!configuration.threestate)
		{
			realstate+=3;
			origin="pickingZone";
		}
		switch(realstate)
		{
			case 3:
			case 4:
				if(container.id!==origin)
				{
					if(!("container" in card)||!card["container"])
						card["container"]=container.id;
					else
					{
						if(configuration.isDynamicDistance&&card["container"] in threestatesMap&&container.id in threestatesMap)
						{
							let val1=threestatesMap[card["container"]];
							let val2=threestatesMap[container.id]
							cardsDistances[card.id]+=Math.abs(val1-val2);
						}
						if(configuration.isDynamicMovements&&card["container"]!==container.id)
							cardsMovements[card.id]++;
						card["container"]=container.id;
					}
				}
				if(container.id==="pickingZone")
				{
					if(card["location"]==="pickingZone")
						return;
					card["location"]="pickingZone";
					break;
				}
				else if(parentContainer.id==="threestates" && "location" in card && card["location"] && QInterfaceGenerator.GetParentWithId(document.getElementById(card["location"])).id==="threestates")
					return;
				smaller=true;
				card["location"]=parentContainer.id;
				break;
			case 6:
			case 7:
				if(container.id!==origin)
				{
					if(!("container" in card)||!card["container"]||card["container"] in threestatesMap)
						card["container"]=container.id;
					else
					{
						if(configuration.isDynamicDistance)
							cardsDistances[card.id]+=Math.abs(Number.parseInt(card["container"].substring(4))-Number.parseInt(container.id.substring(4)));
						if(configuration.isDynamicMovements&&card["container"]!==container.id)
							cardsMovements[card.id]++;
						card["container"]=container.id;
					}
				}
				if(((parentContainer && parentContainer.id==="qstates")||(container && container.id==="qstates")) && "location" in card && card["location"])
				{
					
					location=QInterfaceGenerator.GetParentWithId(document.getElementById(card["location"]).parentNode);
					if(location.id==="qstates")
						return;
				}
				else if((parentContainer && parentContainer.id===origin)||(container && container.id===origin))
				{
					if(card["location"]===origin)
						return;
					break;
				}
				smaller=true;
				break;
			default:
				return;
		}
		if(smaller)
			QInterfaceGenerator.ScalingAnimation(card,1.0,configuration.scalinganimationminvalue,configuration.scalinganimationinterval,configuration.scalinganimationduration);
		else
			QInterfaceGenerator.ScalingAnimation(card,configuration.scalinganimationminvalue,1.0,configuration.scalinganimationinterval,configuration.scalinganimationduration);
	}

	static ChangeCardsScale(scale)
	{
		let cards = document.getElementsByClassName("nested-item");
		for(let iterator=0;iterator<cards.length;iterator++)
			QInterfaceGenerator.ChangeCardScale(cards[iterator],scale);
	}

	static SetParameters(node,parameters)
	{
		let isRequired=false;
		for(let iterator=0; iterator<parameters.length; iterator++)
		{
			node[parameters[iterator].name]=parameters[iterator].value;
			if(parameters[iterator].name==="required"&&parameters[iterator].value)
				isRequired=true;
		}
		return isRequired;
	}

	static GenerateExoQuizz()
	{
		QInterfaceGenerator.HideZoom(true);
		let main=QInterfaceGenerator.GetMain();
		QInterfaceGenerator.CleanMain();
		let form=document.createElement("table");	
		form.className="tableExo";
		for(let iterator=0; iterator<configuration.exoquizz.length;iterator++)
		{
			let row=form.insertRow(iterator);
			row.className="trExo";
			row.insertCell(0).appendChild(document.createTextNode(configuration.exoquizz[iterator].text));
			row.cells[0].className="tdExo";
			let div=row.insertCell(1);
			let input,label,radio,checkbox,range,datalist,option,asterix;
			switch(configuration.exoquizz[iterator].type)
			{
				case "text":
					input=document.createElement("input");
					input.id=configuration.exoquizz[iterator].id;
					input.type="text";
					input.onkeydown=function(event){Storage.StoreKeyEvent(event)};
					input.onkeyup=function(event){Storage.StoreKeyEvent(event)};
					input.onfocus=function(event){Storage.StoreFocusEvent(event)};
					if(QInterfaceGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
							form.rows[iterator].cells[0].innerHTML+="(*)";
					div.appendChild(input);
					break;
				case "number":
					input=document.createElement("input");
					input.id=configuration.exoquizz[iterator].id;
					input.type="number";
					input.onkeydown=function(event){Storage.StoreKeyEvent(event)};
					input.onkeyup=function(event){Storage.StoreKeyEvent(event)};
					input.onfocus=function(event){Storage.StoreFocusEvent(event)};
					if(QInterfaceGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
							form.rows[iterator].cells[0].innerHTML+="(*)";
					div.appendChild(input);
					break;
				case "radio":
					radio=document.createElement("div");
					radio.id=configuration.exoquizz[iterator].id;
					asterix=false;
					for(let iterator2=0; iterator2<configuration.exoquizz[iterator].values.length;iterator2++)
					{
						input=document.createElement("input");
						input.value=configuration.exoquizz[iterator].values[iterator2];
						input.type="radio";
						input.name=configuration.exoquizz[iterator].id;
						input.id=configuration.exoquizz[iterator].id+"_"+iterator2;
						input.onchange=function(event){Storage.StoreOnChangeRadioEvent(event)};
						radio.appendChild(input);
						label=document.createElement("label");
						label.innerHTML=configuration.exoquizz[iterator].values[iterator2];
						label.htmlFor=input.id;
						if(QInterfaceGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
							asterix=true;
						radio.appendChild(label);
					}
					if(asterix)
						form.rows[iterator].cells[0].innerHTML+="(*)";
					div.appendChild(radio);
					break;
				case "checkbox":
					let checkbox=document.createElement("div");
					asterix=false;
					checkbox.id=configuration.exoquizz[iterator].id;
					for(let iterator2=0; iterator2<configuration.exoquizz[iterator].values.length;iterator2++)
					{
						input=document.createElement("input");
						input.value=configuration.exoquizz[iterator].values[iterator2];
						input.type="checkbox";
						input.name=configuration.exoquizz[iterator].id;
						input.id=configuration.exoquizz[iterator].id+"_"+configuration.exoquizz[iterator].values[iterator2];
						input.onchange=function(event){Storage.StoreOnChangeCheckboxEvent(event)};
						checkbox.appendChild(input);
						label=document.createElement("label");
						label.innerHTML=configuration.exoquizz[iterator].values[iterator2];
						label.htmlFor=input.id;
						checkbox.appendChild(label);
						if(QInterfaceGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
							asterix=true;
					}	
					if(asterix)
						form.rows[iterator].cells[0].innerHTML+="(*)";
					div.appendChild(checkbox);
					break;
				case "range":
					range=document.createElement("div");
					range.id=configuration.exoquizz[iterator].id;
					input=document.createElement("input");
					input.type="range";
					input.className="rangeExo";
					input.id=configuration.exoquizz[iterator].id;
					if(configuration.exoquizz[iterator].value.length)
					{
						input.setAttribute("list", "datalist_"+configuration.exoquizz[iterator].id);
						datalist=document.createElement("datalist");
						datalist.id=input.list;
						for(let iterator2=0; iterator2<configuration.exoquizz[iterator].value.length; iterator2++)
						{
							option=document.createElement("option");
							option.value=configuration.exoquizz[iterator].value[iterator2];
							datalist.appendChild(option);
						}
						div.appendChild(datalist);
					}
					else
						input.value=configuration.exoquizz[iterator].value;
						
					input.oninput=function(event){QTraceSorage.StoreRangeEvent(event);};
					if(QInterfaceGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
							form.rows[iterator].cells[0].innerHTML+="(*)";
					range.appendChild(input);
					div.appendChild(range);
					break;
			}
		}
		let requiredDiv=null;
		if(configuration.requiredtext)
		{
			requiredDiv=document.createElement("div");
			requiredDiv.innerHTML="(*) "+configuration.requiredtext;
			requiredDiv.style.color="grey";
		}
		let submit=document.createElement("input");
		submit.type="button";
		submit.id="button";
		submit.className="noselect";
		submit.value=configuration.continuebutton;
		submit.onclick=function(){if(Storage.StoreExoResult()){state++;Storage.StoreNextStepEvent(state);QInterfaceGenerator.GenerateFinnishPage();}};
		main.appendChild(form);
		if(requiredDiv)
			main.appendChild(requiredDiv);
		main.appendChild(document.createElement("br"));
		main.appendChild(submit);
	}

	static OpacityAnimation(element,start,end,interval,duration)
	{
		  element.style.opacity=start;
		  let acc=start;
		  let step=timefactor*(end-start)*interval/duration; 
		  let id=setInterval(frame, timefactor*interval);
		  function frame()
		  {
				acc+=step;
				if (acc>=end) 
				{
					clearInterval(id);
					acc=end;
				}
				element.style.opacity=acc; 
		  }
	}

	static ScalingAnimation(element,start,end,interval,duration)
	{
		  if("scaleAnimation" in element && element["scaleAnimation"]!=0)
			return;
		  let acc=start;
		  let step=timefactor*(end-start)*interval/duration; 
		  let id=setInterval(frame, timefactor*interval);
		  element["scaleAnimation"]=end-start;
		  function frame()
		  {
				acc+=step;
				if (acc>=end&&step>0 || acc<=end&&step<0) 
				{
					element["scaleAnimation"]=0;
					clearInterval(id);
					acc=end;
				}
				element["stateScale"]=acc;
				QInterfaceGenerator.ChangeCardScale(element,0);
		  }
	}

	static TranslateAnimation(element,start,end,interval,duration)
	{
		  let acc=start;
		  let stepX=timefactor*(end.x-start.x)*interval/duration;
		  let stepY=timefactor*(end.y-start.y)*interval/duration;
		  let id=setInterval(frame, timefactor*interval);
		  function frame()
		  {
				acc.x+=stepX;
				acc.y+=stepY;
				if (acc.x>=end.x&&stepX>0 || acc.x<=end.x&&stepX<0 || acc.y>=end.y&&stepY>0 || acc.y<=end.y&&stepY<0) 
				{
					clearInterval(id);
					acc=end;
				}
				element.style.transform="translate("+acc.x+"px,"+acc.y+"px)";
		  }
	}

	static UnscaleElement()
	{
		if(!scaledNode)
			return;	
		Storage.StoreEvent("zooming","scale",scaledNode.id,"initial");
		scaledNode.style.transform="initial";
		if(scaledNode["oldStateScale"])
		{
			scaledNode["stateScale"]=scaledNode["oldStateScale"];
			QInterfaceGenerator.ChangeCardScale(scaledNode,0);
		}
		scaledNode=null;
	}

	static GetGlobalOffsetLeft(element)
	{
		let acc=element.offsetLeft;
		while(element.offsetParent)
		{
			element=element.offsetParent;
			acc+=element.offsetLeft;
		}
		return acc;
	}

	static GetGlobalOffsetTop(element)
	{
		let acc=element.offsetTop;
		while(element.offsetParent)
		{
			element=element.offsetParent;
			acc+=element.offsetTop;
		}
		return acc;
	}

	static ScaleElement(element)
	{
		if(scaledNode&&scaledNode===element)
		{
			QInterfaceGenerator.UnscaleElement();
			return;
		}
		if(scaledNode)
			QInterfaceGenerator.UnscaleElement();
		scaledNode=element;
		if(scaledNode["stateScale"])
		{
			scaledNode["oldStateScale"]=scaledNode["stateScale"];
			scaledNode["stateScale"]=1;
			QInterfaceGenerator.ChangeCardScale(scaledNode,0);
		}
		let width=(element.style.width===""||element.offsetWidth>parseInt(element.style.width))?element.offsetWidth:parseInt(element.style.width);
		let scale=configuration.scalinganimationmaxvalue*Math.pow(1-width/window.innerWidth,2);
		if(scale*width>(window.innerWidth*0.75))
			scale=(window.innerWidth*0.95)/width;
		Storage.StoreEvent("zooming","scale",element.id,"scale("+scale+")");
		let x=(window.innerWidth/2)-(QInterfaceGenerator.GetGlobalOffsetLeft(element)+element.offsetWidth/2),y=(window.innerHeight/2)-(QInterfaceGenerator.GetGlobalOffsetTop(element)+element.offsetHeight/2);
		element.style.transform="translate("+x+"px,"+y+"px) scale("+scale+")";
	}

		static IsAcceptNewChild(container,target,locked)
	{
		if(!container||container.className==="")
			return null;
		if(container.className.includes("nested-item"))
			return QInterfaceGenerator.IsAcceptNewChild(container.parentNode,target,false);
		
		if(container.className.includes("nestable"))
		{
			if('isFrozen' in container && container.isFrozen)
			{
 				let containerTable=QInterfaceGenerator.GetParentTable(container);
 				let targetTable=QInterfaceGenerator.GetParentTable(target);
 				if(targetTable===containerTable)
					return null;
				return container;
			}
			if(!('childLimit' in container))
				return container;
			if('childLimit' in container && container.childLimit>QInterfaceGenerator.CountRealChildsInContainer(container))
				return container;
			if(locked)
				return null;
		}
		if(container.parentNode.className.includes("nest-container"))
			return QInterfaceGenerator.IsAcceptNewChild(container.parentNode,target,true);
		if(container.className.includes("nest-container"))
		{
			for(let iterator=0;iterator<container.childNodes.length;iterator++)
			{
				if(container.childNodes[iterator].className.includes("nestable"))
				{
					let res=QInterfaceGenerator.IsAcceptNewChild(container.childNodes[iterator],target,true);
					if(res)
						return res;
				}
			}
			return null;
		}
		return null;
	}
	
	static GenerateStartPage()
	{
		state=0;
		userid=0;
		QInterfaceGenerator.GetMain().className+=" main";
		DragAndDropManager.InitialiserManager(	'nested-item',
										'nest-container',
										function(id,parentid){QInterfaceGenerator.UnscaleElement();Storage.StoreEvent("drag","start",id,parentid);if(configuration.isThreeStatesDeck&&state>1)QInterfaceGenerator.UpdateDeckView(true);},
										function(id,parentid){Storage.StoreEvent("drag","end",id,parentid);QInterfaceGenerator.CardScaleOnDrop(id,parentid);if(parentid){QInterfaceGenerator.SetContainerId(id,parentid);QInterfaceGenerator.CheckState();QInterfaceGenerator.GetNewOrder(parentid);}if(configuration.isThreeStatesDeck)QInterfaceGenerator.UpdateDeckView(true);},
										function(id,cardid,extra){Storage.StoreDraggableEvent(id,cardid);if(configuration.isThreeStatesDeck)QInterfaceGenerator.UpdateDeckView(true);},
										function(container,target){return QInterfaceGenerator.IsAcceptNewChild(container,target,false);}
									);
		//QInterfaceGenerator.GenerateExoQuizz();//(configuration.introtext,configuration.startbutton,function(){ResetReferenceTime();QInterfaceGenerator.GenerateCards();QInterfaceGenerator.GenerateZoomSlider();Storage.StoreNextStepEvent(state);});
		QInterfaceGenerator.GenerateStepPage(configuration.introtext,configuration.startbutton,function(){ResetReferenceTime();Storage.ClearStorage();state++;QInterfaceGenerator.GenerateStepPage(configuration.likerts[likertIterator].qsorttext,configuration.startbutton,function(){state++;Storage.StoreNextStepEvent(state);QInterfaceGenerator.GenerateCards();},["pickingZone"]);QInterfaceGenerator.ChangeCardsScale(1.0);QInterfaceGenerator.GenerateZoomSlider();QInterfaceGenerator.HideZoom(true);Storage.StoreNextStepEvent(state);});
	}
}

/**
 * Function calls
 */

function start()
{
	likertIterator=0;
	if(isServer)
		Processor.LoadConfig();
	else
		QInterfaceGenerator.GenerateDropZone("id",text,QInterfaceGenerator.GetMain(),"json",false,"padding-top: 15%;",function(event){if(!event.length)return;FileManager.ReadFile(event[0],function(text){try{configuration=FileManager.JSONParse(text);if(!configuration.serverurlsubmit){alert(configuration.notaconfigfileerrortext);return false;}Processor.LoadStatement();return true;}catch(e){console.log(e);alert(configuration.jsonparsingerrortext);return false;}});});
}

function mousemove(event) 
{
    Storage.StoreMousePositionData(event);
}

function mouseclick(event,element_id) 
{
	QInterfaceGenerator.UnscaleElement();
    Storage.StoreMouseClickData(event,element_id); 
}

function scrolling(event)
{
	Storage.StoreScrollingData(event);
}

function zooming(event)
{
	QInterfaceGenerator.UnscaleElement();
	Storage.StoreEvent("zooming","zoom",0,event.currentTarget.value);
	QInterfaceGenerator.ChangeCardsScale(event.currentTarget.value/100.0);
}