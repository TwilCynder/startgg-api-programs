let write = process.stdout.write;

export function muteStdout(){
    process.stdout.write = ()=>{};
}//scriptutil

export function unmuteStdout(){
    process.stdout.write = write;
}