//MooTools More, <http://mootools.net/more>. Copyright (c) 2006-2009 Aaron Newton <http://clientcide.com/>, Valerio Proietti <http://mad4milk.net> & the MooTools team <http://mootools.net/developers>, MIT Style License.
// More, Element.Forms, Drag, Drag.Move, Sortables, Scroller, Fx.Scroll

MooTools.More={version:"1.2.3.1"};Element.implement({tidy:function(){this.set("value",this.get("value").tidy());},getTextInRange:function(b,a){return this.get("value").substring(b,a);
},getSelectedText:function(){if(this.setSelectionRange){return this.getTextInRange(this.getSelectionStart(),this.getSelectionEnd());}return document.selection.createRange().text;
},getSelectedRange:function(){if($defined(this.selectionStart)){return{start:this.selectionStart,end:this.selectionEnd};}var e={start:0,end:0};var a=this.getDocument().selection.createRange();
if(!a||a.parentElement()!=this){return e;}var c=a.duplicate();if(this.type=="text"){e.start=0-c.moveStart("character",-100000);e.end=e.start+a.text.length;
}else{var b=this.get("value");var d=b.length-b.match(/[\n\r]*$/)[0].length;c.moveToElementText(this);c.setEndPoint("StartToEnd",a);e.end=d-c.text.length;
c.setEndPoint("StartToStart",a);e.start=d-c.text.length;}return e;},getSelectionStart:function(){return this.getSelectedRange().start;},getSelectionEnd:function(){return this.getSelectedRange().end;
},setCaretPosition:function(a){if(a=="end"){a=this.get("value").length;}this.selectRange(a,a);return this;},getCaretPosition:function(){return this.getSelectedRange().start;
},selectRange:function(e,a){if(this.setSelectionRange){this.focus();this.setSelectionRange(e,a);}else{var c=this.get("value");var d=c.substr(e,a-e).replace(/\r/g,"").length;
e=c.substr(0,e).replace(/\r/g,"").length;var b=this.createTextRange();b.collapse(true);b.moveEnd("character",e+d);b.moveStart("character",e);b.select();
}return this;},insertAtCursor:function(b,a){var d=this.getSelectedRange();var c=this.get("value");this.set("value",c.substring(0,d.start)+b+c.substring(d.end,c.length));
if($pick(a,true)){this.selectRange(d.start,d.start+b.length);}else{this.setCaretPosition(d.start+b.length);}return this;},insertAroundCursor:function(b,a){b=$extend({before:"",defaultMiddle:"",after:""},b);
var c=this.getSelectedText()||b.defaultMiddle;var g=this.getSelectedRange();var f=this.get("value");if(g.start==g.end){this.set("value",f.substring(0,g.start)+b.before+c+b.after+f.substring(g.end,f.length));
this.selectRange(g.start+b.before.length,g.end+b.before.length+c.length);}else{var d=f.substring(g.start,g.end);this.set("value",f.substring(0,g.start)+b.before+d+b.after+f.substring(g.end,f.length));
var e=g.start+b.before.length;if($pick(a,true)){this.selectRange(e,e+d.length);}else{this.setCaretPosition(e+f.length);}}return this;}});Fx.Scroll=new Class({Extends:Fx,options:{offset:{x:0,y:0},wheelStops:true},initialize:function(b,a){this.element=this.subject=document.id(b);
this.parent(a);var d=this.cancel.bind(this,false);if($type(this.element)!="element"){this.element=document.id(this.element.getDocument().body);}var c=this.element;
if(this.options.wheelStops){this.addEvent("start",function(){c.addEvent("mousewheel",d);},true);this.addEvent("complete",function(){c.removeEvent("mousewheel",d);
},true);}},set:function(){var a=Array.flatten(arguments);this.element.scrollTo(a[0],a[1]);},compute:function(c,b,a){return[0,1].map(function(d){return Fx.compute(c[d],b[d],a);
});},start:function(c,h){if(!this.check(c,h)){return this;}var e=this.element.getSize(),f=this.element.getScrollSize();var b=this.element.getScroll(),d={x:c,y:h};
for(var g in d){var a=f[g]-e[g];if($chk(d[g])){d[g]=($type(d[g])=="number")?d[g].limit(0,a):a;}else{d[g]=b[g];}d[g]+=this.options.offset[g];}return this.parent([b.x,b.y],[d.x,d.y]);
},toTop:function(){return this.start(false,0);},toLeft:function(){return this.start(0,false);},toRight:function(){return this.start("right",false);},toBottom:function(){return this.start(false,"bottom");
},toElement:function(b){var a=document.id(b).getPosition(this.element);return this.start(a.x,a.y);},scrollIntoView:function(c,e,d){e=e?$splat(e):["x","y"];
var h={};c=document.id(c);var f=c.getPosition(this.element);var i=c.getSize();var g=this.element.getScroll();var a=this.element.getSize();var b={x:f.x+i.x,y:f.y+i.y};
["x","y"].each(function(j){if(e.contains(j)){if(b[j]>g[j]+a[j]){h[j]=b[j]-a[j];}if(f[j]<g[j]){h[j]=f[j];}}if(h[j]==null){h[j]=g[j];}if(d&&d[j]){h[j]=h[j]+d[j];
}},this);if(h.x!=g.x||h.y!=g.y){this.start(h.x,h.y);}return this;}});var Drag=new Class({Implements:[Events,Options],options:{snap:6,unit:"px",grid:false,style:true,limit:false,handle:false,invert:false,preventDefault:false,modifiers:{x:"left",y:"top"}},initialize:function(){var b=Array.link(arguments,{options:Object.type,element:$defined});
this.element=document.id(b.element);this.document=this.element.getDocument();this.setOptions(b.options||{});var a=$type(this.options.handle);this.handles=((a=="array"||a=="collection")?$$(this.options.handle):document.id(this.options.handle))||this.element;
this.mouse={now:{},pos:{}};this.value={start:{},now:{}};this.selection=(Browser.Engine.trident)?"selectstart":"mousedown";this.bound={start:this.start.bind(this),check:this.check.bind(this),drag:this.drag.bind(this),stop:this.stop.bind(this),cancel:this.cancel.bind(this),eventStop:$lambda(false)};
this.attach();},attach:function(){this.handles.addEvent("mousedown",this.bound.start);return this;},detach:function(){this.handles.removeEvent("mousedown",this.bound.start);
return this;},start:function(c){if(this.options.preventDefault){c.preventDefault();}this.mouse.start=c.page;this.fireEvent("beforeStart",this.element);
var a=this.options.limit;this.limit={x:[],y:[]};for(var d in this.options.modifiers){if(!this.options.modifiers[d]){continue;}if(this.options.style){this.value.now[d]=this.element.getStyle(this.options.modifiers[d]).toInt();
}else{this.value.now[d]=this.element[this.options.modifiers[d]];}if(this.options.invert){this.value.now[d]*=-1;}this.mouse.pos[d]=c.page[d]-this.value.now[d];
if(a&&a[d]){for(var b=2;b--;b){if($chk(a[d][b])){this.limit[d][b]=$lambda(a[d][b])();}}}}if($type(this.options.grid)=="number"){this.options.grid={x:this.options.grid,y:this.options.grid};
}this.document.addEvents({mousemove:this.bound.check,mouseup:this.bound.cancel});this.document.addEvent(this.selection,this.bound.eventStop);},check:function(a){if(this.options.preventDefault){a.preventDefault();
}var b=Math.round(Math.sqrt(Math.pow(a.page.x-this.mouse.start.x,2)+Math.pow(a.page.y-this.mouse.start.y,2)));if(b>this.options.snap){this.cancel();this.document.addEvents({mousemove:this.bound.drag,mouseup:this.bound.stop});
this.fireEvent("start",[this.element,a]).fireEvent("snap",this.element);}},drag:function(a){if(this.options.preventDefault){a.preventDefault();}this.mouse.now=a.page;
for(var b in this.options.modifiers){if(!this.options.modifiers[b]){continue;}this.value.now[b]=this.mouse.now[b]-this.mouse.pos[b];if(this.options.invert){this.value.now[b]*=-1;
}if(this.options.limit&&this.limit[b]){if($chk(this.limit[b][1])&&(this.value.now[b]>this.limit[b][1])){this.value.now[b]=this.limit[b][1];}else{if($chk(this.limit[b][0])&&(this.value.now[b]<this.limit[b][0])){this.value.now[b]=this.limit[b][0];
}}}if(this.options.grid[b]){this.value.now[b]-=((this.value.now[b]-(this.limit[b][0]||0))%this.options.grid[b]);}if(this.options.style){this.element.setStyle(this.options.modifiers[b],this.value.now[b]+this.options.unit);
}else{this.element[this.options.modifiers[b]]=this.value.now[b];}}this.fireEvent("drag",[this.element,a]);},cancel:function(a){this.document.removeEvent("mousemove",this.bound.check);
this.document.removeEvent("mouseup",this.bound.cancel);if(a){this.document.removeEvent(this.selection,this.bound.eventStop);this.fireEvent("cancel",this.element);
}},stop:function(a){this.document.removeEvent(this.selection,this.bound.eventStop);this.document.removeEvent("mousemove",this.bound.drag);this.document.removeEvent("mouseup",this.bound.stop);
if(a){this.fireEvent("complete",[this.element,a]);}}});Element.implement({makeResizable:function(a){var b=new Drag(this,$merge({modifiers:{x:"width",y:"height"}},a));
this.store("resizer",b);return b.addEvent("drag",function(){this.fireEvent("resize",b);}.bind(this));}});Drag.Move=new Class({Extends:Drag,options:{droppables:[],container:false,precalculate:false,includeMargins:true,checkDroppables:true},initialize:function(c,b){this.parent(c,b);
this.droppables=$$(this.options.droppables);this.container=document.id(this.options.container);if(this.container&&$type(this.container)!="element"){this.container=document.id(this.container.getDocument().body);
}var a=this.element.getStyle("position");if(a=="static"){a="absolute";}if([this.element.getStyle("left"),this.element.getStyle("top")].contains("auto")){this.element.position(this.element.getPosition(this.element.offsetParent));
}this.element.setStyle("position",a);this.addEvent("start",this.checkDroppables,true);this.overed=null;},start:function(f){if(this.container){var b=this.container.getCoordinates(this.element.getOffsetParent()),c={},e={};
["top","right","bottom","left"].each(function(g){c[g]=this.container.getStyle("border-"+g).toInt();e[g]=this.element.getStyle("margin-"+g).toInt();},this);
var d=this.element.offsetWidth+e.left+e.right;var a=this.element.offsetHeight+e.top+e.bottom;if(this.options.includeMargins){$each(e,function(h,g){e[g]=0;
});}if(this.container==this.element.getOffsetParent()){this.options.limit={x:[0-e.left,b.right-c.left-c.right-d+e.right],y:[0-e.top,b.bottom-c.top-c.bottom-a+e.bottom]};
}else{this.options.limit={x:[b.left+c.left-e.left,b.right-c.right-d+e.right],y:[b.top+c.top-e.top,b.bottom-c.bottom-a+e.bottom]};}}if(this.options.precalculate){this.positions=this.droppables.map(function(g){return g.getCoordinates();
});}this.parent(f);},checkAgainst:function(c,b){c=(this.positions)?this.positions[b]:c.getCoordinates();var a=this.mouse.now;return(a.x>c.left&&a.x<c.right&&a.y<c.bottom&&a.y>c.top);
},checkDroppables:function(){var a=this.droppables.filter(this.checkAgainst,this).getLast();if(this.overed!=a){if(this.overed){this.fireEvent("leave",[this.element,this.overed]);
}if(a){this.fireEvent("enter",[this.element,a]);}this.overed=a;}},drag:function(a){this.parent(a);if(this.options.checkDroppables&&this.droppables.length){this.checkDroppables();
}},stop:function(a){this.checkDroppables();this.fireEvent("drop",[this.element,this.overed,a]);this.overed=null;return this.parent(a);}});Element.implement({makeDraggable:function(a){var b=new Drag.Move(this,a);
this.store("dragger",b);return b;}});var Sortables=new Class({Implements:[Events,Options],options:{snap:4,opacity:1,clone:false,revert:false,handle:false,constrain:false},initialize:function(a,b){this.setOptions(b);
this.elements=[];this.lists=[];this.idle=true;this.addLists($$(document.id(a)||a));if(!this.options.clone){this.options.revert=false;}if(this.options.revert){this.effect=new Fx.Morph(null,$merge({duration:250,link:"cancel"},this.options.revert));
}},attach:function(){this.addLists(this.lists);return this;},detach:function(){this.lists=this.removeLists(this.lists);return this;},addItems:function(){Array.flatten(arguments).each(function(a){this.elements.push(a);
var b=a.retrieve("sortables:start",this.start.bindWithEvent(this,a));(this.options.handle?a.getElement(this.options.handle)||a:a).addEvent("mousedown",b);
},this);return this;},addLists:function(){Array.flatten(arguments).each(function(a){this.lists.push(a);this.addItems(a.getChildren());},this);return this;
},removeItems:function(){return $$(Array.flatten(arguments).map(function(a){this.elements.erase(a);var b=a.retrieve("sortables:start");(this.options.handle?a.getElement(this.options.handle)||a:a).removeEvent("mousedown",b);
return a;},this));},removeLists:function(){return $$(Array.flatten(arguments).map(function(a){this.lists.erase(a);this.removeItems(a.getChildren());return a;
},this));},getClone:function(b,a){if(!this.options.clone){return new Element("div").inject(document.body);}if($type(this.options.clone)=="function"){return this.options.clone.call(this,b,a,this.list);
}return a.clone(true).setStyles({margin:"0px",position:"absolute",visibility:"hidden",width:a.getStyle("width")}).inject(this.list).position(a.getPosition(a.getOffsetParent()));
},getDroppables:function(){var a=this.list.getChildren();if(!this.options.constrain){a=this.lists.concat(a).erase(this.list);}return a.erase(this.clone).erase(this.element);
},insert:function(c,b){var a="inside";if(this.lists.contains(b)){this.list=b;this.drag.droppables=this.getDroppables();}else{a=this.element.getAllPrevious().contains(b)?"before":"after";
}this.element.inject(b,a);this.fireEvent("sort",[this.element,this.clone]);},start:function(b,a){if(!this.idle){return;}this.idle=false;this.element=a;
this.opacity=a.get("opacity");this.list=a.getParent();this.clone=this.getClone(b,a);this.drag=new Drag.Move(this.clone,{snap:this.options.snap,container:this.options.constrain&&this.element.getParent(),droppables:this.getDroppables(),onSnap:function(){b.stop();
this.clone.setStyle("visibility","visible");this.element.set("opacity",this.options.opacity||0);this.fireEvent("start",[this.element,this.clone]);}.bind(this),onEnter:this.insert.bind(this),onCancel:this.reset.bind(this),onComplete:this.end.bind(this)});
this.clone.inject(this.element,"before");this.drag.start(b);},end:function(){this.drag.detach();this.element.set("opacity",this.opacity);if(this.effect){var a=this.element.getStyles("width","height");
var b=this.clone.computePosition(this.element.getPosition(this.clone.offsetParent));this.effect.element=this.clone;this.effect.start({top:b.top,left:b.left,width:a.width,height:a.height,opacity:0.25}).chain(this.reset.bind(this));
}else{this.reset();}},reset:function(){this.idle=true;this.clone.destroy();this.fireEvent("complete",this.element);},serialize:function(){var c=Array.link(arguments,{modifier:Function.type,index:$defined});
var b=this.lists.map(function(d){return d.getChildren().map(c.modifier||function(e){return e.get("id");},this);},this);var a=c.index;if(this.lists.length==1){a=0;
}return $chk(a)&&a>=0&&a<this.lists.length?b[a]:b;}});var Scroller=new Class({Implements:[Events,Options],options:{area:20,velocity:1,onChange:function(a,b){this.element.scrollTo(a,b);
},fps:50},initialize:function(b,a){this.setOptions(a);this.element=document.id(b);this.listener=($type(this.element)!="element")?document.id(this.element.getDocument().body):this.element;
this.timer=null;this.bound={attach:this.attach.bind(this),detach:this.detach.bind(this),getCoords:this.getCoords.bind(this)};},start:function(){this.listener.addEvents({mouseenter:this.bound.attach,mouseleave:this.bound.detach});
},stop:function(){this.listener.removeEvents({mouseenter:this.bound.attach,mouseleave:this.bound.detach});this.timer=$clear(this.timer);},attach:function(){this.listener.addEvent("mousemove",this.bound.getCoords);
},detach:function(){this.listener.removeEvent("mousemove",this.bound.getCoords);this.timer=$clear(this.timer);},getCoords:function(a){this.page=(this.listener.get("tag")=="body")?a.client:a.page;
if(!this.timer){this.timer=this.scroll.periodical(Math.round(1000/this.options.fps),this);}},scroll:function(){var b=this.element.getSize(),a=this.element.getScroll(),f=this.element.getOffsets(),c=this.element.getScrollSize(),e={x:0,y:0};
for(var d in this.page){if(this.page[d]<(this.options.area+f[d])&&a[d]!=0){e[d]=(this.page[d]-this.options.area-f[d])*this.options.velocity;}else{if(this.page[d]+this.options.area>(b[d]+f[d])&&a[d]+b[d]!=c[d]){e[d]=(this.page[d]-b[d]+this.options.area-f[d])*this.options.velocity;
}}}if(e.y||e.x){this.fireEvent("change",[a.x+e.x,a.y+e.y]);}}});