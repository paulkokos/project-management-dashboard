export default {
  input: 'dist/index.js',
  output: {
    file: 'dist/index.esm.js',
    format: 'es',
    sourcemap: true,
  },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
};
