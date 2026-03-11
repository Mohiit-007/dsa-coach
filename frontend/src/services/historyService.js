import api from "../api/axios";

// Save a history entry for any tool
export const saveToHistory = async (toolType, codeInput, language, resultOutput, problemTitle = "", problemDescription = "") => {
  try {
    console.log(`[HISTORY] === Starting History Save ===`);
    console.log(`[HISTORY] Tool Type: ${toolType}`);
    console.log(`[HISTORY] Language: ${language}`);
    console.log(`[HISTORY] Code Length: ${codeInput?.length || 0}`);
    console.log(`[HISTORY] Has Result:`, !!resultOutput);
    console.log(`[HISTORY] Token exists:`, !!localStorage.getItem("token"));
    
    // Validate required fields
    if (!toolType || !codeInput || !resultOutput) {
      console.error("[HISTORY] Missing required fields:", { toolType, hasCode: !!codeInput, hasResult: !!resultOutput });
      throw new Error("Missing required fields for history save");
    }
    
    const payload = {
      toolType,
      codeInput,
      language,
      resultOutput,
      problemTitle,
      problemDescription,
    };
    
    console.log(`[HISTORY] Payload keys:`, Object.keys(payload));
    console.log(`[HISTORY] Making API call to /history/save`);
    
    const response = await api.post("/history/save", payload);
    
    console.log(`[HISTORY] ✅ Save successful!`);
    console.log(`[HISTORY] Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[HISTORY] ❌ Save Failed!`);
    console.error(`[HISTORY] Error:`, error);
    console.error(`[HISTORY] Error Response:`, error.response?.data);
    console.error(`[HISTORY] Error Status:`, error.response?.status);
    throw error;
  }
};

// Get user's history with filtering and pagination
export const getHistory = async (filters = {}) => {
  try {
    console.log(`[HISTORY] === Fetching History ===`);
    console.log(`[HISTORY] Filters:`, filters);
    console.log(`[HISTORY] Token exists:`, !!localStorage.getItem("token"));
    
    const params = new URLSearchParams();
    
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.toolType) {
      if (Array.isArray(filters.toolType)) {
        filters.toolType.forEach(type => params.append("toolType", type));
      } else {
        params.append("toolType", filters.toolType);
      }
    }
    if (filters.language) params.append("language", filters.language);
    if (filters.search) params.append("search", filters.search);
    
    console.log(`[HISTORY] API Call: GET /history?${params}`);
    
    const response = await api.get(`/history?${params}`);
    
    console.log(`[HISTORY] ✅ Fetch successful!`);
    console.log(`[HISTORY] Total entries:`, response.data.total);
    console.log(`[HISTORY] Data length:`, response.data.data?.length);
    console.log(`[HISTORY] Response:`, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`[HISTORY] ❌ Fetch Failed!`);
    console.error(`[HISTORY] Error:`, error);
    console.error(`[HISTORY] Error Response:`, error.response?.data);
    throw error;
  }
};

// Get a specific history entry
export const getHistoryEntry = async (id) => {
  try {
    const response = await api.get(`/history/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch history entry:", error);
    throw error;
  }
};

// Delete a history entry
export const deleteHistoryEntry = async (id) => {
  try {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete history entry:", error);
    throw error;
  }
};

// Toggle bookmark on a history entry
export const toggleBookmark = async (id) => {
  try {
    const response = await api.patch(`/history/${id}/bookmark`);
    return response.data;
  } catch (error) {
    console.error("Failed to toggle bookmark:", error);
    throw error;
  }
};

// Get user's history statistics
export const getHistoryStats = async () => {
  try {
    const response = await api.get("/history/stats");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch history stats:", error);
    throw error;
  }
};
