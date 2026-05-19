module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@store': './src/store',
            '@types': './src/types',
            '@constants': './src/constants',
            '@components': './src/components',
          },
        },
      ],
    ],
  };
};
