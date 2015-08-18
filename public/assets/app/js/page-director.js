/* ==============================================================================
 * Does 1 thing only:
 * --> Checks for an ssData payload from server and redirects to appropriate page
 * ==============================================================================*/
$(document).ready(function () {
	
	var requestid = window.sessionStorage.getItem('requestid');
	var gameid = window.sessionStorage.getItem('gameid');

	if (requestid) {
		window.sessionStorage.removeItem('requestid');
		document.querySelector('app-router').go('/request/' + requestid);
	}

	if (gameid) {
		window.sessionStorage.removeItem('gameid');
		document.querySelector('app-router').go('/games/' + requestid);
	}
});