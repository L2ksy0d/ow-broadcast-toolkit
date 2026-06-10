export const BROADCAST_STYLE_IDS = {
  owbt: 'owbt',
  owcs: 'owcs'
}

export const BROADCAST_STYLES = [
  {
    id: BROADCAST_STYLE_IDS.owbt,
    name: 'OWBT Dark',
    description: 'Dark broadcast HUD with neon accent lighting.'
  },
  {
    id: BROADCAST_STYLE_IDS.owcs,
    name: 'OWCS Light',
    description: 'Official-style light package with orange speed marks.'
  }
]

export const OWCS_BROADCAST_PALETTE = {
  bg: '#f3f5f6',
  bgSoft: '#e5e9ec',
  bgWash: '#f8f9f9',
  ink: '#2f3b45',
  inkStrong: '#25313a',
  muted: '#6f7c86',
  faint: 'rgba(47,59,69,0.18)',
  line: 'rgba(47,59,69,0.14)',
  lineStrong: 'rgba(47,59,69,0.26)',
  panel: 'rgba(255,255,255,0.82)',
  panelSolid: '#ffffff',
  orange: '#f06414',
  orangeSoft: 'rgba(240,100,20,0.16)',
  shadow: '0 18px 46px rgba(47,59,69,0.12)'
}

export const normalizeBroadcastStyle = value => (
  value === BROADCAST_STYLE_IDS.owcs ? BROADCAST_STYLE_IDS.owcs : BROADCAST_STYLE_IDS.owbt
)

export const getBroadcastStyle = project => normalizeBroadcastStyle(project?.theme?.broadcastStyle)

export const isOwcsBroadcastStyle = project => getBroadcastStyle(project) === BROADCAST_STYLE_IDS.owcs
