const COMMAND_REPLACEMENTS: Array<[RegExp, string]> = [
    [/\\+rightleftharpoons/g, '⇌'],
    [/\\+leftrightarrow/g, '↔'],
    [/\\+rightarrow/g, '→'],
    [/\\+leftarrow/g, '←'],
    [/\\+downarrow/g, '↓'],
    [/\\+uparrow/g, '↑'],
    [/\\+lambda(?![A-Za-z])/g, 'λ'],
    [/\\+omega(?![A-Za-z])/g, 'ω'],
    [/\\+theta(?![A-Za-z])/g, 'θ'],
    [/\\+Delta(?![A-Za-z])/g, 'Δ'],
    [/\\+alpha(?![A-Za-z])/g, 'α'],
    [/\\+beta(?![A-Za-z])/g, 'β'],
    [/\\+gamma(?![A-Za-z])/g, 'γ'],
    [/\\+rho(?![A-Za-z])/g, 'ρ'],
    [/\\+phi(?![A-Za-z])/g, 'φ'],
    [/\\+mu(?![A-Za-z])/g, 'μ'],
    [/\\+sigma(?![A-Za-z])/g, 'σ'],
    [/\\+pi(?![A-Za-z])/g, 'π'],
    [/\\+partial(?![A-Za-z])/g, '∂'],
    [/\\+infty(?![A-Za-z])/g, '∞'],
    [/\\+approx(?![A-Za-z])/g, '≈'],
    [/\\+parallel(?![A-Za-z])/g, '∥'],
    [/\\+perp(?![A-Za-z])/g, '⊥'],
    [/\\+propto(?![A-Za-z])/g, '∝'],
    [/\\+angle(?![A-Za-z])/g, '∠'],
    [/\\+triangle(?![A-Za-z])/g, '△'],
    [/\\+subset(?![A-Za-z])/g, '⊂'],
    [/\\+in(?![A-Za-z])/g, '∈'],
    [/\\+pm(?![A-Za-z])/g, '±'],
    [/\\+times(?![A-Za-z])/g, '×'],
    [/\\+div(?![A-Za-z])/g, '÷'],
    [/\\+neq(?![A-Za-z])/g, '≠'],
    [/\\+leq(?![A-Za-z])/g, '≤'],
    [/\\+geq(?![A-Za-z])/g, '≥'],
    [/\\+cdot(?![A-Za-z])/g, '·'],
    [/\\+circ(?![A-Za-z])/g, '°'],
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
    n: 'ⁿ',
    i: 'ⁱ',
};

function toMappedScript(
    input: string,
    map: Record<string, string>,
): string | null {
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

    formatted = formatted.replace(/\^\\circ/g, '°');
    formatted = formatted.replace(/\\vec\{([^{}]+)\}/g, '$1⃗');
    formatted = formatted.replace(/\\lim_\{([^{}]*)\}/g, (_, value: string) =>
        value ? `lim ${value}` : 'lim',
    );
    formatted = formatted.replace(/\\iint_\{([^{}]*)\}/g, (_, value: string) =>
        value ? `∬ ${value}` : '∬',
    );
    formatted = formatted.replace(
        /\\xrightarrow\{([^{}]*)\}/g,
        (_, value: string) => (value ? `--${value}→` : '→'),
    );
    formatted = formatted.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1/$2)');
    formatted = formatted.replace(/\\sqrt\{([^{}]*)\}/g, '√($1)');
    formatted = formatted.replace(
        /\\int_\{([^{}]*)\}\^\{([^{}]*)\}/g,
        '∫[$1→$2]',
    );
    formatted = formatted.replace(
        /\\sum_\{([^{}]*)\}\^\{([^{}]*)\}/g,
        '∑[$1→$2]',
    );
    formatted = formatted.replace(
        /\\begin\{bmatrix\}\s*([\s\S]*?)\s*\\end\{bmatrix\}/g,
        '[$1]',
    );
    formatted = formatted.replace(
        /\\begin\{vmatrix\}\s*([\s\S]*?)\s*\\end\{vmatrix\}/g,
        '|$1|',
    );
    formatted = formatted.replace(/_\{([^{}]+)\}/g, (_, value: string) => {
        const mapped = toMappedScript(value, SUBSCRIPT_MAP);
        return mapped ?? `(${value})`;
    });

    formatted = formatted.replace(/\^\{([^{}]+)\}/g, (_, value: string) => {
        const mapped = toMappedScript(value, SUPERSCRIPT_MAP);
        return mapped ?? `^(${value})`;
    });

    // Handle malformed user input such as HO{+} and display it as HO⁺.
    formatted = formatted.replace(
        /([A-Za-z0-9])\{([+\-0-9]+)\}/g,
        (_, base: string, value: string) => {
            const mapped = toMappedScript(value, SUPERSCRIPT_MAP);
            return mapped ? `${base}${mapped}` : `${base}{${value}}`;
        },
    );

    for (const [pattern, value] of COMMAND_REPLACEMENTS) {
        formatted = formatted.replace(pattern, value);
    }

    return formatted;
}
