# Sentry Loader

Comparison of different methods of loading multi-tenant Sentry on webpage.

1. `@sentry/browser`
2. [Sentry Loader](https://docs.sentry.io/platforms/javascript/install/loader/)
3. Custom Loader (lazy load Sentry bundle from CDN)

## Comparison

| Variant | Multi-tenant | Bundle size |
|---------|--------------|-------------|
| npm     | ✅            | 55.5 KB     |
| loader  | ❌            | 727 B       |
| custom  | ✅            | 1.28 KB     |

Using `@sentry/browser` npm package is the easiest way to get started, but it results in a large bundle size.

Sentry Loader is a great way to reduce bundle size (as it supports lazy loading), but it doesn't support multi-tenant Sentry.

Custom solution is combining the best of both solutions. It loads minified Sentry bundle from Sentry CDN, but provides lazy loading to reduce initial page load time, while supporting multi-tenant Sentry.

## Usage

```shell
nvm use
npm ci
```

```shell
cp .env.example .env
```

Provide `SENTRY_DSN_1` and `SENTRY_DSN_2` in .env file.

Run each variant and check that error is reported to both Sentry projects.

```shell
npm run start:npm
npm run start:loader
npm run start:custom
```