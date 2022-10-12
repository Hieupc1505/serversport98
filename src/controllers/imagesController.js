const imagesModel = require("../models/images");

class ImageCtrl {
    async getImage(req, res, next) {
        const { id, title } = req.params;
        if (id) {
            const images = await imagesModel.find({
                teamId: Number.parseInt(id),
                slug: title,
            });
            if (images[0])
                res.status(200).json({
                    url: images[0].url,
                });
            else
                res.status(500).json({
                    mes: "Internal server error",
                });
        }
    }
}

module.exports = new ImageCtrl();
