module.exports = function (api) {
  const bundler = api.caller((caller) => caller?.bundler);

  if (bundler === 'metro') {
    return {
      presets: [require.resolve('./tools/babel/expo-metro-preset')],
    };
  }

  return {};
};
