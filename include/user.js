import { GraphQLClient } from 'graphql-request';
import { getUserInfo } from './getUserInfo.js'
import { TimedQuerySemaphore } from 'startgg-helper';
import { extractUserDiscriminator, readUsersFile, tryReadJSONArray } from './lib/util.js';


/**
 * @param {any[]} usersData 
 */
function _createUsersMap(usersData){
    return new Map(usersData.map(userInfo => {
        let user = new User(userInfo);
        return [user.slug, user]
    }));
}

/**
 * @param {User[]} array 
 */
function _mapFromArray(array){
    return new Map(array.map(user => [user.slug, user]))
}

/**
 * @param {User[]} array 
 * @param {boolean | "both"} asMap 
 */
function _arrayAndOrMapFromArray(array, asMap){
    return asMap == "both" ? [array, _mapFromArray(array)] : asMap ? _mapFromArray(array) : array;
}

export class User {

    /** @type {number} */
    id;
    /** @type {string} */
    name;

    /**
     * @param {string} slug 
     */
    constructor(user, slug){
        if (user == null){
            throw "Null user";
        }
        slug = slug ?? user.discriminator ?? user.slug;
        this.slug = extractUserDiscriminator(slug);
        this.id = user.player.id;
        this.name = user.player.gamerTag;

        return this;
    }

    static async loadUser(client, slug, limiter = null){
        let user = await getUserInfo(client, slug, limiter);
        return new User(user);
    }

    /**
     * 
     * @param {GraphQLClient} client 
     * @param {string[]} slugs 
     * @param {TimedQuerySemaphore} limiter 
     * @returns 
     */
    static async createUsers(client, slugs = [], limiter = null){
        return await Promise.all(slugs.map( (slug) => this.loadUser(client, slug, limiter)))
    }

    static _loadMultimodalInputs(slugs, slugsFile, datafile){
        return Promise.all ([
            tryReadJSONArray(datafile),
            readUsersFile(slugsFile, slugs),
        ]);
    }


    static async _createUsersMultimodal(client, limiter, slugs, slugsFile, datafile){
        let [usersData, slugs_] = await this._loadMultimodalInputs(slugs, slugsFile, datafile);

        let usersMap = _createUsersMap(usersData);

        await Promise.all(slugs_.map(async slug => {
            if (!usersMap.get(slug)){
                const user = await this.loadUser(client, slug, limiter);
                usersMap.set(slug, user);
            }
        }));

        return usersMap;
    }

    static async _createUsersMultimodalFiltered(client, limiter, slugs, slugsFile, datafile){
        let [usersData, slugs_] = await this._loadMultimodalInputs(slugs, slugsFile, datafile);
        
        let usersMap = _createUsersMap(usersData);

        return await Promise.all(slugs_.map(async slug => {
            slug = extractUserDiscriminator(slug)
            let fromMap = usersMap.get(slug);
            if (fromMap){
                return fromMap;
            } else {
                return await this.loadUser(client, slug, limiter);
            }
        }))
    }

    /**
     * Creates user objects from a list of slugs (fetching data for each of them) and/or an array of pre-fetched objects. Both lists may contain the same user, it will be deduplicated. If filterMode is true, instead disregards any user data not present in the slug list.
     * @param {GraphQLClient} client 
     * @param {TimedQuerySemaphore} limiter 
     * @param {string[]} slugs List of user slugs
     * @param {string} slugsFile File containing a list of slugs
     * @param {string} datafile File containing an array of pre-fetched user data
     * @param {boolean} listOnly Use only the users present in the slugs list ; the data file is only used to avoid redundant fetches.
     * @param {boolean | "both"} asMap Returns the users in a map, with the slug as key for each user
     */
    static async createUsersMultimodal(client, limiter, slugs, slugsFile, datafile, listOnly, asMap){
        if (datafile){
            if (listOnly){
                let array = await this._createUsersMultimodalFiltered(client, limiter, slugs, slugsFile, datafile);
                return _arrayAndOrMapFromArray(array, asMap);
            } else {
                let map = await this._createUsersMultimodal(client, limiter, slugs, slugsFile, datafile);
                return asMap == "both" ? [Array.from(map.values()), map] : asMap ? map : Array.from(map.values());
            }
        } else {
            slugs = await readUsersFile(slugsFile, slugs);
            return await Promise.all(slugs.map(slug => this.loadUser(client, slug, limiter))).then(array => _arrayAndOrMapFromArray(array, asMap));
        }

    }

}

//TODO : système de mise à jour du data file quand j'aurai unifié les formats de données

