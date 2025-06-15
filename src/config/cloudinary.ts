import axios from "axios";

const API_BASE_URL = "http://192.168.84.234:8080";

interface UploadResult {
  url: string;
  type: "image" | "video";
  width: number;
  height: number;
  duration?: number;
}

export const uploadMediaToCloudinary = async (
  uri: string,
  type: string,
  width?: number,
  height?: number,
  duration?: number
): Promise<UploadResult | null> => {
  try {
    const fileName = uri.split("/").pop() || "media";
    const mimeType = type === "video" ? "video/mp4" : "image/jpeg";

    // 1. Get signature from backend
    const sigRes = await axios.get(`${API_BASE_URL}/api/upload/signature`, {
      params: {
        folder: "user_uploads",
        resourceType: type,
      },
    });

    const { signature, timestamp, apiKey, cloudName } = sigRes.data;

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append("file", {
      uri,
      type: mimeType,
      name: fileName,
    } as any);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", "user_uploads");

    // 3. Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`;
    const uploadRes = await axios.post(uploadUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return {
      url: uploadRes.data.secure_url,
      type: type as "image" | "video",
      width: width || 0,
      height: height || 0,
      duration,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};
