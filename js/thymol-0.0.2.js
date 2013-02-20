/*-------------------- Thymol - the flavour of Thymeleaf --------------------*

   Thymol version 0.0.1 Copyright 2012 James J. Benson.
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

$(document).ready(function(){
  thymol();
 });

var thymol = function() {
	thGetPrefix();
	var thIncl =  thPrefix + ":include";
	var thSubs =  thPrefix + ":substituteby";
	var thInclEscp = "[" + thPrefix + "\\:include]";
	var thSubsEscp = "[" + thPrefix + "\\:substituteby]";
	var thFragEscp = "[" + thPrefix + "\\:fragment='";	
	var thInclSpecs = $( thInclEscp );
	var thSubsSpecs = $( thSubsEscp );
	var thSpecs = $(thInclSpecs).add(thSubsSpecs); 
	$(thSpecs).each(function() {
		var element = this;
		$(element.attributes).each(function() {
			var thAttr = this;
			if( thIncl == thAttr.localName || thSubs == thAttr.localName ) {
				var parent = element.parentNode;
				var filePart = null;
				var fragmentPart = "::";
				if( thAttr.value.indexOf("::") < 0 ) {
					filePart = thAttr.value;
				}
				else {
					var names = thAttr.value.split("::");
					filePart = names[0].trim();			
					fragmentPart = names[1].trim();
				}
				if( thCache[filePart] == null ) {
					thCache[filePart] = new Object;
				}
				if(thCache[filePart][fragmentPart]!=null) {
					doReplace((thSubs == thAttr.localName) || (fragmentPart == "::"),parent,element,thCache[filePart][fragmentPart]);
				}
				else {
					var fileName = filePart + ".html";					
					$.get(fileName, function(content,status) {
						if( "success" == status ) {
							if( fragmentPart == "::" ) {
								var htmlContent = $("html",content)[0];
								doReplace(thSubs == thAttr.localName,parent,element,htmlContent);
								thCache[filePart][fragmentPart] = htmlContent;
							}
							else {
								var fragSpec = thFragEscp + fragmentPart + "']";   
								var fragArray = $(fragSpec,content);
								$(fragArray).each(function() {
									doReplace(thSubs == thAttr.localName,parent,element,this);
									thCache[filePart][fragmentPart] = this;
								});                	   								
							}
						}												
					}, "xml" );										                 
				}                                      
			}
		});
	});

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
	
	function doReplace(isNode,parent,node,content) {
		if( isNode ) {
			parent.replaceChild(content.cloneNode(true),node);
		}
		else {
			node.innerHTML=content.innerHTML;			
		}
	};
	
};
