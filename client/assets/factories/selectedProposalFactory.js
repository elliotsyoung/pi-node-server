app.factory('selectedProposalFactory', function() {
	var selected_proposal;

	return {
		set: function(proposal) {
			selected_proposal = proposal;
		},
		get: function() {
			return selected_proposal;
		}
	}
});
