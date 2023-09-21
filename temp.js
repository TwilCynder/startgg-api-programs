import { readJSONAsync } from "./include/lib/lib.js";

let chars = await readJSONAsync('./out/season-2022-2023-characters.json');

let count = 0;
let current_char = "";

for (let char of chars){
    count += char.count;
    if (count >= 2228) break;
    current_char = char.name
}

console.log(current_char);