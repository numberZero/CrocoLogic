function bind(fn, obj, args)
{
	if(arguments.length < 2)
		obj = this;
	if(!(args instanceof Array))
		args = Array.prototype.slice.call(arguments, 2);
	var result = function() { fn.apply(obj, args); }
	result.object = obj;
	result.method = fn;
	return result;
}

function bind_passthis(fn, args)
{
	args = args || [];
	var result = function(self) { fn.apply(self, args); }
	result.object = null;
	result.method = fn;
	return result;
}

function MakeToolbars(toolbox, data, callback) // pass false as callback to suppress modifying data
{
	for(var k = 0; k < data.length; ++k)
	{
		var toolgroup = data[k];
		var panel = document.createElement("span");
		panel.className = "ToolBar";
		for(var i = 0; i < toolgroup.length; ++i)
		{
			var spec = toolgroup[i];
			var tool = document.createElement("img");
			tool.src = spec.image;
			tool.title = spec.name;
			tool.className = "Tool";
			tool.onclick = spec.tool;
			if(callback !== false)
				spec.button = tool;
			if(callback)
				callback.call(tool, spec, k, i);
			panel.appendChild(tool);
		}
		toolbox.appendChild(panel);
	}
}

(function()
{
	var Click = {method:{}};
	var Selected = null;
	var Infobox = document.getElementById("Infobox");
	var DummyCell = { field: { x: null, y: null, content: null }};
	DummyCell.field.cell = DummyCell;
	
	function getInfoboxElement(infobox, key)
	{
		return document.getElementById("Infobox" + infobox + key);
	}
	
	function updateData(infobox, data)
	{
		getInfoboxElement(infobox, "").classList.add("InfoboxActive");
		for(var id in data)
			getInfoboxElement(infobox, id).textContent = data[id];
	}
	
	Crocodile.prototype.updateInfobox = function()
	{
		var img = getInfoboxElement("Croc", "Img");
		img.src = this.img.src;
		img.style.opacity = this.img.style.opacity;
		updateData("Croc", {
			"X": this.field.x,
			"Y": this.field.y,
			"Id": this.id,
			"Sleepy": this.sleep,
			"Ate": this.ate,
		});
	}
	
	Meat.prototype.updateInfobox = function()
	{
		updateData("Meat", {
			"X": this.field.x,
			"Y": this.field.y,
		});
	}
	
	function MakeInfobox()
	{
		var e = document.getElementsByClassName("InfoboxActive");
		while(e.length)
			e[0].classList.remove("InfoboxActive");
		UpdateInfobox();
	}
	
	function UpdateInfobox()
	{
		if(Selected)
			Selected.updateInfobox();
	}
	
	function Select()
	{
		if(Selected)
		{
			Selected.ondie = null;
			Selected.img.classList.remove("ObjectSelected");
		}
		Selected = this.field.content;
		if(Selected)
		{
			Selected.img.classList.add("ObjectSelected");
			Selected.ondie = function() { Select.call(DummyCell); };
		}
		MakeInfobox();
	}
	
	function Erase()
	{
		if(!this.field.content)
			return;
		this.field.content.die();
	}
	
	function MakeCroc(dir)
	{
		if(this.field.content)
			return;
		new Crocodile(this.field, dir);
	}
	
	function MakeMeat()
	{
		if(this.field.content)
			return;
		new Meat(this.field);
	}
	
	function SelectTool()
	{
		document.body.classList.remove("UsingTool_" + Click.method.name);
		Click = this.fn;
		document.body.classList.add("UsingTool_" + Click.method.name);
		var old = document.getElementsByClassName("ToolActive");
		while(old.length)
			old[0].classList.remove("ToolActive");
		this.classList.add("ToolActive");
	}
	
	function BFClick(e)
	{
		if(e.target instanceof HTMLTableCellElement)
			Click(e.target);
	}
	
	var tools = [
		[
			{	name: "Select",	image: "image/arrow.png",	tool: Select,	},
			{	name: "Erase",	image: "image/delete.png",	tool: Erase,	},
		],
		[
			{	name: "North",	image: "image/crocU.png",	tool: MakeCroc,	params: [dirNorth],	},
			{	name: "East",	image: "image/crocR.png",	tool: MakeCroc,	params: [dirEast],	},
			{	name: "South",	image: "image/crocD.png",	tool: MakeCroc,	params: [dirSouth],	},
			{	name: "West",	image: "image/crocL.png",	tool: MakeCroc,	params: [dirWest],	},
			{	name: "Auto",	image: "image/crocO.png",	tool: MakeCroc,	params: [dirAuto],	},
			{	name: "Meat",	image: "image/meat.png",	tool: MakeMeat,	},
		]
	];

	var toolbox = document.getElementById("Toolbox");
	MakeToolbars(toolbox, tools, function(spec, bar, button)
		{
			this.onclick = SelectTool;
			this.fn = bind_passthis(spec.tool, spec.params);
			spec.button = this;
		});
	
	document.getElementById("BattlefieldGrid").onclick = BFClick;
	tools[0][0].button.onclick();
	
	onupdate.push(UpdateInfobox);
})();

(function()
{
	var tools = [
		[
			{	name: "Play",	image: "image/play.png",	tool: Play,	},
			{	name: "Pause",	image: "image/pause.png",	tool: Pause,	},
		],
		[
			{	name: "Reset",	image: "image/reset.png",	tool: Reset,	},
			{	name: "Load",	image: "image/load.png",	tool: Load,	},
			{	name: "Save",	image: "image/save.png",	tool: Save,	},
		]
	];

	var toolbox = document.getElementById("Controlbox");
	MakeToolbars(toolbox, tools);
	
	function Play()
	{
		play();
		tools[0][0].button.style.display = "none";
		tools[0][1].button.style.display = "";
	}
	
	function Pause()
	{
		pause();
		tools[0][0].button.style.display = "";
		tools[0][1].button.style.display = "none";
	}
	
	function Reset()
	{
		Pause();
		if(!confirm("Clear whole field?"))
			return;
		var k = prompt("Enter new map size (one or two numbers, separated by anything), or leave the filed blank to keep current map size");
		k = /^\s*([0-9]+)((\s*[^\s\d]+\s*|\s+)([0-9]+))?\s*$/.exec(k);
		if(k)
		{
			var w = k[1];
			var h = k[4] || null;
		}
		initialize(w, h);
	}
	
	function Load()
	{
		Pause();
		var data = prompt("Enter saved data");
		if(!data)
			return; // silently
		data = JSON.parse(data);
		if(!data)
			return void(alert("Invalid JSON"));
		restore(data);
	}
	
	function Save()
	{
		Pause();
		alert(JSON.stringify(serialize()));
	}
	
	Pause();
})();
