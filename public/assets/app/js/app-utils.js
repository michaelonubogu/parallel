
(function () {

	document.onreadystatechange = function () {
		var state = document.readyState;
		
		if (state === 'complete') {
			var lfg = window.lfg !== null && window.lfg !== undefined ? window.lfg : {};
			
			lfg.utils = {				
				indexMapping: [
					{ char: '0', value : 'j' },
					{ char: '1', value : 'i' },
					{ char: '2', value : 'h' },
					{ char: '3', value : 'g' },
					{ char: '4', value : 'f' },
					{ char: '5', value : 'e' },
					{ char: '6', value : 'd' },
					{ char: '7', value : 'c' },
					{ char: '8', value : 'b' },
					{ char: '9', value : 'a' },
				],
				
				convertDateToUtc: function (date) {
					return Date.UTC(
						date.getFullYear(),
						date.getMonth(),
						date.getHours(),
						date.getMinutes(),
						date.getSeconds(),
						date.getMilliseconds()
					)
				},
				
				convertUtcToLocal: function (utcDate) {
				},
				
				clearWhiteSpace: function (string) {
					string.replace(/ /g, '');
				},
				
				getSearchIndex: function (string) {
					var ascii = '';
					var index = '';
					string = this.clearWhiteSpace(string);
					
					for (var i = 0; i < string.length; i++) {
						ascii += string.charCodeAt(i).toString();
					}
					
					for (var j = 0; j < ascii.length; j++) {
						index += this.getIndexSwap(ascii[j]);
					}
					
					return index;
				},
				
				getIndexSwap: function (char) {
					for (var i = 0; i < this.indexMapping.length; i++) {
						if (this.indexMapping[i].char === char) {
							return this.indexMapping[i].value;
						}
					}
				}

			}			
			window.lfg = lfg;
		}
	}
})();