const musicModel = require('../models/music.model');
const { uploadFile } = require('../services/storage.service');
const albumModel = require('../models/album.model'); 


async function createMusic(req, res) {

   

    
    

    if (!req.file) {
        return res.status(400).json({
            message: "No file uploaded"
        });
    }

    const { title } = req.body;

    console.log("req.file exists:", !!req.file);
    console.log("File name:", req.file.originalname);
    console.log("Mimetype:", req.file.mimetype);
    console.log("File size:", req.file.size);

     const result = await uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        console.log("IMAGEKIT RESULT:", result);

        const music = await musicModel.create({
            uri: result.url,
            title,
            artist: req.user.id,
        });

        return res.status(201).json({
            id: music._id,
            title: music.title,
            uri: music.uri,
            artist: music.artist
        });

}

async function createAlbum(req, res) {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const musics = Array.isArray(req.body.musics) ? req.body.musics : [];
    if (!title || !musics.length) {
        return res.status(400).json({ message: "Album title and tracks are required" });
    }
    const ownedTracks = await musicModel.countDocuments({ _id: { $in: musics }, artist: req.user.id });
    if (ownedTracks !== musics.length) {
        return res.status(403).json({ message: "You can only add your own tracks" });
    }
        let coverUri;
        if (req.file) {
            const cover = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
            coverUri = cover.url;
        }
        const album = await albumModel.create({
            title,
            artist: req.user.id,
            musics,
            coverUri
        })
        res.status(201).json({
            message: "Album created successfully",
            album:{
                id: album._id,
                title: album.title,
                artist: album.artist,
                musics: album.musics
            }
        })

}

async function getAllMusic(req, res) {
    const musics = await musicModel.find().populate("artist", "username");
    res.status(200).json({
        message: "All music fetched successfully",
        musics: musics
    });
}

async function getMyMusic(req, res) {
    const musics = await musicModel.find({ artist: req.user.id }).sort({ _id: -1 });
    res.status(200).json({ musics });
}

async function updateMusic(req, res) {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    if (!title) return res.status(400).json({ message: "Track title is required" });
    const music = await musicModel.findOneAndUpdate(
        { _id: req.params.musicId, artist: req.user.id },
        { title },
        { new: true, runValidators: true }
    );
    if (!music) return res.status(404).json({ message: "Track not found" });
    res.status(200).json({ music });
}

async function deleteMusic(req, res) {
    const music = await musicModel.findOneAndDelete({ _id: req.params.musicId, artist: req.user.id });
    if (!music) return res.status(404).json({ message: "Track not found" });
    await albumModel.updateMany({ artist: req.user.id }, { $pull: { musics: music._id } });
    res.status(200).json({ message: "Track deleted successfully" });
}

async function getAllAlbums(req, res) {
    const albums = await albumModel.find().select("title coverUri artist").populate("artist", "username").populate("musics", "title uri");
    res.status(200).json({
        message: "All albums fetched successfully",
        albums: albums
    });
}

async function getAlbumById(req, res) {
    const albumId = req.params.albumId
    const album = await albumModel.findById(albumId).populate("artist", "username").populate("musics", "title uri");
    return res.status(200).json({
        message: "Album fetched successfully",
        album: album
    });
}

module.exports = { createMusic, createAlbum, getAllMusic, getMyMusic, updateMusic, deleteMusic, getAllAlbums, getAlbumById };


// const musicModel = require('../models/music.model');
// const {uploadFile} = require('../services/storage.service')
// const jwt = require('jsonwebtoken');

// async function createMusic(req, res) {

// const token = req.cookies.token;

// if(!token){
//     return res.status(401).json({ message: 'Unauthorized' });
// }
// try{
//    const decoded = jwt.verify(token,process.env.JWT_SECRET);

//    if(decoded.role !== 'artist'){
//     return res.status(403).json({ message: 'you donot have access to create new music' });
//    }
// }
// catch(err){
//     return res.status(401).json({ message: 'Unauthorized' });
// }

// const {title} = req.body;
// // const {file} = req.file

// const result = await uploadFile(req.file.buffer);//

// const music = await musicModel.create({
//     uri: result.uri,
//     title,
//     artist: decoded.id,
// })
// res.status(201).json({ 
//     id: music._id,
//     title: music.title,
//     uri: music.uri,
//     artist: music.artist
//  });

// }
// module.exports = { createMusic }