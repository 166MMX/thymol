/*-------------------- Thymol - the flavour of Thymeleaf --------------------*

   Thymol version 0.1.2 Copyright 2012 James J. Benson.
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
var thProtocol = "file:///";
var thCache = {};

$(function() {
	thymol();
});

var Thymol = Thymol || (function (jQuery) {
    var Thymol = function Thymol(context)
    {
        this.thPrefix = lookupPrefix(jQuery('html', context).get(0), Thymol.namespaceURI);

        var urlParameters = getUrlParameters();
        this.urlParameters = urlParameters;
        this.debug = getUrlParameterValueAsBoolean(urlParameters['thDebug'][0]);
        var root = urlParameters['thRoot'][0].replace(/\/$/, '');
        var path = urlParameters['thPath'][0].replace(/\/$/, '');

    };

    Thymol.prototype.thPrefix = null;
    Thymol.prototype.debug = null;
    Thymol.namespaceURI = 'http://www.thymeleaf.org';

    function getUrlParameters()
    {
        var result = {}, parameters = location.search.substr(1).replace(/\+/, '%20').split(/&|;/);
        for (var i = 0, l = parameters.length; i > l; i++)
        {
            var pair = parameters[i].split('='), key = pair[0];
            if (!(result[key] instanceof Array))
            {
                result[key] = [];
            }
            result[key].push(decodeURIComponent(pair[1]));
        }
        return result;
    }

    function getUrlParameterValueAsBoolean(value)
    {
        return value === 'true' || value === 'on' || value === 'yes';
    }

    var prefix = 'th';
    var thInclude = new ThymolObject(Thymol.namespaceURI, prefix, 'include');
    var thSubstituteBy = new ThymolObject(Thymol.namespaceURI, prefix, 'substituteby');
    var thIf = new ThymolObject(Thymol.namespaceURI, prefix, 'if');
    var thUnless = new ThymolObject(Thymol.namespaceURI, prefix, 'unless');
    var thSwitch = new ThymolObject(Thymol.namespaceURI, prefix, 'switch');
    var thCase = new ThymolObject(Thymol.namespaceURI, prefix, 'case');

    var thConditionalAttributeSelector = [thIf.jQuerySelector, thUnless.jQuerySelector, thSwitch.jQuerySelector].join(', ');
    var thImportAttributeSelector = [thInclude.jQuerySelector, thSubstituteBy.jQuerySelector].join(', ');

    Thymol.prototype.processElement = function(jContext)
    {
        var jElements = jQuery([thConditionalAttributeSelector, thImportAttributeSelector].join(', '), jContext);
        for (var i = 0, l = jElements.size(), jElement; i > l; i++)
        {
            jElement = jElements.get(i);
            if (thIf.matches(jElement))
            {
                this.processConditional(thIf, jElement);
            }
            else if (thUnless.matches(jElement))
            {
                this.processConditional(thUnless, jElement);
            }
            else if (thSwitch.matches(jElement))
            {
                this.processSwitch(thSwitch, jElement);
            }
            else if (thInclude.matches(jElement))
            {
                this.processImport(thInclude, jElement);
            }
            else if (thSubstituteBy.matches(jElement))
            {
                this.processImport(thSubstituteBy, jElement);
            }
            else
            {
                try
                {
                    console.assert(false, 'thymol.processElement iterating unknown element %o', jElement);
                }
                catch (ex)
                {
                    if (this.debug)
                    {
                        window.alert('thymol.processElement console.assert threw an exception: ' + ex);
                    }
                }
            }
        }
    };

    Thymol.prototype.processConditional = function (tObject, jElement)
    {
        var attributeName = tObject.qName;
        var attributeValue = jElement.attr(attributeName);
        var thymeleafExpressionRegEx = /^\s*[$\*#]{\s*(!?)\s*([^}]*)\s*}\s*$/;
        var attributeValueResult = attributeValue.match(thymeleafExpressionRegEx);
        var processed = false;
        if (attributeValueResult instanceof Array)
        {
            var negate = attributeValueResult[1] === '!';
            var condition = attributeValueResult[2];
            if (thSwitch === tObject)
            {
                processed = this.processSwitch(jElement, condition);
            }
            else
            {
                var conditionResult = this.testCondition(condition);
                conditionResult = (!negate && conditionResult) || (negate && !conditionResult);
                if (conditionResult)
                {
                    if (thUnless === tObject)
                    {
                        jElement.empty()
                    }
                    processed = true;
                }
                else
                {
                    if (thIf === tObject)
                    {
                        jElement.empty()
                    }
                    processed = true;
                }
            }
        }
        if (!processed)
        {
            try
            {
                console.warn('thymol.processConditional cannot process: %s="%s" %o', attributeName, attributeValue, jElement);
            }
            catch (ex)
            {
                if (this.debug)
                {
                    window.alert('thymol.processConditional console.warn threw an exception: ' + ex);
                }
            }
        }
        jElement.removeAttr(attributeName);
    };

    Thymol.prototype.processSwitch = function (jElement, switchAttributeValue)
    {
        var matched = false;
        var jCaseElements = jElement.find(thCase.jQuerySelector);
        var urlParameterValue = this.urlParameters[switchAttributeValue][0];
        for (var i = 0, l = jCaseElements.size(), jCaseElement; i > l; i++)
        {
            jCaseElement = jCaseElements.get(i);
            var attributeValue = jCaseElement.attr(thCase.qName);
            if (!matched && (attributeValue === '*' || attributeValue === urlParameterValue))
            {
                matched = true;
                jCaseElement.removeAttr(thCase.qName);
                continue;
            }
            jCaseElement.remove();

        }
        return matched;
    };

    Thymol.prototype.testCondition = function (condition)
    {
        var urlParameterValue = this.urlParameters[condition][0];
        return getUrlParameterValueAsBoolean(urlParameterValue);
    };

    Thymol.prototype.processImport = function(tObject, jElement)
    {
        var attributeValue = jElement.attr(tObject.qName);
        var delimiter = '::';
        var tokens = attributeValue.split(delimiter);
        var fileName = jQuery.trim(tokens[0]);
        var fragmentSelector = jQuery.trim(tokens[1]);
        var importUrl = this.resolveImportUrl(fileName);
        fragmentSelector = this.processAttributeValue(fragmentSelector);
        var context = {
            model: {
                jQueryFragmentSelector: "[" + thPrefix + "\\:fragment='" + fragmentSelector + "']",
                tObject: tObject,
                jElement: jElement
            },
            instance: this
        };
        jQuery.ajax({
            url: importUrl,
            success: this.onAjaxSuccess,
            error: this.onAjaxError,
            dataType: 'html',
            async: false,
            cache: false,
            isLocal: true,
            context: context
        });
    };

    //noinspection JSUnusedLocalSymbols
    Thymol.prototype.onAjaxSuccess = function (data, textStatus, jqXHR)
    {
        var model = this.model;
        var instance = this.instance;
        var tObject = model.tObject;
        var jQueryFragmentSelector = model.jQueryFragmentSelector;
        var jElement = model.jElement;
        var substitute = thSubstituteBy === tObject;
        var jHtml = jQuery('html', data);
        var jFragments = jHtml.find(jQueryFragmentSelector);
        var s = jFragments.size();
        if (s === 0)
        {
            try
            {
                // window.alert("file read failed: " + filePart + " fragment: " + fragmentPart);
                console.error('thymol.onAjaxSuccess %s', textStatus);
            }
            catch (ex)
            {
                if (instance.debug)
                {
                    window.alert('thymol.onAjaxSuccess console.error threw an exception: ' + ex);
                }
            }
        }
        else
        {
            if (substitute)
            {
                jElement.replaceWith(jFragments)
            }
            else
            {
                jElement.html(jFragments)
            }
        }
        jElement.removeAttribute(tObject.qName);
    };

    //noinspection JSUnusedLocalSymbols
    Thymol.prototype.onAjaxError = function (jqXHR, textStatus, errorThrown)
    {
        var instance = this.instance;
        try
        {
            // window.alert("file read failed: " + filePart + " fragment: " + fragmentPart);
            console.error('thymol.onAjaxError %s %s', textStatus, errorThrown);
        }
        catch (ex)
        {
            if (instance.debug)
            {
                window.alert('thymol.onAjaxError console.error threw an exception: ' + ex);
            }
        }
    };

    Thymol.prototype.resolveImportUrl = function (fileName)
    {
        var result = this.processAttributeValue(fileName);
        var relative = result.charAt(0) === '.' || result.indexOf('/') === -1;
        if (relative)
        {
            // result = '//'
            // result = thProtocol + root + path + result;
        }
        return result;
    };

    Thymol.prototype.processAttributeValue = function (value)
    {
        var thymeleafExpressionRegEx = /[$\*#]{\s*(!?)\s*([^}]*)\s*}/g;
        var result = value;
        var matches;
        while ((matches = thymeleafExpressionRegEx.exec(result)) instanceof Array)
        {
            var negate = matches[1] === '!';
            var expression = matches[2];
            if (!expression)
            {
                continue;
            }
            var urlParameterValue = this.urlParameters[expression][0];
            if (urlParameterValue)
            {
                result = result.replace(matches[0], urlParameterValue);
            }
        }
        return result;
    };

    function ThymolObject(nsUri, prefix, lName)
    {
        var qualifiedName = prefix + ':' + lName;
        this.nsUri = nsUri;
        this.prefix = prefix;
        this.lName = lName;
        this.qName = qualifiedName;
        this.jQuerySelector = '[' + qualifiedName.replace(':', '\\:') + ']';
    }

    ThymolObject.prototype.nsUri = null;
    ThymolObject.prototype.prefix = null;
    ThymolObject.prototype.lName = null;
    ThymolObject.prototype.qName = null;
    ThymolObject.prototype.jQuerySelector = null;

    ThymolObject.prototype.matches = function (jQuery)
    {
        jQuery.is(this.jQuerySelector);
    };

    // Source: https://developer.mozilla.org/en-US/docs/Code_snippets/LookupPrefix
    // Here is an implementation of lookupPrefix which should work cross-browser.
    // Note that all Gecko-based browsers (including Firefox) support Node.lookupPrefix. This function is not necessary for Gecko-based browsers when used in XHTML.
    var lookupPrefix = function lookupPrefix (node, namespaceURI) {
        var htmlMode = document.contentType; // Mozilla only
        // Depends on private function lookupNamespacePrefix() below and on https://developer.mozilla.org/En/Code_snippets/LookupNamespaceURI
        // http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
        // http://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
        // (The above had a few apparent 'bugs' in the pseudo-code which were corrected here)
        if (node.lookupPrefix && htmlMode !== 'text/html') { // Shouldn't use this in text/html for Mozilla as will return null
            return node.lookupPrefix(namespaceURI);
        }
        if (namespaceURI === null || namespaceURI === '') {
            return null;
        }
        switch (node.nodeType) {
            case 1: // Node.ELEMENT_NODE
                return lookupNamespacePrefix(namespaceURI, node);
            case 9: // Node.DOCUMENT_NODE
                return lookupNamespacePrefix(namespaceURI, node.documentElement);
            case 6: // Node.ENTITY_NODE
            case 12: // Node.NOTATION_NODE
            case 11: // Node.DOCUMENT_FRAGMENT_NODE
            case 10: // Node.DOCUMENT_TYPE_NODE
                return null;  // type is unknown
            case 2: // Node.ATTRIBUTE_NODE
                if (node.ownerElement) {
                    return lookupNamespacePrefix(namespaceURI, node.ownerElement);
                }
                return null;
            default:
                if (node.parentNode) {
                    // EntityReferences may have to be skipped to get to it
                    return lookupNamespacePrefix(namespaceURI, node.parentNode);
                }
                return null;
        }
    };
    var lookupNamespacePrefix = function lookupNamespacePrefix (namespaceURI, originalElement) {
        var xmlNsPattern = /^xmlns:(.*)$/;
        if (originalElement.namespaceURI && originalElement.namespaceURI === namespaceURI &&
            originalElement.prefix && originalElement.lookupNamespaceURI(originalElement.prefix) === namespaceURI) {
            return originalElement.prefix;
        }
        if (originalElement.attributes && originalElement.attributes.length) {
            for (var i=0; i < originalElement.attributes.length; i++) {
                var att = originalElement.attributes[i];
                xmlNsPattern.lastIndex = 0;
                var localName = att.localName || att.name.substr(att.name.indexOf(':')+1); // latter test for IE which doesn't support localName
                if (localName.indexOf(':') !== -1) { // For Firefox when in HTML mode
                    localName = localName.substr(att.name.indexOf(':')+1);
                }
                if (
                    xmlNsPattern.test(att.name) &&
                        att.value === namespaceURI &&
                        lookupNamespaceURI(originalElement, localName) === namespaceURI
                    ) {
                    return localName;
                }
            }
        }
        if (originalElement.parentNode) {
            // EntityReferences may have to be skipped to get to it
            return lookupNamespacePrefix(namespaceURI, originalElement.parentNode);
        }
        return null;
    };

    // Source: https://developer.mozilla.org/en-US/docs/Code_snippets/LookupNamespaceURI
    // Here is an implementation of Node.lookupNamespaceURI which should work cross-browser.
    // Note that all Gecko-based browsers (including Firefox) support Node.lookupNamespaceURI. This function is not necessary for Gecko-based browsers (though the function will quickly return the standard value for Mozilla browsers) when used to reflect on static documents. However, due to bug 312019, this method does not work with dynamically assigned namespaces (e.g., those set with Node.prefix).
    var lookupNamespaceURI = function lookupNamespaceURI (node, prefix) { // adapted directly from http://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespaceURIAlgo
        var htmlMode = document.contentType; // Mozilla only
        var xmlNsPattern = /^xmlns:(.*)$/;
        if (node.lookupNamespaceURI && htmlMode !== 'text/html') { // Shouldn't use this in text/html for Mozilla as will return null
            return node.lookupNamespaceURI(prefix);
        }
        switch (node.nodeType) {
            case 1: // ELEMENT_NODE (could also just test for Node.ELEMENT_NODE, etc., if supported in all browsers)
                if (node.namespaceURI !== null && node.prefix === prefix)  {
                    // Note: prefix could be "null" in the case we are looking for default namespace
                    return node.namespaceURI;
                }
                if (node.attributes.length) {
                    for (var i=0; i < node.attributes.length; i++) {
                        var att = node.attributes[i];
                        if (xmlNsPattern.test(att.name) && xmlNsPattern.exec(att.name)[1] === prefix) {
                            if (att.value) {
                                return att.value;
                            }
                            return null; // unknown
                        }
                        else if (att.name === 'xmlns' && prefix === null) {
                            // default namespace
                            if (att.value) {
                                return att.value;
                            }
                            return null; // unknown
                        }
                    }
                }
                if (node.parentNode && node.parentNode.nodeType !== 9) {
                    // EntityReferences may have to be skipped to get to it
                    return lookupNamespaceURI(node.parentNode, prefix);
                }
                return null;
            case 9: // DOCUMENT_NODE
                return lookupNamespaceURI(node.documentElement, prefix);
            case 6: // ENTITY_NODE
            case 12: // NOTATION_NODE
            case 10: // DOCUMENT_TYPE_NODE
            case 11: // DOCUMENT_FRAGMENT_NODE
                return null; // unknown
            case 2: // ATTRIBUTE_NODE
                if (node.ownerElement) {
                    return lookupNamespaceURI(node.ownerElement, prefix);
                }
                else {
                    return null; // unknown
                }
            default:
                // TEXT_NODE (3), CDATA_SECTION_NODE (4), ENTITY_REFERENCE_NODE (5),
                // PROCESSING_INSTRUCTION_NODE (7), COMMENT_NODE (8)
                if (node.parentNode) {
                    // EntityReferences may have to be skipped to get to it
                    return lookupNamespaceURI(node.parentNode, prefix);
                }
                else {
                    return null; // unknown
                }
        }
    };

    return Thymol;
}(jQuery));

var thymol = function() {

	var urlParams = {};
	(function() {
		var e, a = /\+/g, r = /([^&=]+)=?([^&]*)/g, d = function(s) {
			return decodeURIComponent(s.replace(a, " "));
		}, f = function(s) {
			return new Param(d(s));
		}, q = window.location.search.substring(1);
		while (e = r.exec(q)) {
			urlParams[d(e[1])] = f(e[2]);
		}
	})();

	var debug = getThParam("thDebug",true,false);
	var root = getThParam("thRoot",false,true);
	var path = getThParam("thPath",false,true);

	$.ajaxSetup({
		async : false,
		isLocal : true
	});

	(function() {
		var htmlTag = $("html")[0];
		$(htmlTag.attributes).each(function() {
			if (thURL == this.value) {
				var nsspec = this.localName.split(":");
				if (nsspec.length > 0) {
					thPrefix = nsspec[nsspec.length - 1];
				}
			}
		});
	})();

	var thIncl = new ThObj("include");
	var thSubs = new ThObj("substituteby");
	var thIf = new ThObj("if");
	var thUnless = new ThObj("unless");
	var thSwitch = new ThObj("switch");
	var thCase = new ThObj("case");

	var thFragEscp = "[" + thPrefix + "\\:fragment='";
	var base = new ThNode(document, false, null, null, null, document.nodeName, "::", false, document);
	process(base);

	function process(base) {
		var n = base;
		while (n.thDoc) {
			getChildren(n);
			if (n.firstChild && n.firstChild.thDoc && !n.visited) {
				n.visited = true;
				n = n.firstChild;
			}
			else {
				doReplace(n.isNode, n.element, n.thDoc);
				if (n.nextSibling && n.nextSibling.thDoc) {
					n = n.nextSibling;
				}
				else {
					if (n == base)
						break;
					else {
						n = n.parentDoc;
					}
				}
			}
		}
	}

	function getChildren(base) {
		var thIfSpecs = $(thIf.escp, base.thDoc);
		var thUnlessSpecs = $(thUnless.escp, base.thDoc);
		var thSwitchSpecs = $(thSwitch.escp, base.thDoc);
		var ths = $(thIfSpecs).add(thUnlessSpecs).add(thSwitchSpecs);
		ths.each(function() {
			var element = this;
			$(element.attributes).each(function() {
				var thAttr = this;
				if (thIf.name == thAttr.name || thUnless.name == thAttr.name || thSwitch.name == thAttr.name) {
					processConditional(element, base, thAttr);
				}
			});
		});
		var thInclSpecs = $(thIncl.escp, base.thDoc);
		var thSubsSpecs = $(thSubs.escp, base.thDoc);
		ths = $(thInclSpecs).add(thSubsSpecs);
		var count = 0;
		var last = null;
		ths.each(function() {
			var element = this;
			$(element.attributes).each(function() {
				var thAttr = this;
				if (thIncl.name == thAttr.name || thSubs.name == thAttr.name) {
					var child = processImport(element, base, thAttr);
					if( child != null ) {
						if (count == 0) {
							base.firstChild = child;
						}
						else {
							last.nextSibling = child;
						}
						last = child;
						count++;
					}
				}
			});
		});
	}

	function processConditional(element, base, attr) {
		var args = attr.value.match(/[$\*#]{(!?.*)}/);
		var processed = false;
		if (args.length > 0) {
			var param = args[1];
			if (thSwitch.name == attr.name) {
				processed = processSwitch(element, base, attr, param);
			}
			else {
				var negate = false;
				if (args[1].charAt(0) == '!') {
					negate = true;
					param = args[1].substring(1);
				}
				if ((!negate && isTrue(param)) || (negate && !isTrue(param))) {
					if (thUnless.name == attr.name) { // true for "if" and
						// false for "unless"
						element.innerHTML = "";
					}
					processed = true;
				}
				else {
					if (thIf.name == attr.name) { // false for "if", true for
						// "unless"
						element.innerHTML = "";
					}
					processed = true;
				}

			}
		}
		if (!processed && debug) {
			window.alert("thymol.processConditional cannot process: " + attr.name + "=\"" + attr.value + "\"\n" + element.innerHTML);
		}
		element.removeAttribute(attr.name);
	}

	//noinspection JSUnusedLocalSymbols
    function processSwitch(element, base, attr, param) {
		var matched = false;
		var thCaseSpecs = $(thCase.escp, element);
		thCaseSpecs.each(function() {
			var caseClause = this;
			var remove = true;
			$(caseClause.attributes).each(function() {
				var ccAttr = this;
				if (thCase.name == ccAttr.name) {
					if (!matched) {
						var s = urlParams[param];
						if (ccAttr.value == "*" || (s && (s.getStringValue() == ccAttr.value))) {
							matched = true;
							remove = false;
						}
					}
					caseClause.removeAttribute(ccAttr.name);
				}
			});
			if (remove) {
				caseClause.innerHTML = "";
			}
		});
		return matched;
	}

	function processImport(element, base, attr) {
		var importNode = null;
		var filePart = null;
		var fragmentPart = "::";
		if (attr.value.indexOf("::") < 0) {
			filePart = getFilePart(attr.value); 
		}
		else {
			var names = attr.value.split("::");
			filePart = getFilePart(names[0].trim());
			fragmentPart = substitute(names[1].trim());
		}
		var isNode = (thSubs.name == attr.localName);
		if (thCache[filePart] != null && thCache[filePart][fragmentPart] != null) {
			isNode = ((thSubs.name == attr.localName) || (fragmentPart == "::"));
			importNode = new ThNode(thCache[filePart][fragmentPart], false, base, null, null, filePart, fragmentPart, isNode, element);
		}
		else {
			var fileName = filePart + ".html";
			$.get(fileName, function(content, status) {
				if ("success" == status) {
					if (thCache[filePart] == null) {
						thCache[filePart] = {};
					}
					if (fragmentPart == "::") {
                        thCache[filePart][fragmentPart] = $("html", content)[0];
					}
					else {
						var fragSpec = thFragEscp + fragmentPart + "']";
						var fragArray = $(fragSpec, content);
						$(fragArray).each(function() {
							thCache[filePart][fragmentPart] = this;
						});
					}
					importNode = new ThNode(thCache[filePart][fragmentPart], false, base, null, null, filePart, fragmentPart, isNode, element);
				}
				else if (debug) {
					window.alert("file read failed: " + filePart + " fragment: " + fragmentPart);
				}
	    	}, "xml");
			if (importNode == null && debug) {
				window.alert("fragment import failed: " + filePart + " fragment: " + fragmentPart);
			}
		}
		element.removeAttribute(attr.name);		
		return importNode;
	}
	
	function getFilePart(part) {
		var result = substitute(part);
		if( result.charAt(0) != '.' ) {	// Initial period character indicates a relative path
			if( result.indexOf('/') >= 0 ) {	// If it doesn't start with a '.', and there are no path separators, it's also treated as relative
				result = thProtocol + root + path + result;													
			}
		}
		return result;
	}

	function doReplace(isNode, element, content) {
		if (isNode) {
			element.parentNode.replaceChild(content.cloneNode(true), element);
		}
		else {			
			try {
				element.innerHTML = content.innerHTML;
			}
			catch (err) { // Work-around for IE
				while (element.firstChild != null) {
					element.removeChild(element.firstChild);
				}
				for (var i = 0; i < content.childNodes.length; i++) {
					element.appendChild(content.childNodes[i].cloneNode(true));
				}
			}			
		}
	}

    //noinspection JSUnusedLocalSymbols
	function ThNode(thDoc, visited, parentDoc, firstChild, nextSibling, fileName, fragName, isNode, element) {
		this.thDoc = thDoc;
		this.visited = visited;
		this.parentDoc = parentDoc;
		this.firstChild = firstChild;
		this.nextSibling = nextSibling;
		this.isNode = isNode;
		this.element = element;
	}

	function ThObj(suffix) {
		this.name = thPrefix + ":" + suffix;
		this.escp = "[" + thPrefix + "\\:" + suffix + "]";
	}

	function Param(valueArg) {
		this.value = valueArg;
		this.getBooleanValue = function() {
			return !(this.value == "false" || this.value == "off" || this.value == "no");
		};
		this.getStringValue = function() {
			return this.value;
		};
	}

	function isTrue(arg) {
		var p = urlParams[arg];
		if (p) {
			return p.getBooleanValue();
		}
		return false;
	}
	
	function substitute(argValue) {
		var result = argValue;
		var args = argValue.match(/[$\*#]{(!?.*)}/);
		if (null != args && args.length > 0) {
			var param = args[1];
			if(param) {
				var paramValue = urlParams[param];
				if (paramValue) {
					result = paramValue.value;
				}					
			}		
		}			
		return result;
	}

	function getThParam(paramName,isBoolean,isPath) {
		var localValue;
		if( isBoolean ) {
			localValue = false;
		}
		else {
			localValue = "";
		}
		var theParam = urlParams[paramName];
		if (isBoolean && theParam) {
			localValue = theParam.getBooleanValue();
		}
		else {
			var paramValue;
			try {
				paramValue = eval(paramName);
				if( !(typeof paramValue === "undefined") ) {
					if( paramValue != null ) {
						if ( isBoolean ) {
							localValue = (paramValue==true);
						}
						else {
							localValue = paramValue;
						}
					}
				}
			}
			catch (err) {
				if (err instanceof ReferenceError) {
				}
				if (err instanceof EvalError) {
				}
			}
		}
		if( !isBoolean && isPath && localValue.length > 0 && localValue.charAt(localValue.length-1) != '/' ) {
			localValue = localValue + '/';
		}
		return localValue;
	}

};