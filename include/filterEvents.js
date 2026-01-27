/** @typedef {Awaited<ReturnType<import("./lib/util.js").readEventFilterWords>>} WordFilterArray*/

/**
 * 
 * @param {string} string 
 * @param {WordFilterArray} exclude_words 
 */
export function matchWordFilter(string, exclude_words){
    for (let word of exclude_words){
        if (typeof word == "string"){
            if (string.includes(word)) return true
        } else {
            if (string.includes(word.filter_word) && word.exceptions.every(exception => !string.includes(exception))) return true;
        }
    }
    return false;
}

/**
 * @param {Object[]} events 
 * @param {WordFilterArray} exclude_words 
 */
export function filterEventsNames(events, exclude_words){
    if (exclude_words && exclude_words.length){
        events = events.filter(event => !matchWordFilter(event.slug, exclude_words));
    }
    return events;
}

/**
 * 
 * @param {Object[]} events 
 * @param {string[]} exclude_expression 
 * @param {WordFilterArray} exclude_words 
 * @param {boolean} offline 
 * @param {boolean} online 
 */
export function filterEvents(events, exclude_expression, exclude_words, offline, online){

    if (exclude_expression){
        let exclude_regex = exclude_expression.map(exp => new RegExp(exp));
        events = events.filter(event => {
            for (let exp of exclude_regex){
                if (exp.test(event.slug)){
                    return false;
                }
            }
            return true;
        })
    }

    events = filterEventsNames(events, exclude_words);

    if (offline == online){
        events = events.filter(event => event.isOnline == online)
    }

    return events;
}

/**
 * Additional minEntrants filters for events pulled from a tournament since the tournament.events query doesn't have the minEntrants filter built-in
 * @param {Object[]} events 
 * @param {string[]} exclude_expression 
 * @param {string[]} exclude_words 
 * @param {number} minEntrants 
 * @param {boolean} offline 
 * @param {boolean} online
 */
export function filterEventsFromTournament(events, exclude_expression, exclude_words, minEntrants, offline, online){
    events = filterEvents(events, exclude_expression, exclude_words, offline, online);

    return minEntrants ? events.filter(event => event.numEntrants >= minEntrants) : events;
}