export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.jsm.aora',
    projectId: '66295767f1fedcc27e10',
    databaseId: '662a92718dd311846817',
    userCollectionId: '662a929331241a1271c2',
    videoColectionId: '662a92bb2820a8c495cd',
    storageId: '662a94913935442bd1ec'
}

const{
    endpoint,
    platform,
    projectId,
    databaseId,
    userCollectionId,
    videoColectionId,
    storageId,
} = appwriteConfig;

import { Client, Account, ID, Avatars, Databases, Query, Storage} from 'react-native-appwrite';
// Init your react-native SDK
const client = new Client();

client
    .setEndpoint(endpoint)
    .setProject(projectId) 
    .setPlatform(platform) 
;

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client)
const storage = new Storage(client)

export const createUser = async (email, password, username) =>{
    try{
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        )

        if(!newAccount) throw Error

        const avatarUrl = avatars.getInitials()
        
        await signIn(email, password)

        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email,
                username,
                avatar: avatarUrl
            }
        )
        return newUser;
    } catch (error){
        console.log(error);
        throw new Error(error);
    }
}

export const signIn = async (email, password) =>{
    try{
        const session = await account.createEmailSession(email, password)
        return session
    } catch (error){
        throw new Error(error);
    }
}

export const getCurrentUser = async () => {
    try{
        const currertAccount = await account.get();
        if(!currertAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currertAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0]

    } catch (error){
        console.log('Ovde')
        console.log(error);
    }
}

export const getAllPosts = async () => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoColectionId,
            [Query.orderDesc('$createdAt')]
        )
        return posts.documents;
    }catch (error){
        throw new Error(error);
    }
}

export const getLatestPosts = async () => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoColectionId,
            [Query.orderDesc('$createdAt', Query.limit(7))]
        )
        return posts.documents;
    }catch (error){
        throw new Error(error);
    }
}

export const searchPosts = async (query) => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoColectionId,
            [Query.search('title', query)]
        )
        return posts.documents;
    }catch (error){
        throw new Error(error);
    }
}

export const getUserPosts = async (userId) => {
    try{
        const posts = await databases.listDocuments(
            databaseId,
            videoColectionId,
            [Query.equal('users', userId), Query.orderDesc('$createdAt')]
        )
        return posts.documents;
    }catch (error){
        throw new Error(error);
    }
}

export const signOut = async () => {
    try{
        const session = await account.deleteSession('current')
        return session;
    } catch(error) {
        throw new Error(error)
    }
}

export const getFilePreview = async (fileId, type) => {
    let fileUrl;

    try {
        if(type === 'video'){
            fileUrl = storage.getFileView(storageId, fileId);
        } else if(type === 'image'){
            fileUrl = storage.getFilePreview(storageId, fileId, 2000, 2000, 'top', 100);
        } else {
            throw new Error('Invalid file type');
        }

        if(!fileUrl) throw Error;

        return fileUrl;
    } catch (error) {
        throw new Error(error);
    }
}

export const uploadFile = async (file, type) => {

    const asset = {
        name: file.fileName,
        type: file.mimeType,
        size: file.fileSize,
        uri: file.uri,
    };

    try {
        const uploadedFile = await storage.createFile(
            storageId,
            ID.unique(),
            asset
        );
        const fileUrl = await getFilePreview(uploadedFile.$id, type);
        return fileUrl;
    } catch (error) {
        throw new Error(error) 
    }
}

export const createVideo = async (form) => {
    try {
        const [thumbnailUrl, videoUrl] = await Promise.all([
            uploadFile(form.thumbnail, 'image'),
            uploadFile(form.video, 'video'),
        ]);

        const newPost = await databases.createDocument(
            databaseId, videoColectionId, ID.unique(), {
                title: form.title,
                thumbnail: thumbnailUrl,
                video: videoUrl,
                prompt: form.prompt,
                users: form.userId
            }
        )

        return newPost;
    } catch (error) {
        throw new Error(error)
    }
}