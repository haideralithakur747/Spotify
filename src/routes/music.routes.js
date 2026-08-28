const express = require ("express")

const musicController = require('../Controllers/music.controller')
const authMiddleware = require('../middlewares/auth.middlewares')
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/upload',  authMiddleware.authArtist, upload.single('music'), musicController.createMusic)
router.post('/album',authMiddleware.authArtist,musicController.createAlbum)
router.get('/', authMiddleware.authUser, musicController.getAllMusic)
router.get("/albums" , authMiddleware.authUser, musicController.getAllMusic)
router.get("/albums/:albumId" , authMiddleware.authUser, musicController.getAllAlbums)

module.exports = router;