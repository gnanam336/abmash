(function(abmash) {
	var queryElementsFound;
	var queryLimit;
	var queryData = {};
	
	var tempElement = null;
	var tempReferenceElements = null;
	var tempData = null;

	// public functions
	
	abmash.setData = function(key, value) {
		queryData[key] = value;
	}
	
	abmash.getData = function(key) {
		return queryData[key];
	}
	
	abmash.processJqueryCommands = function(elements, jQueryCommands) {
		var response = {};
		jQuery.each(elements, function(id, element) {
			abmash.setData('queryElements', element);
			var elementData = {};
//			alert(element);
			jQuery.each(jQueryCommands, function(type, jQueryCommand) {
//				alert(element + " - " + type + "(" + jQueryCommand + ")");
				jQuery.globalEval("abmash.setData('queryResults', " + jQueryCommand + ");");
				elementData[type] = abmash.getData('queryResults');
//				alert(element + " - " + type + "(" + jQueryCommand + "): " + elementData[type]);
//				alert(element + " - " + id + "(" + type + "): " + jQueryCommand);
			});
			response[id] = elementData;
		});
		return response;
	}
	
	abmash.query = function(conditions, rootElements, referenceElements, limit) {
		var result = null;
		queryLimit = limit;
		queryElementsFound = 0;
		// TODO how do multiple root elements work?
		abmash.setData('queryElements', rootElements.length > 0 ? rootElements.join(',') : document.body);
		jQuery.each(jQuery.parseJSON(conditions), function() {
			var conditionResult = queryCondition(this, referenceElements);
			if(result == null) {
				result = conditionResult;
			} else if(conditionResult.length > 0) {
				// intersect the results with the previous condition because all conditions are ANDed
				result = jQuery.map(result, function(a) { return jQuery.inArray(a, conditionResult) < 0 ? null : a;})
			}
			// TODO process all conditions again with fallbacks only? could produce unexpected results...
			if(result.length == 0) return false;
		});
//		jQuery(result).css('background-color', 'purple');
		return result.unique();
	}

	// private functions
	
	function queryCondition(condition, referenceElements) {
		var conditionResult = [];
		// TODO condition weight?
		jQuery.each(condition.selectorGroups, function() {
			var groupResult = querySelectorGroup(this, referenceElements);
			if(groupResult.length > 0) conditionResult = conditionResult.concat(groupResult);
			if(queryLimitReached()) return false;
		});
		// continue with fallback selector groups if nothing was found
		if(queryElementsFound == 0) {
			jQuery.each(condition.fallbackSelectorGroups, function() {
				var groupResult = querySelectorGroup(this, referenceElements);
				if(groupResult.length > 0) conditionResult = conditionResult.concat(groupResult);
				if(queryLimitReached()) return false;
			});
		}
		return conditionResult;
	}
	
	function querySelectorGroup(selectorGroup, referenceElements) {
		var groupResult = [];
		var groupLimit = selectorGroup.limit;
		if(selectorGroup.referenceId) {
			abmash.setData('referenceElements', jQuery(referenceElements[selectorGroup.referenceId]));
		}
		jQuery.each(selectorGroup.selectors, function() {
			var selector = this;
			// process jquery command
			jQuery.globalEval("abmash.setData('queryResults', " + selector.command + ");");
			var queryResult = abmash.getData('queryResults');
			jQuery.each(jQuery(queryResult), function() {
			    var element = this;
			    // add element if it is visible
			    // TODO optional?
			    if(jQuery(element).filter(":visible").get(0) == jQuery(element).get(0)) {
			    	groupResult.push(element);
			    	queryElementsFound++;
			    	if(queryLimitReached() || groupLimit > 0 && groupResult.length >= groupLimit) return false;
			    }
			});
			if(queryLimitReached() || groupLimit > 0 && groupResult.length >= groupLimit) return false;
		});
		return groupResult;
	}
	
	function queryLimitReached() {
		return queryLimit > 0 && queryElementsFound >= queryLimit;
	}
	
})(window.abmash = window.abmash || {});

//jQuery(document).ready(function(jQuery) {
//	abmash.foo();
//});