const express = require ("express")

const musicController = require('../Controllers/music.controller')
const authMiddleware = require('../middlewares/auth.middlewares')
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/upload',  authMiddleware.authArtist, upload.single('music'), musicController.createMusic)
router.post('/album', authMiddleware.authArtist, upload.single('cover'), musicController.createAlbum)
router.delete('/album/:albumId', authMiddleware.authArtist, musicController.deleteAlbum)
router.get('/mine', authMiddleware.authArtist, musicController.getMyMusic)
router.patch('/:musicId', authMiddleware.authArtist, musicController.updateMusic)
router.delete('/:musicId', authMiddleware.authArtist, musicController.deleteMusic)
router.get('/', authMiddleware.authUser, musicController.getAllMusic)
router.get('/albums', authMiddleware.authUserOrArtist, musicController.getAllAlbums)
router.get('/albums/:albumId', authMiddleware.authUserOrArtist, musicController.getAlbumById)

module.exports = router;