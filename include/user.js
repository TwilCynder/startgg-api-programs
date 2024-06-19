import { getUserInfo } from './getUserInfo.js'

export class User {
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

    static async createUsers(client, slugs, limiter = null){
        let users = []
        await Promise.all(slugs.map( (slug) => this.createUser(client, slug, limiter)))
            .then(values => users = values);
        return users;
    }

    static async loadUsers(client, users, limiter = null){
        await Promise.all(users.map( (p) => p.load(client, limiter)))
    }

}