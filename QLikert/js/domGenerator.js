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

class DOMGenerator 
{
	static GetMain() 
	{
		let main=document.getElementById("main");
		if(main!==null)
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

	static CleanNode(name,jokers) 
	{
		let main=document.getElementById(name);
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
			}
		}
		else
		{
			while(main.firstChild)
				main.removeChild(main.firstChild);
		}
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

	static GetParentWithClassName(node, className)
	{
		if(node.className.includes(className))
			return node;
		while(true)
		{
			if(node.className.includes(className))
				return node;	
			if(!node.parentNode)
				return null;
			node=node.parentNode;
		}
		return null;
	}

	static GetParentTable(node)
	{
		if(node.tagName==="table")
			return node;
		if(node.parentNode)
			DOMGenerator.GetParentTable(node.parentNode);
		return null;
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

	static Addvalue(begin,size,value,tab)
	{
		for(let iterator=begin;iterator<size+begin;iterator++)
			tab[iterator].limit+=value;
	}

	static CheckQState(qsort)
	{
		let sum=0;
		for(let iterator in qsort)
		{
			if(!qsort[iterator].limit)
				return;
			sum+=qsort[iterator].limit;
		}
		let style="";
		if(sum!==Object.keys(statements).length)
			style="red";
		document.getElementById("qstates").style.backgroundColor=style;
	}
	
	static CreateQStatediv(isLimitless, isLine)
	{
		let qstatediv=document.createElement("div");
		qstatediv.className="nestable grey";
		if(isLimitless)
		{
			qstatediv.style.minHeight="100px";
			if(isLine)
				qstatediv.style.minWidth="100%";
		}
		else
		{
			qstatediv['childLimit']=1;
			qstatediv.style.minHeight="30px";
			if(isLine)
				qstatediv.className+=" nest-line";
		}
		return qstatediv;
	}

	static QTabPlacement(min,max)
	{
		let qsortTemp={};
		let qtablesize=(max-min)+1;
		for(let iterator=min;iterator<=max;iterator++)
		{
			qsortTemp[iterator]={};
			qsortTemp[iterator].limit=0;
			if(Object.keys(qsort).length!==0&&qsort[iterator])
				qsortTemp[iterator].title=qsort[iterator].title;
			else
				qsortTemp[iterator].title="";
		}
		qsort=qsortTemp;
		let result=Object.keys(statements).length;
		if(!result)
			return;
		let size=qtablesize;
		let lign=0;
		let iterator=Number.parseInt(min);
		while(true)
		{
			result=result/size;
			lign=Number.parseInt(result);
			result-=lign;
			result*=size;
			if(result===lign||(result-lign)*size<size-2)
				lign--;
			DOMGenerator.Addvalue(iterator,size,lign,qsort);
			size-=2;
			iterator++;
			if(size===1||lign===0)
			{
				qsort[0].limit+=Math.ceil(result);
				break;
			}
			if(isNaN(lign)||isNaN(result))
			{
				let sum=1;
				for(let iterator=min;iterator<=max;iterator++)
					sum+=qsort[iterator].limit;
				qsort[0].limit+=statements.length-sum;
				break;
			}
		}
	}

	static DeleteQStates()
	{
		if(document.getElementById("qstates")===null)
			return;
		document.getElementById("simulator").removeChild(document.getElementById("qstates"));
	}

	static GenerateQStatesByColumns(states,sortedTab,qConfig,statAlign,insertToTitleCellFunctor)
	{
		let headerRow;
		let dataDow;
		let data;
		switch(statAlign)
		{
			case "top":
			case 0:
			case "middle":
			case 2:
				headerRow=states.insertRow();
				dataDow=states.insertRow();
				break;
			case "bottom":
			case 1:
				dataDow=states.insertRow();
				headerRow=states.insertRow();
				break;
		}

		for(let iterator in sortedTab)
		{
			data=document.createElement("div");
			data.className="tabletitle";
			//specific insertion (QAdmin input vs QInterfaceText)
			insertToTitleCellFunctor(qConfig,data,iterator,sortedTab);
			headerRow.insertCell().appendChild(data);
			data=document.createElement("div");
			data.id="tab_"+(sortedTab[iterator]).toString();
			data.className="nest-container";
			if(!qConfig[sortedTab[iterator]].limit)
				data.appendChild(DOMGenerator.CreateQStatediv(true,false));
			else
				for(let iterator2=0;iterator2<qConfig[sortedTab[iterator]].limit;iterator2++)
					data.appendChild(DOMGenerator.CreateQStatediv(false,false));
			let cell=dataDow.insertCell();
			cell.className="statAlign";
			cell.appendChild(data);
		}
	}

	static GenerateQStatesByLines(states,sortedTab,qConfig,statAlign,insertToTitleCellFunctor)
	{
		let dataTitle,dataCell;
		for(let iterator in sortedTab)
		{
			dataTitle=document.createElement("div");
			dataTitle.className="tabletitle";
			//specific insertion (QAdmin input vs QInterfaceText)
			insertToTitleCellFunctor(qConfig,dataTitle,iterator,sortedTab);
			
			dataCell=document.createElement("div");
			dataCell.id="tab_"+(sortedTab[iterator]).toString();
			dataCell.className="nest-container";
			if(!qConfig[sortedTab[iterator]].limit)
				dataCell.appendChild(DOMGenerator.CreateQStatediv(true,true));
			else
				for(let iterator2=0;iterator2<qConfig[sortedTab[iterator]].limit;iterator2++)
					dataCell.appendChild(DOMGenerator.CreateQStatediv(false,true));

			let row=states.insertRow();
			let cellTitle, cellStates;
			switch(statAlign)
			{
				case "left":
				case 3:
					cellTitle=row.insertCell();
					cellStates=row.insertCell();
					break;
				case "right":
				case 4:
					cellStates=row.insertCell();
					cellTitle=row.insertCell();
					break;
			}
			cellStates.className="statAlign";
			cellStates.appendChild(dataCell);
			cellTitle.appendChild(dataTitle);

			if(dataCell.childNodes.length===1)
				dataTitle.style.minHeight="100px";
			else
				dataTitle.style.minHeight="30px";
		}
	}

	static GenerateQStates(isCrescent,statAlign,qConfig,checkFunctor,insertToTitleCellFunctor,insertFunctor)
	{
		if(!Object.keys(qConfig).length)
			return;
		//spesific check do before (aka froze 3 states in qInterface)
		checkFunctor();
		let states=document.createElement("table");
		states.id="qstates";
		
		let tab=[];
		for(let key in qConfig)
			tab[tab.length]=Number.parseInt(key);
		if(isCrescent==="true"||isCrescent)
			tab.sort(function(a,b){return a-b;});
		else
			tab.sort(function(a,b){return b-a;});
		
		switch(statAlign)
		{
			case "top":
			case 0:
			case "bottom":
			case 1:
			case "middle":
			case 2:
				DOMGenerator.GenerateQStatesByColumns(states,tab,qConfig,statAlign,insertToTitleCellFunctor);
				break;
			case "left":
			case 3:
			case "right":
			case 4:
				DOMGenerator.GenerateQStatesByLines(states,tab,qConfig,statAlign,insertToTitleCellFunctor);
				break;
		}
		insertFunctor(states);
		DOMGenerator.CheckQState(qConfig);
		DOMGenerator.SetStatementsAlignement(statAlign);
	}

	static SetStatementsAlignement(statAlign)
	{
		let cells=document.getElementsByClassName("statAlign");
		if(!cells||!cells.length)
			return;
		switch(statAlign)
		{
			case "top":
			case 0:
				for(let iterator=0;iterator<cells.length;iterator++)
					cells[iterator].style.verticalAlign="top";
				break;
			case "bottom":
			case 1:
				for(let iterator=0;iterator<cells.length;iterator++)
					cells[iterator].style.verticalAlign="bottom";
				break;
			case "middle":
			case 2:
				for(let iterator=0;iterator<cells.length;iterator++)
					cells[iterator].style.verticalAlign="middle";
				break;
			case "left":
			case 3:
				for(let iterator=0;iterator<cells.length;iterator++)
					cells[iterator].childNodes[0].className+=" nested-line-left";
				break;
			case "right":
			case 4:
				for(let iterator=0;iterator<cells.length;iterator++)
					cells[iterator].childNodes[0].className+=" nested-line-right";
				break;
		}
	}

	static GenerateThreeStates(threeStateConfig,checkFunctor,insertToTitleCellFunctor,insertThreeStatesFunctor) 
	{
		if(document.getElementById("threestates")!==null)
			return;
		checkFunctor();
		let states=document.createElement("table");
		states.id="threestates";
		let rowHead=states.insertRow();
		let rowBody=states.insertRow();
		
		for(let iterator=0;iterator<3;iterator++)
		{
			let cell=rowHead.insertCell();
			cell.style.width="30%";
			let title=cell.appendChild(document.createElement("div"));
			insertToTitleCellFunctor(threeStateConfig,title,iterator);

			cell=rowBody.insertCell();
			cell.style.verticalAlign="top";
			let div=cell.appendChild(document.createElement("div"));
			div.id=threeStateConfig[iterator].type;
			div.className="nestable grey nest-container";
			if(isReplay)
			{
				div.style.minWidth=(replayScale*130)+'px';
				div.style.minHeight=(replayScale*90)+'px';
			}
		}
		insertThreeStatesFunctor(states);
	}

	static GenerateDropZone(id,text,parent,accept,isMultiple,style,functor)
	{
		let dropZone=parent.appendChild(document.createElement("div"));
		dropZone.appendChild(document.createTextNode(text+" : "));
		dropZone.class="dropZone";
		dropZone.id=id;
		if(style)
			dropZone.style=style;
		dropZone.onchange=function(event){if(event.target)functor(event.target.files);};
		let form=dropZone.appendChild(document.createElement("form"));
		let input=form.appendChild(document.createElement("input"));
		input.type="file";
		if(isMultiple)
			input.multiple="multiple";
		input.accept=accept;
	}

	static UpdateDeckView(isThreeStatesDeck)
	{
		let pickingZone=document.getElementById("pickingZone");
		if(!pickingZone||!pickingZone.childNodes.length)
			return;
		if(isThreeStatesDeck)	
		{
			pickingZone.firstChild.style.display="";
			for(let iterator=1;iterator<pickingZone.childNodes.length;iterator++)
				pickingZone.childNodes[iterator].style.display="none";
		}
		else
			for(let iterator=0;iterator<pickingZone.childNodes.length;iterator++)
				pickingZone.childNodes[iterator].style.display="";
	}
}
