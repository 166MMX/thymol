/*-------------------- Thymol - the flavour of Thymeleaf --------------------*

   Thymol version 0.0.3-SNAPSHOT Copyright 2012 James J. Benson.
   jjbenson .AT. users.sf.net

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" basis,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

 *---------------------------------------------------------------------------*/

var thURL = "http://www.thymeleaf.org";
var thPrefix = "th";
var thCache = new Object;

$(function(){
  thymol();
 });

var thymol = function() {
	
	$.ajaxSetup({
		async: false
	});
	
	thGetPrefix();
	var thIncl =  thPrefix + ":include";
	var thSubs =  thPrefix + ":substituteby";
	var thInclEscp = "[" + thPrefix + "\\:include]";
	var thSubsEscp = "[" + thPrefix + "\\:substituteby]";
	var thFragEscp = "[" + thPrefix + "\\:fragment='";
	var root = {thDoc: document, visited: false, parentDoc: null, firstChild: null, nextSibling: null, fileName: document.nodeName, fragName: "::", isNode: false, element: document };
	process(root);
			
	
	function process(root) {
	  var n = root;
	  while(n.thDoc) {
	  	getChildren( n );
	    if (n.firstChild && n.firstChild.thDoc && !n.visited) {
	      n.visited = true;
	      n = n.firstChild;
	    }
	    else {
		  	doReplace(n.isNode,n.element,n.thDoc);
	      if (n.nextSibling && n.nextSibling.thDoc) {      	      
	        n = n.nextSibling;
	      }
	      else {
	        if (n == root)
	          break;
	        else {      	
	          n = n.parentDoc;
	        }
	      }
	    }
	  }
	}

	
	function getChildren(base) {
		var thInclSpecs = $( thInclEscp,base.thDoc );
		var thSubsSpecs = $( thSubsEscp,base.thDoc );
		var ths = $(thInclSpecs).add(thSubsSpecs);		
		var count = 0;
		var last=null;
		ths.each(function() {
			var element = this;
			$(element.attributes).each(function() {
				var thAttr = this;
				if( thIncl == thAttr.name || thSubs == thAttr.name ) {
					var filePart = null;
					var fragmentPart = "::";
					if( thAttr.value.indexOf("::") < 0 ) {
						filePart = thAttr.value;
					}
					else {
						var names = thAttr.value.split("::");
						filePart = names[0].trim();			
						fragmentPart = names[1].trim();
					};
					if( thCache[filePart] == null ) {
						thCache[filePart] = new Object;
					};
					var isNode = (thSubs == thAttr.localName);
					if(thCache[filePart][fragmentPart]!=null) {
						isNode = ((thSubs == thAttr.localName) || (fragmentPart == "::"));
					}
					else {
						var fileName = filePart + ".html";					
						$.get(fileName, function(content,status) {
							if( "success" == status ) {
								if( fragmentPart == "::" ) {
									var htmlContent = $("html",content)[0];
									thCache[filePart][fragmentPart] = htmlContent;
								}
								else {
									var fragSpec = thFragEscp + fragmentPart + "']";   
									var fragArray = $(fragSpec,content);
									$(fragArray).each(function() {
										thCache[filePart][fragmentPart] = this;
									});                	   								
								}
							}
							else {
								window.alert("read failed file: " + filePart + " fragment: " + fragmentPart);
							}
						}, "xml" );										                 
					};
					var child = {thDoc: thCache[filePart][fragmentPart], visited: false, parentDoc: base, firstChild: null, nextSibling: null, fileName: filePart, fragName: fragmentPart, isNode: isNode, element: element };
					if( count == 0 ) {
						base.firstChild=child;
					}
					else {
						last.nextSibling=child;
					};
					last=child;
					count++;
				}
			});
		});
	};

	function thGetPrefix() {
		var htmlTag = $("html")[0];
		$(htmlTag.attributes).each(function() {
			if( thURL == this.value ) {
				var nsspec = this.localName.split(":");
				if( nsspec.length > 0 ) {
					thPrefix = nsspec[nsspec.length-1];
					return;
				}			 
			}
		});
	};
	
	function doReplace(isNode,element,content) {
		if( isNode ) {
			element.parentNode.replaceChild(content.cloneNode(true),element);
		}
		else {
			element.innerHTML=content.innerHTML;			
		}
	};
	
};
