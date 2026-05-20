module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@store': './src/store',
            '@app-types': './src/types',
            '@constants': './src/constants',
            '@components': './src/components',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
