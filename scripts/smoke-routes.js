const app = require('../src/app');

const expectedRoutes = [
  '/health',
  '/ready',
  '/api-docs',
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/users/me',
  '/api/v1/candidates/me',
  '/api/v1/companies',
  '/api/v1/recruiters',
  '/api/v1/jobs/search',
  '/api/v1/jobs',
  '/api/v1/jobs/:id',
  '/api/v1/applications',
  '/api/v1/applications/me',
  '/api/v1/resumes',
  '/api/v1/resumes/me',
  '/api/v1/saved-jobs',
  '/api/v1/saved-jobs/me',
  '/api/v1/notifications',
  '/api/v1/notifications/me',
  '/api/v1/interviews',
  '/api/v1/interviews/me',
  '/api/v1/analytics/summary',
  '/api/v1/admin/users',
  '/api/v1/subscriptions',
  '/api/v1/subscriptions/plans',
];

function prefixFromRegexp(regexp) {
  const source = regexp.source
    .replace(/^\^/, '')
    .replace(/\(\?=.+$/, '')
    .replace(/\\\//g, '/')
    .replace(/\/\?$/, '');

  if (source === '/?' || source === '/' || source === '') {
    return '';
  }

  return source;
}

function normalizeRoutePath(routePath) {
  if (!routePath) {
    return routePath;
  }

  return routePath.replace(/\/$/, '') || '/';
}

function collectRoutes() {
  const discoveredRoutes = new Set();

  for (const layer of app._router.stack) {
    if (layer.route && layer.route.path) {
      discoveredRoutes.add(normalizeRoutePath(layer.route.path));
    }

    if (layer.regexp && layer.regexp.toString().includes('/api-docs')) {
      discoveredRoutes.add('/api-docs');
    }
  }

  const apiRouter = app._router.stack.find((layer) => layer.name === 'router');
  const v1Router = apiRouter?.handle?.stack?.[0];

  for (const subRouter of v1Router?.handle?.stack || []) {
    const prefix = '/api/v1' + prefixFromRegexp(subRouter.regexp);

    for (const routeLayer of subRouter.handle.stack) {
      if (routeLayer.route && routeLayer.route.path) {
        discoveredRoutes.add(normalizeRoutePath(prefix + routeLayer.route.path));
      }
    }
  }

  return [...discoveredRoutes].sort();
}

const discoveredRoutes = collectRoutes();
const missingRoutes = expectedRoutes.filter((route) => !discoveredRoutes.includes(route));

console.log('Discovered routes:');
for (const route of discoveredRoutes) {
  console.log(`- ${route}`);
}

if (missingRoutes.length) {
  console.error('\nMissing routes:');
  for (const route of missingRoutes) {
    console.error(`- ${route}`);
  }
  process.exit(1);
}

console.log('\nRoute smoke check passed');
