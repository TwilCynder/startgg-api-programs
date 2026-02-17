//For use will small user test scripts

/**
 * @template T
 * @param {T[]} a LHS argument
 * @param {T[]} b RHS argument
 * @param {((a: T[], b: T[]) => boolean)?} comparator 
 * @param {(elt: T) => void} callback 
 */
export function includes(a, b, callback, comparator = null){
    if (comparator){
        b_loop: for (const b_ of b){
            for (const a_ of a){
                if (comparator(a_, b_)) continue b_loop;
            }
            callback(b_);
        }   
    } else {
        for (const elt of b){
            if (!a.includes(elt)) callback(elt);
        }
    }
}

/**
 * Checks two arrays for elements appearing in only one. Calls callback each time such an element is found, or callback2 if defined if it's in b
 * @template T
 * @param {T[]} a LHS
 * @param {T[]} b RHS
 * @param {((a: T[], b: T[]) => boolean)?} comparator 
 * @param {(elt: T) => void} callback
 * @param {((elt: T) => void)?} callback2
 */
export function diff(a, b, callback = null, callback2 = null, comparator){
    includes(b, a, callback, comparator);
    includes(a, b, callback2 ?? callback, comparator);
}