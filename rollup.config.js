import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/soundflow-card.js',
    format: 'es',
    sourcemap: false
  },
  plugins: [
    resolve(),
    terser({
      format: { comments: false },
      compress: { drop_console: true }
    })
  ]
};
