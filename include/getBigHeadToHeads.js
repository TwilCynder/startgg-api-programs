import { getAttendanceOverLeague } from "./getEntrants.js";


export async function test(client, slugs){
    return await getAttendanceOverLeague(client, slugs);
}