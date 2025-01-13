
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

    
}