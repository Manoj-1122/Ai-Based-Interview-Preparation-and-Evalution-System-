const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim();
const exampleAppUrls = ["https://your-app-domain.com", "https://my-interview-app.vercel.app"];

export const getAuthRedirectUrl = (path = "") => {
  const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const baseUrl = !isLocalDevelopment && configuredAppUrl && !exampleAppUrls.includes(configuredAppUrl)
    ? configuredAppUrl
    : window.location.origin;
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};