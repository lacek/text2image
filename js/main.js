(function($) {
var config = {
	ios: /(ip(hone|od|ad))/i .test(navigator.userAgent)
};
var charImages = {};
var filteringRegex;

function loadConfig(callback) {
	$.ajax({
		dataType: "json",
		url: "config.json",
		mimeType: "application/json",
		success: function(result) {
			config = $.extend(result, config);
			if (config.charSpacingRatio < 0)config.charSpacingRatio = 0;
			else if (config.charSpacingRatio > 1) config.charSpacingRatio = 1;
			
			if (config.lineSpacingRatio < 0) config.lineSpacingRatio = 0;
			else if (config.lineSpacingRatio > 1) config.lineSpacingRatio = 1;
			
			if (config.maxFileNameLength < 0) config.maxFileNameLength = 1;
			
			var charResMapKeys = Object.keys(config.charResMap);
			filteringRegex = new RegExp("[^" + 
				escapeRegExp(charResMapKeys.join("")) + " \n]", "g");

			callback();
		}
	});
}

function loadImage(text, callback) {
	$("#loader").show();
	$("#output").hide();
	var loaded = 0,
		averageWidth = 0,
		averageHeight = 0,
		lineSpacing = 0,
		letters = uniqueCharacters(text.replace(/[^\S]/g)),
		done = function(ch) {
			loaded++;
			averageWidth += charImages[ch].width;
			averageHeight += charImages[ch].height;
			if (loaded === letters.length) {
				averageWidth /= loaded;
				averageHeight /= loaded;
				$("#loader").hide();
				callback({
					char: averageWidth,
					line: averageHeight * config.lineSpacingRatio
				});
			}
		};
	// Load images and calculate average width of letters
	$.each(letters, function(key, value) {
		if (charImages[value] && charImages[value].complete) {
			done(value);
		} else {
			var img = new Image();
			img.onload = function() {
				charImages[value] = this;
				done(value);
			};
			img.setAttribute('crossorigin', 'anonymous');
			img.src = config.charResMap[value];
		}
	});
}

function showInterface() {
	$("#loader").hide();
	$("#main").removeClass("hidden");
	if (!config.ios) {
		$("#output").tooltip();
	}
	if ($("#textarea").val().length > 0) {
		drawImage();
	}
}

function drawImage() {
	var canvas = $("#outputCanvas")[0];
	var $image = $("#output");
	if (canvas.height === 0 || canvas.width === 0) {
		$image.hide();
	}
	
	var text = $("#textarea").val()
		.replace(/[^\S\n]/, " ")
		.replace(filteringRegex, "");
	if (text.length <= 0) {
		return;
	}
	
	loadImage(text, function(spacing) {
		// Set canvas dimension
		// Width equals that of equals longest line
		// Height equal number of lines
		var height = 0, width = 0, rowWidth = 0, rowHeight = 0;
		var rowHeights = [], rowWidths = [];
		for (var i = 0; i < text.length; i++) {
			var ch = text.charAt(i);
			if (ch === "\n") {
				width = Math.max(width, rowWidth);
				height += rowHeight + spacing.line;
				rowHeights[rowHeights.length] = rowHeight;
				rowWidths[rowWidths.length] = rowWidth;
				rowWidth = rowHeight = 0;
			} else {
				if (i > 0 && config.charSpacingRatio) {
					rowWidth += spacing.char
						* config.charSpacingRatio;
				}
				if (ch === " ") {
					rowWidth += spacing.char;
				} else {
					var img = charImages[ch];
					if (rowHeight < img.height) {
						rowHeight = img.height;
					}
					rowWidth += img.width;
				}
			}
		}
		if (text.charAt(text.length - 1) !== "\n") {
			width = Math.max(width, rowWidth);
			height += rowHeight;
			rowHeights[rowHeights.length] = rowHeight;
			rowWidths[rowWidths.length] = rowWidth;
		}
		canvas.width = width;
		canvas.height = height;
		
		// Start drawing
		var x = 0, y = 0, row = 0;
		rowHeight = 0;
		var context = canvas.getContext("2d");
		if (config.backgroundColor) {
			context.fillStyle = config.backgroundColor;
			context.fillRect(0, 0, width, height);
		}
		var maxRowWidth = Math.max.apply(Math, rowWidths);
		if (rowWidths[0] < maxRowWidth) {
			switch (config.charHorizontalAlign) {
				case "center":
					x = (maxRowWidth - rowWidths[0]) / 2;
					break;
				case "right":
					x = maxRowWidth - rowWidths[0];
					break;
			}
		}
		for (var i = 0; i < text.length; i++) {
			var ch = text.charAt(i);
			if (ch === "\n") {
				x = 0;
				y += rowHeights[row] + spacing.line;
				row++;
				if (rowWidths[row] < maxRowWidth) {
					switch (config.charHorizontalAlign) {
						case "center":
							x = (maxRowWidth - rowWidths[row]) / 2;
							break;
						case "right":
							x = maxRowWidth - rowWidths[row];
							break;
					}
				}
			} else {
				if (i > 0 && config.charSpacingRatio) {
					x += spacing.char * config.charSpacingRatio;
				}
				if (ch === " ") {
					x += spacing.char;
				} else {
					var img = charImages[ch];
					var yOffset = 0;
					if (rowHeights[row] > img.height) {
						switch (config.charVerticalAlign) {
							case "top":
								break;
							case "center":
								yOffset = (rowHeights[row] - img.height) / 2;
								break;
							default:
								yOffset = rowHeights[row] - img.height;
						}
					}
					context.drawImage(img, x, y + yOffset,
						img.width, img.height);
					x += img.width;
				}
			}
		}
		
		// Style and show canvas
		$image.attr("src", canvas.toDataURL("image/png")).attr("download", text);
		if (canvas.width > $image.parent().width()) {
			$image.css("width", "100%");
		} else {
			$image.css("width", "");
		}
		if (config.ios) {
			$image.attr("title", text);
		}
		$image.show();
	});
}

function saveImage() {
	$("#outputCanvas")[0].toBlob(function(blob) {
		var filename = $("#textarea").val()
			.trim().substring(0, config.maxFileNameLength)
			+ ".png";
		saveAs(blob, filename, "image/png");
	});
}

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function uniqueCharacters(str) {
	var letters = {};
	for (var i = 0, length = str.length; i < length; i++) {
        var ch = str[i];
		if (!letters[ch]) letters[ch] = true;
	}
	return Object.keys(letters);
}

function isTextInput(node) {
	return ['INPUT', 'TEXTAREA'].indexOf(node.nodeName) !== -1;
}

function blurOnTouchOutside(e) {
	if (e.target !== document.activeElement
		&& !isTextInput(e.target) && isTextInput(document.activeElement)) {
		document.activeElement.blur();
	}
}

function isBlobSupported() {
	try {
		return !!new Blob();
	} catch(e) {
		return false;
	}
}

if (!isBlobSupported()) {
	document.write('<script src="js/vendor/Blob.js"><\/script>')
}
	
$(document.body).ready(function() {
	loadConfig(showInterface);
	$(document).on("touchstart mousedown", blurOnTouchOutside);
	$("#textarea").focusout(drawImage);
	if (!config.ios) {
		$("#output")
			.click(saveImage)
			.keypress(function(e) {
				if (e.which == 13 || e.which == 32) {
					saveImage.call(this, arguments);
				}
			});
	}
});
})(jQuery);
