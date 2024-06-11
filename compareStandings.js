import { client } from "./include/lib/client.js";
import * as fs from 'fs'
import { User } from "./include/user.js";
import * as SC from "./include/computeStandingComparison.js";   

if (process.argv.length < 3 ){
    console.log("Usage : " + process.argv[0] + " " + process.argv[1] + " IDsListFilename [startDate [endDate]]");
    process.exit()
}

var IDs = fs.readFileSync(process.argv[2]).toString('utf-8').replaceAll('\r', '').split('\n');

var begin = null;
if (process.argv.length > 3){
    begin = parseInt(process.argv[3]);
}

var end = null;
if (process.argv.length > 4){
    end = parseInt(process.argv[4]);
}

let users = await User.createUsers(client, IDs);

let result = "\\\\\\";
for (let user of users){
    result += '\t' + user.name;
}

console.log("Looking for events after", new Date(begin * 1000).toLocaleDateString("fr-FR"), "and before", new Date(end * 1000).toLocaleDateString("fr-FR"));
let matrix = await SC.computeStandingComparison(client, users, begin, end);

for (let i = 0; i < users.length ; i++){
    result+= '\n' + users[i].name
    for (let j = 0; j < users.length; j++){
        if (i == j){
            result += '\tXXXX'
        } else if (i < j){
            let comp = SC.getSCFromIndex(matrix, users, i, j);
            result += '\t' + comp.left + "-" + comp.right + "-" + comp.draws;
        } else if (i > j){  
            let comp = SC.getSCFromIndex(matrix, users, j, i);
            result += '\t' + comp.right + "-" + comp.left + "-" + comp.draws;
        }
    }
}

console.log(result);

fs.mkdir('out', () => {});
fs.writeFileSync('./out/standingComparison.txt', result, (err) => {
    console.error(err);
})

/**

be651aa3
0bdcfabf
28d107e9
afd90ad9
69187974
f64edcac
80d8449b
efc3f2d5
54bc8a80
3c5165ea
af7e1ed1
41b91bed
f98c58d2
fe8e3b95
878f503c
85a54a4a
c7d642b4
c8c65ad0
7167d698
f8aad09b
a1bca050
1a2903e2
de10d801
4bcc337b
c6129424
b08a54a6
b7190d43

 */