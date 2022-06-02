import { Storage } from '@google-cloud/storage'

const googleStorage = new Storage();

let GCloud = {

    uploadFile: async function (filePath, id) {
        const bucketName = 'parket-pictures';
        await googleStorage.bucket(bucketName).upload(filePath, {
            destination: id,
        });
    },

    deleteFile: async function (fileName) {
        await googleStorage.bucket('parket-pictures').file(fileName).delete();
    },
}

export default GCloud