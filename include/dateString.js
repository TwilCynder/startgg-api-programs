const months = [
    "January", "February", "March", "April", "May", "June", "July", "August", "Septempber", "October", "November", "December"
]

function getSuffix(day){
    if (day == 11 || day == 12) return "th";

    switch (day % 10){
        case 1: 
            return "st"
        case 2: 
            return "nd"
        default:
            return "th"
    }
}

export function getDateString(date){
    return months[date.getMonth()] + " " + date.getDate() + getSuffix(date.getDate()) + ", " + date.getFullYear();
}