/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const commands = require('./commands.json');

const sepBy1 = (rule, sep) => seq(rule, repeat(seq(sep, rule)));

const sepBy = (rule, sep) => optional(sepBy1(rule, sep));

module.exports = grammar({
  name: 'latex',
  extras: $ => [$._whitespace, $.comment],
  word: $ => $.generic_command_name,
  rules: {
    document: $ => repeat($._content),

    //--- Trivia ---//

    _whitespace: $ => /\s+/,

    comment: $ => /%[^\r\n]*/,

    //--- Content ---//

    _simple_content: $ =>
      choice(
        $.brace_group,
        $.mixed_group,
        $.parameter,
        $.text,
        $.displayed_equation,
        $.inline_formula,
        $.environment,
        $.caption,
        $.citation,
        $.package_include,
        $.class_include,
        $.latex_include,
        $.biblatex_include,
        $.bibtex_include,
        $.graphics_include,
        $.svg_include,
        $.inkscape_include,
        $.verbatim_include,
        $.import,
        $.label_definition,
        $.label_reference,
        $.label_reference_range,
        $.label_number,
        $.command_definition,
        $.math_operator,
        $.glossary_entry_definition,
        $.glossary_entry_reference,
        $.acronym_definition,
        $.acronym_reference,
        $.theorem_definition,
        $.color_reference,
        $.color_definition,
        $.color_set_definition,
        $.pgf_library_import,
        $.tikz_library_import,
        $.generic_command
      ),

    _content: $ =>
      choice(
        $.part,
        $.chapter,
        $.section,
        $.subsection,
        $.subsubsection,
        $.paragraph,
        $.subparagraph,
        $.enum_item,
        $._simple_content
      ),

    //--- Structure ---//

    part: $ =>
      prec.right(
        seq(
          field('command', choice('\\part', '\\part*')),
          field('text', $.brace_group),
          field(
            'child',
            repeat(
              choice(
                $.chapter,
                $.section,
                $.subsection,
                $.subsubsection,
                $.paragraph,
                $.subparagraph,
                $.enum_item,
                $._simple_content
              )
            )
          )
        )
      ),

    chapter: $ =>
      prec.right(
        seq(
          field('command', choice('\\chapter', '\\chapter*')),
          field('text', $.brace_group),
          field(
            'child',
            repeat(
              choice(
                $.section,
                $.subsection,
                $.subsubsection,
                $.paragraph,
                $.subparagraph,
                $.enum_item,
                $._simple_content
              )
            )
          )
        )
      ),

    section: $ =>
      prec.right(
        seq(
          field('command', choice('\\section', '\\section*')),
          field('text', $.brace_group),
          field(
            'child',
            repeat(
              choice(
                $.subsection,
                $.subsubsection,
                $.paragraph,
                $.subparagraph,
                $.enum_item,
                $._simple_content
              )
            )
          )
        )
      ),

    subsection: $ =>
      prec.right(
        seq(
          field('command', choice('\\subsection', '\\subsection*')),
          field('text', $.brace_group),
          field(
            'child',
            repeat(
              choice(
                $.subsubsection,
                $.paragraph,
                $.subparagraph,
                $.enum_item,
                $._simple_content
              )
            )
          )
        )
      ),

    subsubsection: $ =>
      prec.right(
        seq(
          field('command', choice('\\subsubsection', '\\subsubsection*')),
          field('text', $.brace_group),
          field(
            'child',
            repeat(
              choice(
                $.paragraph,
                $.subparagraph,
                $.enum_item,
                $._simple_content
              )
            )
          )
        )
      ),

    paragraph: $ =>
      prec.right(
        seq(
          field('command', choice('\\paragraph', '\\paragraph*')),
          field('text', $.brace_group),
          field(
            'child',
            repeat(choice($.subparagraph, $.enum_item, $._simple_content))
          )
        )
      ),

    subparagraph: $ =>
      prec.right(
        seq(
          field('command', choice('\\subparagraph', '\\subparagraph*')),
          field('text', $.brace_group),
          field('child', repeat(choice($.enum_item, $._simple_content)))
        )
      ),

    enum_item: $ =>
      prec.right(
        seq(
          field('command', '\\item'),
          optional(seq('[', field('label', $.word), ']')),
          field('child', repeat(choice($._simple_content)))
        )
      ),

    //--- Groups ---//

    brace_group: $ => seq('{', field('child', repeat($._content)), '}'),

    brace_group_word: $ => seq('{', field('word', $.word), '}'),

    brace_group_word_list: $ =>
      seq('{', sepBy(field('word', $.word), ','), '}'),

    brace_group_key_value: $ =>
      seq('{', sepBy(field('property', $.key_value_pair), ','), '}'),

    bracket_group: $ => seq('[', field('child', repeat($._content)), ']'),

    bracket_group_word: $ => seq('[', field('word', $.word), ']'),

    bracket_group_word_list: $ =>
      seq('[', sepBy(field('word', $.word), ','), ']'),

    bracket_group_key_value: $ =>
      seq('[', sepBy(field('property', $.key_value_pair), ','), ']'),

    paren_group: $ => seq('(', field('child', repeat($._content)), ')'),

    mixed_group: $ =>
      seq(
        choice('(', '['),
        field('child', repeat($._content)),
        choice(')', ']')
      ),

    key: $ => repeat1($.word),

    key_value_pair: $ =>
      seq(
        field('key', $.key),
        optional(seq(field('equals', '='), field('value', $._content)))
      ),

    //--- Text ---//

    text: $ => prec.right(repeat1($._text_fragment)),

    _text_fragment: $ => prec.right(choice($.word, ',', '=')),

    word: $ => /[^\s\\%\{\},\$\[\]\(\)=\#]+/,

    parameter: $ => /#\d/,

    //--- Math ---//

    displayed_equation: $ =>
      prec.left(
        seq(
          choice('$$', '\\['),
          field('child', repeat($._content)),
          choice('$$', '\\]')
        )
      ),

    inline_formula: $ =>
      prec.left(
        seq(
          choice('$', '\\('),
          field('child', repeat($._content)),
          choice('$', '\\)')
        )
      ),

    //--- Environment ---//

    begin: $ =>
      prec.right(
        seq(
          field('command', '\\begin'),
          field('name', $.brace_group_word),
          field('option', repeat($.bracket_group))
        )
      ),

    end: $ => seq(field('command', '\\end'), field('name', $.brace_group_word)),

    environment: $ =>
      prec.right(
        seq(
          field('begin', $.begin),
          field('child', repeat($._content)),
          field('end', $.end)
        )
      ),

    //--- Special Commands ---//

    caption: $ =>
      seq(
        field('command', '\\caption'),
        field('short', optional($.bracket_group)),
        field('long', $.brace_group)
      ),

    citation: $ =>
      seq(
        field('command', choice(...commands.citation)),
        optional(
          seq(
            field('prenote', $.bracket_group),
            field('postnote', optional($.bracket_group))
          )
        ),
        field('keys', $.brace_group_word_list)
      ),

    package_include: $ =>
      seq(
        field('command', choice('\\usepackage', '\\RequirePackage')),
        field('option', optional($.bracket_group_key_value)),
        field('paths', $.brace_group_word_list)
      ),

    class_include: $ =>
      seq(
        field('command', '\\documentclass'),
        field('option', optional($.bracket_group_key_value)),
        field('paths', $.brace_group_word_list)
      ),

    latex_include: $ =>
      seq(
        field(
          'command',
          choice('\\include', '\\subfileinclude', '\\input', '\\subfile')
        ),
        field('paths', $.brace_group_word_list)
      ),

    biblatex_include: $ =>
      seq(
        field('command', '\\addbibresource'),
        field('option', optional($.bracket_group_key_value)),
        field('paths', $.brace_group_word_list)
      ),

    bibtex_include: $ =>
      seq(
        field('command', '\\bibliography'),
        field('paths', $.brace_group_word_list)
      ),

    graphics_include: $ =>
      seq(
        field('command', '\\includegraphics'),
        field('option', optional($.bracket_group_key_value)),
        field('paths', $.brace_group_word_list)
      ),

    svg_include: $ =>
      seq(
        field('command', '\\includesvg'),
        field('option', optional($.bracket_group_key_value)),
        field('paths', $.brace_group_word_list)
      ),

    inkscape_include: $ =>
      seq(
        field('command', '\\includeinkscape'),
        field('option', optional($.bracket_group_key_value)),
        field('paths', $.brace_group_word_list)
      ),

    verbatim_include: $ =>
      seq(
        field('command', choice('\\verbatiminput', '\\VerbatimInput')),
        field('paths', $.brace_group_word_list)
      ),

    import: $ =>
      seq(
        field(
          'command',
          choice(
            '\\import',
            '\\subimport',
            '\\inputfrom',
            '\\subimportfrom',
            '\\includefrom',
            '\\subincludefrom'
          )
        ),
        field('directory', $.brace_group_word),
        field('file', $.brace_group_word)
      ),

    label_definition: $ =>
      seq(field('command', '\\label'), field('name', $.brace_group_word)),

    label_reference: $ =>
      seq(
        field('command', choice(...commands.labelReference)),
        field('label', $.brace_group_word_list)
      ),

    label_reference_range: $ =>
      prec.right(
        seq(
          field('command', choice(...commands.labelRangeReference)),
          field('label1', $.brace_group_word),
          // optional to improve error handling
          optional(field('label2', $.brace_group_word))
        )
      ),

    label_number: $ =>
      seq(
        field('command', '\\newlabel'),
        field('label', $.brace_group_word),
        field('number', $.brace_group)
      ),

    command_definition: $ =>
      seq(
        field(
          'command',
          choice('\\newcommand', '\\renewcommand', '\\DeclareRobustCommand')
        ),
        field('argc', optional(seq('[', /\d/, ']'))),
        '{',
        field('name', $.generic_command_name),
        '}',
        field('implementation', $.brace_group)
      ),

    math_operator: $ =>
      seq(
        field(
          'command',
          choice('\\DeclareMathOperator', '\\DeclareMathOperator*')
        ),
        '{',
        field('name', $.generic_command_name),
        '}',
        field('implementation', $.brace_group)
      ),

    glossary_entry_definition: $ =>
      seq(
        field('command', '\\newglossaryentry'),
        field('name', $.brace_group_word),
        field('properties', $.brace_group_key_value)
      ),

    glossary_entry_reference: $ =>
      seq(
        field('command', choice(...commands.glossaryEntryReference)),
        field('option', optional($.bracket_group_key_value)),
        field('name', $.brace_group_word)
      ),

    acronym_definition: $ =>
      seq(
        '\\newacronym',
        field('option', optional($.bracket_group_key_value)),
        field('name', $.brace_group_word),
        field('short', $.brace_group),
        field('long', $.brace_group)
      ),

    acronym_reference: $ =>
      seq(
        field('command', choice(...commands.acronymReference)),
        field('option', optional($.bracket_group_key_value)),
        field('name', $.brace_group_word)
      ),

    theorem_definition: $ =>
      prec.right(
        seq(
          field('command', choice('\\newtheorem', '\\declaretheorem')),
          field('name', $.brace_group_word),
          field('counter', optional($.bracket_group_word)),
          field('description', $.brace_group),
          field('structure', optional($.bracket_group_word))
        )
      ),

    color_reference: $ =>
      prec.right(
        seq(
          field(
            'command',
            choice('\\color', '\\colorbox', '\\textcolor', '\\pagecolor')
          ),
          field('name', $.brace_group_word)
        )
      ),

    color_definition: $ =>
      prec.right(
        seq(
          field('command', '\\definecolor'),
          field('name', $.brace_group_word),
          field('model', $.brace_group_word),
          // optional to improve error handling
          optional(seq('{', field('spec', $.text), '}'))
        )
      ),

    color_set_definition: $ =>
      prec.right(
        seq(
          field('command', '\\definecolorset'),
          field('ty', optional($.bracket_group_word)),
          field('models', $.brace_group_word_list),
          optional(
            // optional to improve error handling
            seq(
              field('head', $.brace_group),
              field('tail', $.brace_group),
              field('spec', $.brace_group)
            )
          )
        )
      ),

    pgf_library_import: $ =>
      seq(
        field('command', '\\usepgflibrary'),
        field('name', $.brace_group_word_list)
      ),

    tikz_library_import: $ =>
      seq(
        field('command', '\\usetikzlibrary'),
        field('name', $.brace_group_word_list)
      ),

    //--- Generic commands ---//

    generic_command: $ =>
      prec.right(
        seq(
          field('name', $.generic_command_name),
          field(
            'arg',
            repeat(choice($.brace_group, $.bracket_group, $.paren_group))
          )
        )
      ),

    generic_command_name: $ => /\\([^\r\n]|[@a-zA-Z]+\*?)?/,
  },
});
