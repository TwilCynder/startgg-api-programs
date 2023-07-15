import { relurl } from "./dirname.js";
import {readFileSync} from 'fs';

export function readSchema(source, filename){
    return readFileSync(relurl(source, filename), {encoding: "utf-8"});
}