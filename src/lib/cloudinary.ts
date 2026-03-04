const GAS_URL = "https://script.google.com/macros/s/AKfycbzaFbtdSIWOaWk_xXAnp9YWBK-QdRiKQ9VbIl-MfPpjTkF538WEOt82wXgACVaULgFHGQ/exec";

export async function uploadImage(file: File): Promise<string> {
    try {
        // 1. Get signature from GAS
        // 1. Get signature from GAS using text/plain to avoid CORS preflight
        const sigResp = await fetch(GAS_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "getCloudinarySignature" })
        });
        const sigData = await sigResp.json();
        const { result: auth, success, error } = sigData;

        if (!success || !auth || !auth.signature) {
            throw new Error(error || "Failed to get Cloudinary signature from backend");
        }

        // 2. Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", auth.api_key);
        formData.append("timestamp", auth.timestamp.toString());
        formData.append("signature", auth.signature);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${auth.cloud_name}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Cloudinary upload failed");
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}
