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
			{
				name: "Select",
				image: "arrow.png",
				tool: Select,
			},
			{
				name: "Erase",
				image: "delete.png",
				tool: Erase,
			},
		],
		[
			{
				name: "North",
				image: "crocU.png",
				tool: MakeCroc,
				params: [0],
			},
			{
				name: "East",
				image: "crocR.png",
				tool: MakeCroc,
				params: [1],
			},
			{
				name: "South",
				image: "crocD.png",
				tool: MakeCroc,
				params: [2],
			},
			{
				name: "West",
				image: "crocL.png",
				tool: MakeCroc,
				params: [3],
			},
			{
				name: "Auto",
				image: "crocO.png",
				tool: MakeCroc,
				params: [4],
			},
			{
				name: "Meat",
				image: "meat.png",
				tool: MakeMeat,
			},
		]
	];

	var toolbox = document.getElementById("Toolbox");
	for(var k = 0; k < tools.length; ++k)
	{
		var toolgroup = tools[k];
		var panel = document.createElement("span");
		panel.className = "ToolBar";
		for(var i = 0; i < toolgroup.length; ++i)
		{
			var spec = toolgroup[i];
			if(!spec)
			{
				toolbox.appendChild(document.createTextNode(" "));
				continue;
			}
			var tool = document.createElement("img");
			tool.src = spec.image;
			tool.title = spec.name;
			tool.className = "Tool";
			tool.id = "Tool_" + k + "_" + i;
			tool.onclick = SelectTool;
			tool.fn = bind_passthis(spec.tool, spec.params);
			panel.appendChild(tool);
		}
		toolbox.appendChild(panel);
	}
	
	document.getElementById("Battlefield").onclick = BFClick;
	document.getElementById("Tool_0_0").onclick();
	
	onupdate.push(UpdateInfobox);
})()
