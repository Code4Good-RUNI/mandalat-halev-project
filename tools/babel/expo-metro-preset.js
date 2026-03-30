const path = require('path');
const fs = require('fs');

function findExpoAppRoot(filename, fallbackProjectRoot) {
  const routerNodeModulesSegment = `${path.sep}node_modules${path.sep}expo-router${path.sep}`;
  const routerNodeModulesIndex = filename.indexOf(routerNodeModulesSegment);

  if (routerNodeModulesIndex !== -1) {
    return filename.slice(0, routerNodeModulesIndex);
  }

  let currentDir = path.dirname(filename);
  const normalizedFallback = path.resolve(fallbackProjectRoot);

  while (true) {
    const packageJsonPath = path.join(currentDir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        if (packageJson.main === 'expo-router/entry') {
          return currentDir;
        }
      } catch {
        // Ignore malformed or unrelated package.json files and keep walking.
      }
    }

    if (currentDir === normalizedFallback) {
      return normalizedFallback;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return normalizedFallback;
    }

    currentDir = parentDir;
  }
}

function inlineExpoRouterEnv(api) {
  const t = api.types;
  const projectRoot = api.caller((caller) => caller?.projectRoot) || process.cwd();
  const routerRoot = api.caller((caller) => caller?.routerRoot) || 'app';
  const asyncRoutes = api.caller((caller) => caller?.asyncRoutes) || false;
  const importMode = asyncRoutes ? 'lazy' : 'sync';

  return {
    name: 'inline-expo-router-env',
    visitor: {
      MemberExpression(memberPath, state) {
        const expoAppRoot = findExpoAppRoot(state.filename, projectRoot);
        const absoluteRouterRoot = path.isAbsolute(routerRoot)
          ? routerRoot
          : path.join(expoAppRoot, routerRoot);
        const object = memberPath.node.object;

        if (!t.isMemberExpression(object)) return;
        if (!t.isIdentifier(object.object, { name: 'process' })) return;
        if (!t.isIdentifier(object.property, { name: 'env' })) return;

        const property = memberPath.node.property;
        if (!t.isIdentifier(property)) return;

        if (property.name === 'EXPO_ROUTER_APP_ROOT') {
          memberPath.replaceWith(
            t.stringLiteral(
              path.relative(path.dirname(state.filename), absoluteRouterRoot)
            )
          );
        }

        if (property.name === 'EXPO_ROUTER_ABS_APP_ROOT') {
          memberPath.replaceWith(t.stringLiteral(absoluteRouterRoot));
        }

        if (property.name === 'EXPO_ROUTER_IMPORT_MODE') {
          memberPath.replaceWith(t.stringLiteral(importMode));
        }
      },
    },
  };
}

module.exports = function expoMetroPreset() {
  return {
    presets: ['babel-preset-expo'],
    plugins: [inlineExpoRouterEnv],
  };
};
