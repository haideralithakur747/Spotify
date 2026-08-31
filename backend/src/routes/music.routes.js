const express = require ("express")

const musicController = require('../Controllers/music.controller')
const authMiddleware = require('../middlewares/auth.middlewares')
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/upload',  authMiddleware.authArtist, upload.single('music'), musicController.createMusic)
router.post('/album', authMiddleware.authArtist, upload.single('cover'), musicController.createAlbum)
router.get('/mine', authMiddleware.authArtist, musicController.getMyMusic)
router.patch('/:musicId', authMiddleware.authArtist, musicController.updateMusic)
router.delete('/:musicId', authMiddleware.authArtist, musicController.deleteMusic)
router.get('/', authMiddleware.authUser, musicController.getAllMusic)
router.get("/albums" , authMiddleware.authUser, musicController.getAllAlbums)
router.get("/albums/:albumId" , authMiddleware.authUser, musicController.getAlbumById)

module.exports = router;