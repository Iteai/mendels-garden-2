const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Importante per Oppo - disabilita la minificazione aggressiva
config.transformer.minifierConfig = {
  compress: {
    drop_console: false,
    drop_debugger: false,
  },
};

module.exports = config;
