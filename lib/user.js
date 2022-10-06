import { getUserInfo } from './getUserInfo.js'

export class User {
    constructor(slug){
        this.slug = slug;
    }

    async load(client){
        let user = await getUserInfo(client, this.slug);

        if (user == null){
            throw "Couldn't load user " + this.slug;
        }

        this.id = user.id;
        this.name = user.player.gamerTag;

        return this;
    }
 
    static createUser(client, slug){
        return (new User(slug).load(client));
    }

    static async createUsers(client, slugs){
        let users = []
        await Promise.all(slugs.map( (slug) => this.createUser(client, slug)))
            .then(values => users = values);
        return users;
    }

    static async loadUsers(client, users){
        await Promise.all(users.map( (p) => p.load(client)))
    }

    static async loadStandingsPlayersSync(client, users, after = null){
        let count = 0;
        for (let user of users){
            console.log("Loading sets from user ", user.name, "with ID", user.id);
            await user.loadStandings(client, 1000, after);
            count += user.standingsList.length
            console.log("Current events count : ", count)
        }
    }

}