import axios from "axios";
import FormData from "form-data";

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Forwards a raw image buffer to the FastAI vision service (multipart field "frame").
 * @param {Buffer} imageBuffer
 * @param {string} [mimeType] e.g. image/jpeg
 * @param {string} [filename] default frame.jpg
 * @returns {Promise<{ status: string, message?: string }>}
 */
export async function forwardFrameToAiService(
  imageBuffer,
  mimeType = "image/jpeg",
  filename = "frame.jpg"
) {
  const base = process.env.AI_SERVICE_URL?.replace(/\/$/, "");
  if (!base) {
    return { status: "error", message: "AI_SERVICE_URL is not set" };
  }

  const form = new FormData();
  form.append("frame", imageBuffer, {
    filename,
    contentType: mimeType,
  });

  try {
    const { data } = await axios.post(`${base}/analyze-frame`, form, {
      headers: form.getHeaders(),
      timeout: DEFAULT_TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    });

    if (data && typeof data.status === "string") {
      return data;
    }
    return { status: "error", message: "invalid AI service response" };
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      "AI service request failed";
    return { status: "error", message: String(msg) };
  }
}
