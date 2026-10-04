import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Historical studies remain available during development, outside the offline product bundle.
async function start() {
  let Page = App
  if (import.meta.env.DEV) {
    const preview = new URLSearchParams(location.search).get('preview')
    if (preview === 'cat') Page = (await import('./preview/CatSample')).default
    if (preview === 'cat3d') Page = (await import('./preview3d/CatStudy')).default
    if (preview === 'cat2d') Page = (await import('./preview2d/CatIllustration')).default
    if (preview === 'catlayers') Page = (await import('./preview2d/layers/LayerStudy')).default
    if (preview) document.documentElement.dataset.preview = preview
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Page />
    </StrictMode>,
  )
}
void start()
