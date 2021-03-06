const beautify = require('js-beautify').js_beautify
const fs = require('fs')
const path = require('path');
const utils = require('./utils')

function formatJS(filename) {
  let data = fs.readFileSync(filename, 'utf8')
  let html = beautify(data, {
    // Set brace_style
    //  collapse: (old default) Put braces on the same line as control statements
    //  collapse-preserve-inline: (new default) Same as collapse but better support for ES6 destructuring and other features. https://github.com/victorporof/Sublime-HTMLPrettify/issues/231
    //  expand: Put braces on own line (Allman / ANSI style)
    //  end-expand: Put end braces on own line
    //  none: Keep them where they are
    "brace_style": "collapse-preserve-inline",

    "break_chained_methods": false, // Break chained method calls across subsequent lines
    "e4x": false, // Pass E4X xml literals through untouched
    "end_with_newline": false, // End output with newline
    "indent_char": " ", // Indentation character
    "indent_level": 0, // Initial indentation level
    "indent_size": 2, // Indentation size
    "indent_with_tabs": false, // Indent with tabs, overrides `indent_size` and `indent_char`
    "jslint_happy": false, // If true, then jslint-stricter mode is enforced
    "keep_array_indentation": false, // Preserve array indentation
    "keep_function_indentation": false, // Preserve function indentation
    "max_preserve_newlines": 0, // Maximum number of line breaks to be preserved in one chunk (0 disables)
    "preserve_newlines": true, // Whether existing line breaks should be preserved
    "space_after_anon_function": false, // Should the space before an anonymous function's parens be added, "function()" vs "function ()"
    "space_before_conditional": false, // Should the space before conditional statement be added, "if(true)" vs "if (true)"
    "space_in_empty_paren": false, // Add padding spaces within empty paren, "f()" vs "f( )"
    "space_in_paren": false, // Add padding spaces within paren, ie. f( a, b )
    "unescape_strings": false, // Should printable characters in strings encoded in \xNN notation be unescaped, "example" vs "\x65\x78\x61\x6d\x70\x6c\x65"
    "wrap_line_length": 0 // Lines should wrap at next opportunity after this number of characters (0 disables)
  })
  fs.writeFileSync(filename, html)
}

let count = 0

function ls(src) {
  let files = fs.readdirSync(src);
  for (let file in files) {
    var rootPath = src + path.sep
    var filename = rootPath + files[file]
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory() == true) {
      ls(filename)
    } else {
      if (/.js/.test(filename)) {
        formatJS(filename)
          ++count
      }
    }
  }
}


ls('src/lib')

utils.log(`The format of the file number：${count}`, 'debug')
