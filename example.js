import request from "graphql-request";

function bigCalc(n){
    let count = 0;
    for (let i = 0; i < 2 ** n; i++){
        count += Math.log(i);
    }
    return count;
}

function request(req){
    setTimeout(req, 2000);
    return 
}

function getCalcAsync(n){
    return new Promise(function(resolve){
        let res = bigCalc(n);
        resolve(res);
    })
}

async function getHalf(n){
    let res = await getCalcAsync(n);
    return res / 2;
}

console.log("On attend ...");

getHalf(28).then(res => console.log(res));
getHalf(28).then(res => console.log(res));
getHalf(28).then(res => console.log(res));
getHalf(28).then(res => console.log(res));
getHalf(28).then(res => console.log(res));

console.log(await getHalf(28));

request().then().catch().finally();