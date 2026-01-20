//For use will small user test scripts

/**
 * @template T
 * @param {T[]} a LHS argument
 * @param {T[]} b RHS argument
 * @param {(a: T[], b: T[]) => boolean} comparator 
 * @param {(elt: T) => void} errorcallback 
 */
export function includes(a, b, comparator = null, errorcallback = null){
    if (comparator){
        b_loop: for (const b_ of b){
            for (const a_ of a){
                if (comparator(a_, b_)) continue b_loop;
            }
            errorcallback(b_);
        }   
    } else {
        for (const elt of b){
            if (!a.includes(elt)) errorcallback(elt);
        }
    }
}