
/**
 * 
 * @param {Object[]} events 
 * @param {string[]} exclude_expression 
 * @param {string[]} exclude_words 
 */
export function filterEvents(events, exclude_expression, exclude_words){

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

    if (exclude_words && exclude_words.length){
        data = data.filter(event => {
            for (let word of exclude_words){
                if (event.slug.includes(word)) return false
            }
            return true;
        })
    }

    return data;
}