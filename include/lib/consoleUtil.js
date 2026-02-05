const reset_esc = "\x1b[0m";
const codes = {
    yellow : "33",
    purple : "35",
    bgreen : "92",
    bold : "1",
    italics : "3",
    underline : "4"
}

export function terminalEscape(code){
    return `\x1b[${code}m`;
}

/**
 * @param {any} text 
 * @param  {keyof codes} format 
 */
export function format(text, format){
    return terminalEscape(codes[format] ?? "") + text + reset_esc;
}

/**
 * @param {any} text 
 * @param  {...(keyof codes)} formats  
 */
export function formatM(text, ...formats){
    return formats.map(formatKey => terminalEscape(codes[formatKey])).join("") + text + reset_esc;
}

export function bold(text){
    return terminalEscape(codes.bold) + text + reset_esc;
}

export function italics(text){
    return terminalEscape(codes.italics) + text + reset_esc;
}

export function underline(text){
    return terminalEscape(codes.underline) + text + reset_esc;
}

export function colored(text, code){
    return terminalEscape(code) + text + reset_esc;
}

export function yellow(text){
    return colored(text, codes.yellow);
}

export function purple(text){
    return colored(text, codes.purple);
}

export function bgreen(text){
    return colored(text, codes.bgreen);
}

/**
 * Stringyfies the value and adds escape codes to color it according to the value (yellow for numbers, etc)
 * @param {any} value 
 */
export function autoColor(value){
    if (typeof text === "number"){
        return yellow(value);
    }
    return value;
}

/**
 * Applies {@link autoColor} to all values passed as argument and returns a string with all the results
 * @param  {...any} values 
 */
export function cFormat(...values){
    let str = "";
    for (let value of values){
        str += autoColor(value);
    }
    return str;
}

/**
 * Applies {@link autoColor} to all values passed as argument and returns the strings separated by a space (like console.log does)
 * @param  {...any} value s
 * @returns 
 */
export function cSFormat(...values){
    let str = "";
    for (let value of values){
        str += autoColor(value) + " ";
    }
    return str;
}