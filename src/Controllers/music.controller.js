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

    
    const { title, musics } = req.body;
        const album = await albumModel.create({
            title,
            artist: req.user.id,
            musics: musics
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
    const musics = await musicModel.find().populate("artist", "name");
    res.status(200).json({
        message: "All music fetched successfully",
        musics: musics
    });
}

async function getAllAlbums(req, res) {
    const albums = await albumModel.find().limit(2).skip(0).select("title artist").populate("artist", "name").populate("musics", "title uri");
    res.status(200).json({
        message: "All albums fetched successfully",
        albums: albums
    });
}

async function getAlbumById(req, res) {
    const albumId = req.params.albumId
}

module.exports = { createMusic, createAlbum ,getAllMusic, getAllAlbums,getAlbumById};


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