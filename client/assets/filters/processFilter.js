app.filter('processFilter', function() {
	return function(proposals, process) {
		if (!process || proposals.length == 0) 
			return proposals;
		return proposals.filter(function(proposal) {
			if (!proposal.processes)
				return false;
			
			var noFiltersSelected = true;
			for (var key in process)
				if (process[key]) {
					noFiltersSelected = false;
					if (proposal.processes.includes(key))
						return true;
				}
			return noFiltersSelected;
		});
	}
});