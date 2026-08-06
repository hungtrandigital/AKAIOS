declare module "cloudflare:workers" {
  export const env: {
    DB: D1Database;
    MEDIA: R2Bucket;
    ADMIN_EMAILS?: string;
  };
}
