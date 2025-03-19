export function removeTags(name){
    return name.split("|").at(-1).trim();
}//sggutil