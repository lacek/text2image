Text to Image
==============================
This is a little app to convert text to a downloadable image file. Demo is 
[here](http://cdn.rawgit.com/lacek/text2image/master/index.html)

Motivation
------------------------------
This is a tool for my friend to help students with reading disability to learn
vocabulary.


Usage
------------------------------
Simply download as zip, extract then open *index.html* and use locally.
If you want to host it to the Internet, check out the following simple methods:

- [Google Drive](https://support.google.com/drive/answer/2881970)
- [Dropbox]
(http://www.dropboxwiki.com/tips-and-tricks/host-websites-with-dropbox)


Configurations
------------------------------
Configurations can be find in [*config.json*]
(https://github.com/lacek/text2image/blob/master/config.json).

- `charResMap` **(Object)**  
An object containing mapping of characters to images.
The key should be a single character. The value is the path to the image. The 
path can be absolute or relative.
- `charVerticalAlign` **(String [top|center|bottom])**  
Vertical alignment of character in a row.
- `charHorizontalAlign` **(String [left|center|right])**  
Horizontal alignment of characters in a row.
- `charSpacingRatio` **(Float [0-1])**  
Spacing ratio between each character. Average width of all characters is used 
as the base.
- `lineSpacingRatio` **(Float [0-1])**  
Spacing ratio between each line. Average height of all characters is used as 
the base.
- `maxFileNameLength` **(Integer [1-...])**  
Maximum length of the file name of downloadable image.

Compatibility
------------------------------
[FileSaver](https://github.com/eligrey/FileSaver.js) is used to enable the 
"save as" feature. The list of supported browser can be found [here]
(https://github.com/eligrey/FileSaver.js/#supported-browsers).


Know Issues
------------------------------
- If [cross origin image]
(https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-crossorigin)
is used, the result will not be downloadable. You will need to use browser's 
"Save as" feature to store the result


Credit
------------------------------
- [Tux Paint](http://http://www.tuxpaint.org) for demo image.


License
------------------------------
The MIT License