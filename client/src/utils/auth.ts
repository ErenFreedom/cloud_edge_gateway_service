export const getUserFromToken = () => {

  const token = localStorage.getItem("accessToken");

  if (!token) return null;

  try {

    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    return payload;

  } catch {
    return null;
  }

};