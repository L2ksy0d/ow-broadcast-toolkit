import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getSceneById } from '../scenes/registry'
import { getBroadcastStyle } from '../theme/broadcastStyles'
import styles from './ProgramPreview.module.css'

const PROGRAM_WIDTH = 1920
const PROGRAM_HEIGHT = 1080
const TRANSITION_SPEEDS = {
  fast: { mask: 420, resolve: 340 },
  normal: { mask: 620, resolve: 520 },
  slow: { mask: 820, resolve: 700 }
}
const DEFAULT_TRANSITION_MARK = '/brand/icon/owbt-transition-mono.png'
const clean = value => String(value || '').trim()

const getTransitionLogoSource = (project, logoMode) => {
  if (logoMode === 'ow') return DEFAULT_TRANSITION_MARK
  if (logoMode === 'event') return clean(project?.event?.logo || project?.event?.organizerLogo)
  return ''
}

const normalizeTransitionMode = mode => {
  if (mode === 'cut') return 'none'
  return mode || 'scan'
}

const getProjectSceneId = project => project?.scenes?.activeSceneId || ''

const getTransitionSwapDelay = (mode, timing) => {
  const ratio = mode === 'simple' ? 0.34 : 0.42
  return Math.max(0, Math.min(timing.mask - 80, Math.round(timing.mask * ratio)))
}

const getTransitionLogoShape = (width, height) => {
  if (!width || !height) return 'square'
  const ratio = width / height
  if (ratio >= 1.45) return 'wide'
  if (ratio <= 0.72) return 'tall'
  return 'square'
}

const handleTransitionLogoError = event => {
  event.currentTarget.style.display = 'none'
}

export default function ProgramPreview({
  project,
  bare = false,
  transitionMode = 'scan',
  transitionSpeed = 'slow',
  transitionLogo = 'off'
}) {
  const frameRef = useRef(null)
  const displayProjectRef = useRef(project)
  const pendingProjectRef = useRef(null)
  const transitionActiveRef = useRef(false)
  const transitionTimersRef = useRef([])
  const [scale, setScale] = useState(1)
  const [displayProject, setDisplayProject] = useState(project)
  const [transitionState, setTransitionState] = useState({
    key: 0,
    active: false,
    resolving: false,
    logoSource: ''
  })
  const [transitionLogoProbe, setTransitionLogoProbe] = useState({ source: '', shape: 'square' })
  const scene = getSceneById(displayProject.scenes.activeSceneId)
  const SceneComponent = scene.component
  const broadcastStyle = getBroadcastStyle(displayProject)
  const normalizedTransitionMode = normalizeTransitionMode(transitionMode)
  const transitionTiming = TRANSITION_SPEEDS[transitionSpeed] || TRANSITION_SPEEDS.slow
  const shouldAnimateScene = transitionState.active && normalizedTransitionMode !== 'none'
  const shouldResolveScene = transitionState.resolving && normalizedTransitionMode !== 'none'
  const shouldShowTransitionLogo = shouldAnimateScene && normalizedTransitionMode !== 'simple'
  const transitionLogoSource = shouldAnimateScene ? transitionState.logoSource : ''
  const transitionLogoShape = transitionLogoProbe.source === transitionLogoSource
    ? transitionLogoProbe.shape
    : 'square'
  const transitionClassName = [
    styles.sceneTransition,
    normalizedTransitionMode === 'simple' ? styles.sceneTransitionSimple : styles.sceneTransitionBrand
  ].join(' ')
  const transitionLogoClassName = [
    styles.transitionLogo,
    transitionLogo === 'event' ? styles.transitionLogoEvent : styles.transitionLogoBrand,
    transitionLogo === 'event' && transitionLogoShape === 'wide' ? styles.transitionLogoEventWide : '',
    transitionLogo === 'event' && transitionLogoShape === 'tall' ? styles.transitionLogoEventTall : ''
  ].filter(Boolean).join(' ')
  const clearTransitionTimers = useCallback(() => {
    transitionTimersRef.current.forEach(timer => window.clearTimeout(timer))
    transitionTimersRef.current = []
  }, [])

  useLayoutEffect(() => {
    if (!frameRef.current || typeof ResizeObserver === 'undefined') return undefined

    const frame = frameRef.current
    const syncScale = rect => {
      if (!rect?.width || !rect?.height) return
      setScale(Math.min(rect.width / PROGRAM_WIDTH, rect.height / PROGRAM_HEIGHT))
    }

    syncScale(frame.getBoundingClientRect())

    const resizeObserver = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      syncScale(rect)
    })

    resizeObserver.observe(frame)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (transitionLogo !== 'event' || !transitionLogoSource || typeof Image === 'undefined') return undefined

    let isCurrent = true
    const image = new Image()
    image.onload = () => {
      if (isCurrent) {
        setTransitionLogoProbe({
          source: transitionLogoSource,
          shape: getTransitionLogoShape(image.naturalWidth, image.naturalHeight)
        })
      }
    }
    image.src = transitionLogoSource

    return () => {
      isCurrent = false
    }
  }, [transitionLogoSource, transitionLogo])

  useEffect(() => {
    return () => clearTransitionTimers()
  }, [clearTransitionTimers])

  useEffect(() => {
    const nextSceneId = getProjectSceneId(project)
    const displayedSceneId = getProjectSceneId(displayProjectRef.current)
    const pendingSceneId = getProjectSceneId(pendingProjectRef.current)

    if (transitionActiveRef.current && pendingSceneId === nextSceneId) {
      pendingProjectRef.current = project
      return
    }

    clearTransitionTimers()

    if (normalizedTransitionMode === 'none' || displayedSceneId === nextSceneId) {
      transitionActiveRef.current = false
      pendingProjectRef.current = null
      displayProjectRef.current = project
      setDisplayProject(project)
      setTransitionState(state => ({
        ...state,
        active: false,
        resolving: false,
        logoSource: ''
      }))
      return
    }

    transitionActiveRef.current = true
    pendingProjectRef.current = project
    setTransitionState(state => ({
      key: state.key + 1,
      active: true,
      resolving: false,
      logoSource: getTransitionLogoSource(project, transitionLogo)
    }))

    const swapDelay = getTransitionSwapDelay(normalizedTransitionMode, transitionTiming)

    transitionTimersRef.current.push(window.setTimeout(() => {
      const nextProject = pendingProjectRef.current || project
      displayProjectRef.current = nextProject
      setDisplayProject(nextProject)
      setTransitionState(state => ({
        ...state,
        resolving: true
      }))
    }, swapDelay))

    transitionTimersRef.current.push(window.setTimeout(() => {
      const nextProject = pendingProjectRef.current || project
      transitionActiveRef.current = false
      pendingProjectRef.current = null
      displayProjectRef.current = nextProject
      setDisplayProject(nextProject)
      setTransitionState(state => ({
        ...state,
        active: false,
        resolving: false,
        logoSource: ''
      }))
    }, transitionTiming.mask))
  }, [clearTransitionTimers, normalizedTransitionMode, project, transitionLogo, transitionTiming])

  const handleTransitionLogoLoad = event => {
    if (transitionLogo !== 'event') return
    setTransitionLogoProbe({
      source: transitionLogoSource,
      shape: getTransitionLogoShape(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)
    })
  }

  return (
    <div ref={frameRef} className={bare ? styles.bareFrame : styles.frame}>
      <div
        className={bare ? styles.bareCanvas : styles.canvas}
        data-owbt-broadcast-style={broadcastStyle}
        data-owbt-active-scene={displayProject.scenes.activeSceneId}
        style={{
          '--owbt-scene-resolve-duration': `${transitionTiming.resolve}ms`,
          '--owbt-transition-duration': `${transitionTiming.mask}ms`,
          transform: `scale(${scale})`
        }}
      >
        <div
          key={displayProject.scenes.activeSceneId}
          className={`${styles.sceneMount} ${shouldResolveScene ? styles.sceneMountActive : ''}`}
        >
          <SceneComponent project={displayProject} scene={scene} />
        </div>
        {shouldAnimateScene && (
          <div
            key={transitionState.key}
            className={transitionClassName}
            data-owbt-transition-key={transitionState.key}
            aria-hidden="true"
          >
            {transitionLogoSource && shouldShowTransitionLogo && (
              <div className={transitionLogoClassName}>
                <img
                  src={transitionLogoSource}
                  alt=""
                  onError={handleTransitionLogoError}
                  onLoad={handleTransitionLogoLoad}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
