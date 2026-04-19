export async function startScreenShare() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false // keep simple for now
    });

    return stream;
  } catch (err) {
    console.error("Screen share error:", err);
    return null;
  }
}