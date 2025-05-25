const reset_esc = "\x1b[0m";

const yellow_esc = "33";

export function terminalEscape(code){
    return `\x1b[${code}m`;
}

export function colored(text, code){
    return terminalEscape(code) + text + reset_esc;
}

export function yellow(text){
    return colored(text, yellow_esc);
}

export function autoColor(value){
    if (typeof text === "number"){
        return yellow(value);
    }
    return value;
}

export function cFormat(...values){
    let str = "";
    for (let value of values){
        str += autoColor(value);
    }
    return str;
}