const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const flattenMessages = (value) => {
  if (!value) return [];

  if (typeof value === "string") return [value];

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenMessages(item));
  }

  if (isPlainObject(value)) {
    if (typeof value.msg === "string") return [value.msg];
    if (typeof value.message === "string") return [value.message];
    if (typeof value.error === "string") return [value.error];

    return Object.values(value).flatMap((item) => flattenMessages(item));
  }

  return [];
};

export const getErrorMessage = (error, fallback = FALLBACK_MESSAGE) => {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  const responseData = error.response?.data;
  const candidates = [
    error.normalizedMessage,
    responseData?.message,
    responseData?.error?.message,
    responseData?.error,
    responseData?.errors,
    responseData,
    error.payload,
    error.data,
    error.message,
  ];

  for (const candidate of candidates) {
    const messages = flattenMessages(candidate).filter(Boolean);
    if (messages.length > 0) return messages.join("\n");
  }

  if (error.code === "ERR_NETWORK") {
    return "Network error. Please check your connection and try again.";
  }

  return fallback;
};

export default getErrorMessage;
