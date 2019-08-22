const webfont = require("webfont").default;
const meow = require('meow');
const fs = require("fs");
const path = require('path');

const dartKeywords = [
    "abstract", "dynamic", "implements", "show", "as", "else", "import", "static", "assert", "enum", "in", "super", "async", "export", "interface", "switch", "await", "extends", "is", "sync", "break", "external", "library", "this", "case", "factory", "mixin", "throw", "catch", "false", "new", "true", "class", "final", "null", "try", "const", "finally", "on", "typedef", "continue", "for", "operator", "var", "covariant", "Function", "part", "void", "default", "get", "rethrow", "while", "deferred", "hide", "return", "with", "do", "if", "set", "yield"
];

const cli = meow(`
	Usage
	  $ svg2flutter <options>

	Options
      --input, -i  Input directory contains all SVG icons (defaults to ".")
      --dart, -d Output directory contains generated Dart file (defaults to ".")
      --ttf, -t Output directory contains generated TTF file (defaults to ".")
      --name, -n Generated name (defaults "to MyIcons") 
`, {
        flags: {
            input: {
                type: 'string',
                alias: 'i',
                default: './'
            },
            dart: {
                type: 'string',
                alias: 'd',
                default: '.'
            },
            ttf: {
                type: 'string',
                alias: 't',
                default: '.'
            },
            name: {
                type: 'string',
                alias: 'n',
                default: 'MyIcons'
            }
        }
    });

const toCamelCase = str => {
    const s = str &&
        str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
            .map(x => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
            .join('');
    return s.slice(0, 1).toLowerCase() + s.slice(1);
};

const normalizedName = str => {
    let name = str.replace(/-/g, "_");
    name = dartKeywords.includes(name) ? name + "_" : name;
    if (name.charAt(0) >= '0' && name.charAt(0) <= '9') return "$" + name;
    return toCamelCase(name);
}

async function generate() {
    const svg = await webfont({
        files: cli.flags.input,
        fontName: cli.flags.name
    });

    fs.writeFileSync(path.join(cli.flags.ttf, cli.flags.name + ".ttf"), svg.ttf);

    let dart = "import 'package:flutter/widgets.dart';\n";
    dart += `\nclass ${cli.flags.name} {\n`;
    dart += `  ${cli.flags.name}._();\n\n`;

    const regex = /glyph\s+glyph-name="([^"]+)"\s+unicode="&#x([^"]+);"/gi;

    while ((glifo = regex.exec(svg.svg)) !== null) {
        const unicode = parseInt(glifo[2], 16);
        const name = normalizedName(glifo[1]);
        dart += `  static const ${name} = const _${cli.flags.name}IconData(${unicode});\n`;
    }

    dart += "}\n";

    dart += `
class _${cli.flags.name}IconData extends IconData {
  const _${cli.flags.name}IconData(int codePoint)
      : super(codePoint, fontFamily: "${cli.flags.name}");
}
`;

    fs.writeFileSync(path.join(cli.flags.dart, cli.flags.name.toLowerCase() + ".dart"), dart);

    return "OK";
}

generate().then(o => console.log(o)).catch(e => console.log(e));
