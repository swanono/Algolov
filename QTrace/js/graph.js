var configuration;
var isReplay=false;
var activeNode=null;
var setFixed=false;
var dragActivate=0;
var oldTimeMouseMove=0;
var lmddTimer=0;
var counters=0;
var indicators={general:{},phase:{},individual:{}}
var regex=/\d+/;
var section;
var name;
var ind;
var selection=[];
var Filter4DPlugin=null;
var text="Result file (json)";

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

function MouseMove(event)
{
    if(activeNode&&activeNode.parentNode&&activeNode.parentNode.id==="grid")
	{
		if(!setFixed)
		{
			DOMGenerator.SetFixed(true);
			setFixed=true;
		}
		if(oldTimeMouseMove==0)
		{
			oldTimeMouseMove=GetMillisecSinceRefTime();
			return;
		}
		if((GetMillisecSinceRefTime()-oldTimeMouseMove)>1000)
		{
			VisuGenerator.CalculateNexDisplayZone(activeNode);
			oldTimeMouseMove=GetMillisecSinceRefTime();
		}
	}
}

function LoadFile(file, parseFunction, onSuccess) 
{
    fetch(file,{method: "GET"})
    .then(res=> res.text())
    .then(function(data){	
        if(parseFunction(data)&&onSuccess)
            onSuccess();
    });
}

function LoadGraphs(data,parentNode)
{
    for(let key in data)
    {
        switch(data[key].type)
        {
            case 'histogram':
                VisuGenerator.GenerateHistogram(data[key],parentNode,section,ind);
                break;
            case 'stacked-histogram':
                VisuGenerator.GenerateStackedHistogram(data[key],parentNode,section,ind);
                break;
		  case 'stacked-histogram-w':
                VisuGenerator.GenerateStackedHistogram4D(data[key],parentNode,section,ind);
                break;
            case 'scatterplot':
                VisuGenerator.GenerateScatterPlot(data[key],parentNode,section,ind);
                break;
            case 'indicators':
                section=data[key].parameter.title;
                LoadGraphs(data[key].data,indicators.phase);
                section=null;
                break;     
          case 'individuals':
                LoadGraphs(data[key].data);
                break; 
         case 'individual':
                ind=data[key].id;
                LoadGraphs(data[key].data,indicators.individual);
                ind=null;
                break; 
           default:
                continue;
        }
    }
}

class VisuGenerator
{
    static CalculateNexDisplayZone(target)
    {
        if(!target||!target.childNodes[0]||!target.childNodes[1]||!("chart" in target))
            return;
        let style=window.getComputedStyle(target);
        let offset=parseInt(style.getPropertyValue("padding"))+parseFloat(style.getPropertyValue("border"))*2;
        let width=target.clientWidth-offset;
        style=window.getComputedStyle(target.childNodes[0]);
        offset+=parseFloat(style.getPropertyValue("margin"))*2+10;
        let height=target.clientHeight-target.childNodes[0].clientHeight-offset;
        target.childNodes[1].style.width=width+'px';
        target.childNodes[1].style.height=height+'px';
       	target["chart"].renderTo('#'+target.childNodes[1].id);
    }

 	static TransfertDisplayZone(target)
    {
        if(!target||!target.childNodes[0]||!target.childNodes[1]||!("chart" in target))
            return;
        let style=window.getComputedStyle(activeNode);
        let offset=parseInt(style.getPropertyValue("padding"))+parseFloat(style.getPropertyValue("border"))*2;
        let width=activeNode.clientWidth-offset;
        style=window.getComputedStyle(activeNode.childNodes[0]);
        offset+=parseFloat(style.getPropertyValue("margin"))*2+10;
        let height=activeNode.clientHeight-activeNode.childNodes[0].clientHeight-offset;
        if(height<10)
        {
        	height=activeNode.clientHeight+activeNode.childNodes[0].clientHeight+offset;
        	setTimeout(function(){target["chart"].renderTo('#'+target.childNodes[1].id);},100);
        }
        target.childNodes[1].style.width=width+'px';
        target.childNodes[1].style.height=height+'px';
		target["chart"].renderTo('#'+target.childNodes[1].id);
    }

    static Hide_(target)
    {
        let style=window.getComputedStyle(target);
        if(target.style.width!=="")
            target["hideWidth"]=target.style.width;
        else
            target["hideWidth"]=style.getPropertyValue("width");
        if(target.style.height!=="")
            target["hideHeight"]=target.style.height;
        else
            target["hideHeight"]=style.getPropertyValue("height");
        target.style.width="";
        target.style.height="";
    }

    static Show_(target)
    {
        target.style.width=target["hideWidth"];
        target.style.height=target["hideHeight"];
    }

	static Hide(target)
    {
        let group=target.parentNode.childNodes[1];
		VisuGenerator.Hide_(group);
		VisuGenerator.Hide_(target.parentNode);
		group.style.display="none";
    }

    static Show(target)
    {
	    let group=target.parentNode.childNodes[1];
    	if(group.style.display!==""&&group.style.display!=="none")
    	 	return;
		VisuGenerator.CalculateNexDisplayZone(target.parentNode);
		group.style.display="inherit";
		VisuGenerator.Show_(target.parentNode);
		VisuGenerator.Show_(group);
    }

    static ShowHide(target)
    {
        let group=target.parentNode.childNodes[1];
        if(group.style.display!==""&&group.style.display!=="none")
        {
            VisuGenerator.Hide_(group);
            VisuGenerator.Hide_(target.parentNode);
            group.style.display="none";
        }
        else
        {
            group.style="inherit";
            VisuGenerator.Show_(target.parentNode);
            VisuGenerator.Show_(group);
            VisuGenerator.CalculateNexDisplayZone(target.parentNode);
        }
    }

    static GenerateSectionTitle(titletext,parentNode)
    {
        let cell;
        if(!parentNode.rows.length)
            cell=parentNode.insertRow().insertCell();
        else
            cell=parentNode.rows[0].insertCell();
        let title=cell.appendChild(document.createElement("h2"));
        title.appendChild(document.createTextNode(titletext));
        //title.oncontextmenu=function(event){event.preventDefault();event.stopPropagation();let group=event.target.parentNode.childNodes[1];if(group.style.display!=="none")group.style.display="none";else group.style.display="inherit";};
        return parentNode;
    }

    static GenerateGraphTitle(data,name,classNameDiv,classNameGraph,parentNode,phase,individual)
    {
        let div=document.createElement("div");
        let obj={};
        let title=div.appendChild(document.createElement("h4"));
        let strtitle=data.parameter.title+' - '+phase+':'+individual;
        if(phase)
        {
            obj["section"]=phase;
            if(individual)
            {
                strtitle=data.parameter.title+' - '+phase+':'+individual;
                obj["individual"]=individual;
            }
            else
            {
                strtitle=data.parameter.title+' - '+phase;
                obj["individual"]=0;
            }
        }
        else
        {
            strtitle=data.parameter.title;
            obj["section"]="General";
        }
        title.appendChild(document.createTextNode(strtitle));
        div.id=strtitle;
        let graph=div.appendChild(document.createElement("div"));
        div.className="noselect "+classNameDiv;
        DOMGenerator.SetDraggable(div);
        graph.className=classNameGraph;
        graph.id=name;
        title.oncontextmenu=function(event){event.preventDefault();event.stopPropagation();if(event.target.parentNode.parentNode.id==="grid")VisuGenerator.ShowHide(event.target);};
        div.onmousedown=function(event){activeNode=event.target;};
        div.onmouseup=function(event){event.preventDefault();event.stopPropagation();setFixed=false;DOMGenerator.SetFixed(false);if(activeNode&&activeNode.parentNode&&activeNode.parentNode.id==="grid")VisuGenerator.CalculateNexDisplayZone(activeNode);activeNode=null;};
 
        if(parentNode)
        {
            if(!(data.parameter.title in parentNode))
                 parentNode[data.parameter.title]=[];
            obj["element"]=div;
            parentNode[data.parameter.title].push(obj);
        }
        return div;
        DOMGenerator.RegisterResizeEvent(div);
    }

    static GenerateHistogram(data,parentNode,phase,individual)
    {
        let name='bar'+counters++;
        let div=VisuGenerator.GenerateGraphTitle(data,name,"graph bar",'graph-bar',parentNode,phase,individual);
        let chart = new Taucharts.Chart({
            type   : 'bar',
            data   : data.data,
            x      : 'x',
            y      : 'y',

            plugins:[Taucharts.api.plugins.get('tooltip')({fields:['y']}),Taucharts.api.plugins.get('export-to')({cssPaths:['css/taucharts.min.css']})], 
            guide:{x:{label:{text:data.parameter.xtitle}},y:{label:{text:data.parameter.ytitle}}},
            dimension:{x:{type:'order'}},
            settings:{asyncRendering: true}
        });
        //chart.renderTo('#'+name);
        div["chart"]=chart;
    }

    static GenerateStackedHistogram(data,parentNode,phase,individual)
    {
        let name='stacked-bar'+counters++;
        let div=VisuGenerator.GenerateGraphTitle(data,name,"graph stacked-bar",'graph-stacked-bar',parentNode,phase,individual);
        var chart = new Taucharts.Chart({
            type   : 'stacked-bar',
            data   : data.data,
            x      : 'x',
            y      : 'y',
            color  : 'z',
            plugins:[Taucharts.api.plugins.get('legend')(),Taucharts.api.plugins.get('tooltip')({fields:['z','y'],formatters:{z:{label:data.parameter.ztitle},y:{label:data.parameter.ytitle}}}),Taucharts.api.plugins.get('export-to')({cssPaths:['css/taucharts.min.css']})], 
            guide:{x:{label:{text:data.parameter.xtitle}},y:{label:{text:data.parameter.ytitle}}},
            dimension:{x:{type:'order'}},
            settings:{asyncRendering: true}
        });
       //chart.renderTo('#'+name);
        div["chart"]=chart;
        DOMGenerator.RegisterResizeEvent(div);
    }

    static Filter(min,max,data,chart)
    {
		let newdata=[];
		for(let key in data)
		{
			if(data[key].w>=min&&data[key].w<=max)
				newdata.push(data[key]);
		}
		return newdata;
    }

    static Generate4DPlugin()
    {
		Filter4DPlugin=function(settings){
			let min, max;
			let data;
			return {
				init: function(chart){
					if(settings.wmin===settings.wmax)
						return;
					this._label=document.createElement('label');
					this._label.textContent=settings.wtitle+" -> ";
					this._labelmax=document.createElement('label');
					this._labelmax.textContent="Max: ";
					let maxinput=this._labelmax.appendChild(document.createElement('input'));
					maxinput.type="number";
					maxinput.value=settings.wmax;
					maxinput.max=settings.wmax;
					maxinput.min=settings.wmin;
					maxinput.addEventListener('change',function(event){event.preventDefault();event.stopPropagation();max=Number.parseInt(event.target.value);chart.setData(VisuGenerator.Filter(min,max,data,chart));});
					this._labelmin=document.createElement('label');
					this._labelmin.textContent="Min: ";
					let mininput=this._labelmin.appendChild(document.createElement('input'));
					mininput.type="number";
					mininput.value=settings.wmin;
					mininput.max=settings.wmax;
					mininput.min=settings.wmin;
					mininput.addEventListener('change',function(event){event.preventDefault();event.stopPropagation();min=Number.parseInt(event.target.value);chart.setData(VisuGenerator.Filter(min,max,data,chart));});
				 	chart.insertToFooter(this._label);
      				chart.insertToFooter(this._labelmin);
      				chart.insertToFooter(this._labelmax);
      				data=chart.getData();
      				min=settings.wmin;
      				max=settings.wmax;
				},
				destroy:function(chart){
					if(this._label.parentElement) 
					{
						this._labelmax.parentElement.removeChild(this._labelmax);
						this._labelmin.parentElement.removeChild(this._labelmin);
						this._label.parentElement.removeChild(this._label);
					}},
				onRender:function(chart){}
			};
		};
    }

    static GenerateStackedHistogram4D(data,parentNode,phase,individual)
    {
        let name='stacked-bar'+counters++;
        let div=VisuGenerator.GenerateGraphTitle(data,name,"graph stacked-bar",'graph-stacked-bar',parentNode,phase,individual);
        var chart = new Taucharts.Chart({
            type   : 'stacked-bar',
            data   : data.data,
            x      : 'x',
            y      : 'y',
            color  : 'z',
            plugins:[Filter4DPlugin(data.parameter),Taucharts.api.plugins.get('legend')(),Taucharts.api.plugins.get('tooltip')({fields:['z','y','w'],formatters:{z:{label:data.parameter.ztitle},y:{label:data.parameter.ytitle},w:{label:data.parameter.wtitle}}}),Taucharts.api.plugins.get('export-to')({cssPaths:['css/taucharts.min.css']})], 
            guide:{x:{label:{text:data.parameter.xtitle}},y:{label:{text:data.parameter.ytitle}}},
            dimension:{x:{type:'order'}},
            settings:{asyncRendering: true}
        });
       //chart.renderTo('#'+name);
        div["chart"]=chart;
        DOMGenerator.RegisterResizeEvent(div);
    }

    static GenerateScatterPlot(data,parentNode,phase,individual)
    {
        let name='scatterplot'+counters++;
        let div=VisuGenerator.GenerateGraphTitle(data,name,'graph scatterplot','graph-scatterplot',parentNode,phase,individual);
        let chart = new Taucharts.Chart({
            type   : 'scatterplot',
            data   : data.data,
            x      : 'x',
            y      : 'y',
            size   : "z",
            plugins: [Taucharts.api.plugins.get('tooltip')({fields:['z'],formatters:{z:{label:data.parameter.ztitle}}}),Taucharts.api.plugins.get('export-to')({cssPaths:['css/taucharts.min.css']})], 
            guide:{x:{label:{text:data.parameter.xtitle}},y:{label:{text:data.parameter.ytitle}},size:{nice: true}},
            dimension:{x:{type:'order'}},
            settings:{asyncRendering: true}
        });
        //chart.renderTo('#'+name);
        div["chart"]=chart;
        DOMGenerator.RegisterResizeEvent(div);
    }

    static GenerateDatatable(titletext,parentNode)
    {
        let div=document.createElement("div");
        let title=div.appendChild(document.createElement("h2"));
        title.appendChild(document.createTextNode(titletext));
        let table=div.appendChild(document.createElement("table"));
        table.class="nestable";
        table.align="center";
        div.className="noselect";
        if(parentNode)
            parentNode.appendChild(div);
        else
            document.getElementById('main').appendChild(div);
        return table;
    }

    static GenerateDataText(titletext,datatext,parentNode)
    {
        let cell;
        if(!parentNode.rows.length)
            cell=parentNode.insertRow().insertCell();
        else
            cell=parentNode.rows[0].insertCell();
           let div=cell.appendChild(document.createElement("div"));
        let title=div.appendChild(document.createElement("h3"));
        title.appendChild(document.createTextNode(titletext));
        div.appendChild(document.createTextNode(datatext));
        div.className="nested-item noselect";
        return parentNode;
    }

    static RemoveGraphs()
    {
		let picking=DOMGenerator.GetPicking();
		if(!picking.childNodes.length)
			return;
		for(let key in indicators.individual)
			for(let key2 in indicators.individual[key])
				if(selection.includes(indicators.individual[key][key2].individual)&&indicators.individual[key][key2].element.parentNode===picking)
					indicators.individual[key][key2].element.parentNode.removeChild(indicators.individual[key][key2].element);
    }

    static AddGraphs(value)
    {
    	if(!(value in indicators[name]))
    		return;
    	let chart=indicators[name][value];
    	if(!chart)
    		return;
    	for(let key in chart)
    	{
    		if((name!=="individual"||!selection.includes(chart[key].individual))&&!chart[key].element.parentNode)
    			DOMGenerator.GetPicking().appendChild(chart[key].element);
    	}
    }

    static SetSelection(value)
    {
    	let array=document.getElementById("comboFilter").value.split(/[^\d+\-?]/);
    	selection=[];
    	if(array.length&&array[0]!=="")
    	{
    		for(let iterator=1;iterator<=configuration.individuals;iterator++)
    			selection.push(iterator);
		}
		else
			return;
    	for(let key in array)
    	{
    		if(array[key].includes("-"))
    		{
    			let domain=array[key].split("\-");
    			if(domain.length>2)
    			{
    				alert("Error: "+array[key]+" is incorrect!");
    				return;
    			}
    			if(domain[0]<domain[1])
    				selection.splice(selection.indexOf(Number.parseInt(domain[0])),1+Number.parseInt(domain[1])-Number.parseInt(domain[0]));
    			else 
    				selection.splice(selection.indexOf(Number.parseInt(domain[1])),1+Number.parseInt(domain[0])-Number.parseInt(domain[1]));
    			continue;
    		}
    		selection.splice(selection.indexOf(Number.parseInt(array[key])),1);
    	}
    	VisuGenerator.RemoveGraphs();
    }
}

class DOMGenerator
{
	static GetParentWithId(node, joker)
	{
		if(node.id)
			node=node.parentNode;
		while(!node.id||(joker&&node.id.includes(joker)))
		{	
			if(!node.parentNode)
				return node;
			node=node.parentNode;
		}
		return node;
	}

	static RemoveChilds(node)
	{
		if(node.id==="grid")
		{
			while(node.childNodes.length)
			{
				VisuGenerator.Hide(node.firstChild.firstChild);
				node.removeChild(node.firstChild);
			}
		}
		else
			while(node.childNodes.length)
				node.removeChild(node.firstChild);
	}

	static CalculateDistance(vector,node)
	{
		let objectRect=node.getBoundingClientRect();
		if(vector.y<objectRect.top||vector.y>objectRect.bottom)
			return -1;
		let x=objectRect.left+(objectRect.width/2.0);
		return Math.sqrt(Math.pow(vector.x-x,2)/*+Math.pow(vector.y-y,2)*/);
	}

	static ProcessPositionEvent(event,node)
	{
		if(!node)
			return;
		let vect={x:event.clientX,y:event.clientY};
		let dist=1000000,select=0;
		if(event.target.id==="grid"||event.target.parentNode.id==="grid"||event.target.id==="grid-clone"||event.target.parentNode.id==="grid-clone")
		{
			for(let key=0;key<event.currentTarget.childNodes.length;key++)
			{
				let d=DOMGenerator.CalculateDistance(vect,event.currentTarget.childNodes[key]);
				if(d<0)
					continue;
				if(dist>d)
				{
					select=key;
					dist=d;
				}							
			}
			let objectRect=node.getBoundingClientRect();
			let x=objectRect.left+(objectRect.width/2.0);
			if(vect.x<x)
				event.currentTarget.insertBefore(node,event.currentTarget.childNodes[select]);
			else
				event.currentTarget.insertBefore(node,event.currentTarget.childNodes[select+1]);
		}
	}

	static RegisterResizeEvent(node)
	{
		node.addEventListener("resize", function(event){console.log("resize");});
	}

	static SetDraggable(node)
	{
		if(!node)
			return;
		node.draggable=true;
		node.ondragstart=function(event){activeNode=event.target;activeNode.className+=" clone";};
		node.ondragend=function(event){activeNode.className=activeNode.className.substring(0,activeNode.className.length-6);activeNode=null;};
	}

	static SetFixed(active)
	{
		let grid=DOMGenerator.GetGrid();
		if(active)
		{
			grid.style.textAlign="left";
			grid.style.overflow="clip";
		}
		else
		{
			grid.style.textAlign="center";
			grid.style.overflow="auto";
		}
	}

	static GetMain()
	{
		let main=document.getElementById("main");
		if(main)
			return main;
		main=document.body.appendChild(document.createElement("div"));
		main.id="main";
		return main;		
	}

	static GetGrid()
	{
		let grid=document.getElementById("grid");
		if(grid)
			return grid;
		grid=DOMGenerator.GetMain().appendChild(document.createElement("div"));
		grid.id="grid";
		grid.className="grid";
		grid.ondragenter=function(event){event.preventDefault();};
		grid.ondragover=function(event){event.preventDefault();DOMGenerator.ProcessPositionEvent(event,activeNode);};
		grid.ondragleave=function(event){event.preventDefault();};
		grid.ondrop=function(event){event.preventDefault();if(activeNode.parentNode&&activeNode.parentNode.id==="grid")VisuGenerator.Show(activeNode.firstChild);activeNode.style.resize="both";};
		return grid;		
	}

	static GetPicking()
	{
		let div=document.getElementById("picking");
		if(div)
			return div;
		div=DOMGenerator.GetMain().appendChild(document.createElement("div"));
       	div.id="picking";
        div.className="picking";
		div.ondragenter=function(event){event.preventDefault();};
		div.ondragover=function(event){event.preventDefault();};
		div.ondragleave=function(event){event.preventDefault();};
		div.ondrop=function(event){event.preventDefault();if(activeNode.parentNode.id==="grid")VisuGenerator.Hide(activeNode.firstChild);activeNode.parentNode.removeChild(activeNode);};
        return div;
	}

	static GenerateInfobox()
	{
		 let div=DOMGenerator.GetMain().appendChild(document.createElement("div"));
		 div.className="topInfo";
		 let table=div.appendChild(document.createElement("table"));
		 let title=table.insertRow().insertCell().appendChild(document.createElement("h4"));
		 title.appendChild(document.createTextNode("Individuals: "+configuration.individuals));
		 title=table.rows[0].insertCell().appendChild(document.createElement("h4"));
		 title.appendChild(document.createTextNode("Statements: "+configuration.statements));
		 return div;
	}

	static DisabledFilter(istrue)
	{
		let filter=document.getElementById("filter");
		let inputtext=filter.childNodes[0].childNodes[1];
		let button=filter.childNodes[1];
		if(istrue)
		{
			inputtext.disabled=true;
			button.disabled=true;
		}
		else
		{
			inputtext.disabled=false;
			button.disabled=false;
		}
	}

    static GenerateSearchToolbox()
    {
        let div=DOMGenerator.GetMain().appendChild(document.createElement("div"));
        div.className="sideOptions";
        let radio=div.appendChild(document.createElement("div"));
		radio.id="radioType";
		let configurationType=[{text:"General",value:"0"},{text:"Phase",value:"1"},{text:"Individual",value:"2"}]
		for(let iterator=0; iterator<configurationType.length; iterator++)
		{
			let label=radio.appendChild(document.createElement("label"));
			label.appendChild(document.createTextNode(configurationType[iterator].text));
			label.htmlFor=configurationType[iterator].text;
			let rInput=document.createElement("input");
			rInput.value=configurationType[iterator].value;
			rInput.type="radio";
			rInput.name="comboType";
			rInput.id=configurationType[iterator].text;
			rInput.onchange=function(event){let input=document.getElementById("comboType");input.value="";switch(event.currentTarget.value){case "0":name="general";DOMGenerator.DisabledFilter(true);break;case "1":name="phase";DOMGenerator.DisabledFilter(true);break;case "2":name="individual";DOMGenerator.DisabledFilter(false);break;}input.setAttribute("list", name);};
			label.appendChild(rInput);
		}
        for(let key in indicators)
        {
            let comboType=div.appendChild(document.createElement("datalist"));
            comboType.id=key;
            for(let key2 in indicators[key])
            {
                let option=comboType.appendChild(document.createElement("option"));
                option.innerHTML=key2;
            }
        }
        let label=div.appendChild(document.createElement("label"));
        label.appendChild(document.createTextNode("Graphics: "));
        let input=label.appendChild(document.createElement("input"));
        input.type="text";
        input.id="comboType";
        input.onchange=function(event){VisuGenerator.AddGraphs(event.target.value);event.target.value="";};
        let filterdiv=div.appendChild(document.createElement("div"));
        filterdiv.id="filter";
        label=filterdiv.appendChild(document.createElement("label"));
        label.appendChild(document.createTextNode("Filter: "));
        let filter=label.appendChild(document.createElement("input"));
        filter.type="text";
        filter.id="comboFilter";
        let button=filterdiv.appendChild(document.createElement("button"));
        button.appendChild(document.createTextNode("Apply"));
        button.onclick=function(event){VisuGenerator.SetSelection(event.target.value);};
      	DOMGenerator.DisabledFilter(true);
        let removes=div.appendChild(document.createElement("div"));
        input=removes.appendChild(document.createElement("button"));
        input.appendChild(document.createTextNode("Remove Graphs"));
        input.onclick=function(event){DOMGenerator.RemoveChilds(DOMGenerator.GetGrid());DOMGenerator.RemoveChilds(DOMGenerator.GetPicking());};
        return div;
    }

    static GenerateInterfaces()
    {
    	DOMGenerator.GenerateInfobox();
    	let div=DOMGenerator.GetMain().appendChild(document.createElement("div"));
    	div.appendChild(DOMGenerator.GenerateSearchToolbox());
    	div.appendChild(DOMGenerator.GetPicking());
    	DOMGenerator.GetGrid();
    	window.onmouseup=function(){setFixed=false;DOMGenerator.SetFixed(false);};
    }
}

function ReadFile(file,functor)
{
	let txtReader=new FileReader();
	txtReader.onload=function(event){functor(event.target.result);};
	txtReader.readAsText(file);
}

function GenerateDropZone()
{
	let main=DOMGenerator.GetMain();
	let dropZone=main.appendChild(document.createElement("div"));
	dropZone.appendChild(document.createTextNode(text+" : "));
	dropZone.className="dropZone";
	let form=dropZone.appendChild(document.createElement("form"));
	let input=form.appendChild(document.createElement("input"));
	input.onchange=function(event){let files=this.files;ReadFile(files[0],function(text){try{configuration=JSON.parse(text);DOMGenerator.RemoveChilds(DOMGenerator.GetMain());VisuGenerator.Generate4DPlugin();LoadGraphs(configuration.data,indicators.general);DOMGenerator.GenerateInterfaces();return true;}catch(e){console.log(e);return false;}});};
	input.type="file";
	input.accept="json";
}

function start()
{
    LoadFile('/QTrace/data/result.json',function(text){try{configuration=JSON.parse(text); return true;}catch(e){console.log(e); return false;}},function(){}); 
}