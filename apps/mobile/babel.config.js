// nativewind/babel usa @babel/plugin-transform-react-jsx sin declararlo; la app lo declara
// para que el empaquetado de la APK (export:embed) lo encuentre.
module.exports = (api) => {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
