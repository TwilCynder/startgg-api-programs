export function _dirname(url){
    return new URL('.', url).pathname;
}

export function _filename(url){
    return new URL('', url).pathname;
}

export function relpath(url, path){
    return new URL(path, url).pathname;
}

export function relurl(url, path){
    return new URL(path, url);
}