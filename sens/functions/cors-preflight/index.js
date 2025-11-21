export async function handler(event, context) {
  return {
    statusCode: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "*",
      "access-control-max-age": "3600"
    },
    body: ""
  };
}