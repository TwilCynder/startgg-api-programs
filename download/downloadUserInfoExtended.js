import { aggregateArrayDataPromises, readUsersFile, tryReadJSONArray } from "../include/lib/util.js";
import { downloadScript } from "../include/downloadScriptFramework.js";

await downloadScript(
    (am) => am
        .addMultiParameter("userSlugs")
        .addOption(["-f", "--users-file"], {dest: "file", description: "File containing a list of user slugs"}),
    async (client, limiter, {userSlugs, file, inputfile}) => {
        let [users, userObjects] = await Promise.all([readUsersFile(file, userSlugs), tryReadJSONArray(inputfile)])

        return await aggregateArrayDataPromises([getUsersInfoExtended(client, users, limiter), getUsersInfoExtendedFromObjects(client, userObjects, limiter)]);
    }
);