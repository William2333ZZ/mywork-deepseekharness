/**
 * MyWork mobile — a native client for the MyWork running on your own computer.
 *
 * Screens (design/v2/TEAMMATES.md §9.6, MOBILE.md §10): pair · home (the teammates list) · a teammate's conversation ·
 * the teammate's page (例行 · 设置 · 文件) · the bell's activity · new teammate · files · one file · settings.
 * One stack, one screen at a time; the app starts on the list and everything else is pushed on top of it. Colours
 * follow the desktop's palettes (炭 · 香槟 / 墨 · 雾紫, picked in 设置) in the phone's light or dark scheme.
 */
import React from 'react'
import { ActivityIndicator, StatusBar, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Providers, useConn, useNav } from './src/store'
import { color, ThemeProvider, useTheme } from './src/theme'
import Pair from './src/screens/Pair'
import Home from './src/screens/Home'
import Thread from './src/screens/Thread'
import MateInfo from './src/screens/MateInfo'
import Activity from './src/screens/Activity'
import NewMate from './src/screens/NewMate'
import Files from './src/screens/Files'
import File from './src/screens/File'
import Settings from './src/screens/Settings'

function Router() {
  const { conn, ready, failed } = useConn()
  const { route } = useNav()
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}><ActivityIndicator color={color.fg2} /></View>
  if (!conn || failed) return <Pair />
  switch (route.name) {
    case 'mate': return <Thread id={route.id} runId={route.runId} />
    case 'mateInfo': return <MateInfo key={route.id + ':' + (route.routineId || '')} id={route.id} routineId={route.routineId} />
    case 'activity': return <Activity />
    case 'newMate': return <NewMate />
    case 'files': return <Files mateId={route.mateId} />
    case 'file': return <File key={route.id} id={route.id} />
    case 'settings': return <Settings />
    default: return <Home />
  }
}

/** The screens under the theme: a palette or scheme change remounts them (`version`), so each draws with the new colours. */
function Themed() {
  const { scheme, version } = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <StatusBar barStyle={scheme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={color.bg} />
      <Providers><Router key={version} /></Providers>
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider><Themed /></ThemeProvider>
    </SafeAreaProvider>
  )
}
