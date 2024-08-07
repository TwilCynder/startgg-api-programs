import { GraphQLClient } from 'graphql-request';
import { getUserInfo } from './getUserInfo.js'
import { TimedQuerySemaphore } from './lib/queryLimiter.js';

export class User {

    /** @type {number} */
    id;
    /** @type {string} */
    name;

    /**
     * @param {string} slug 
     */
    constructor(slug){
        this.slug = slug;
    }

    async load(client, limiter = null){
        let user = await getUserInfo(client, this.slug, limiter);

        if (user == null){
            throw "Couldn't load user " + this.slug;
        }

        this.id = user.id;
        this.name = user.player.gamerTag;

        return this;
    }

    static createUser(client, slug, limiter = null){
        return (new User(slug).load(client, limiter));
    }

    /**
     * 
     * @param {GraphQLClient} client 
     * @param {string[]} slugs 
     * @param {TimedQuerySemaphore} limiter 
     * @returns 
     */
    static async createUsers(client, slugs, limiter = null){
        return await Promise.all(slugs.map( (slug) => this.createUser(client, slug, limiter)))
    }

    static async loadUsers(client, users, limiter = null){
        await Promise.all(users.map( (p) => p.load(client, limiter)))
    }

}