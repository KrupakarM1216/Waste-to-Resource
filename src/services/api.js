const BASE_URL = "https://waste-to-resource.onrender.com/api";

export const analyzeWaste = async (description) => {
  const response = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) throw new Error("Server error");
  return response.json();
};

export const evaluateScrap = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${BASE_URL}/evaluate-scrap`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Server error");
  return response.json();
};