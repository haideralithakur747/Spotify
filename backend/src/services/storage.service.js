// const {ImageKit} = require("@imagekit/nodejs")

// const ImageKitClient = new ImageKit({
//     privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
// })

// // async function uploadFile(file){
// //     const result = await ImageKitClient.files.upload({

// //     file,
// //     fileName:"music_"+Date.now(),
// //     folder:"spotify/music"
// //     })
// //     return result
// // }
// async function uploadFile(file){
//     try {
//         const result = await ImageKitClient.files.upload({
//             file,
//             fileName: "music_" + Date.now(),
//             folder: "spotify/music"
//         });
//         return result;
//     } catch (err) {
//         console.log("IK status:", err.status);
//         console.log("IK name:", err.name);
//         console.log("IK message:", err.message);
//         console.log("IK response:", err.error || err.body);
//         throw err;
//     }
//     console.log("Original file size (MB):", req.file.buffer.length / (1024 * 1024));
// console.log("Mimetype:", req.file.mimetype);
// }
// module.exports = { uploadFile }
// const { ImageKit, toFile } = require("@imagekit/nodejs");

// const ImageKitClient = new ImageKit({
//     privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
// });

// async function uploadFile(file, originalName, mimeType) {
//     const wrappedFile = await toFile(file, originalName || "music_" + Date.now(), {
//         type: mimeType
//     });

//     console.log("wrappedFile:", wrappedFile);

//     try {
//         const result = await ImageKitClient.files.upload({
//             file: wrappedFile,
//             fileName: "music_" + Date.now(),
//             folder: "spotify/music"
//         });
//         return result;
//     } catch (err) {
//         console.log("IK status:", err.status);
//         console.log("IK name:", err.name);
//         console.log("IK message:", err.message);
//         console.log("IK response:", err.error || err.body);
//         console.log("IK headers:", err.headers);
//         throw err;
//     }
// }

// module.exports = { uploadFile };
const { ImageKit, toFile } = require("@imagekit/nodejs");

const ImageKitClient = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

async function uploadFile(file, originalName, mimeType) {
    try {

        // Check environment variable
        console.log(
            "Private key exists:",
            !!process.env.IMAGEKIT_PRIVATE_KEY
        );

        // Show only prefix — DO NOT print the full private key
        console.log(
            "Private key prefix:",
            process.env.IMAGEKIT_PRIVATE_KEY?.substring(0, 8)
        );

        // File information
        console.log("Filename:", originalName);
        console.log("Mimetype:", mimeType);
        console.log("File size:", file?.length);

        // Check if file exists
        if (!file) {
            throw new Error("File buffer is missing");
        }

        // Convert Buffer into File
        const wrappedFile = await toFile(
            file,
            originalName || `music_${Date.now()}`,
            {
                type: mimeType || "application/octet-stream"
            }
        );

        console.log("File successfully converted using toFile()");

        // Upload file to ImageKit
        const result = await ImageKitClient.files.upload({
            file: wrappedFile,
            fileName: originalName || `music_${Date.now()}`,
            folder: "/spotify/music"
        });

        console.log("========== IMAGEKIT SUCCESS ==========");
        console.log("URL:", result.url);
        console.log("File ID:", result.fileId);
        console.log("=======================================");

        return result;

    } catch (err) {

        console.log("\n========== IMAGEKIT ERROR ==========");

        console.log("Status:", err.status);
        console.log("Name:", err.name);
        console.log("Message:", err.message);

        // Print ImageKit error response if available
        console.log("Error response:", err.error);
        console.log("Error body:", err.body);

        // Print headers safely
        if (err.headers) {
            try {
                console.log(
                    "Headers:",
                    Object.fromEntries(err.headers.entries())
                );
            } catch (headerError) {
                console.log("Headers:", err.headers);
            }
        }

        // Full error for debugging
        console.log("Full error:", err);

        console.log("=====================================\n");

        throw err;
    }
}

module.exports = {
    uploadFile
};