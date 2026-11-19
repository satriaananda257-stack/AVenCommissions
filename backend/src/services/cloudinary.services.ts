import cloudinary from "../config/cloudinary";

export const uploadToCloudinary = (buffer: Buffer): Promise<{ secure_url: string; public_id: string }> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "aven-commission" },
            (error, result) => {
                if (error || !result) return reject(error);
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
        );
        stream.end(buffer);
    });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    await cloudinary.uploader.destroy(publicId);
};
