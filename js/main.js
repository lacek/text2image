(function($) {
var config;
var charImages = {};
var loadedImageCount = 0;
var averageWidth = 0;
var averageHeight = 0;
var lineSpacing = 0;
var filteringRegex;

function loadConfig(callback) {
	$.ajax({
		dataType: "json",
		url: "config.json",
		mimeType: "application/json",
		success: function(result) {
			config = result;
			if (config.charSpacingRatio < 0)config.charSpacingRatio = 0;
			else if (config.charSpacingRatio > 1) config.charSpacingRatio = 1;
			
			if (config.lineSpacingRatio < 0) config.lineSpacingRatio = 0;
			else if (config.lineSpacingRatio > 1) config.lineSpacingRatio = 1;
			
			if (config.maxFileNameLength < 0) config.maxFileNameLength = 1;
			
			callback();
		}
	});
}

function loadImage() {
	var charResMap = config.charResMap;
	var keys = Object.keys(charResMap);
	filteringRegex = new RegExp("[^" + 
		escapeRegExp(keys.join("")) +" \n]", "g");

	// Load images and calculate average width of letters
	$.each(charResMap, function(key, value) {
		var img = new Image();
		img.onload = function() {
			loadedImageCount++;
			charImages[key] = this;
			averageWidth += this.width;
			averageHeight += this.height;
			if (loadedImageCount === keys.length) {
				averageWidth /= loadedImageCount;
				averageHeight /= loadedImageCount;
				lineSpacing = averageHeight * config.lineSpacingRatio;
				showInterface();
			}
		};
		img.src = value;
	});
}

function showInterface() {
	$("#loader").remove();
	$("#main").removeClass("hide");
	$("#output").tooltip();
	if ($("#textarea").val().length > 0) {
		drawImage();
	}
}

function drawImage() {
	var canvas = $("#output")[0];
	if (canvas.height === 0 || canvas.width === 0) {
		$(canvas).hide();
	}
	
	var text = $("#textarea").val().toLowerCase()
		.replace(/[^\S\n]/, " ")
		.replace(filteringRegex, "");
	if (text.length <= 0) {
		return;
	}
	
	// Set canvas dimension
	// Width equals that of equals longest line
	// Height equal number of lines
	var height = 0, width = 0, rowWidth = 0, rowHeight = 0;
	var rowHeights = [], rowWidths = [];
	for (var i = 0; i < text.length; i++) {
		var ch = text.charAt(i);
		if (ch === "\n") {
			width = Math.max(width, rowWidth);
			height += rowHeight + lineSpacing;
			rowHeights[rowHeights.length] = rowHeight;
			rowWidths[rowWidths.length] = rowWidth;
			rowWidth = rowHeight = 0;
		} else {
			if (i > 0 && config.charSpacingRatio) {
				rowWidth += averageWidth * config.charSpacingRatio;
			}
			if (ch === " ") {
				rowWidth += averageWidth;
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
			y += rowHeights[row] + lineSpacing;
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
				x += averageWidth * config.charSpacingRatio;
			}
			if (ch === " ") {
				x += averageWidth;
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
				context.drawImage(img, x, y + yOffset, img.width, img.height);
				x += img.width;
			}
		}
	}
	
	// Style and show canvas
	var $canvas = $(canvas);
	if (canvas.width > $canvas.parent().width()) {
		$canvas.css("width", "100%");
	} else {
		$canvas.css("width", "");
	}
	$canvas.show().focus();
}

function saveImage() {
	this.toBlob(function(blob) {
		var filename = $("#textarea").val()
			.trim().substring(0, config.maxFileNameLength)
			+ ".png";
		saveAs(blob, filename, "image/png");
	});
}

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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

var isBlobSupported = false;
try {
	isBlobSupported = !!new Blob();
} catch(e) {}
if (!isBlobSupported) {
	document.write('<script src="js/vendor/Blob.js"><\/script>')
}
	
$(document.body).ready(function() {
	loadConfig(loadImage);
	$(document).on("touchstart mousedown", blurOnTouchOutside);
	$("#textarea").focusout(drawImage);
	$("#output").click(saveImage);
});
})(jQuery);