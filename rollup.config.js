import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/soundflow-card.js',
  output: {
    file: 'dist/soundflow-card.js',
    format: 'es',
    sourcemap: false,
  },
  plugins: [
    resolve(),
    terser({
      format: { comments: false },
      compress: { passes: 2 },
    }),
  ],
};
