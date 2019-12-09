/**
* Mode Serveur
*/
var isServer=false;
// Si true : charge automatiquement le fichier config.json dans le dossier racine.
// Si false : s�lection du fichier de configuration manuel.


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
var qsort;
var state=0;
var isMedia=false;
var baseCardValue={w:0,h:0};
var scaledNode=null;
var text="Configuration file (json)"
var replayScale=0;
var timefactor=1;

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
 *  File Loader 
 */

class FileLoader 
{
	static ReadFile(file,functor)
	{
		let txtReader=new FileReader();
		txtReader.onload=function(event){functor(event.target.result);};
		txtReader.readAsText(file);
	}
	
    static XMLParse(text) 
    {
        let parser=new DOMParser();
        return parser.parseFromString(text,"text/xml");
    }

    static JSONParse(text) 
    {
        return JSON.parse(text);
    }

    static LoadFile(file, parseFunction, onSuccess) 
    {
		fetch(file,{method: "GET"})
		.then(res=> res.text())
		.then(function(data){	
			if(parseFunction(data)&&onSuccess)
				onSuccess();
		});
	}

	static GenerateFile(filename, text) 
	{
		let pom = document.createElement('a');
		pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		pom.setAttribute('download', filename);
		if (document.createEvent) 
		{
			let event = document.createEvent('MouseEvents');
			event.initEvent('click', true, true);
			pom.dispatchEvent(event);
		}
		else 
		{
			pom.click();
		}
	}

	static GenerateMail(filename, text) 
	{
		let pom = document.createElement('a');
		pom.setAttribute('href', 'mailto:?'+configuration.mail+'?subject:'+encodeURIComponent(configuration.mailSubject));
		if (document.createEvent)		
		{
			FileLoader.GenerateFile(filename, text);
			let event = document.createEvent('MouseEvents');
			event.initEvent('click', true, true);
			pom.dispatchEvent(event);
		}
		else 
		{
			pom.click();
		}
	}
}


/**
 * Local Storage 
 */
 
class QTraceStorage 
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
        QTraceStorage.AppendToStorage(name,JSON.stringify(object));
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
		threestatesresults.disagree=DOMGenerator.GetChildsIds(document.getElementById("disagree"),function(node){DOMGenerator.RegisterParents("disagree","threestates",node);});
		threestatesresults.neutral=DOMGenerator.GetChildsIds(document.getElementById("neutral"),function(node){DOMGenerator.RegisterParents("neutral","threestates",node);});
		threestatesresults.agree=DOMGenerator.GetChildsIds(document.getElementById("agree"),function(node){DOMGenerator.RegisterParents("agree","threestates",node);});
    }

	static StoreQSortValues()
	{
		let size;
		if('qtableconfiguration' in statements)
			size=Object.keys(statements.qtableconfiguration).length;
		else
			alert(configuration.missingqtableparameters);
		
		qsort=[];
		let tab=[];
		for(let key in statements.qtableconfiguration)
			tab[tab.length]=Number.parseInt(key);
		tab.sort(function(a,b){return b-a;});

		for(let iterator in tab)
		{
			let object={}
			object.id=([tab[iterator]]).toString();
			object.data=DOMGenerator.GetChildsIds(document.getElementById("tab_"+(tab[iterator]).toString()),null,'tab_');
			if(object.data.length===1 && object.data[0].includes("tab_"))
				object.data=[];
			qsort.push(object);
		}

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
			object.class=DOMGenerator.GetParentWithId(list[iterator]).id;
			object.data=list[iterator].value;
			QTraceStorage.AppendToStorage("interview",JSON.stringify(object));
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
				QTraceStorage.AppendToStorage("exogen",JSON.stringify(object));
		}
		return true;
	}

    static CleanStorageFormTraces() 
    {
        QTraceStorage.CleanStorage("steps");
		QTraceStorage.CleanStorage("interview");
		QTraceStorage.CleanStorage("exogen");
		QTraceStorage.CleanStorage("focus");
		QTraceStorage.CleanStorage("change");
		QTraceStorage.CleanStorage("range");
		QTraceStorage.CleanStorage("keypress");
        QTraceStorage.CleanStorage("mousemove");
        QTraceStorage.CleanStorage("mouseclick");
        QTraceStorage.CleanStorage("scrolling");
		QTraceStorage.CleanStorage("zooming");
		QTraceStorage.CleanStorage("media");
		QTraceStorage.CleanStorage("drag");
		QTraceStorage.CleanStorage("drop");
		QTraceStorage.CleanStorage("errors");
		QTraceStorage.CleanStorage("draggablecontainer");
    }

	static StoreDraggableEvent(id,cardid)
	{
		if(isReplay)
			return;
		let object={};
        object.id=id;
		object.c=cardid;
        QTraceStorage.StoreItem('draggablecontainer',object);
	}
	
	static StoreNextStepEvent(step,extra)
    {
		if(isReplay)
			return;
        let object={};
        object.s=step;
		if(extra)
			object.e=extra;
        QTraceStorage.StoreItem('steps',object);
    }

	static StoreError(error, extra)
    {
		if(isReplay)
			return;
        let object={};
        object.log=error;
		if(extra)
			object.e=extra;
        QTraceStorage.StoreItem('errors',object);
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
        QTraceStorage.StoreItem('change',object);
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
        QTraceStorage.StoreItem('change',object);
     }

	static StoreFocusEvent(event)
     {
		if(isReplay)
			return;
        let object={};
        object.id=event.currentTarget.id;
        QTraceStorage.StoreItem('focus',object);
     }

	 static StoreRangeEvent(event)
     {
		if(isReplay)
			return;
        let object={};
        object.id=event.currentTarget.id;
		object.v=event.currentTarget.value;
        QTraceStorage.StoreItem('range',object);
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
        QTraceStorage.StoreItem('keypress',object);
     }

    static StoreMousePositionData(event)
    {
		if(isReplay)
			return;
        let object={};
        object.x=event.clientX;
        object.y=event.clientY;
        QTraceStorage.StoreItem('mousemove',object);
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
        QTraceStorage.StoreItem('mouseclick',object);
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
        QTraceStorage.StoreItem('scrolling',object);
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
        QTraceStorage.StoreItem(event,object);
    }

	static GenerateQSortState()
	{
		let json='"qsortresult": [';
		for(let iterator=0;iterator<qsort.length;iterator++)
		{
			json+='{ "id": "'+qsort[iterator].id+'", "data": [';
			for(let key in qsort[iterator].data) 
			{
				json+=qsort[iterator].data[key];
				if(key<qsort[iterator].data.length-1)
					json+=',';
			}
			json+=']}';
			if(iterator<qsort.length-1)
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
			json+=QTraceStorage.GenerateThreeState()+',';
		if(state>5)
			json+=QTraceStorage.GenerateQSortState()+',';
		json+=QTraceStorage.GetJSONFromStore("steps")+',';
        json+=QTraceStorage.GetJSONFromStore("mousemove")+',';
        json+=QTraceStorage.GetJSONFromStore("mouseclick")+',';
        json+=QTraceStorage.GetJSONFromStore("drag")+',';
		json+=QTraceStorage.GetJSONFromStore("drop")+',';
		json+=QTraceStorage.GetJSONFromStore("draggablecontainer");
		json+='}';
		return json;

	}

	static GenerateTrace()
	{
		let json='"traces":[';
		json+=QTraceStorage.GetJSONFromStore("steps")+',';
        json+=QTraceStorage.GetJSONFromStore("range")+',';
        json+=QTraceStorage.GetJSONFromStore("focus")+',';
		json+=QTraceStorage.GetJSONFromStore("change")+',';
        json+=QTraceStorage.GetJSONFromStore("keypress")+',';
        json+=QTraceStorage.GetJSONFromStore("mousemove")+',';
        json+=QTraceStorage.GetJSONFromStore("mouseclick")+',';
		json+=QTraceStorage.GetJSONFromStore("scrolling")+',';
		json+=QTraceStorage.GetJSONFromStore("zooming")+',';
        json+=QTraceStorage.GetJSONFromStore("drag")+',';
		json+=QTraceStorage.GetJSONFromStore("drop")+',';
		json+=QTraceStorage.GetJSONFromStore("draggablecontainer")+',';
		json+=QTraceStorage.GetJSONFromStore("errors");
		if(isMedia)
			json+=','+QTraceStorage.GetJSONFromStore("media");
        json+=']';
		return json;
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
		if(state>3&&configuration.threestate)
			json+=QTraceStorage.GenerateThreeState()+',';
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
		json+=QTraceStorage.GenerateTrace();
		json+='}';
        //console.log(json);
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

/**
 * IHM
 */ 

class DOMGenerator 
{
	static GetMain() 
	{
		let main=document.getElementById("main");
		if(main!=null)
			return main;
		main=document.createElement("div");
		main.id="main";
		document.body.appendChild(main);
		return main;
	}

	static CleanMain(jokers) 
	{
		let main=DOMGenerator.GetMain();
		if(jokers)
		{
			let found=false;
			for(let iterator=0; iterator<main.childNodes.length;iterator++)
			{
				found=false;
				for(let iterator2=0; iterator2<jokers.length; iterator2++)
				{
					if(jokers[iterator2]===main.childNodes[iterator].id)
					{
						found=true;
						break;
					}
				}
				if(!found)
				{
					main.removeChild(main.childNodes[iterator]);
					iterator--;
				}
				else
					main.childNodes[iterator].style.display="none";
			}
		}
		else
		{
			while(main.firstChild)
				main.removeChild(main.firstChild);
		}
	}

	static GetStatement(id)
	{
		for(let iterator=0;iterator<statements.statements.length;iterator++)
			if(statements.statements[iterator].id===id)
				return statements.statements[iterator];
		return null;
	}

	static GetParentWithId(node, joker)
	{
		if(node.id)
			node=node.parentNode;
		while(!node.id || (joker && node.id.includes(joker)))
		{	
			if(!node.parentNode)
				return node;
			node=node.parentNode;
		}
		return node;
	}

	static GetChildsIds(container,functor,joker) 
	{
		if(!container)
			return null;
		let data=[];
		for(let iterator=0; iterator<container.childElementCount;iterator++) 
		{
			if((!container.childNodes[iterator].id || joker && container.childNodes[iterator].id.includes(joker)) && container.childNodes[iterator].childElementCount>0)
				data=data.concat(DOMGenerator.GetChildsIds(container.childNodes[iterator],functor)); 
			else
			{
				if(container.childNodes[iterator].id)
				{
					data.push(container.childNodes[iterator].id);
					if(functor)
						functor(container.childNodes[iterator]);
				}
			}
		}
		return data;
	}

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
					DOMGenerator.CardScaleOnDrop(list[iterator],nodeid);
			}
		}
	}

	static GetNewOrder(elementid)
	{
		let orderedList;
		if(state>5)
			orderedList=DOMGenerator.GetChildsIds(document.getElementById(elementid),null,'tab_');
		else
			orderedList=DOMGenerator.GetChildsIds(document.getElementById(elementid));
		QTraceStorage.StoreEvent("drop","elementslist",elementid,orderedList);
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
		switch(state)
		{
			case 3:
				return DOMGenerator.CheckPickingZoneEmpty();
				break;
			case 4:
				return DOMGenerator.CheckPickingZoneEmptyFinnish();
				break;
			case 6:
				return DOMGenerator.Check3StatesEmpty();
				break;
			case 7:
				return DOMGenerator.Check3StatesEmptyFinnish();
				break;
		}
	}

	static CheckPickingZoneEmpty() 
	{
		let zone=document.getElementById("pickingZone");
		if(zone&&zone.childElementCount==0) 
		{
			state++;
			QTraceStorage.StoreNextStepEvent(state,"check");
			if(configuration.threestate)
				DOMGenerator.AddContinueButton(function(){QTraceStorage.StoreThreeStatesValues();state++;DOMGenerator.GenerateStepPage(configuration.qsorttext,configuration.startbutton,function(){state++;QTraceStorage.StoreNextStepEvent(state);DOMGenerator.ChangeCardsScale(1);DOMGenerator.GenerateQStates("threestates");},["threestates"]);QTraceStorage.StoreNextStepEvent(state);});
			else
				DOMGenerator.AddContinueButton(function(){QTraceStorage.StoreQSortValues();state++;QTraceStorage.StoreNextStepEvent(state);QTraceStorage.SubmitData("preview.json",QTraceStorage.GenerateResultPreview(),configuration.serverurlpreviewsubmit,function(res){if(res.status===200)cardsForInterview=FileLoader.ParseJSON(res.responseText);});DOMGenerator.GenerateStepPage(configuration.quizztext,configuration.startbutton,function(){lmdd.unset(document.getElementById('main'));state++;DOMGenerator.GeneratePostInterview();QTraceStorage.StoreNextStepEvent(state);});});
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
			QTraceStorage.StoreNextStepEvent(state,"check");
			DOMGenerator.AddContinueButton(function(){QTraceStorage.StoreQSortValues();state++;QTraceStorage.StoreNextStepEvent(state);if(!isReplay)QTraceStorage.SubmitData("preview.json",QTraceStorage.GenerateResultPreview(),configuration.serverurlpreviewsubmit,function(res){if(res.status===200)cardsForInterview=FileLoader.ParseJSON(res.responseText);});DOMGenerator.GenerateStepPage(configuration.quizztext,configuration.startbutton,function(){lmdd.unset(document.getElementById('main'));state++;DOMGenerator.GeneratePostInterview();QTraceStorage.StoreNextStepEvent(state);});});
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
		DOMGenerator.HideZoom(true);
		DOMGenerator.CleanMain(jokers);
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
		button.onclick=function(){DOMGenerator.HideZoom(false);functor();};
		div.appendChild(button);
		DOMGenerator.GetMain().appendChild(div);
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
			li.appendChild(DOMGenerator.GenerateStatement(DOMGenerator.GetStatement(parseInt(list.data[iterator]))));
			li.className="nested-item ";
			row.insertCell(0).appendChild(li);
			row.cells[0].className="nestable grey";
			row.cells[0].width="25%";
			let input=document.createElement("textarea");
			input.id="text_"+list.data[iterator];
			input.name=list.data[iterator];
			input.onkeydown=function(event){QTraceStorage.StoreKeyEvent(event)};
			input.onkeyup=function(event){QTraceStorage.StoreKeyEvent(event)};
			input.onfocus=function(event){QTraceStorage.StoreFocusEvent(event)};
			row.insertCell(1).appendChild(input);
		}
		return div;
	}

	static GeneratePostInterview()
	{
		let main=DOMGenerator.GetMain();
		document.body.removeChild(document.getElementById("zoomcontainer"));
		DOMGenerator.CleanMain();
		main.appendChild(document.createElement("br"));
		if(qsort[qsort.length-1].data.length)
		{
			main.appendChild(DOMGenerator.GeneratePostInterviewTable(configuration.disagreeposttext,qsort[qsort.length-1],"disagree"));
			main.appendChild(document.createElement("br"));
		}
		if(qsort[0].data.length)
		{
			main.appendChild(DOMGenerator.GeneratePostInterviewTable(configuration.agreeposttext,qsort[0],"agree"));
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
			main.appendChild(DOMGenerator.GeneratePostInterviewTable(configuration.whyposttext,cardsForInterview,"dynamic"));
			main.appendChild(document.createElement("br"));
		}
		let button=document.createElement("button");
		button.appendChild(document.createTextNode(configuration.continuebutton));
		button.className="noselect";
		button.id="button";
		button.onclick=function(){QTraceStorage.StoreTextInterview();state++;QTraceStorage.StoreNextStepEvent(state);if(configuration.exoquizz)DOMGenerator.GenerateExoQuizz();else DOMGenerator.GenerateFinnishState();};
		main.appendChild(button);
	}

	static GenerateFinnishState()
	{
		let main=DOMGenerator.GetMain();
		DOMGenerator.CleanMain();
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

		let button=document.createElement("button");
		button.id="button";
		button.className="noselect";
		button.appendChild(document.createTextNode(configuration.finnishbutton));
		button.onclick=function()
		{
			QTraceStorage.SubmitData(userid+".json",QTraceStorage.GenerateJSON(),configuration.serverurlsubmit,function(res){if(res.status!=200){if(confirm(configuration.networkerrortext))/*FileLoader.GenerateMail(filename,text);else*/ FileLoader.GenerateFile(filename,text);}});
			QTraceStorage.CleanStorageFormTraces();
			threestatesresults={agree:[],neutral:[],disagree:[]};
			qsort=null;
			DOMGenerator.CleanMain();
			generateStatementsList();
		};
		div.appendChild(button);
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

	static AddQStateDive(elementid)
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
			document.getElementById(elementid).appendChild(DOMGenerator.CreateQStatediv(true, DOMGenerator.FindMissingId(div)));
	}

	static CheckMissingDrop()
	{
		let divs=document.getElementsByClassName("toCheck");
		for(let iterator=divs.length-1; iterator>0; iterator--)
		{
			if(divs[iterator].firstChild)
			{
				let parentContainer=DOMGenerator.GetParentWithId(divs[iterator].firstChild);
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
		let container=DOMGenerator.GetParentWithId(document.getElementById(containerid));
		let parentContainer=DOMGenerator.GetParentWithId(container);
		let card=document.getElementById(cardid);
		let tempvalue=0;
		if(parentContainer.id!="qstates")
		{
			if(!("location"in card) || !card["location"] || card["location"]==="threestates")
				return;
			DOMGenerator.AddQStateDive(card["location"]);
			card["location"]="threestates";
		}
		else
		{	
			if("location" in card && card["location"] && card["location"]!="threestates")
				DOMGenerator.AddQStateDive(card["location"]);
			if(card.parentNode!=container.firstChild)
				container.firstChild.appendChild(document.getElementById(cardid));
			if((container.firstChild["childLimit"]+1)<(container.firstChild.childElementCount+container.childElementCount))
				container.removeChild(container.childNodes[container.childElementCount-1]);
			card["location"]=containerid;
		}
		DOMGenerator.CheckMissingDrop();
	}

	static Addvalue(begin,size,value,tab)
	{
		for(let iterator=begin;iterator<size+begin;iterator++)
			tab[iterator]+=value;
	}

	static CreateQStatediv(animation,id,childLimit)
	{
		let qstatediv=document.createElement("div");
		qstatediv.className="nestable grey";
		
		if(id)
			qstatediv.id=id;
		if(childLimit)
		{
			qstatediv["childLimit"]=childLimit;
			qstatediv.style.minHeight="100px";
		}
		else
		{
			qstatediv["childLimit"]=1;
			qstatediv.className+=" toCheck";
			qstatediv.style.minHeight="30px";
		}
		if(animation)
			DOMGenerator.OpacityAnimation(qstatediv,0.0,1.0,configuration.opacityanimationinterval,configuration.opacityanimationduration);
		return qstatediv;
	}

	static QTabPlacement()
	{
		let tab=new Array(statements.qtablesize);
		for(let iterator=0;iterator<statements.qtablesize;iterator++)
			tab[iterator]=0;
		let result=randoms.length;
		let size=statements.qtablesize;
		let lign=0;
		let iterator=0;
		while(true)
		{
			result=result/size;
			lign=parseInt(result);
			if(result==lign||((result-lign)*size)<(size-2))
				lign--;
			result-=lign;
			result*=size;
			DOMGenerator.Addvalue(iterator,size,lign,tab);
			size-=2;
			iterator++;
			if(size===1||lign===0)
			{
				tab[parseInt(statements.qtablesize/2)]+=Math.ceil(result);
				break;
			}
		}
		return tab;
	}

	static GenerateQStates(joker)
	{
		if(document.getElementById("qstates")!=null)
			return;
		if(joker)
			DOMGenerator.CleanMain([joker]);
		let main=DOMGenerator.GetMain();
		if(document.getElementById("disagree")!=null)
		{
			document.getElementById("disagree")["isFrozen"]=true;
			document.getElementById("agree")["isFrozen"]=true;
			document.getElementById("neutral")["isFrozen"]=true;
		}
		
		let states=document.createElement("table");
		states.id="qstates";
		let headerRow;
		let dataDow;
		if(statements.headerPosition==="bottom")
		{
			dataDow=states.insertRow(0);
		 	headerRow=states.insertRow(1);
		}
		else
		{
		 	 headerRow=states.insertRow(0);
			 dataDow=states.insertRow(1);
		}
		let data;

		let tab=[];
		for(let key in statements.qtableconfiguration)
			tab[tab.length]=Number.parseInt(key);
		tab.sort(function(a,b){return b-a;});

		for(let iterator in tab)
		{
			data=document.createElement("div");
			data.className="tabletitle";
			data.appendChild(document.createTextNode((tab[iterator]).toString()));
			headerRow.insertCell(0).appendChild(data);

			data=document.createElement("div");
			data.id="tab_"+(tab[iterator]).toString();
			if(!statements.qtableconfiguration[tab[iterator]])
				data.appendChild(DOMGenerator.CreateQStatediv(false,data.id+'_0',configuration.statements.statements.length));
			else
				for(let iterator2=0;iterator2<statements.qtableconfiguration[tab[iterator]];iterator2++)
					data.appendChild(DOMGenerator.CreateQStatediv(false,data.id+'_'+iterator2));
			let cell=dataDow.insertCell(0);
			cell.appendChild(data);
			switch(statements.statementsAlignement)
			{
				case "bottom":
					cell.style.verticalAlign="bottom";
					break;
				default:
				case "top":
					cell.style.verticalAlign="top";
					break;
				case "middle":
					cell.style.verticalAlign="";
					break;
			}
		}

		main.insertBefore(states, main.firstChild);
		DOMGenerator.OpacityAnimation(states,0.0,1.0,configuration.opacityanimationinterval,configuration.opacityanimationduration);
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
		DOMGenerator.OpacityAnimation(document.getElementById(name),0.0,1.0,configuration.opacityanimationinterval,configuration.opacityanimationduration);
	}

	static GenerateThreeStates() 
	{
		if(document.getElementById("threestates")!=null)
			return;
		DOMGenerator.CleanMain(["pickingZone"]);
		let main=DOMGenerator.GetMain();
		let states=document.createElement("table");
		states.id="threestates";
		let row=states.insertRow(0);

		let text=document.createElement("div");
		text.appendChild(document.createTextNode(configuration.disagree));
		text.className="tabletitle noselect";
		row.insertCell(0).appendChild(text);

		text=text.cloneNode(false);
		text.appendChild(document.createTextNode(configuration.neutral));
		row.insertCell(1).appendChild(text);

		text=text.cloneNode(false);
		text.appendChild(document.createTextNode(configuration.agree));
		row.insertCell(2).appendChild(text);

		row=states.insertRow(1);
		
		let disagree=document.createElement("div");
		disagree.id="disagree";
		disagree.className="nestable grey";
		if(replayScale)
		{
			disagree.style.minWidth=(replayScale*130)+'px';
			disagree.style.minHeight=(replayScale*90)+'px';
		}
		row.insertCell(0).appendChild(disagree);

		let neutral=document.createElement("div");
		neutral.id="neutral";
		neutral.className="nestable grey";
		if(replayScale)
		{
			neutral.style.minWidth=(replayScale*130)+'px';
			neutral.style.minHeight=(replayScale*90)+'px';
		}
		row.insertCell(1).appendChild(neutral);

		let agree=document.createElement("div");	
		agree.id="agree";
		agree.className="nestable grey";
		if(replayScale)
		{
			agree.style.minWidth=(replayScale*130)+'px';
			agree.style.minHeight=(replayScale*90)+'px';
		}
		row.insertCell(2).appendChild(agree);
		
		let picking=document.getElementById("pickingZone");
		picking.style.display="initial";
		let startPos={x:picking.offsetTop,y:picking.offsetLeft};
			
		main.insertBefore(states, main.firstChild);
		DOMGenerator.OpacityAnimation(states,0.0,1.0,configuration.opacityanimationinterval,configuration.opacityanimationduration);
	}

	static SetMediaEvent(player)
	{
		isMedia=true;
		if('onwebkitfullscreenchange' in player)
			player.onwebkitfullscreenchange=(function(id){return function(){let media=document.getElementById(id);QTraceStorage.StoreEvent("media","fullscreen",id,media.mozFullScreen);};})(player.id);
		player.onpause=(function(id){return function(){let media=document.getElementById(id);QTraceStorage.StoreEvent("media","pause",id,media.currentTime);};})(player.id);
		player.onplay=(function(id){ return function(){let media=document.getElementById(id);QTraceStorage.StoreEvent("media","play",id,media.currentTime);};})(player.id);
		player.onended=(function(id){return function(){QTraceStorage.StoreEvent("media","end",id);};})(player.id);
		player.onseeking=(function(id){return function(){let media=document.getElementById(id);QTraceStorage.StoreEvent("media","seeking",id,media.currentTime);};})(player.id);
		player.onvolumechange=(function(id){return function(){let media=document.getElementById(id);QTraceStorage.StoreEvent("media","volumechange",id,media.volume);};})(player.id);
		//Behavior correction for chromium.
		//player.onmousedown=function(event){event.stopPropagation();};
	}

	static GenerateStatement(statement) 
	{
		if(!statement)
			return;
		if(statement.type==="text")
			return document.createTextNode(statement.text)
		if(statement.type==="image") 
		{
			let image=document.createElement("img");
			image.setAttribute("src",statement.image);
			image.oncontextmenu=function(event){event.preventDefault();event.stopPropagation();DOMGenerator.ScaleElement(event.target.parentNode);};
			return image;
		}
		if(statement.type==="audio") 
		{
			let audio=document.createElement("audio");
			audio.id='audio-player-'+statement.id;
			audio.controls='controls';
			audio.controlsList="nodownload";
			audio.src=statement.audio;
			DOMGenerator.SetMediaEvent(audio);
			if('description' in statement)
			{
				let div=document.createElement("div");
				div.appendChild(audio);
				div.appendChild(document.createTextNode(statement.description));
				return div;
			}
			if('illustration' in statement)
			{
				let div=document.createElement("div");
				div.appendChild(audio);
				let image=document.createElement("img");
				div.appendChild(image);
				image.setAttribute("src",statement.illustration);
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
			DOMGenerator.SetMediaEvent(video);
			return video;
		}
		alert(configuration.unknowstatementype);
		return null;
	}

	static GenerateCards() 
	{
		let main=DOMGenerator.GetMain();
		DOMGenerator.CleanMain();
		let button=document.createElement("button");
		button.id="button";
		button.className="noselect";
		button.appendChild(document.createTextNode(configuration.continuebutton));
		if(configuration.threestate)
			button.onclick=function(){state++;QTraceStorage.StoreNextStepEvent(state);DOMGenerator.GenerateStepPage(configuration.threestatetext,configuration.startbutton,function(){state++;QTraceStorage.StoreNextStepEvent(state);DOMGenerator.GenerateThreeStates();},["pickingZone"]);};	
		else	
			button.onclick=function(){state++;DOMGenerator.GenerateStepPage(configuration.qsorttext,configuration.startbutton,function(){state++;QTraceStorage.StoreNextStepEvent(state);DOMGenerator.GenerateQStates("pickingZone");},["pickingZone"]);};
		main.appendChild(button);
		let pickingZone=document.createElement("div");
		pickingZone.id="pickingZone";
		pickingZone.className="nestable";
		for(let key in randoms)
		{
			let li=document.createElement('div');
			li.appendChild(DOMGenerator.GenerateStatement(statements.statements[randoms[key]]));
			li.className="nested-item noselect";
			li["location"]="pickingZone";
			li["baseFontSize"]=1.2;
			li.oncontextmenu=function(event){if(!event.target.classList.contains("nested-item"))return;event.preventDefault();DOMGenerator.ScaleElement(event.target);};
			li.id=statements.statements[randoms[key]].id;
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

		lmdd.set(document.getElementById('main'),{
			containerClass: 'nestable',draggableItemClass: 'nested-item'},
			function(id,parentid){DOMGenerator.UnscaleElement();QTraceStorage.StoreEvent("drag","start",id,parentid);},
			function(id,parentid){QTraceStorage.StoreEvent("drag","end",id,parentid);DOMGenerator.CardScaleOnDrop(id,parentid);if(parentid){DOMGenerator.SetContainerId(id,parentid);DOMGenerator.CheckState();DOMGenerator.GetNewOrder(parentid);}},
			function(id,cardid){QTraceStorage.StoreDraggableEvent(id,cardid);});
		DOMGenerator.OpacityAnimation(pickingZone,0.0,1.0,configuration.opacityanimationinterval,configuration.opacityanimationduration);
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
		let parentContainer=DOMGenerator.GetParentWithId(container.parentNode);
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
				else if(parentContainer.id==="threestates" && "location" in card && card["location"] && DOMGenerator.GetParentWithId(document.getElementById(card["location"])).id==="threestates")
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
					
					location=DOMGenerator.GetParentWithId(document.getElementById(card["location"]).parentNode);
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
			DOMGenerator.ScalingAnimation(card,1.0,configuration.scalinganimationminvalue,configuration.scalinganimationinterval,configuration.scalinganimationduration);
		else
			DOMGenerator.ScalingAnimation(card,configuration.scalinganimationminvalue,1.0,configuration.scalinganimationinterval,configuration.scalinganimationduration);
	}

	static ChangeCardsScale(scale)
	{
		let cards = document.getElementsByClassName("nested-item");
		for(let iterator=0;iterator<cards.length;iterator++)
			DOMGenerator.ChangeCardScale(cards[iterator],scale);
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
		let main=DOMGenerator.GetMain();
		DOMGenerator.CleanMain();
		let form=document.createElement("table");	
		form.className="tableExo";
		for(let iterator=0; iterator<configuration.exoquizz.length;iterator++)
		{
			let row=form.insertRow(iterator);
			row.className="trExo";
			row.insertCell(0).appendChild(document.createTextNode(configuration.exoquizz[iterator].label));
			row.cells[0].className="tdExo";
			let div=row.insertCell(1);
			let input,label,radio,checkbox,range,datalist,option,asterix;
			switch(configuration.exoquizz[iterator].type)
			{
				case "text":
					input=document.createElement("input");
					input.id=configuration.exoquizz[iterator].id;
					input.type="text";
					input.onkeydown=function(event){QTraceStorage.StoreKeyEvent(event)};
					input.onkeyup=function(event){QTraceStorage.StoreKeyEvent(event)};
					input.onfocus=function(event){QTraceStorage.StoreFocusEvent(event)};
					if(DOMGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
							form.rows[iterator].cells[0].innerHTML+="(*)";
					div.appendChild(input);
					break;
				case "number":
					input=document.createElement("input");
					input.id=configuration.exoquizz[iterator].id;
					input.type="number";
					input.onkeydown=function(event){QTraceStorage.StoreKeyEvent(event)};
					input.onkeyup=function(event){QTraceStorage.StoreKeyEvent(event)};
					input.onfocus=function(event){QTraceStorage.StoreFocusEvent(event)};
					if(DOMGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
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
						input.onchange=function(event){QTraceStorage.StoreOnChangeRadioEvent(event)};
						radio.appendChild(input);
						label=document.createElement("label");
						label.innerHTML=configuration.exoquizz[iterator].values[iterator2];
						label.htmlFor=input.id;
						if(DOMGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
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
						input.onchange=function(event){QTraceStorage.StoreOnChangeCheckboxEvent(event)};
						checkbox.appendChild(input);
						label=document.createElement("label");
						label.innerHTML=configuration.exoquizz[iterator].values[iterator2];
						label.htmlFor=input.id;
						checkbox.appendChild(label);
						if(DOMGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
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
					if(DOMGenerator.SetParameters(input,configuration.exoquizz[iterator].parameters))
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
		submit.onclick=function(){if(QTraceStorage.StoreExoResult()){state++;QTraceStorage.StoreNextStepEvent(state);DOMGenerator.GenerateFinnishState();}};
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
				DOMGenerator.ChangeCardScale(element,0);
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
		QTraceStorage.StoreEvent("zooming","scale",scaledNode.id,"initial");
		scaledNode.style.transform="initial";
		if(scaledNode["oldStateScale"])
		{
			scaledNode["stateScale"]=scaledNode["oldStateScale"];
			DOMGenerator.ChangeCardScale(scaledNode,0);
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
			DOMGenerator.UnscaleElement();
			return;
		}
		if(scaledNode)
			DOMGenerator.UnscaleElement();
		scaledNode=element;
		if(scaledNode["stateScale"])
		{
			scaledNode["oldStateScale"]=scaledNode["stateScale"];
			scaledNode["stateScale"]=1;
			DOMGenerator.ChangeCardScale(scaledNode,0);
		}
		let width=(element.style.width===""||element.offsetWidth>parseInt(element.style.width))?element.offsetWidth:parseInt(element.style.width);
		let scale=configuration.scalinganimationmaxvalue*Math.pow(1-width/window.innerWidth,2);
		if(scale*width>(window.innerWidth*0.75))
			scale=(window.innerWidth*0.95)/width;
		QTraceStorage.StoreEvent("zooming","scale",element.id,"scale("+scale+")");
		let x=(window.innerWidth/2)-(DOMGenerator.GetGlobalOffsetLeft(element)+element.offsetWidth/2),y=(window.innerHeight/2)-(DOMGenerator.GetGlobalOffsetTop(element)+element.offsetHeight/2);
		element.style.transform="translate("+x+"px,"+y+"px) scale("+scale+")";
	}

}

/**
 * Function
 */

function generateStatementsList() 
{
	randoms=[];
	cardsMovements={};
	cardsDistances={};
	for(let key=0; key<statements.statements.length;key++)
	{
		randoms.push(key);
		cardsMovements[key]=0;
		cardsDistances[key]=0;
	}
	ShuffleList(randoms);
	generateStartPage();
}

function Start()
{
	if(isServer)
		loadconfig();
	else
		GenerateDropZone();
}

function GenerateDropZone()
{
	let main=DOMGenerator.GetMain();
	let dropZone=main.appendChild(document.createElement("div"));
	dropZone.appendChild(document.createTextNode(text+" : "));
	dropZone.className="dropZone";
	let form=dropZone.appendChild(document.createElement("form"));
	let input=form.appendChild(document.createElement("input"));
	input.onchange= function(event){
		let files=this.files;
		if(!files.length)return;
		FileLoader.ReadFile(files[0],function(text){
			try{
				configuration=FileLoader.JSONParse(text);
				if(!configuration.serverurlsubmit){
					alert(configuration.notaconfigfileerrortext);
					console.log("coucou");
					return false;
				}
				loadstatement();
				return true;
			}catch(e){
				console.log(e);
				alert(configuration.jsonparsingerrortext);
				return false;
			}
		});
	};
	input.type="file";
	input.accept="json";
}

function generateStartPage()
{
	state=0;
	userid=0;
	//DOMGenerator.GenerateFinnishState();
	//DOMGenerator.GenerateExoQuizz();//(configuration.introtext,configuration.startbutton,function(){ResetReferenceTime();DOMGenerator.GenerateCards();DOMGenerator.GenerateZoomSlider();QTraceStorage.StoreNextStepEvent(state);});
	//DOMGenerator.GenerateStepPage(configuration.acceptancetext,configuration.startbutton,function(){ResetReferenceTime();QTraceStorage.ClearStorage();state++;DOMGenerator.GenerateCards();DOMGenerator.ChangeCardsScale(1.0);DOMGenerator.GenerateZoomSlider();QTraceStorage.StoreNextStepEvent(state);});
	DOMGenerator.GenerateStepPage(
		configuration.acceptancetext,
		configuration.startbutton,
		function(){
			DOMGenerator.GenerateStepPage(
				configuration.introtext,
				configuration.startbutton,
				function(){
					ResetReferenceTime();
					QTraceStorage.ClearStorage();
					state++;
					DOMGenerator.GenerateCards();
					DOMGenerator.ChangeCardsScale(1.0);
					DOMGenerator.GenerateZoomSlider();
					QTraceStorage.StoreNextStepEvent(state);
				}
			);
		}
	);

}

function loadstatement() 
{
	QTraceStorage.CleanStorageFormTraces();
	if(configuration.statementsFile&&configuration.statementsType)
	{
		if(configuration.statementsType==="xml")
			FileLoader.LoadFile(configuration.statementsFile,function parser(text){try{statements=FileLoader.XMLParse(text);return true;}catch(e){console.log(e);return false;}},function(){return generateStatementsList();});
		else if(configuration.statementsType==="json")
			FileLoader.LoadFile(configuration.statementsFile,function parser(text){try{statements=FileLoader.JSONParse(text);return true;}catch(e){console.log(e);return false;}},function(){return generateStatementsList();});
		else
			alert(configuration.wrongstatementformatmessage);

	}
	else if(configuration.statements)
	{
		statements=configuration.statements;
		generateStatementsList();
	}
	else
		alert(configuration.wrongstatementformatmessage);
}

function loadconfig() 
{
	FileLoader.LoadFile('config.json',function(text){try{configuration=FileLoader.JSONParse(text);return true;}catch(e){console.log(e);return false;}},function(){return loadstatement();});
}

/**
 * Functions calls
 */

function mousemove(event) 
{
    QTraceStorage.StoreMousePositionData(event);
}

function mouseclick(event,element_id) 
{
	DOMGenerator.UnscaleElement();
    QTraceStorage.StoreMouseClickData(event,element_id); 
}

function scrolling(event)
{
	QTraceStorage.StoreScrollingData(event);
}

function zooming(event)
{
	DOMGenerator.UnscaleElement();
	QTraceStorage.StoreEvent("zooming","zoom",0,event.currentTarget.value);
	DOMGenerator.ChangeCardsScale(event.currentTarget.value/100.0);
}