import { GraphQLClient } from 'graphql-request';
import { getUserInfo } from './getUserInfo.js'
import { TimedQuerySemaphore } from './lib/queryLimiter.js';
import { aggregateDataPromises } from './lib/util.js';
import { readJSONInput } from './lib/readUtil.js';

export class User {

    /** @type {number} */
    id;
    /** @type {string} */
    name;

    /**
     * @param {string} slug 
     */
    constructor(user){
        if (user == null){
            throw "Couldn't load user " + this.slug;
        }
        this.slug = user.slug;
        this.id = user.id;
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

    static createUsersMultimodal(client, slugs, limiter, datafile){
        return aggregateDataPromises([
            this.createUsers(client, slugs, limiter),
            datafile ? readJSONInput(datafile).catch(err => {
                throw "Couldn't read specified user data file " + datafile + " : " + err
            }).then(data => data.map(user => new User(user))) : []
        ])
    }

    static async loadUsers(client, users, limiter = null){
        await Promise.all(users.map( (p) => p.load(client, limiter)))
    }

}