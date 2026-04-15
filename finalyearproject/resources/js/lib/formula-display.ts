const COMMAND_REPLACEMENTS: Array<[RegExp, string]> = [
    [/\\+lambda/g, 'λ'],
    [/\\+omega/g, 'ω'],
    [/\\+theta/g, 'θ'],
    [/\\+Delta/g, 'Δ'],
    [/\\+alpha/g, 'α'],
    [/\\+beta/g, 'β'],
    [/\\+gamma/g, 'γ'],
    [/\\+pi/g, 'π'],
    [/\\+approx/g, '≈'],
    [/\\+rightarrow/g, '→'],
    [/\\+leftarrow/g, '←'],
    [/\\+leftrightarrow/g, '⇌'],
    [/\\+pm/g, '±'],
    [/\\+times/g, '×'],
    [/\\+cdot/g, '·'],
    [/\\+, /g, ' '],
    [/\\+,/g, ' '],
];

const SUBSCRIPT_MAP: Record<string, string> = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
    '+': '₊',
    '-': '₋',
    '=': '₌',
    '(': '₍',
    ')': '₎',
};

const SUPERSCRIPT_MAP: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
    '+': '⁺',
    '-': '⁻',
    '=': '⁼',
    '(': '⁽',
    ')': '⁾',
    'n': 'ⁿ',
    'i': 'ⁱ',
};

function toMappedScript(input: string, map: Record<string, string>): string | null {
    let output = '';

    for (const char of input) {
        const mapped = map[char];
        if (!mapped) {
            return null;
        }
        output += mapped;
    }

    return output;
}

export function formatFormulaText(content: string): string {
    if (!content) {
        return '';
    }

    let formatted = content;

    formatted = formatted.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
    formatted = formatted.replace(/\$([^$]+)\$/g, '$1');

    formatted = formatted.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1/$2)');
    formatted = formatted.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
    formatted = formatted.replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, '∫[$1→$2]');
    formatted = formatted.replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, '∑[$1→$2]');
    formatted = formatted.replace(/_\{([^{}]+)\}/g, (_, value: string) => {
        const mapped = toMappedScript(value, SUBSCRIPT_MAP);
        return mapped ?? `(${value})`;
    });

    formatted = formatted.replace(/\^\{([^{}]+)\}/g, (_, value: string) => {
        const mapped = toMappedScript(value, SUPERSCRIPT_MAP);
        return mapped ?? `^(${value})`;
    });

    // Handle malformed user input such as HO{+} and display it as HO⁺.
    formatted = formatted.replace(/([A-Za-z0-9])\{([+\-0-9]+)\}/g, (_, base: string, value: string) => {
        const mapped = toMappedScript(value, SUPERSCRIPT_MAP);
        return mapped ? `${base}${mapped}` : `${base}{${value}}`;
    });

    for (const [pattern, value] of COMMAND_REPLACEMENTS) {
        formatted = formatted.replace(pattern, value);
    }

    return formatted;
}
