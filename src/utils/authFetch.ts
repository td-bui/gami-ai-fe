export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  let token = localStorage.getItem("token");
  let refreshToken = localStorage.getItem("refreshToken");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Attach access token to headers
  init.headers = {
    ...(init.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
    "user-id": localStorage.getItem("userId") || "", // Include userId if needed
    "level": localStorage.getItem("level") || "", // Include user level if needed
  };

  let res = await fetch(input, init);

  // If unauthorized, try refresh
  if (res.status === 401 && refreshToken) {
    // Try to refresh the token
    const refreshRes = await fetch(
      `${apiBaseUrl}/api/auth/refresh?refreshToken=${refreshToken}`,
      { method: "POST" }
    );
    if (refreshRes.ok) {
      console.log("Token refreshed successfully");
      const data = await refreshRes.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userId", data.userId); 
      localStorage.setItem("level", data.level); // Store user level
      init.headers = {
        ...(init.headers || {}),
        Authorization: `Bearer ${data.token}`,
        "Content-Type": "application/json",
      };
      res = await fetch(input, init);
    } else {
      // Refresh failed, logout user
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/sign-in";
      throw new Error("Session expired. Please sign in again.");
    }
  }

  return res;
}